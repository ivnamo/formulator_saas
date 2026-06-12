from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

from dotenv import dotenv_values
from sqlmodel import Session, select

ROOT = Path(__file__).resolve().parents[1]
API_SRC = ROOT / "apps" / "api" / "src"
if str(API_SRC) not in sys.path:
    sys.path.insert(0, str(API_SRC))

from formulia_api.database import create_db_engine  # noqa: E402
from formulia_api.models import Parameter, RawMaterial, RawMaterialParameterValue  # noqa: E402


def load_local_env(path: Path) -> None:
    if not path.exists():
        return
    for key, value in dotenv_values(path).items():
        if value is not None and key not in os.environ:
            os.environ[key] = value


def backfill_zero_parameter_values(*, dry_run: bool) -> dict[str, int]:
    engine = create_db_engine()
    inserted = 0
    tenants_seen: set[str] = set()

    with Session(engine) as session:
        materials = session.exec(select(RawMaterial)).all()
        parameters_by_tenant: dict[object, list[Parameter]] = {}
        existing_pairs = {
            (value.raw_material_id, value.parameter_id)
            for value in session.exec(select(RawMaterialParameterValue)).all()
        }

        for material in materials:
            tenants_seen.add(str(material.tenant_id))
            parameters = parameters_by_tenant.get(material.tenant_id)
            if parameters is None:
                parameters = session.exec(
                    select(Parameter).where(
                        Parameter.tenant_id == material.tenant_id,
                        Parameter.is_active.is_(True),
                    )
                ).all()
                parameters_by_tenant[material.tenant_id] = parameters

            for parameter in parameters:
                pair = (material.id, parameter.id)
                if pair in existing_pairs:
                    continue
                inserted += 1
                existing_pairs.add(pair)
                if dry_run:
                    continue
                session.add(
                    RawMaterialParameterValue(
                        tenant_id=material.tenant_id,
                        raw_material_id=material.id,
                        parameter_id=parameter.id,
                        value=0,
                        source="default_zero",
                    )
                )

        if not dry_run:
            session.commit()

    return {
        "tenants": len(tenants_seen),
        "materials": len(materials),
        "missing_pairs": inserted,
        "inserted": 0 if dry_run else inserted,
    }


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Backfill explicit zero parameter values for active tenant parameters."
    )
    parser.add_argument("--env-file", default=str(ROOT / ".env.local"))
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    load_local_env(Path(args.env_file))
    summary = backfill_zero_parameter_values(dry_run=args.dry_run)
    print(summary)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
