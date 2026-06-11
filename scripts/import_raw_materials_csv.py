from __future__ import annotations

import argparse
import csv
import hashlib
import json
import sys
import unicodedata
from datetime import date
from pathlib import Path

from sqlmodel import Session, select


WORKSPACE_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(WORKSPACE_ROOT / "apps" / "api" / "src"))

from formulia_api.database import create_db_engine, init_db
from formulia_api.local_env import load_local_env
from formulia_api.models import (
    Parameter,
    RawMaterial,
    RawMaterialImport,
    RawMaterialImportRow,
    RawMaterialParameterValue,
    RawMaterialPrice,
    Tenant,
    TenantMember,
    User,
)
from formulia_api.tenant import DEV_USER_ID


EXCLUDED_COLUMNS = {
    "id",
    "Materia Prima",
    "Precio €/kg",
    "%",
    "Código SAP",
    "Estado SAP",
    "Precio anterior €/kg",
    "Precio SAP €/kg",
    "ItemName SAP",
    "Tipo cruce",
    "Candidato SAP",
    "Score candidato",
    "Variación €/kg",
    "Variación %",
}

FAMILY_BY_COLUMN = {
    "Ntotal": "Nitrogen",
    "Norg": "Nitrogen",
    "Nnitr": "Nitrogen",
    "Nure": "Nitrogen",
    "Namo": "Nitrogen",
    "K2O": "Macronutrients",
    "P2O5": "Macronutrients",
    "CaO": "Macronutrients",
    "MgO": "Macronutrients",
    "SO3": "Macronutrients",
    "SiO2": "Macronutrients",
    "Zn": "Micronutrients",
    "Mn": "Micronutrients",
    "Fe": "Micronutrients",
    "Cu": "Micronutrients",
    "B": "Micronutrients",
    "Mo": "Micronutrients",
    "Co": "Micronutrients",
    "Mseca": "Organic matter",
    "Morg": "Organic matter",
    "Corg": "Organic matter",
    "Extracto Húmico total": "Humic substances",
    "Acidos fulvicos": "Humic substances",
    "Acidos húmicos": "Humic substances",
    "Extracto de Algas": "Biostimulants",
    "Polisacaridos": "Biostimulants",
    "Sum AA totales": "Amino acids",
    "Sum AA libres": "Amino acids",
    "As": "Trace elements",
    "Hg": "Trace elements",
    "Pb": "Trace elements",
    "Cd": "Trace elements",
    "Cr": "Trace elements",
    "Ni": "Trace elements",
}


def main() -> None:
    args = parse_args()
    csv_path = args.csv_path.resolve()
    rows = read_rows(csv_path)
    if not rows:
        raise SystemExit("CSV has no rows.")

    feature_columns = [
        column for column in rows[0].keys() if column not in EXCLUDED_COLUMNS
    ]
    source = args.source or csv_path.stem
    source_hash = sha256_file(csv_path)
    summary = preview_summary(rows, feature_columns)

    if args.dry_run:
        print(
            json.dumps(
                {
                    "mode": "dry_run",
                    "rows": len(rows),
                    "feature_columns": len(feature_columns),
                    **summary,
                },
                ensure_ascii=False,
                indent=2,
            )
        )
        return

    load_local_env(WORKSPACE_ROOT)
    engine = create_db_engine()
    init_db(engine)

    with Session(engine) as session:
        tenant = ensure_tenant(session, args.tenant_slug, args.tenant_name)
        parameters = ensure_parameters(session, tenant.id, feature_columns)
        materials_created = 0
        materials_updated = 0
        prices_created = 0
        prices_updated = 0
        values_upserted = 0

        import_record = RawMaterialImport(
            tenant_id=tenant.id,
            file_name=csv_path.name,
            source=source,
            source_hash=source_hash,
            status="running",
            summary_json={
                "rows": len(rows),
                "feature_columns": len(feature_columns),
                **summary,
            },
        )
        session.add(import_record)
        session.flush()

        for index, row in enumerate(rows, start=2):
            material, created = upsert_material(session, tenant.id, row, source)
            if created:
                materials_created += 1
                action = "created"
            else:
                materials_updated += 1
                action = "updated"

            price_action = upsert_price(
                session,
                tenant.id,
                material.id,
                row,
                source,
                args.valid_from,
            )
            if price_action == "created":
                prices_created += 1
            elif price_action == "updated":
                prices_updated += 1

            values_upserted += upsert_parameter_values(
                session,
                tenant.id,
                material.id,
                row,
                parameters,
                source,
            )

            session.add(
                RawMaterialImportRow(
                    tenant_id=tenant.id,
                    import_id=import_record.id,
                    row_number=index,
                    raw_material_id=material.id,
                    raw_name=clean(row.get("Materia Prima")),
                    action=action,
                    status="ok",
                    raw_row_json=dict(row),
                )
            )

        import_record.status = "applied"
        import_record.summary_json = {
            **import_record.summary_json,
            "materials_created": materials_created,
            "materials_updated": materials_updated,
            "prices_created": prices_created,
            "prices_updated": prices_updated,
            "parameter_values_upserted": values_upserted,
        }
        session.add(import_record)
        session.commit()

        print(
            json.dumps(
                {
                    "mode": "applied",
                    "tenant_id": str(tenant.id),
                    "import_id": str(import_record.id),
                    **import_record.summary_json,
                },
                ensure_ascii=False,
                indent=2,
            )
        )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Import tenant raw materials, prices, and parameter values from CSV."
    )
    parser.add_argument("csv_path", type=Path)
    parser.add_argument("--tenant-slug", default="atlantica-agricola")
    parser.add_argument("--tenant-name", default="Atlantica Agricola")
    parser.add_argument("--valid-from", type=date.fromisoformat, default=date(2026, 6, 1))
    parser.add_argument("--source")
    parser.add_argument("--dry-run", action="store_true")
    return parser.parse_args()


