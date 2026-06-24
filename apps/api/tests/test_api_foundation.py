import uuid

from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import SQLModel, Session, create_engine

from formulia_api.main import create_app
from formulia_api.models import TenantMember, User


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


def add_tenant_member(client: TestClient, tenant_id: str, user_id: str, role: str) -> None:
    with Session(client.app.state.engine) as session:
        user_uuid = uuid.UUID(user_id)
        if session.get(User, user_uuid) is None:
            session.add(User(id=user_uuid, email=f"{user_id}@example.test"))
            session.commit()
        session.add(
            TenantMember(
                tenant_id=uuid.UUID(tenant_id),
                user_id=user_uuid,
                role=role,
                status="active",
            )
        )
        session.commit()


def test_rejects_tenant_access_without_membership() -> None:
    client = make_client()
    tenant_a = create_tenant(client, USER_A, "tenant-a")

    response = client.get(
        "/api/v1/parameters",
        headers={"X-User-Id": USER_B, "X-Tenant-Id": tenant_a},
    )

    assert response.status_code == 403


def test_product_events_can_be_recorded_and_summarized_by_admin() -> None:
    client = make_client()
    tenant_id = create_tenant(client, USER_A, "tenant-a")
    headers = {"X-User-Id": USER_A, "X-Tenant-Id": tenant_id}

    navigation = client.post(
        "/api/v1/product-events",
        headers=headers,
        json={
            "event_type": "navigation_view",
            "surface": "formula",
            "element": "sidebar",
            "metadata": {"view": "formula"},
        },
    )
    action = client.post(
        "/api/v1/product-events",
        headers=headers,
        json={
            "event_type": "action_success",
            "surface": "library",
            "element": "Refresh library",
            "metadata": {"label": "Refresh library"},
        },
    )
    summary = client.get("/api/v1/product-events/summary", headers=headers)

    assert navigation.status_code == 201
    assert navigation.json()["metadata_json"] == {"view": "formula"}
    assert action.status_code == 201
    assert summary.status_code == 200
    payload = summary.json()
    assert payload["total"] == 2
    assert payload["by_event_type"][0] == {"key": "action_success", "count": 1}
    assert {item["key"] for item in payload["by_surface"]} == {"formula", "library"}
    assert len(payload["recent"]) == 2


def test_product_event_summary_requires_admin_role() -> None:
    client = make_client()
    tenant_id = create_tenant(client, USER_A, "tenant-a")
    add_tenant_member(client, tenant_id, USER_B, "formulator")
    formulator_headers = {"X-User-Id": USER_B, "X-Tenant-Id": tenant_id}

    recorded = client.post(
        "/api/v1/product-events",
        headers=formulator_headers,
        json={"event_type": "navigation_view", "surface": "formula"},
    )
    forbidden_summary = client.get(
        "/api/v1/product-events/summary",
        headers=formulator_headers,
    )

    assert recorded.status_code == 201
    assert forbidden_summary.status_code == 403


def test_formula_item_payload_rejects_negative_percentage() -> None:
    client = make_client()
    tenant_id = create_tenant(client, USER_A, "tenant-a")

    response = client.post(
        "/api/v1/formulas/calculate",
        headers={"X-User-Id": USER_A, "X-Tenant-Id": tenant_id},
        json={
            "items": [
                {
                    "raw_material_id": str(uuid.uuid4()),
                    "percentage": -0.1,
                    "order_index": 0,
                }
            ],
        },
    )

    assert response.status_code == 422
    assert response.json()["detail"][0]["type"] == "greater_than_equal"


def test_formula_creation_requires_description() -> None:
    client = make_client()
    tenant_id = create_tenant(client, USER_A, "tenant-a")
    headers = {"X-User-Id": USER_A, "X-Tenant-Id": tenant_id}

    response = client.post(
        "/api/v1/formulas",
        headers=headers,
        json={"name": "No Description Formula", "objective": "   ", "items": []},
    )

    assert response.status_code == 422


