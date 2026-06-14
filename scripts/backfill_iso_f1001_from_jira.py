from __future__ import annotations

import argparse
import json
import os
import re
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import datetime
from urllib.parse import urlencode, urlparse, urlunparse

from sqlmodel import Session, select

from formulia_api.database import create_db_engine, init_db
from formulia_api.jira_client import make_jira_client
from formulia_api.local_env import load_local_env
from formulia_api.models import IsoDesignProject, JiraConnection, Tenant, utc_now


ATLANTICA_SLUG = "atlantica-agricola"


JIRA_F1001_FIELDS = [
    "summary",
    "issuetype",
    "status",
    "reporter",
    "created",
    "updated",
    "customfield_10658",
    "customfield_10856",
    "customfield_11024",
]


@dataclass(frozen=True)
class BackfillCandidate:
    project_code: str
    iso_request_number: str
    jira_project_id: str
    issue_count: int
    first_issue_key: str
    last_issue_key: str
    product_name: str
    requester: str | None
    product_type: str | None
    lifecycle_status: str
    finished_at: str | None
    comment: str
    action: str
    status: str
    message: str | None


def main() -> None:
    load_local_env()
    parser = argparse.ArgumentParser(
        description="Backfill ISO F10-01 design projects from Jira project issues."
    )
    parser.add_argument("--tenant-slug", default=ATLANTICA_SLUG)
    parser.add_argument("--year", type=int, default=datetime.now().year)
    parser.add_argument("--jira-project-key", default="ID")
    parser.add_argument("--database-url", default=None)
    parser.add_argument("--use-transaction-pooler", action="store_true")
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()

    database_url = args.database_url or os.getenv("DATABASE_URL")
    if args.use_transaction_pooler and database_url:
        database_url = _transaction_pooler_url(database_url)
    engine = create_db_engine(database_url)
    try:
        init_db(engine)
        with Session(engine) as session:
            tenant = session.exec(select(Tenant).where(Tenant.slug == args.tenant_slug)).first()
            if tenant is None:
                raise SystemExit(f"Tenant not found: {args.tenant_slug}")
            connection = session.exec(
                select(JiraConnection).where(
                    JiraConnection.tenant_id == tenant.id,
                    JiraConnection.is_active.is_(True),
                )
            ).first()
            if connection is None:
                raise SystemExit(f"Active Jira connection not found for {args.tenant_slug}")
            issues = _fetch_jira_year_issues(
                make_jira_client(connection),
                project_key=args.jira_project_key,
                year=args.year,
            )
            candidates, skipped = _build_candidates(session, tenant, issues, args.year)
            if args.apply:
                _apply_candidates(session, tenant, candidates, args.year)
                session.commit()
            _print_report(args, issues, candidates, skipped)
    finally:
        engine.dispose()


def _fetch_jira_year_issues(client, *, project_key: str, year: int) -> list[dict]:
    start = f"{year}-01-01"
    end = f"{year + 1}-01-01"
    jql = (
        f'project = {project_key} AND created >= "{start}" '
        f'AND created < "{end}" ORDER BY created ASC'
    )
    issues: list[dict] = []
    next_page_token = None
    while True:
        params = {
            "jql": jql,
            "fields": ",".join(JIRA_F1001_FIELDS),
            "maxResults": 100,
        }
        if next_page_token:
            params["nextPageToken"] = next_page_token
        response = client._json_get(f"/rest/api/3/search/jql?{urlencode(params)}")
        issues.extend(response.get("issues", []))
        if response.get("isLast", True):
            return issues
        next_page_token = response.get("nextPageToken")
        if not next_page_token:
            return issues


