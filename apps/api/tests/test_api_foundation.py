import uuid

from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import SQLModel, create_engine

from formulia_api.main import create_app


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


def test_rejects_tenant_access_without_membership() -> None:
    client = make_client()
    tenant_a = create_tenant(client, USER_A, "tenant-a")

    response = client.get(
        "/api/v1/parameters",
        headers={"X-User-Id": USER_B, "X-Tenant-Id": tenant_a},
    )

    assert response.status_code == 403


def test_lists_only_data_for_active_tenant() -> None:
    client = make_client()
    tenant_a = create_tenant(client, USER_A, "tenant-a")
    tenant_b = create_tenant(client, USER_B, "tenant-b")

    created = client.post(
        "/api/v1/parameters",
        headers={"X-User-Id": USER_A, "X-Tenant-Id": tenant_a},
        json={"code": "active_content", "name": "Active Content", "unit": "% p/p"},
    )
    assert created.status_code == 201

    response_a = client.get(
        "/api/v1/parameters",
        headers={"X-User-Id": USER_A, "X-Tenant-Id": tenant_a},
    )
    response_b = client.get(
        "/api/v1/parameters",
        headers={"X-User-Id": USER_B, "X-Tenant-Id": tenant_b},
    )

    assert len(response_a.json()) == 1
    assert response_b.json() == []


def test_raw_material_from_another_tenant_is_not_found() -> None:
    client = make_client()
    tenant_a = create_tenant(client, USER_A, "tenant-a")
    tenant_b = create_tenant(client, USER_B, "tenant-b")

    created = client.post(
        "/api/v1/raw-materials",
        headers={"X-User-Id": USER_A, "X-Tenant-Id": tenant_a},
        json={"name": "Active A", "code": "ACT-A"},
    )
    raw_material_id = created.json()["id"]

    response = client.get(
        f"/api/v1/raw-materials/{raw_material_id}",
        headers={"X-User-Id": USER_B, "X-Tenant-Id": tenant_b},
    )

    assert response.status_code == 404


def test_persisted_formula_calculation_uses_backend_core() -> None:
    client = make_client()
    tenant_id = create_tenant(client, USER_A, "tenant-a")
    headers = {"X-User-Id": USER_A, "X-Tenant-Id": tenant_id}

    parameter = client.post(
        "/api/v1/parameters",
        headers=headers,
        json={"code": "active_content", "name": "Active Content", "unit": "% p/p"},
    ).json()
    rm_1 = client.post(
        "/api/v1/raw-materials",
        headers=headers,
        json={"name": "Active A", "code": "ACT-A"},
    ).json()
    rm_2 = client.post(
        "/api/v1/raw-materials",
        headers=headers,
        json={"name": "Carrier B", "code": "CAR-B"},
    ).json()

    for raw_material, price, parameter_value in [
        (rm_1, 2.0, 40),
        (rm_2, 1.0, 10),
    ]:
        price_response = client.post(
            f"/api/v1/raw-materials/{raw_material['id']}/prices",
            headers=headers,
            json={"price": price, "currency": "EUR", "unit": "kg"},
        )
        assert price_response.status_code == 201
        value_response = client.post(
            f"/api/v1/raw-materials/{raw_material['id']}/parameter-values",
            headers=headers,
            json={"parameter_id": parameter["id"], "value": parameter_value},
        )
        assert value_response.status_code == 201

    formula = client.post(
        "/api/v1/formulas",
        headers=headers,
        json={
            "name": "Test Formula",
            "items": [
                {"raw_material_id": rm_1["id"], "percentage": 25},
                {"raw_material_id": rm_2["id"], "percentage": 75},
            ],
        },
    ).json()

    response = client.post(
        f"/api/v1/formulas/{formula['id']}/calculate",
        headers=headers,
    )

    assert response.status_code == 200
    result = response.json()
    assert result["total_percentage"] == 100
    assert result["price_total"] == 1.25
    assert result["parameters"] == [
        {"code": "active_content", "value": 17.5, "unit": "% p/p"}
    ]
    assert result["warnings"] == []


