from io import BytesIO

from fastapi.testclient import TestClient
from openpyxl import Workbook
from sqlalchemy.pool import StaticPool
from sqlmodel import SQLModel, create_engine

from formulia_api.excel_import import parse_formula_xlsx
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


def workbook_bytes(rows: list[list[object]]) -> bytes:
    workbook = Workbook()
    worksheet = workbook.active
    for row in rows:
        worksheet.append(row)
    stream = BytesIO()
    workbook.save(stream)
    return stream.getvalue()


def test_parser_detects_columns_and_percent_rows() -> None:
    content = workbook_bytes(
        [
            ["Code", "Raw Material", "Percentage"],
            ["ACT-A", "Active A", 25],
            ["CAR-B", "Carrier B", 75],
        ]
    )

    parsed = parse_formula_xlsx(content)

    assert parsed.columns.material_code == "code"
    assert parsed.columns.material_name == "raw material"
    assert parsed.columns.percentage == "percentage"
    assert parsed.total_percentage == 100
    assert [row.material_code for row in parsed.rows] == ["ACT-A", "CAR-B"]


def test_preview_matches_by_code_and_normalized_name() -> None:
    client = make_client()
    tenant_id = create_tenant(client, USER_A, "tenant-a")
    headers = {"X-User-Id": USER_A, "X-Tenant-Id": tenant_id}
    active = client.post(
        "/api/v1/raw-materials",
        headers=headers,
        json={"name": "Active A", "code": "ACT-A"},
    ).json()
    carrier = client.post(
        "/api/v1/raw-materials",
        headers=headers,
        json={"name": "Carrier B", "code": "CAR-B"},
    ).json()
    content = workbook_bytes(
        [
            ["Code", "Raw Material", "Percentage"],
            ["ACT-A", "Active A", 25],
            ["", "Carrier B", 75],
        ]
    )

    response = client.post(
        "/api/v1/imports/formulas/excel/preview",
        headers=headers,
        files={"file": ("formula.xlsx", content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
    )

    assert response.status_code == 200
    preview = response.json()
    assert preview["total_percentage"] == 100
    assert preview["resolved_rows"] == 2
    assert preview["pending_rows"] == 0
    assert preview["rows"][0]["raw_material_id"] == active["id"]
    assert preview["rows"][0]["matched_by"] == "code"
    assert preview["rows"][1]["raw_material_id"] == carrier["id"]
    assert preview["rows"][1]["matched_by"] == "name"


def test_preview_matches_by_alias() -> None:
    client = make_client()
    tenant_id = create_tenant(client, USER_A, "tenant-a")
    headers = {"X-User-Id": USER_A, "X-Tenant-Id": tenant_id}
    material = client.post(
        "/api/v1/raw-materials",
        headers=headers,
        json={"name": "Carrier B", "code": "CAR-B"},
    ).json()
    alias = client.post(
        f"/api/v1/raw-materials/{material['id']}/aliases",
        headers=headers,
        json={"alias": "Carrier beta"},
    )
    assert alias.status_code == 201
    content = workbook_bytes(
        [
            ["Raw Material", "Percentage"],
            ["Carrier beta", 100],
        ]
    )

    response = client.post(
        "/api/v1/imports/formulas/excel/preview",
        headers=headers,
        files={"file": ("formula.xlsx", content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
    )

    assert response.status_code == 200
    row = response.json()["rows"][0]
    assert row["raw_material_id"] == material["id"]
    assert row["matched_by"] == "alias"


def test_preview_matches_material_code_by_alias() -> None:
    client = make_client()
    tenant_id = create_tenant(client, USER_A, "tenant-a")
    headers = {"X-User-Id": USER_A, "X-Tenant-Id": tenant_id}
    material = client.post(
        "/api/v1/raw-materials",
        headers=headers,
        json={"name": "Carrier B", "code": "CAR-B"},
    ).json()
    alias = client.post(
        f"/api/v1/raw-materials/{material['id']}/aliases",
        headers=headers,
        json={"alias": "ALT-CAR-B"},
    )
    assert alias.status_code == 201
    content = workbook_bytes(
        [
            ["Code", "Percentage"],
            ["ALT-CAR-B", 100],
        ]
    )

    response = client.post(
        "/api/v1/imports/formulas/excel/preview",
        headers=headers,
        files={"file": ("formula.xlsx", content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
    )

    assert response.status_code == 200
    row = response.json()["rows"][0]
    assert row["raw_material_id"] == material["id"]
    assert row["matched_by"] == "alias"


def test_preview_suggests_fuzzy_match_without_resolving() -> None:
    client = make_client()
    tenant_id = create_tenant(client, USER_A, "tenant-a")
    headers = {"X-User-Id": USER_A, "X-Tenant-Id": tenant_id}
    material = client.post(
        "/api/v1/raw-materials",
        headers=headers,
        json={"name": "Carrier Meta 009", "code": "CAR-009"},
    ).json()
    content = workbook_bytes(
        [
            ["Raw Material", "Percentage"],
            ["Carier Meta 009", 100],
        ]
    )

    response = client.post(
        "/api/v1/imports/formulas/excel/preview",
        headers=headers,
        files={"file": ("formula.xlsx", content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
    )

    assert response.status_code == 200
    preview = response.json()
    row = preview["rows"][0]
    assert preview["resolved_rows"] == 0
    assert preview["pending_rows"] == 1
    assert row["status"] == "needs_review"
    assert row["raw_material_id"] is None
    assert row["matched_by"] is None
    assert row["suggested_raw_material_id"] == material["id"]
    assert row["suggested_material_name"] == "Carrier Meta 009"
    assert row["suggested_match_score"] >= 0.82


def test_preview_flags_unmatched_and_invalid_rows() -> None:
    client = make_client()
    tenant_id = create_tenant(client, USER_A, "tenant-a")
    headers = {"X-User-Id": USER_A, "X-Tenant-Id": tenant_id}
    content = workbook_bytes(
        [
            ["Code", "Raw Material", "Percentage"],
            ["MISSING", "Missing Material", 50],
            ["", "Invalid Material", "abc"],
        ]
    )

    response = client.post(
        "/api/v1/imports/formulas/excel/preview",
        headers=headers,
        files={"file": ("formula.xlsx", content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
    )

    assert response.status_code == 200
    rows = response.json()["rows"]
    assert rows[0]["status"] == "needs_review"
    assert rows[1]["status"] == "invalid_percentage"


def test_save_imported_rows_as_formula_and_calculate() -> None:
    client = make_client()
    tenant_id = create_tenant(client, USER_A, "tenant-a")
    headers = {"X-User-Id": USER_A, "X-Tenant-Id": tenant_id}
    parameter = client.post(
        "/api/v1/parameters",
        headers=headers,
        json={"code": "active_content", "name": "Active Content", "unit": "% p/p"},
    ).json()
    active = _create_material(client, headers, "Active A", "ACT-A", parameter["id"], 2, 40)
    carrier = _create_material(client, headers, "Carrier B", "CAR-B", parameter["id"], 1, 10)

    response = client.post(
        "/api/v1/imports/formulas/excel/save",
        headers=headers,
        json={
            "name": "Imported Formula",
            "rows": [
                {"raw_material_id": active["id"], "percentage": 25},
                {"raw_material_id": carrier["id"], "percentage": 75},
            ],
        },
    )

    assert response.status_code == 201
    formula = response.json()
    assert formula["name"] == "Imported Formula"
    calculation = client.post(
        f"/api/v1/formulas/{formula['id']}/calculate",
        headers=headers,
    )
    assert calculation.status_code == 200
    assert calculation.json()["price_total"] == 1.25
    assert calculation.json()["parameters"][0]["value"] == 17.5


def test_save_import_rejects_negative_percentage() -> None:
    client = make_client()
    tenant_id = create_tenant(client, USER_A, "tenant-a")
    headers = {"X-User-Id": USER_A, "X-Tenant-Id": tenant_id}
    raw_material = client.post(
        "/api/v1/raw-materials",
        headers=headers,
        json={"name": "Active A", "code": "ACT-A"},
    ).json()

    response = client.post(
        "/api/v1/imports/formulas/excel/save",
        headers=headers,
        json={
            "name": "Invalid Import",
            "rows": [{"raw_material_id": raw_material["id"], "percentage": -1}],
        },
    )

    assert response.status_code == 422


def test_import_preview_requires_tenant_membership() -> None:
    client = make_client()
    tenant_a = create_tenant(client, USER_A, "tenant-a")
    content = workbook_bytes([["Code", "Percentage"], ["ACT-A", 100]])

    response = client.post(
        "/api/v1/imports/formulas/excel/preview",
        headers={"X-User-Id": USER_B, "X-Tenant-Id": tenant_a},
        files={"file": ("formula.xlsx", content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
    )

    assert response.status_code == 403


def _create_material(
    client: TestClient,
    headers: dict[str, str],
    name: str,
    code: str,
    parameter_id: str,
    price: float,
    parameter_value: float,
) -> dict[str, object]:
    material = client.post(
        "/api/v1/raw-materials",
        headers=headers,
        json={"name": name, "code": code},
    ).json()
    assert client.post(
        f"/api/v1/raw-materials/{material['id']}/prices",
        headers=headers,
        json={"price": price, "currency": "EUR", "unit": "kg"},
    ).status_code == 201
    assert client.post(
        f"/api/v1/raw-materials/{material['id']}/parameter-values",
        headers=headers,
        json={"parameter_id": parameter_id, "value": parameter_value},
    ).status_code == 201
    return material