def test_formula_creation_requires_name() -> None:
    client = make_client()
    tenant_id = create_tenant(client, USER_A, "tenant-a")
    headers = {"X-User-Id": USER_A, "X-Tenant-Id": tenant_id}

    response = client.post(
        "/api/v1/formulas",
        headers=headers,
        json={"name": " ", "objective": "Formula description.", "items": []},
    )

    assert response.status_code == 422


def test_formula_version_creation_links_source_and_increments_version() -> None:
    client = make_client()
    tenant_id = create_tenant(client, USER_A, "tenant-a")
    headers = {"X-User-Id": USER_A, "X-Tenant-Id": tenant_id}
    source = client.post(
        "/api/v1/formulas",
        headers=headers,
        json={"name": "Formula F2", "objective": "Initial version.", "items": []},
    ).json()

    version = client.post(
        "/api/v1/formulas",
        headers=headers,
        json={
            "name": "Formula F3",
            "objective": "Linked version.",
            "source_formula_id": source["id"],
            "items": [],
        },
    )
    next_version = client.post(
        "/api/v1/formulas",
        headers=headers,
        json={
            "name": "Formula F4",
            "objective": "Second linked version.",
            "source_formula_id": source["id"],
            "items": [],
        },
    )

    assert version.status_code == 201
    assert version.json()["source_formula_id"] == source["id"]
    assert version.json()["version"] == source["version"] + 1
    assert next_version.status_code == 201
    assert next_version.json()["source_formula_id"] == source["id"]
    assert next_version.json()["version"] == version.json()["version"] + 1


def test_formula_version_source_must_belong_to_tenant() -> None:
    client = make_client()
    tenant_a = create_tenant(client, USER_A, "tenant-a")
    tenant_b = create_tenant(client, USER_B, "tenant-b")
    headers_a = {"X-User-Id": USER_A, "X-Tenant-Id": tenant_a}
    headers_b = {"X-User-Id": USER_B, "X-Tenant-Id": tenant_b}
    external_source = client.post(
        "/api/v1/formulas",
        headers=headers_b,
        json={"name": "External Formula", "objective": "Other tenant.", "items": []},
    ).json()

    response = client.post(
        "/api/v1/formulas",
        headers=headers_a,
        json={
            "name": "Invalid Linked Formula",
            "objective": "Should not link across tenants.",
            "source_formula_id": external_source["id"],
            "items": [],
        },
    )

    assert response.status_code == 404


def test_formula_update_rejects_blank_description() -> None:
    client = make_client()
    tenant_id = create_tenant(client, USER_A, "tenant-a")
    headers = {"X-User-Id": USER_A, "X-Tenant-Id": tenant_id}
    formula = client.post(
        "/api/v1/formulas",
        headers=headers,
        json={"name": "Described Formula", "objective": "Initial description.", "items": []},
    ).json()

    response = client.patch(
        f"/api/v1/formulas/{formula['id']}",
        headers=headers,
        json={"objective": " "},
    )

    assert response.status_code == 422


def test_formula_update_rejects_blank_name() -> None:
    client = make_client()
    tenant_id = create_tenant(client, USER_A, "tenant-a")
    headers = {"X-User-Id": USER_A, "X-Tenant-Id": tenant_id}
    formula = client.post(
        "/api/v1/formulas",
        headers=headers,
        json={"name": "Named Formula", "objective": "Initial description.", "items": []},
    ).json()

    response = client.patch(
        f"/api/v1/formulas/{formula['id']}",
        headers=headers,
        json={"name": " "},
    )

    assert response.status_code == 422


def test_owner_can_archive_formula_and_default_list_hides_it() -> None:
    client = make_client()
    tenant_id = create_tenant(client, USER_A, "tenant-a")
    headers = {"X-User-Id": USER_A, "X-Tenant-Id": tenant_id}
    formula = client.post(
        "/api/v1/formulas",
        headers=headers,
        json={"name": "Archive Formula", "objective": "Formula to archive.", "items": []},
    ).json()

    archived = client.post(
        f"/api/v1/formulas/{formula['id']}/archive",
        headers=headers,
    )
    listed = client.get("/api/v1/formulas", headers=headers)
    listed_with_archive = client.get(
        "/api/v1/formulas?include_archived=true",
        headers=headers,
    )
    restored = client.post(
        f"/api/v1/formulas/{formula['id']}/restore",
        headers=headers,
    )
    listed_after_restore = client.get("/api/v1/formulas", headers=headers)

    assert archived.status_code == 200
    assert archived.json()["status"] == "archived"
    assert listed.status_code == 200
    assert listed.json() == []
    assert listed_with_archive.status_code == 200
    assert [item["id"] for item in listed_with_archive.json()] == [formula["id"]]
    assert restored.status_code == 200
    assert restored.json()["status"] == "draft"
    assert listed_after_restore.status_code == 200
    assert [item["id"] for item in listed_after_restore.json()] == [formula["id"]]


