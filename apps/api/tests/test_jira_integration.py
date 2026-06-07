from io import BytesIO
import uuid

from fastapi.testclient import TestClient
from openpyxl import load_workbook
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


def create_jira_connection(client: TestClient, tenant_id: str, user_id: str = USER_A) -> dict:
    response = client.post(
        "/api/v1/integrations/jira",
        headers=headers(user_id, tenant_id),
        json={
            "base_url": "https://example.atlassian.net",
            "auth_email": "lab@example.com",
            "api_token": "secret-token",
            "default_project_key": "LAB",
            "default_issue_type": "Revision de formula",
        },
    )
    assert response.status_code == 201
    return response.json()


def create_formula(client: TestClient, tenant_id: str, user_id: str = USER_A) -> dict:
    request_headers = headers(user_id, tenant_id)
    material = client.post(
        "/api/v1/raw-materials",
        headers=request_headers,
        json={"name": "Material A", "code": "MAT-A"},
    ).json()
    formula_response = client.post(
        "/api/v1/formulas",
        headers=request_headers,
        json={
            "name": "Review Formula",
            "items": [{"raw_material_id": material["id"], "percentage": 100}],
        },
    )
    assert formula_response.status_code == 201
    return formula_response.json()


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


def test_formula_jira_review_request_captures_snapshot() -> None:
    client = make_client()
    tenant_id = create_tenant(client, USER_A, "tenant-a")
    connection = create_jira_connection(client, tenant_id)
    formula = create_formula(client, tenant_id)

    created = client.post(
        f"/api/v1/formulas/{formula['id']}/reviews/jira",
        headers=headers(USER_A, tenant_id),
        json={"notes": "Priorizar revision de estabilidad."},
    )
    listed = client.get(
        f"/api/v1/formulas/{formula['id']}/reviews",
        headers=headers(USER_A, tenant_id),
    )

    assert created.status_code == 201
    review = created.json()
    assert review["tenant_id"] == tenant_id
    assert review["formula_id"] == formula["id"]
    assert review["formula_version"] == 1
    assert review["jira_connection_id"] == connection["id"]
    assert review["review_status"] == "ready_for_jira"
    assert review["jira_issue_key"] is None
    assert review["snapshot"]["formula"]["name"] == "Review Formula"
    assert review["snapshot"]["items"] == [
        {
            "raw_material_id": formula["items"][0]["raw_material_id"],
            "code": "MAT-A",
            "name": "Material A",
            "percentage": 100.0,
            "quantity": None,
            "unit": None,
            "order_index": 0,
        }
    ]
    assert review["snapshot"]["jira"]["project_key"] == "LAB"
    assert review["snapshot"]["notes"] == "Priorizar revision de estabilidad."
    assert listed.status_code == 200
    assert [item["id"] for item in listed.json()] == [review["id"]]