def _build_candidates(
    session: Session,
    tenant: Tenant,
    issues: list[dict],
    year: int,
) -> tuple[list[BackfillCandidate], list[dict]]:
    grouped: dict[str, list[dict]] = defaultdict(list)
    skipped: list[dict] = []
    for issue in issues:
        fields = issue.get("fields") or {}
        project_code = _clean_text(_option_value(fields.get("customfield_10658")))
        if not project_code:
            skipped.append(issue)
            continue
        grouped[project_code].append(issue)

    existing_projects = session.exec(
        select(IsoDesignProject).where(IsoDesignProject.tenant_id == tenant.id)
    ).all()
    existing_by_code = {
        (project.project_code or "").strip().casefold(): project
        for project in existing_projects
        if (project.project_code or "").strip()
    }
    used_project_codes = set(existing_by_code)
    next_project_code = _next_numeric_project_code(existing_projects)
    next_request_number = _next_iso_request_number(existing_projects, year)

    candidates = []
    for jira_project_id in sorted(grouped):
        rows = grouped[jira_project_id]
        fields = [row.get("fields") or {} for row in rows]
        requester = _first_clean(
            (_mapping(field.get("reporter")).get("displayName") for field in fields)
        )
        product_type = _first_clean((_option_value(field.get("customfield_10856")) for field in fields))
        technical_results = Counter(
            _option_value(field.get("customfield_11024")) or "-" for field in fields
        )
        statuses = Counter(_mapping(field.get("status")).get("name") or "-" for field in fields)
        issue_types = Counter(_mapping(field.get("issuetype")).get("name") or "-" for field in fields)
        lifecycle_status = _lifecycle_status_from_jira(statuses, technical_results)
        finished_at = _finished_at_from_jira(fields) if lifecycle_status == "finished" else None
        existing = existing_by_code.get(jira_project_id.casefold())
        action = "update_project" if existing else "create_project"
        if existing:
            project_code = existing.project_code or ""
            iso_request_number = existing.iso_request_number
        else:
            if re.fullmatch(r"\d+", jira_project_id) and jira_project_id.casefold() not in used_project_codes:
                project_code = jira_project_id
            else:
                while str(next_project_code).casefold() in used_project_codes:
                    next_project_code += 1
                project_code = str(next_project_code)
                next_project_code += 1
            used_project_codes.add(project_code.casefold())
            iso_request_number = f"{next_request_number}/{year}"
            next_request_number += 1
        candidates.append(
            BackfillCandidate(
                project_code=project_code,
                iso_request_number=iso_request_number,
                jira_project_id=jira_project_id,
                issue_count=len(rows),
                first_issue_key=str(rows[0].get("key") or ""),
                last_issue_key=str(rows[-1].get("key") or ""),
                product_name=jira_project_id,
                requester=requester,
                product_type=product_type,
                lifecycle_status=lifecycle_status,
                finished_at=finished_at,
                comment=_comment(rows, statuses, issue_types, technical_results),
                action=action,
                status="ready",
                message=None,
            )
        )
    return candidates, skipped


def _apply_candidates(
    session: Session,
    tenant: Tenant,
    candidates: list[BackfillCandidate],
    year: int,
) -> None:
    for candidate in candidates:
        project = session.exec(
            select(IsoDesignProject).where(
                IsoDesignProject.tenant_id == tenant.id,
                IsoDesignProject.project_code == candidate.project_code,
            )
        ).first()
        if project is None:
            project = IsoDesignProject(
                tenant_id=tenant.id,
                iso_request_number=candidate.iso_request_number,
                year=year,
                project_code=candidate.project_code,
                product_name=candidate.product_name,
                created_by=None,
            )
        project.requester = candidate.requester or project.requester
        project.iso_request_number = project.iso_request_number or candidate.iso_request_number
        project.year = year
        project.product_name = candidate.product_name
        project.product_type = candidate.product_type or project.product_type
        project.accepted_status = "accepted"
        project.lifecycle_status = candidate.lifecycle_status
        project.finished_at = candidate.finished_at or project.finished_at
        project.comments = candidate.comment
        project.source_type = "jira_backfill"
        project.source_ref = (
            f"{candidate.first_issue_key}..{candidate.last_issue_key} "
            f"({candidate.issue_count} Jira issues)"
        )
        project.updated_at = utc_now()
        session.add(project)