def test_only_owner_can_archive_formula() -> None:
    client = make_client()
    tenant_id = create_tenant(client, USER_A, "tenant-a")
    add_tenant_member(client, tenant_id, USER_B, "formulator")
    owner_headers = {"X-User-Id": USER_A, "X-Tenant-Id": tenant_id}
    formulator_headers = {"X-User-Id": USER_B, "X-Tenant-Id": tenant_id}
    formula = client.post(
        "/api/v1/formulas",
        headers=owner_headers,
        json={"name": "Owner Formula", "objective": "Formula owner archive test.", "items": []},
    ).json()

    forbidden = client.post(
        f"/api/v1/formulas/{formula['id']}/archive",
        headers=formulator_headers,
    )
    forbidden_archived_list = client.get(
        "/api/v1/formulas?include_archived=true",
        headers=formulator_headers,
    )
    forbidden_restore = client.post(
        f"/api/v1/formulas/{formula['id']}/restore",
        headers=formulator_headers,
    )

    assert forbidden.status_code == 403
    assert forbidden_archived_list.status_code == 403
    assert forbidden_restore.status_code == 403


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


def test_raw_material_aliases_are_tenant_scoped() -> None:
    client = make_client()
    tenant_a = create_tenant(client, USER_A, "tenant-a")
    tenant_b = create_tenant(client, USER_B, "tenant-b")
    headers_a = {"X-User-Id": USER_A, "X-Tenant-Id": tenant_a}
    headers_b = {"X-User-Id": USER_B, "X-Tenant-Id": tenant_b}
    raw_material = client.post(
        "/api/v1/raw-materials",
        headers=headers_a,
        json={"name": "Active A", "code": "ACT-A"},
    ).json()

    created = client.post(
        f"/api/v1/raw-materials/{raw_material['id']}/aliases",
        headers=headers_a,
        json={"alias": "Active Alpha"},
    )
    listed = client.get(
        f"/api/v1/raw-materials/{raw_material['id']}/aliases",
        headers=headers_a,
    )
    forbidden = client.get(
        f"/api/v1/raw-materials/{raw_material['id']}/aliases",
        headers=headers_b,
    )

    assert created.status_code == 201
    assert created.json()["normalized_alias"] == "active alpha"
    assert listed.status_code == 200
    assert listed.json()[0]["alias"] == "Active Alpha"
    assert forbidden.status_code == 404


def test_raw_material_alias_creation_is_idempotent_for_same_material() -> None:
    client = make_client()
    tenant_id = create_tenant(client, USER_A, "tenant-a")
    headers = {"X-User-Id": USER_A, "X-Tenant-Id": tenant_id}
    raw_material = client.post(
        "/api/v1/raw-materials",
        headers=headers,
        json={"name": "Active A", "code": "ACT-A"},
    ).json()
    alias_path = f"/api/v1/raw-materials/{raw_material['id']}/aliases"

    created = client.post(
        alias_path,
        headers=headers,
        json={"alias": "Active Alpha", "source": "excel_import"},
    )
    repeated = client.post(
        alias_path,
        headers=headers,
        json={"alias": " active   alpha ", "source": "excel_import"},
    )
    listed = client.get(alias_path, headers=headers)

    assert created.status_code == 201
    assert repeated.status_code == 200
    assert repeated.json()["id"] == created.json()["id"]
    assert listed.status_code == 200
    assert [alias["alias"] for alias in listed.json()] == ["Active Alpha"]