def test_formula_jira_review_excel_artifact_is_generated_and_downloadable() -> None:
    client = make_client()
    tenant_id = create_tenant(client, USER_A, "tenant-a")
    create_jira_connection(client, tenant_id)
    formula = create_formula(client, tenant_id)
    request_headers = headers(USER_A, tenant_id)

    calculation = client.post(
        f"/api/v1/formulas/{formula['id']}/calculate",
        headers=request_headers,
    )
    created_review = client.post(
        f"/api/v1/formulas/{formula['id']}/reviews/jira",
        headers=request_headers,
        json={"notes": "Preparar paquete Excel."},
    )
    review = created_review.json()

    generated = client.post(
        f"/api/v1/formula-reviews/{review['id']}/artifacts/excel",
        headers=request_headers,
    )
    repeated = client.post(
        f"/api/v1/formula-reviews/{review['id']}/artifacts/excel",
        headers=request_headers,
    )
    listed = client.get(
        f"/api/v1/formula-reviews/{review['id']}/artifacts",
        headers=request_headers,
    )

    assert calculation.status_code == 200
    assert created_review.status_code == 201
    assert generated.status_code == 201
    assert repeated.status_code == 200
    artifact = generated.json()
    assert artifact["id"] == repeated.json()["id"]
    assert artifact["artifact_type"] == "jira_review_xlsx"
    assert artifact["file_name"].endswith(".xlsx")
    assert artifact["size_bytes"] > 0
    assert listed.status_code == 200
    assert [item["id"] for item in listed.json()] == [artifact["id"]]

    downloaded = client.get(
        f"/api/v1/formula-review-artifacts/{artifact['id']}/download",
        headers=request_headers,
    )

    assert downloaded.status_code == 200
    assert artifact["file_name"] in downloaded.headers["content-disposition"]

    workbook = load_workbook(BytesIO(downloaded.content), data_only=True)
    assert workbook.sheetnames == ["Resumen", "Composicion", "Calculo", "Metadatos"]

    summary = {
        row[0].value: row[1].value
        for row in workbook["Resumen"].iter_rows(min_row=2, max_col=2)
    }
    assert summary["Formula name"] == "Review Formula"
    assert summary["Jira project"] == "LAB"
    assert summary["Notes"] == "Preparar paquete Excel."

    composition = workbook["Composicion"]
    assert composition["C2"].value == "Material A"
    assert composition["D2"].value == 100

    calculation_rows = [
        [cell.value for cell in row]
        for row in workbook["Calculo"].iter_rows(min_row=2, max_col=7)
    ]
    assert any(row[0] == "Validation" and row[1] == "missing_price" for row in calculation_rows)


def test_formula_jira_review_request_requires_active_connection() -> None:
    client = make_client()
    tenant_id = create_tenant(client, USER_A, "tenant-a")
    formula = create_formula(client, tenant_id)

    response = client.post(
        f"/api/v1/formulas/{formula['id']}/reviews/jira",
        headers=headers(USER_A, tenant_id),
        json={},
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "Active Jira connection is required."


def test_formula_jira_review_requests_are_tenant_scoped() -> None:
    client = make_client()
    tenant_a = create_tenant(client, USER_A, "tenant-a")
    tenant_b = create_tenant(client, USER_B, "tenant-b")
    create_jira_connection(client, tenant_a, USER_A)
    create_jira_connection(client, tenant_b, USER_B)
    formula = create_formula(client, tenant_a, USER_A)

    cross_create = client.post(
        f"/api/v1/formulas/{formula['id']}/reviews/jira",
        headers=headers(USER_B, tenant_b),
        json={},
    )
    cross_list = client.get(
        f"/api/v1/formulas/{formula['id']}/reviews",
        headers=headers(USER_B, tenant_b),
    )

    assert cross_create.status_code == 404
    assert cross_list.status_code == 404


def test_formula_jira_review_artifacts_are_tenant_scoped() -> None:
    client = make_client()
    tenant_a = create_tenant(client, USER_A, "tenant-a")
    tenant_b = create_tenant(client, USER_B, "tenant-b")
    create_jira_connection(client, tenant_a, USER_A)
    create_jira_connection(client, tenant_b, USER_B)
    formula = create_formula(client, tenant_a, USER_A)
    review = client.post(
        f"/api/v1/formulas/{formula['id']}/reviews/jira",
        headers=headers(USER_A, tenant_a),
        json={},
    ).json()
    artifact = client.post(
        f"/api/v1/formula-reviews/{review['id']}/artifacts/excel",
        headers=headers(USER_A, tenant_a),
    ).json()

    cross_list = client.get(
        f"/api/v1/formula-reviews/{review['id']}/artifacts",
        headers=headers(USER_B, tenant_b),
    )
    cross_download = client.get(
        f"/api/v1/formula-review-artifacts/{artifact['id']}/download",
        headers=headers(USER_B, tenant_b),
    )

    assert cross_list.status_code == 404
    assert cross_download.status_code == 404