def _print_report(
    args,
    issues: list[dict],
    candidates: list[BackfillCandidate],
    skipped: list[dict],
) -> None:
    actions = Counter(candidate.action for candidate in candidates)
    lifecycles = Counter(candidate.lifecycle_status for candidate in candidates)
    report = {
        "mode": "apply" if args.apply else "preview",
        "year": args.year,
        "jira_issues": len(issues),
        "ready_projects": len(candidates),
        "skipped_issues_missing_project_id": len(skipped),
        "actions": dict(actions),
        "lifecycle_status": dict(lifecycles),
        "sample": [candidate.__dict__ for candidate in candidates[:10]],
        "skipped_sample": [
            {
                "key": issue.get("key"),
                "summary": (issue.get("fields") or {}).get("summary"),
                "issue_type": _mapping((issue.get("fields") or {}).get("issuetype")).get("name"),
            }
            for issue in skipped[:10]
        ],
    }
    print(json.dumps(report, ensure_ascii=False, indent=2, default=str))


def _comment(
    rows: list[dict],
    statuses: Counter,
    issue_types: Counter,
    technical_results: Counter,
) -> str:
    first_summary = _clean_text((rows[0].get("fields") or {}).get("summary")) or "-"
    last_summary = _clean_text((rows[-1].get("fields") or {}).get("summary")) or "-"
    return "\n".join(
        [
            "Backfill F10-01 desde Jira 2026.",
            f"Issues: {rows[0].get('key')}..{rows[-1].get('key')} ({len(rows)}).",
            f"Primer resumen: {first_summary}",
            f"Ultimo resumen: {last_summary}",
            f"Issue types: {_counter_text(issue_types)}.",
            f"Estados Jira: {_counter_text(statuses)}.",
            f"Resultado I+D: {_counter_text(technical_results)}.",
        ]
    )


def _next_numeric_project_code(projects: list[IsoDesignProject]) -> int:
    highest = 0
    for project in projects:
        value = (project.project_code or "").strip()
        if re.fullmatch(r"\d+", value):
            highest = max(highest, int(value))
    return highest + 1


def _next_iso_request_number(projects: list[IsoDesignProject], year: int) -> int:
    highest = 0
    pattern = re.compile(rf"^(\d+)/{year}$")
    for project in projects:
        if project.year != year:
            continue
        match = pattern.fullmatch((project.iso_request_number or "").strip())
        if match:
            highest = max(highest, int(match.group(1)))
    return highest + 1


def _lifecycle_status_from_jira(statuses: Counter, technical_results: Counter) -> str:
    if technical_results.get("Liberado", 0) > 0:
        return "finished"
    active_statuses = {status for status in statuses if status not in {"FINALIZADO", "-"}}
    if active_statuses:
        return "in_progress"
    return "in_progress"


def _finished_at_from_jira(fields: list[dict]) -> str | None:
    for field in reversed(fields):
        if _option_value(field.get("customfield_11024")) == "Liberado":
            return _date_part(field.get("updated") or field.get("created"))
    return None


def _date_part(value: object) -> str | None:
    text = str(value or "")
    return text[:10] if len(text) >= 10 else None


def _counter_text(counter: Counter) -> str:
    return ", ".join(f"{key}={value}" for key, value in sorted(counter.items()))


def _first_clean(values) -> str | None:
    for value in values:
        cleaned = _clean_text(value)
        if cleaned:
            return cleaned
    return None


def _option_value(value):
    if isinstance(value, dict):
        return value.get("value")
    return value


def _mapping(value) -> dict:
    return value if isinstance(value, dict) else {}


def _clean_text(value) -> str | None:
    if value is None:
        return None
    cleaned = " ".join(str(value).replace("\xa0", " ").strip().split())
    return cleaned or None


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