def test_raw_material_alias_creation_rejects_cross_material_conflict() -> None:
    client = make_client()
    tenant_id = create_tenant(client, USER_A, "tenant-a")
    headers = {"X-User-Id": USER_A, "X-Tenant-Id": tenant_id}
    material_a = client.post(
        "/api/v1/raw-materials",
        headers=headers,
        json={"name": "Active A", "code": "ACT-A"},
    ).json()
    material_b = client.post(
        "/api/v1/raw-materials",
        headers=headers,
        json={"name": "Carrier B", "code": "CAR-B"},
    ).json()

    created = client.post(
        f"/api/v1/raw-materials/{material_a['id']}/aliases",
        headers=headers,
        json={"alias": "Shared Alias", "source": "excel_import"},
    )
    conflict = client.post(
        f"/api/v1/raw-materials/{material_b['id']}/aliases",
        headers=headers,
        json={"alias": "shared alias", "source": "excel_import"},
    )

    assert created.status_code == 201
    assert conflict.status_code == 409
    assert conflict.json()["detail"] == "Alias already belongs to another raw material."


def test_raw_material_list_includes_current_price_parameters_and_aliases() -> None:
    client = make_client()
    tenant_id = create_tenant(client, USER_A, "tenant-a")
    headers = {"X-User-Id": USER_A, "X-Tenant-Id": tenant_id}
    parameter = client.post(
        "/api/v1/parameters",
        headers=headers,
        json={"code": "Ntotal", "name": "Nitrogen total", "unit": "% p/p"},
    ).json()
    raw_material = client.post(
        "/api/v1/raw-materials",
        headers=headers,
        json={"name": "Urea Technical", "code": "UREA", "external_code": "SAP-001"},
    ).json()

    client.post(
        f"/api/v1/raw-materials/{raw_material['id']}/prices",
        headers=headers,
        json={"price": 1.42, "currency": "EUR", "unit": "kg"},
    )
    client.post(
        f"/api/v1/raw-materials/{raw_material['id']}/parameter-values",
        headers=headers,
        json={"parameter_id": parameter["id"], "value": 46.0},
    )
    client.post(
        f"/api/v1/raw-materials/{raw_material['id']}/aliases",
        headers=headers,
        json={"alias": "Urea 46"},
    )

    listed = client.get("/api/v1/raw-materials", headers=headers)

    assert listed.status_code == 200
    listed_material = listed.json()[0]
    assert listed_material["current_price"]["price"] == 1.42
    assert listed_material["parameters"] == [
        {
            "parameter_id": parameter["id"],
            "code": "Ntotal",
            "name": "Nitrogen total",
            "value": 46.0,
            "unit": "% p/p",
            "source": None,
            "confidence": None,
        }
    ]
    assert listed_material["aliases"] == ["Urea 46"]


