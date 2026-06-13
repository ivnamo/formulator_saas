from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import SQLModel, create_engine

from formulia_api.main import create_app


USER_A = "10000000-0000-0000-0000-000000000001"


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


def test_sap_import_preview_classifies_rows() -> None:
    client = make_client()
    tenant_id = create_tenant(client, USER_A, "tenant-a")
    headers = {"X-User-Id": USER_A, "X-Tenant-Id": tenant_id}
    existing = client.post(
        "/api/v1/raw-materials",
        headers=headers,
        json={
            "name": "Urea Technical",
            "code": "UREA",
            "external_code": "SAP-001",
        },
    ).json()
    client.post(
        f"/api/v1/raw-materials/{existing['id']}/prices",
        headers=headers,
        json={"price": 1.0, "currency": "EUR", "unit": "kg", "valid_from": "2026-01-01"},
    )
    csv_content = "\n".join(
        [
            "Codigo SAP;Materia Prima;Precio EUR/kg;Familia",
            "SAP-001;Urea Technical;1,40;Nitrogen",
            "SAP-002;Boron Solution;2.50;Micros",
            ";Urea Technicall;1.50;Nitrogen",
            "SAP-003;Bad Price;-2;Micros",
        ]
    ).encode()

    response = client.post(
        "/api/v1/raw-material-imports/sap/preview",
        headers=headers,
        data={"valid_from": "2026-06-01", "source": "sap-june"},
        files={"file": ("sap.csv", csv_content, "text/csv")},
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["status"] == "preview"
    assert payload["summary_json"]["rows"] == 4
    assert payload["summary_json"]["price_update"] == 1
    assert payload["summary_json"]["new_material"] == 1
    assert payload["summary_json"]["needs_review"] == 1
    assert payload["summary_json"]["error"] == 1
    assert [row["action"] for row in payload["rows"]] == [
        "price_update",
        "new_material",
        "needs_review",
        "error",
    ]
    assert payload["rows"][0]["raw_material_id"] == existing["id"]
    assert payload["rows"][2]["status"] == "needs_review"
    assert payload["rows"][3]["message"] == "Raw material price cannot be negative."


def test_sap_import_apply_updates_prices_and_creates_materials_idempotently() -> None:
    client = make_client()
    tenant_id = create_tenant(client, USER_A, "tenant-a")
    headers = {"X-User-Id": USER_A, "X-Tenant-Id": tenant_id}
    existing = client.post(
        "/api/v1/raw-materials",
        headers=headers,
        json={
            "name": "Urea Technical",
            "code": "UREA",
            "external_code": "SAP-001",
        },
    ).json()
    client.post(
        f"/api/v1/raw-materials/{existing['id']}/prices",
        headers=headers,
        json={"price": 1.0, "currency": "EUR", "unit": "kg", "valid_from": "2026-01-01"},
    )
    csv_content = "\n".join(
        [
            "Codigo SAP;Materia Prima;Precio EUR/kg;Familia",
            "SAP-001;Urea Technical;1,40;Nitrogen",
            "SAP-002;Boron Solution;2.50;Micros",
            ";Urea Technicall;1.50;Nitrogen",
            "SAP-003;Bad Price;-2;Micros",
        ]
    ).encode()
    preview = client.post(
        "/api/v1/raw-material-imports/sap/preview",
        headers=headers,
        data={"valid_from": "2026-06-01", "source": "sap-june"},
        files={"file": ("sap.csv", csv_content, "text/csv")},
    ).json()

    applied = client.post(
        f"/api/v1/raw-material-imports/{preview['id']}/apply",
        headers=headers,
    )
    applied_again = client.post(
        f"/api/v1/raw-material-imports/{preview['id']}/apply",
        headers=headers,
    )
    materials = client.get("/api/v1/raw-materials", headers=headers).json()
    urea_prices = client.get(
        f"/api/v1/raw-materials/{existing['id']}/prices",
        headers=headers,
    ).json()
    boron = next(material for material in materials if material["name"] == "Boron Solution")
    boron_prices = client.get(
        f"/api/v1/raw-materials/{boron['id']}/prices",
        headers=headers,
    ).json()

    assert applied.status_code == 200
    assert applied.json()["status"] == "applied"
    assert applied.json()["summary_json"]["applied_rows"] == 2
    assert applied.json()["summary_json"]["skipped_rows"] == 2
    assert applied_again.status_code == 200
    assert len(materials) == 2
    assert [row["price"] for row in urea_prices] == [1.4, 1.0]
    assert [row["price"] for row in boron_prices] == [2.5]


def test_sap_import_apply_updates_existing_material_name_metadata() -> None:
    client = make_client()
    tenant_id = create_tenant(client, USER_A, "tenant-a")
    headers = {"X-User-Id": USER_A, "X-Tenant-Id": tenant_id}
    existing = client.post(
        "/api/v1/raw-materials",
        headers=headers,
        json={
            "name": "Urea Technical",
            "code": "UREA",
            "external_code": "SAP-001",
            "family": "Nitrogen",
        },
    ).json()
    client.post(
        f"/api/v1/raw-materials/{existing['id']}/prices",
        headers=headers,
        json={"price": 1.0, "currency": "EUR", "unit": "kg", "valid_from": "2026-01-01"},
    )
    csv_content = "\n".join(
        [
            "Codigo SAP;Materia Prima;Precio EUR/kg;Familia",
            "SAP-001;Urea Granular;1.00;Nitrogen",
        ]
    ).encode()
    preview = client.post(
        "/api/v1/raw-material-imports/sap/preview",
        headers=headers,
        data={"valid_from": "2026-06-01", "source": "sap-june"},
        files={"file": ("sap.csv", csv_content, "text/csv")},
    )

    applied = client.post(
        f"/api/v1/raw-material-imports/{preview.json()['id']}/apply",
        headers=headers,
    )
    materials = client.get("/api/v1/raw-materials", headers=headers).json()
    updated = next(material for material in materials if material["id"] == existing["id"])

    assert preview.status_code == 201
    assert preview.json()["rows"][0]["action"] == "metadata_update"
    assert preview.json()["rows"][0]["status"] == "ready"
    assert applied.status_code == 200
    assert applied.json()["summary_json"]["applied_rows"] == 1
    assert updated["name"] == "Urea Granular"
