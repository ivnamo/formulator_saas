from __future__ import annotations

import argparse
import json
import os
import re
from urllib.parse import urlparse, urlunparse

from sqlmodel import Session, select

from formulia_api.database import create_db_engine, init_db
from formulia_api.local_env import load_local_env
from formulia_api.models import IsoDesignProject, Tenant, utc_now


ATLANTICA_SLUG = "atlantica-agricola"


def main() -> None:
    load_local_env()
    parser = argparse.ArgumentParser(
        description="Repair ISO F10-01 ProyectoID and No Solicitud values for a tenant/year."
    )
    parser.add_argument("--tenant-slug", default=ATLANTICA_SLUG)
    parser.add_argument("--year", type=int, default=2026)
    parser.add_argument("--database-url", default=None)
    parser.add_argument("--use-transaction-pooler", action="store_true")
    parser.add_argument("--skip-init-db", action="store_true")
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()

    database_url = args.database_url or os.getenv("DATABASE_URL")
    if args.use_transaction_pooler and database_url:
        database_url = _transaction_pooler_url(database_url)
    engine = create_db_engine(database_url)
    try:
        if not args.skip_init_db:
            init_db(engine)
        with Session(engine) as session:
            tenant = session.exec(select(Tenant).where(Tenant.slug == args.tenant_slug)).first()
            if tenant is None:
                raise SystemExit(f"Tenant not found: {args.tenant_slug}")
            report = repair_iso_projects(
                session,
                tenant.id,
                year=args.year,
                apply=args.apply,
            )
            if args.apply:
                session.commit()
            print(json.dumps(report, ensure_ascii=False, indent=2, default=str))
    finally:
        engine.dispose()


def repair_iso_projects(session: Session, tenant_id, *, year: int, apply: bool) -> dict:
    projects = session.exec(
        select(IsoDesignProject).where(IsoDesignProject.tenant_id == tenant_id)
    ).all()
    target_projects = [project for project in projects if project.year == year]
    next_project_code = _next_numeric_project_code(projects)
    next_request_number = _next_iso_request_number(projects, year)
    used_project_codes = {
        str(project.project_code or "").strip().casefold()
        for project in projects
        if str(project.project_code or "").strip()
    }
    repairs = []

    for project in sorted(
        target_projects,
        key=lambda item: (item.created_at, item.product_name.casefold(), str(item.id)),
    ):
        old_request = project.iso_request_number
        old_project_code = project.project_code
        request_is_valid = _is_valid_request_number(old_request, year)
        code_is_valid = _is_numeric_project_code(old_project_code)
        if request_is_valid and code_is_valid:
            continue

        next_request = old_request if request_is_valid else f"{next_request_number}/{year}"
        if not request_is_valid:
            next_request_number += 1

        if code_is_valid:
            next_code = str(old_project_code).strip()
        else:
            while str(next_project_code).casefold() in used_project_codes:
                next_project_code += 1
            next_code = str(next_project_code)
            next_project_code += 1
        used_project_codes.add(next_code.casefold())

        repairs.append(
            {
                "id": str(project.id),
                "product_name": project.product_name,
                "old_iso_request_number": old_request,
                "new_iso_request_number": next_request,
                "old_project_code": old_project_code,
                "new_project_code": next_code,
            }
        )
        if apply:
            project.iso_request_number = next_request
            project.project_code = next_code
            project.year = year
            project.comments = _append_repair_comment(
                project.comments,
                old_request=old_request,
                old_project_code=old_project_code,
                new_request=next_request,
                new_project_code=next_code,
            )
            project.updated_at = utc_now()
            session.add(project)

    return {
        "mode": "apply" if apply else "preview",
        "year": year,
        "total_year_projects": len(target_projects),
        "repaired_projects": len(repairs),
        "sample": repairs[:12],
    }


def _is_valid_request_number(value: object, year: int) -> bool:
    return re.fullmatch(rf"\d{{1,3}}/{year}", str(value or "").strip()) is not None


def _is_numeric_project_code(value: object) -> bool:
    return re.fullmatch(r"\d+", str(value or "").strip()) is not None


def _next_numeric_project_code(projects: list[IsoDesignProject]) -> int:
    highest = 0
    for project in projects:
        value = str(project.project_code or "").strip()
        if re.fullmatch(r"\d+", value):
            highest = max(highest, int(value))
    return highest + 1


def _next_iso_request_number(projects: list[IsoDesignProject], year: int) -> int:
    highest = 0
    pattern = re.compile(rf"^(\d+)/{year}$")
    for project in projects:
        match = pattern.fullmatch(str(project.iso_request_number or "").strip())
        if match:
            highest = max(highest, int(match.group(1)))
    return highest + 1


def _append_repair_comment(
    comments: str | None,
    *,
    old_request: str,
    old_project_code: str | None,
    new_request: str,
    new_project_code: str,
) -> str:
    note = (
        "Reparacion ISO: No Solicitud/ProyectoID normalizados. "
        f"No Solicitud anterior: {old_request}; ProyectoID anterior: {old_project_code or '-'}; "
        f"No Solicitud nueva: {new_request}; ProyectoID nuevo: {new_project_code}."
    )
    cleaned = (comments or "").strip()
    return f"{cleaned}\n\n{note}" if cleaned else note


def _transaction_pooler_url(database_url: str) -> str:
    parsed = urlparse(database_url)
    if not parsed.hostname or not parsed.hostname.endswith("pooler.supabase.com"):
        return database_url
    if parsed.port == 6543:
        return database_url
    if parsed.port is None:
        next_netloc = f"{parsed.netloc}:6543"
    else:
        next_netloc = parsed.netloc.replace(f":{parsed.port}", ":6543", 1)
    return urlunparse(parsed._replace(netloc=next_netloc))


if __name__ == "__main__":
    main()