def test_raw_material_catalog_is_light_and_filterable() -> None:
    client = make_client()
    tenant_id = create_tenant(client, USER_A, "tenant-a")
    headers = {"X-User-Id": USER_A, "X-Tenant-Id": tenant_id}
    boron = client.post(
        "/api/v1/parameters",
        headers=headers,
        json={"code": "B", "name": "Boron", "unit": "%"},
    ).json()
    amino = client.post(
        "/api/v1/parameters",
        headers=headers,
        json={"code": "Sum AA libres", "name": "Free amino acids", "unit": "%"},
    ).json()
    priced = client.post(
        "/api/v1/raw-materials",
        headers=headers,
        json={"name": "Boron Solution", "code": "BOR", "family": "Micros"},
    ).json()
    missing_price = client.post(
        "/api/v1/raw-materials",
        headers=headers,
        json={"name": "Plain Water", "code": "WATER", "family": "Carrier"},
    ).json()

    client.post(
        f"/api/v1/raw-materials/{priced['id']}/prices",
        headers=headers,
        json={"price": 2.5, "currency": "EUR", "unit": "kg"},
    )
    client.post(
        f"/api/v1/raw-materials/{priced['id']}/parameter-values",
        headers=headers,
        json={"parameter_id": boron["id"], "value": 5.5},
    )
    client.post(
        f"/api/v1/raw-materials/{priced['id']}/parameter-values",
        headers=headers,
        json={"parameter_id": amino["id"], "value": 0.2},
    )

    filtered = client.get(
        "/api/v1/raw-materials/catalog",
        params=[
            ("price_filter", "with_price"),
            ("parameter_range", "B|4|10"),
            ("parameter_range", "Sum AA libres|0.01|"),
        ],
        headers=headers,
    )
    missing = client.get(
        "/api/v1/raw-materials/catalog?price_filter=missing_price&parameter=B&only_positive=false",
        headers=headers,
    )
    zero_boron = client.get(
        "/api/v1/raw-materials/catalog",
        params=[("parameter_range", "B|0|0")],
        headers=headers,
    )

    assert filtered.status_code == 200
    filtered_payload = filtered.json()
    assert filtered_payload["total"] == 1
    assert filtered_payload["items"][0]["name"] == "Boron Solution"
    assert filtered_payload["items"][0]["current_price"]["price"] == 2.5
    assert filtered_payload["items"][0]["parameter_count"] == 2
    assert filtered_payload["items"][0]["positive_parameter_count"] == 2
    assert filtered_payload["families"] == ["Carrier", "Micros"]
    assert "parameters" not in filtered_payload["items"][0]

    assert missing.status_code == 200
    missing_payload = missing.json()
    assert missing_payload["total"] == 1
    assert missing_payload["items"][0]["name"] == "Plain Water"
    assert missing_payload["items"][0]["parameter_count"] == 2
    assert missing_payload["items"][0]["positive_parameter_count"] == 0

    assert zero_boron.status_code == 200
    zero_boron_payload = zero_boron.json()
    assert zero_boron_payload["total"] == 1
    assert zero_boron_payload["items"][0]["name"] == "Plain Water"


def test_raw_material_catalog_excludes_obsolete_materials() -> None:
    client = make_client()
    tenant_id = create_tenant(client, USER_A, "tenant-a")
    headers = {"X-User-Id": USER_A, "X-Tenant-Id": tenant_id}
    active = client.post(
        "/api/v1/raw-materials",
        headers=headers,
        json={"name": "Active Material", "code": "ACT", "family": "Selectable"},
    ).json()
    obsolete = client.post(
        "/api/v1/raw-materials",
        headers=headers,
        json={"name": "Obsolete Material", "code": "OBS", "family": "Deprecated"},
    ).json()
    updated = client.patch(
        f"/api/v1/raw-materials/{obsolete['id']}",
        headers=headers,
        json={"is_obsolete": True},
    )

    response = client.get("/api/v1/raw-materials/catalog", headers=headers)
    full_list = client.get("/api/v1/raw-materials", headers=headers)

    assert updated.status_code == 200
    assert updated.json()["is_obsolete"] is True
    assert updated.json()["is_active"] is False
    assert response.status_code == 200
    assert full_list.status_code == 200
    assert {item["id"] for item in full_list.json()} == {active["id"], obsolete["id"]}
    payload = response.json()
    assert payload["total"] == 1
    assert [item["id"] for item in payload["items"]] == [active["id"]]
    assert payload["families"] == ["Selectable"]


def test_owner_can_archive_raw_material() -> None:
    client = make_client()
    tenant_id = create_tenant(client, USER_A, "tenant-a")
    headers = {"X-User-Id": USER_A, "X-Tenant-Id": tenant_id}
    active = client.post(
        "/api/v1/raw-materials",
        headers=headers,
        json={"name": "Archive Raw Material", "code": "ARCH-RM", "family": "Selectable"},
    ).json()

    archived = client.post(
        f"/api/v1/raw-materials/{active['id']}/archive",
        headers=headers,
    )
    catalog = client.get("/api/v1/raw-materials/catalog", headers=headers)
    full_list = client.get("/api/v1/raw-materials", headers=headers)
    restored = client.post(
        f"/api/v1/raw-materials/{active['id']}/restore",
        headers=headers,
    )
    restored_catalog = client.get("/api/v1/raw-materials/catalog", headers=headers)

    assert archived.status_code == 200
    assert archived.json()["is_obsolete"] is True
    assert archived.json()["is_active"] is False
    assert catalog.status_code == 200
    assert catalog.json()["total"] == 0
    assert full_list.status_code == 200
    assert [item["id"] for item in full_list.json()] == [active["id"]]
    assert restored.status_code == 200
    assert restored.json()["is_obsolete"] is False
    assert restored.json()["is_active"] is True
    assert restored_catalog.status_code == 200
    assert [item["id"] for item in restored_catalog.json()["items"]] == [active["id"]]


