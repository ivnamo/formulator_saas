from __future__ import annotations

import os
from pathlib import Path


LOCAL_ENV_NAMES = {
    "OPENAI_API_KEY",
    "REQUIREMENT_PARSER_MODEL",
    "REQUIREMENT_PARSER_PROVIDER",
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
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        name, value = line.split("=", 1)
        name = name.strip()
        if name in LOCAL_ENV_NAMES and name not in os.environ:
            os.environ[name] = value.strip().strip('"').strip("'")