def test_persisted_formula_requires_active_tenant_parameters() -> None:
    client = make_client()
    tenant_id = create_tenant(client, USER_A, "tenant-a")
    headers = {"X-User-Id": USER_A, "X-Tenant-Id": tenant_id}

    parameter = client.post(
        "/api/v1/parameters",
        headers=headers,
        json={"code": "viscosity", "name": "Viscosity", "unit": "cP"},
    )
    assert parameter.status_code == 201
    raw_material = client.post(
        "/api/v1/raw-materials",
        headers=headers,
        json={"name": "Base A", "code": "BASE-A"},
    ).json()
    price_response = client.post(
        f"/api/v1/raw-materials/{raw_material['id']}/prices",
        headers=headers,
        json={"price": 1.5, "currency": "EUR", "unit": "kg"},
    )
    assert price_response.status_code == 201
    formula = client.post(
        "/api/v1/formulas",
        headers=headers,
        json={
            "name": "Missing Parameter Formula",
            "items": [{"raw_material_id": raw_material["id"], "percentage": 100}],
        },
    ).json()

    response = client.post(
        f"/api/v1/formulas/{formula['id']}/calculate",
        headers=headers,
    )

    assert response.status_code == 200
    warnings = response.json()["warnings"]
    assert warnings[0]["code"] == "missing_parameter"
    assert warnings[0]["parameter_code"] == "viscosity"


def test_formula_calculation_history_is_tenant_scoped() -> None:
    client = make_client()
    tenant_a = create_tenant(client, USER_A, "tenant-a")
    tenant_b = create_tenant(client, USER_B, "tenant-b")
    headers_a = {"X-User-Id": USER_A, "X-Tenant-Id": tenant_a}
    headers_b = {"X-User-Id": USER_B, "X-Tenant-Id": tenant_b}
    parameter = client.post(
        "/api/v1/parameters",
        headers=headers_a,
        json={"code": "active_content", "name": "Active Content", "unit": "% p/p"},
    ).json()
    rm_1 = client.post(
        "/api/v1/raw-materials",
        headers=headers_a,
        json={"name": "Active A", "code": "ACT-A"},
    ).json()
    rm_2 = client.post(
        "/api/v1/raw-materials",
        headers=headers_a,
        json={"name": "Carrier B", "code": "CAR-B"},
    ).json()
    for raw_material, price, parameter_value in [
        (rm_1, 2.0, 40),
        (rm_2, 1.0, 10),
    ]:
        client.post(
            f"/api/v1/raw-materials/{raw_material['id']}/prices",
            headers=headers_a,
            json={"price": price, "currency": "EUR", "unit": "kg"},
        )
        client.post(
            f"/api/v1/raw-materials/{raw_material['id']}/parameter-values",
            headers=headers_a,
            json={"parameter_id": parameter["id"], "value": parameter_value},
        )
    formula = client.post(
        "/api/v1/formulas",
        headers=headers_a,
        json={
            "name": "History Formula",
            "items": [
                {"raw_material_id": rm_1["id"], "percentage": 25},
                {"raw_material_id": rm_2["id"], "percentage": 75},
            ],
        },
    ).json()

    first = client.post(f"/api/v1/formulas/{formula['id']}/calculate", headers=headers_a)
    second = client.post(f"/api/v1/formulas/{formula['id']}/calculate", headers=headers_a)
    assert first.status_code == 200
    assert second.status_code == 200
    history = client.get(
        f"/api/v1/formulas/{formula['id']}/calculations",
        headers=headers_a,
    )
    forbidden = client.get(
        f"/api/v1/formulas/{formula['id']}/calculations",
        headers=headers_b,
    )

    assert history.status_code == 200
    assert len(history.json()) == 2
    assert history.json()[0]["result_json"]["price_total"] == 1.25
    assert forbidden.status_code == 404


def test_unknown_raw_material_in_ad_hoc_calculation_returns_warning() -> None:
    client = make_client()
    tenant_id = create_tenant(client, USER_A, "tenant-a")

    response = client.post(
        "/api/v1/formulas/calculate",
        headers={"X-User-Id": USER_A, "X-Tenant-Id": tenant_id},
        json={
            "items": [
                {"raw_material_id": str(uuid.uuid4()), "percentage": 100},
            ]
        },
    )

    assert response.status_code == 200
    assert response.json()["warnings"][0]["code"] == "missing_raw_material"