def test_only_owner_can_archive_raw_material_or_change_material_status() -> None:
    client = make_client()
    tenant_id = create_tenant(client, USER_A, "tenant-a")
    add_tenant_member(client, tenant_id, USER_B, "formulator")
    owner_headers = {"X-User-Id": USER_A, "X-Tenant-Id": tenant_id}
    formulator_headers = {"X-User-Id": USER_B, "X-Tenant-Id": tenant_id}
    material = client.post(
        "/api/v1/raw-materials",
        headers=owner_headers,
        json={"name": "Owner Raw Material", "code": "OWNER-RM"},
    ).json()

    forbidden_archive = client.post(
        f"/api/v1/raw-materials/{material['id']}/archive",
        headers=formulator_headers,
    )
    forbidden_status_patch = client.patch(
        f"/api/v1/raw-materials/{material['id']}",
        headers=formulator_headers,
        json={"is_obsolete": True},
    )
    forbidden_restore = client.post(
        f"/api/v1/raw-materials/{material['id']}/restore",
        headers=formulator_headers,
    )

    assert forbidden_archive.status_code == 403
    assert forbidden_status_patch.status_code == 403
    assert forbidden_restore.status_code == 403


def test_raw_material_master_blocks_duplicate_identity() -> None:
    client = make_client()
    tenant_id = create_tenant(client, USER_A, "tenant-a")
    headers = {"X-User-Id": USER_A, "X-Tenant-Id": tenant_id}
    created = client.post(
        "/api/v1/raw-materials",
        headers=headers,
        json={
            "name": "Urea Technical",
            "code": "UREA",
            "external_code": "SAP-001",
        },
    )
    assert created.status_code == 201

    duplicate_code = client.post(
        "/api/v1/raw-materials",
        headers=headers,
        json={"name": "Different Name", "code": "UREA"},
    )
    duplicate_sap_code = client.post(
        "/api/v1/raw-materials",
        headers=headers,
        json={"name": "Another Name", "external_code": "SAP-001"},
    )
    duplicate_name = client.post(
        "/api/v1/raw-materials",
        headers=headers,
        json={"name": "  urea   technical  ", "code": "UREA-2"},
    )

    assert duplicate_code.status_code == 409
    assert duplicate_code.json()["detail"] == "Raw material code already exists for this tenant."
    assert duplicate_sap_code.status_code == 409
    assert (
        duplicate_sap_code.json()["detail"]
        == "Raw material SAP code already exists for this tenant."
    )
    assert duplicate_name.status_code == 409
    assert (
        duplicate_name.json()["detail"]
        == "Raw material name already exists for this tenant."
    )


def test_raw_material_update_blocks_duplicate_identity() -> None:
    client = make_client()
    tenant_id = create_tenant(client, USER_A, "tenant-a")
    headers = {"X-User-Id": USER_A, "X-Tenant-Id": tenant_id}
    first = client.post(
        "/api/v1/raw-materials",
        headers=headers,
        json={"name": "Material A", "code": "MAT-A", "external_code": "SAP-A"},
    ).json()
    second = client.post(
        "/api/v1/raw-materials",
        headers=headers,
        json={"name": "Material B", "code": "MAT-B", "external_code": "SAP-B"},
    ).json()

    duplicate_code = client.patch(
        f"/api/v1/raw-materials/{second['id']}",
        headers=headers,
        json={"code": "MAT-A"},
    )
    duplicate_sap_code = client.patch(
        f"/api/v1/raw-materials/{second['id']}",
        headers=headers,
        json={"external_code": "SAP-A"},
    )
    duplicate_name = client.patch(
        f"/api/v1/raw-materials/{second['id']}",
        headers=headers,
        json={"name": " material   a "},
    )

    assert first["id"] != second["id"]
    assert duplicate_code.status_code == 409
    assert duplicate_sap_code.status_code == 409
    assert duplicate_name.status_code == 409