def read_rows(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def preview_summary(rows: list[dict[str, str]], feature_columns: list[str]) -> dict[str, int]:
    priced_rows = 0
    zero_or_missing_prices = 0
    sap_rows = 0
    research_rows = 0
    for row in rows:
        price = parse_decimal(row.get("Precio €/kg"))
        if price is not None and price > 0:
            priced_rows += 1
        else:
            zero_or_missing_prices += 1
        if clean(row.get("Código SAP")):
            sap_rows += 1
        else:
            research_rows += 1
    return {
        "priced_rows": priced_rows,
        "zero_or_missing_price_rows": zero_or_missing_prices,
        "sap_rows": sap_rows,
        "research_rows": research_rows,
    }


def ensure_tenant(session: Session, slug: str, name: str) -> Tenant:
    user = session.get(User, DEV_USER_ID)
    if user is None:
        user = User(id=DEV_USER_ID, email="local-developer@formulia.local", name="Local Developer")
        session.add(user)
        session.flush()

    tenant = session.exec(select(Tenant).where(Tenant.slug == slug)).first()
    if tenant is None:
        tenant = Tenant(name=name, slug=slug, status="active")
        session.add(tenant)
        session.flush()
    else:
        tenant.name = name
        tenant.status = "active"
        session.add(tenant)

    member = session.exec(
        select(TenantMember).where(
            TenantMember.tenant_id == tenant.id,
            TenantMember.user_id == user.id,
        )
    ).first()
    if member is None:
        session.add(
            TenantMember(
                tenant_id=tenant.id,
                user_id=user.id,
                role="owner",
                status="active",
            )
        )
    else:
        member.role = "owner"
        member.status = "active"
        session.add(member)

    return tenant


def ensure_parameters(
    session: Session,
    tenant_id,
    feature_columns: list[str],
) -> dict[str, Parameter]:
    existing = {
        parameter.code: parameter
        for parameter in session.exec(
            select(Parameter).where(Parameter.tenant_id == tenant_id)
        ).all()
    }
    parameters: dict[str, Parameter] = {}
    for column in feature_columns:
        code = parameter_code(column)
        parameter = existing.get(code)
        if parameter is None:
            parameter = Parameter(
                tenant_id=tenant_id,
                code=code,
                name=column,
                unit="%",
                family=FAMILY_BY_COLUMN.get(column, "Amino acids"),
                decimals=4,
                is_active=True,
            )
            session.add(parameter)
            session.flush()
        else:
            parameter.name = column
            parameter.unit = "%"
            parameter.family = FAMILY_BY_COLUMN.get(column, parameter.family)
            parameter.is_active = True
            session.add(parameter)
        parameters[column] = parameter
    return parameters


def upsert_material(
    session: Session,
    tenant_id,
    row: dict[str, str],
    source: str,
) -> tuple[RawMaterial, bool]:
    source_id = clean(row.get("id"))
    sap_code = clean(row.get("Código SAP"))
    name = clean(row.get("Materia Prima"))
    if not name:
        raise ValueError("Raw material name cannot be empty.")

    code = sap_code or f"CSV-{source_id}"
    material = None
    if code:
        material = session.exec(
            select(RawMaterial).where(
                RawMaterial.tenant_id == tenant_id,
                RawMaterial.code == code,
            )
        ).first()
    if material is None:
        material = session.exec(
            select(RawMaterial).where(
                RawMaterial.tenant_id == tenant_id,
                RawMaterial.normalized_name == normalize_name(name),
            )
        ).first()

    metadata = {
        "source": source,
        "source_id": source_id,
        "sap_status": clean(row.get("Estado SAP")),
        "sap_item_name": clean(row.get("ItemName SAP")),
        "match_type": clean(row.get("Tipo cruce")),
        "sap_candidate": clean(row.get("Candidato SAP")),
        "sap_candidate_score": clean(row.get("Score candidato")),
    }
    notes = json.dumps(metadata, ensure_ascii=False, sort_keys=True)

    created = material is None
    if material is None:
        material = RawMaterial(
            tenant_id=tenant_id,
            code=code,
            external_code=sap_code or None,
            name=name,
            normalized_name=normalize_name(name),
            notes=notes,
        )
    else:
        material.code = code
        material.external_code = sap_code or None
        material.name = name
        material.normalized_name = normalize_name(name)
        material.notes = notes
        material.is_active = True
    session.add(material)
    session.flush()
    return material, created


def upsert_price(
    session: Session,
    tenant_id,
    raw_material_id,
    row: dict[str, str],
    source: str,
    valid_from: date,
) -> str | None:
    price = parse_decimal(row.get("Precio €/kg"))
    if price is None or price <= 0:
        return None

    existing = session.exec(
        select(RawMaterialPrice).where(
            RawMaterialPrice.tenant_id == tenant_id,
            RawMaterialPrice.raw_material_id == raw_material_id,
            RawMaterialPrice.source == source,
            RawMaterialPrice.valid_from == valid_from,
        )
    ).first()
    if existing is None:
        session.add(
            RawMaterialPrice(
                tenant_id=tenant_id,
                raw_material_id=raw_material_id,
                price=price,
                currency="EUR",
                unit="kg",
                source=source,
                valid_from=valid_from,
            )
        )
        return "created"

    existing.price = price
    existing.currency = "EUR"
    existing.unit = "kg"
    session.add(existing)
    return "updated"


def upsert_parameter_values(
    session: Session,
    tenant_id,
    raw_material_id,
    row: dict[str, str],
    parameters: dict[str, Parameter],
    source: str,
) -> int:
    existing = {
        value.parameter_id: value
        for value in session.exec(
            select(RawMaterialParameterValue).where(
                RawMaterialParameterValue.tenant_id == tenant_id,
                RawMaterialParameterValue.raw_material_id == raw_material_id,
            )
        ).all()
    }
    upserted = 0
    for column, parameter in parameters.items():
        parsed = parse_decimal(row.get(column))
        if parsed is None:
            continue
        value = existing.get(parameter.id)
        if value is None:
            value = RawMaterialParameterValue(
                tenant_id=tenant_id,
                raw_material_id=raw_material_id,
                parameter_id=parameter.id,
                value=parsed,
                source=source,
            )
        else:
            value.value = parsed
            value.source = source
        session.add(value)
        upserted += 1
    return upserted


def parameter_code(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    ascii_value = normalized.encode("ascii", "ignore").decode("ascii")
    chars = [char.lower() if char.isalnum() else "_" for char in ascii_value]
    return "_".join("".join(chars).strip("_").split("_"))


def normalize_name(value: str) -> str:
    return " ".join(value.strip().lower().split())


def clean(value: str | None) -> str:
    return "" if value is None else value.strip()


def parse_decimal(value: str | None) -> float | None:
    cleaned = clean(value)
    if not cleaned:
        return None
    try:
        return float(cleaned.replace(",", "."))
    except ValueError:
        return None


if __name__ == "__main__":
    main()
