import uuid

from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import SQLModel, Session, create_engine, select

from formulia_api.main import create_app
from formulia_api.models import Tenant, TenantInvitation, TenantMember


USER_A = "10000000-0000-0000-0000-000000000001"
USER_B = "20000000-0000-0000-0000-000000000001"
AUTH_USER_ID = uuid.UUID("30000000-0000-0000-0000-000000000001")


def make_client(monkeypatch) -> tuple[TestClient, object]:
    monkeypatch.setenv("SUPABASE_URL", "https://example.supabase.co")
    monkeypatch.setenv("SUPABASE_ANON_KEY", "test-anon-key")
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    app = create_app(engine)
    SQLModel.metadata.create_all(engine)
    return TestClient(app), engine


def create_tenant(client: TestClient, user_id: str, slug: str = "tenant-a") -> str:
    response = client.post(
        "/api/v1/tenants",
        headers={"X-User-Id": user_id},
        json={"name": slug.title(), "slug": slug},
    )
    assert response.status_code == 201
    assert response.json()["role"] == "owner"
    return response.json()["id"]


def test_request_without_session_is_rejected(monkeypatch) -> None:
    client, _engine = make_client(monkeypatch)

    response = client.get("/api/v1/me")

    assert response.status_code == 401


def test_supabase_user_without_invitation_is_rejected(monkeypatch) -> None:
    client, _engine = make_client(monkeypatch)
    monkeypatch.setattr(
        "formulia_api.tenant._fetch_supabase_user",
        lambda _token: {
            "id": str(AUTH_USER_ID),
            "email": "not-invited@example.com",
            "user_metadata": {"name": "Not Invited"},
        },
    )

    response = client.get("/api/v1/tenants", headers={"Authorization": "Bearer valid"})

    assert response.status_code == 403


def test_supabase_invitation_creates_membership(monkeypatch) -> None:
    client, engine = make_client(monkeypatch)
    with Session(engine) as session:
        tenant = Tenant(name="Atlantica Agricola", slug="atlantica-agricola")
        session.add(tenant)
        session.commit()
        session.refresh(tenant)
        session.add(
            TenantInvitation(
                tenant_id=tenant.id,
                email="ivan@example.com",
                role="owner",
                status="pending",
            )
        )
        session.commit()
        tenant_id = tenant.id

    monkeypatch.setattr(
        "formulia_api.tenant._fetch_supabase_user",
        lambda _token: {
            "id": str(AUTH_USER_ID),
            "email": "Ivan@Example.com",
            "user_metadata": {"full_name": "Ivan Navarro"},
        },
    )

    response = client.get("/api/v1/tenants", headers={"Authorization": "Bearer valid"})

    assert response.status_code == 200
    assert response.json()[0]["slug"] == "atlantica-agricola"
    assert response.json()[0]["role"] == "owner"
    with Session(engine) as session:
        membership = session.exec(
            select(TenantMember).where(
                TenantMember.tenant_id == tenant_id,
                TenantMember.user_id == AUTH_USER_ID,
            )
        ).one()
        invitation = session.exec(select(TenantInvitation)).one()
    assert membership.role == "owner"
    assert membership.status == "active"
    assert invitation.status == "accepted"
    assert invitation.accepted_by == AUTH_USER_ID


def test_only_tenant_admin_can_create_invitations(monkeypatch) -> None:
    client, engine = make_client(monkeypatch)
    tenant_id = create_tenant(client, USER_A)
    with Session(engine) as session:
        session.add(
            TenantMember(
                tenant_id=uuid.UUID(tenant_id),
                user_id=uuid.UUID(USER_B),
                role="formulator",
                status="active",
            )
        )
        session.commit()

    forbidden = client.post(
        "/api/v1/tenant-invitations",
        headers={"X-User-Id": USER_B, "X-Tenant-Id": tenant_id},
        json={"email": "user@example.com", "role": "viewer"},
    )
    created = client.post(
        "/api/v1/tenant-invitations",
        headers={"X-User-Id": USER_A, "X-Tenant-Id": tenant_id},
        json={"email": "Formulator@Example.com", "role": "formulador"},
    )

    assert forbidden.status_code == 403
    assert created.status_code == 201
    assert created.json()["email"] == "formulator@example.com"
    assert created.json()["role"] == "formulator"


def test_tenant_admin_can_send_supabase_invite_link(monkeypatch) -> None:
    client, _engine = make_client(monkeypatch)
    monkeypatch.setenv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key")
    monkeypatch.setenv("FORMULIA_AUTH_REDIRECT_URL", "https://app.example.com/auth/callback")
    tenant_id = create_tenant(client, USER_A)
    captured: dict[str, object] = {}

    class FakeResponse:
        status_code = 200

    def fake_post(url, headers, json, timeout):  # noqa: ANN001
        captured["url"] = url
        captured["headers"] = headers
        captured["json"] = json
        captured["timeout"] = timeout
        return FakeResponse()

    monkeypatch.setattr("formulia_api.tenant.httpx.post", fake_post)

    response = client.post(
        "/api/v1/tenant-invitations",
        headers={"X-User-Id": USER_A, "X-Tenant-Id": tenant_id},
        json={"email": "new-user@example.com", "role": "viewer", "send_link": True},
    )

    assert response.status_code == 201
    assert response.json()["email_delivery_status"] == "sent"
    assert captured["url"] == "https://example.supabase.co/auth/v1/invite"
    assert captured["headers"]["Authorization"] == "Bearer service-role-key"
    assert captured["json"] == {
        "email": "new-user@example.com",
        "data": {"source": "formulia"},
        "redirect_to": "https://app.example.com/auth/callback",
    }