def test_raw_material_prices_are_validated_and_listed_as_history() -> None:
    client = make_client()
    tenant_id = create_tenant(client, USER_A, "tenant-a")
    headers = {"X-User-Id": USER_A, "X-Tenant-Id": tenant_id}
    raw_material = client.post(
        "/api/v1/raw-materials",
        headers=headers,
        json={"name": "Urea Technical", "code": "UREA"},
    ).json()

    negative = client.post(
        f"/api/v1/raw-materials/{raw_material['id']}/prices",
        headers=headers,
        json={"price": -1, "currency": "EUR", "unit": "kg"},
    )
    older = client.post(
        f"/api/v1/raw-materials/{raw_material['id']}/prices",
        headers=headers,
        json={"price": 1.25, "currency": "EUR", "unit": "kg", "valid_from": "2026-01-01"},
    )
    newer = client.post(
        f"/api/v1/raw-materials/{raw_material['id']}/prices",
        headers=headers,
        json={"price": 1.45, "currency": "EUR", "unit": "kg", "valid_from": "2026-06-01"},
    )
    history = client.get(
        f"/api/v1/raw-materials/{raw_material['id']}/prices",
        headers=headers,
    )
    detail = client.get(f"/api/v1/raw-materials/{raw_material['id']}", headers=headers)

    assert negative.status_code == 400
    assert negative.json()["detail"] == "Raw material price cannot be negative."
    assert older.status_code == 201
    assert newer.status_code == 201
    assert history.status_code == 200
    assert [row["price"] for row in history.json()] == [1.45, 1.25]
    assert detail.json()["current_price"]["price"] == 1.45


def test_compatibility_rules_are_tenant_scoped() -> None:
    client = make_client()
    tenant_a = create_tenant(client, USER_A, "tenant-a")
    tenant_b = create_tenant(client, USER_B, "tenant-b")
    headers_a = {"X-User-Id": USER_A, "X-Tenant-Id": tenant_a}
    headers_b = {"X-User-Id": USER_B, "X-Tenant-Id": tenant_b}
    rm_1 = client.post(
        "/api/v1/raw-materials",
        headers=headers_a,
        json={"name": "Material A", "code": "MAT-A"},
    ).json()
    rm_2 = client.post(
        "/api/v1/raw-materials",
        headers=headers_a,
        json={"name": "Material B", "code": "MAT-B"},
    ).json()

    created = client.post(
        "/api/v1/compatibility-rules",
        headers=headers_a,
        json={
            "severity": "blocker",
            "material_a_id": rm_1["id"],
            "material_b_id": rm_2["id"],
            "message": "Material A and Material B are incompatible.",
            "recommended_action": "Replace one of the two materials.",
        },
    )
    listed_a = client.get("/api/v1/compatibility-rules", headers=headers_a)
    listed_b = client.get("/api/v1/compatibility-rules", headers=headers_b)
    cross_tenant = client.post(
        "/api/v1/compatibility-rules",
        headers=headers_b,
        json={
            "severity": "warning",
            "material_a_id": rm_1["id"],
            "material_b_id": rm_2["id"],
            "message": "Should not be allowed.",
        },
    )

    assert created.status_code == 201
    rule = created.json()
    assert rule["tenant_id"] == tenant_a
    assert rule["rule_type"] == "material_pair"
    assert rule["condition_json"]["raw_material_ids"] == sorted([rm_1["id"], rm_2["id"]])
    assert rule["condition_json"]["recommended_action"] == "Replace one of the two materials."
    assert listed_a.status_code == 200
    assert [item["id"] for item in listed_a.json()] == [rule["id"]]
    assert listed_b.status_code == 200
    assert listed_b.json() == []
    assert cross_tenant.status_code == 404


