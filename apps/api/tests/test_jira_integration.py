import uuid

from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import SQLModel, Session, create_engine

from formulia_api.main import create_app
from formulia_api.models import TenantMember


USER_A = "10000000-0000-0000-0000-000000000001"
USER_B = "20000000-0000-0000-0000-000000000001"


def make_client() -> TestClient:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    app = create_app(engine)
    SQLModel.metadata.create_all(engine)
    return TestClient(app)


def create_tenant(client: TestClient, user_id: str, slug: str) -> str:
    response = client.post(
        "/api/v1/tenants",
        headers={"X-User-Id": user_id},
        json={"name": slug.title(), "slug": slug},
    )
    assert response.status_code == 201
    return response.json()["id"]


def headers(user_id: str, tenant_id: str) -> dict[str, str]:
    return {"X-User-Id": user_id, "X-Tenant-Id": tenant_id}


def add_member(client: TestClient, tenant_id: str, user_id: str, role: str) -> None:
    client.get("/api/v1/me", headers={"X-User-Id": user_id})
    with Session(client.app.state.engine) as session:
        session.add(
            TenantMember(
                tenant_id=uuid.UUID(tenant_id),
                user_id=uuid.UUID(user_id),
                role=role,
            )
        )
        session.commit()


def test_owner_configures_and_tests_jira_connection() -> None:
    client = make_client()
    tenant_id = create_tenant(client, USER_A, "tenant-a")

    created = client.post(
        "/api/v1/integrations/jira",
        headers=headers(USER_A, tenant_id),
        json={
            "base_url": " https://example.atlassian.net/ ",
            "auth_email": " lab@example.com ",
            "api_token": "secret-token",
            "default_project_key": " lab ",
            "default_issue_type": "Revision de formula",
            "default_assignee": "lab-team",
            "field_mapping": {" formula_code ": " customfield_10001 "},
        },
    )
    listed = client.get("/api/v1/integrations/jira", headers=headers(USER_A, tenant_id))

    assert created.status_code == 201
    connection = created.json()
    assert "api_token" not in connection
    assert connection["base_url"] == "https://example.atlassian.net"
    assert connection["auth_email"] == "lab@example.com"
    assert connection["credential_status"] == "configured"
    assert connection["default_project_key"] == "LAB"
    assert connection["field_mapping"] == {"formula_code": "customfield_10001"}
    assert listed.status_code == 200
    assert [item["id"] for item in listed.json()] == [connection["id"]]

    tested = client.post(
        f"/api/v1/integrations/jira/{connection['id']}/test",
        headers=headers(USER_A, tenant_id),
    )

    assert tested.status_code == 200
    assert tested.json()["status"] == "ready_for_client"


def test_jira_connections_are_tenant_scoped() -> None:
    client = make_client()
    tenant_a = create_tenant(client, USER_A, "tenant-a")
    tenant_b = create_tenant(client, USER_B, "tenant-b")

    connection = client.post(
        "/api/v1/integrations/jira",
        headers=headers(USER_A, tenant_a),
        json={
            "base_url": "https://example.atlassian.net",
            "auth_email": "lab@example.com",
            "api_token": "secret-token",
            "default_project_key": "LAB",
            "default_issue_type": "Revision de formula",
        },
    ).json()

    listed_b = client.get("/api/v1/integrations/jira", headers=headers(USER_B, tenant_b))
    cross_patch = client.patch(
        f"/api/v1/integrations/jira/{connection['id']}",
        headers=headers(USER_B, tenant_b),
        json={"default_project_key": "OTHER"},
    )

    assert listed_b.status_code == 200
    assert listed_b.json() == []
    assert cross_patch.status_code == 404


def test_only_owner_or_admin_can_mutate_jira_connection() -> None:
    client = make_client()
    tenant_id = create_tenant(client, USER_A, "tenant-a")
    add_member(client, tenant_id, USER_B, "formulator")

    created = client.post(
        "/api/v1/integrations/jira",
        headers=headers(USER_A, tenant_id),
        json={
            "base_url": "https://example.atlassian.net",
            "auth_email": "lab@example.com",
            "api_token": "secret-token",
            "default_project_key": "LAB",
            "default_issue_type": "Revision de formula",
        },
    ).json()

    listed = client.get("/api/v1/integrations/jira", headers=headers(USER_B, tenant_id))
    forbidden_patch = client.patch(
        f"/api/v1/integrations/jira/{created['id']}",
        headers=headers(USER_B, tenant_id),
        json={"default_project_key": "LAB2"},
    )
    forbidden_test = client.post(
        f"/api/v1/integrations/jira/{created['id']}/test",
        headers=headers(USER_B, tenant_id),
    )

    assert listed.status_code == 200
    assert listed.json()[0]["id"] == created["id"]
    assert forbidden_patch.status_code == 403
    assert forbidden_test.status_code == 403
