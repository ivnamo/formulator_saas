from __future__ import annotations

import os
from pathlib import Path


LOCAL_ENV_NAMES = {
    "AGENT_ORCHESTRATOR_MODEL",
    "AGENT_ORCHESTRATOR_PROVIDER",
    "DATABASE_URL",
    "FORMULIA_AUTH_REQUIRED",
    "FORMULIA_AUTH_REDIRECT_URL",
    "FORMULIA_DB_SCHEMA",
    "FORMULIA_SUPABASE_ANON_KEY",
    "FORMULIA_SUPABASE_SERVICE_ROLE_KEY",
    "FORMULIA_SUPABASE_URL",
    "FORMULIA_JIRA_API_TOKEN",
    "FORMULIA_JIRA_AUTH_EMAIL",
    "FORMULIA_JIRA_CLOUD_ID",
    "FORMULIA_JIRA_OAUTH_ACCESS_TOKEN",
    "FORMULIA_JIRA_OAUTH_CLIENT_ID",
    "FORMULIA_JIRA_OAUTH_CLIENT_SECRET",
    "FORMULIA_JIRA_OAUTH_EXPIRES_AT",
    "FORMULIA_JIRA_OAUTH_REDIRECT_URI",
    "FORMULIA_JIRA_OAUTH_REFRESH_TOKEN",
    "FORMULIA_JIRA_SITE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_SUPABASE_URL",
    "OPENAI_API_KEY",
    "REQUIREMENT_PARSER_MODEL",
    "REQUIREMENT_PARSER_PROVIDER",
    "SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_URL",
}


def load_local_env(workspace_root: Path | None = None) -> None:
    if os.getenv("FORMULIA_DISABLE_LOCAL_ENV") == "1":
        return

    root = workspace_root or Path(__file__).resolve().parents[4]
    for path in (root / ".env.local", root / ".env"):
        if path.exists():
            _load_env_file(path)


def _load_env_file(path: Path) -> None:
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip().lstrip("\ufeff")
        if not line or line.startswith("#") or "=" not in line:
            continue
        name, value = line.split("=", 1)
        name = name.strip()
        if name in LOCAL_ENV_NAMES and name not in os.environ:
            os.environ[name] = value.strip().strip('"').strip("'")


def save_local_env_values(
    values: dict[str, str],
    workspace_root: Path | None = None,
    target_name: str = ".env.local",
) -> Path:
    root = workspace_root or Path(__file__).resolve().parents[4]
    path = root / target_name
    path.parent.mkdir(parents=True, exist_ok=True)

    cleaned_values = {
        name: value
        for name, value in values.items()
        if name in LOCAL_ENV_NAMES and value.strip()
    }
    lines = path.read_text(encoding="utf-8").splitlines() if path.exists() else []
    for name, value in cleaned_values.items():
        pattern = f"{name}="
        replacement = f"{name}={value.strip()}"
        updated = False
        next_lines = []
        for line in lines:
            if line.strip().startswith(pattern):
                next_lines.append(replacement)
                updated = True
            else:
                next_lines.append(line)
        if not updated:
            next_lines.append(replacement)
        lines = next_lines
        os.environ[name] = value.strip()

    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return path