def test_formula_calculation_reports_manual_compatibility_rule() -> None:
    client = make_client()
    tenant_id = create_tenant(client, USER_A, "tenant-a")
    headers = {"X-User-Id": USER_A, "X-Tenant-Id": tenant_id}
    rm_1 = client.post(
        "/api/v1/raw-materials",
        headers=headers,
        json={"name": "Material A", "code": "MAT-A"},
    ).json()
    rm_2 = client.post(
        "/api/v1/raw-materials",
        headers=headers,
        json={"name": "Material B", "code": "MAT-B"},
    ).json()
    rm_3 = client.post(
        "/api/v1/raw-materials",
        headers=headers,
        json={"name": "Material C", "code": "MAT-C"},
    ).json()
    for raw_material in [rm_1, rm_2, rm_3]:
        client.post(
            f"/api/v1/raw-materials/{raw_material['id']}/prices",
            headers=headers,
            json={"price": 1.0, "currency": "EUR", "unit": "kg"},
        )
    created_rule = client.post(
        "/api/v1/compatibility-rules",
        headers=headers,
        json={
            "severity": "blocker",
            "material_a_id": rm_1["id"],
            "material_b_id": rm_2["id"],
            "message": "Material A and Material B should not be combined.",
            "recommended_action": "Use Material C instead of Material B.",
        },
    ).json()

    compatible = client.post(
        "/api/v1/formulas/calculate",
        headers=headers,
        json={
            "items": [
                {"raw_material_id": rm_1["id"], "percentage": 50},
                {"raw_material_id": rm_3["id"], "percentage": 50},
            ]
        },
    )
    incompatible = client.post(
        "/api/v1/formulas/calculate",
        headers=headers,
        json={
            "items": [
                {"raw_material_id": rm_1["id"], "percentage": 50},
                {"raw_material_id": rm_2["id"], "percentage": 50},
            ]
        },
    )

    assert compatible.status_code == 200
    assert compatible.json()["warnings"] == []
    assert incompatible.status_code == 200
    warnings = incompatible.json()["warnings"]
    assert warnings == [
        {
            "code": "compatibility_blocker",
            "severity": "blocker",
            "rule_id": created_rule["id"],
            "message": "Material A and Material B should not be combined.",
            "recommended_action": "Use Material C instead of Material B.",
            "raw_material_id": None,
            "parameter_code": None,
        }
    ]


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
            "objective": "Foundation calculation test.",
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


def test_persisted_formula_treats_missing_active_parameters_as_zero() -> None:
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
    material_detail = client.get(
        f"/api/v1/raw-materials/{raw_material['id']}",
        headers=headers,
    )
    assert material_detail.status_code == 200
    assert material_detail.json()["parameters"] == [
        {
            "parameter_id": parameter.json()["id"],
            "code": "viscosity",
            "name": "Viscosity",
            "value": 0.0,
            "unit": "cP",
            "source": "default_zero",
            "confidence": None,
        }
    ]
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
            "objective": "Formula used to verify default zero parameters.",
            "items": [{"raw_material_id": raw_material["id"], "percentage": 100}],
        },
    ).json()

    response = client.post(
        f"/api/v1/formulas/{formula['id']}/calculate",
        headers=headers,
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["warnings"] == []
    assert payload["parameters"] == [
        {"code": "viscosity", "value": 0.0, "unit": "cP"}
    ]


def test_new_parameter_backfills_existing_raw_materials_with_zero() -> None:
    client = make_client()
    tenant_id = create_tenant(client, USER_A, "tenant-a")
    headers = {"X-User-Id": USER_A, "X-Tenant-Id": tenant_id}
    raw_material = client.post(
        "/api/v1/raw-materials",
        headers=headers,
        json={"name": "Carrier", "code": "CAR"},
    ).json()

    parameter = client.post(
        "/api/v1/parameters",
        headers=headers,
        json={"code": "B", "name": "Boron", "unit": "%"},
    )

    assert parameter.status_code == 201
    detail = client.get(f"/api/v1/raw-materials/{raw_material['id']}", headers=headers)
    assert detail.status_code == 200
    assert detail.json()["parameters"] == [
        {
            "parameter_id": parameter.json()["id"],
            "code": "B",
            "name": "Boron",
            "value": 0.0,
            "unit": "%",
            "source": "default_zero",
            "confidence": None,
        }
    ]


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
            "objective": "Formula used to verify calculation history scoping.",
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
