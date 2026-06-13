from __future__ import annotations

import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
APP_DIR = ROOT / "apps" / "web" / "app"
DISALLOWED_MARKERS = ("request<", "fetch(", "apiUrl", "/api/v1/")


def _is_allowed_api_file(path: Path) -> bool:
    name = path.name
    return name == "workspace-api.ts" or name.endswith("-api.ts")


def _find_violations() -> list[str]:
    violations: list[str] = []
    for path in sorted(APP_DIR.rglob("*")):
        if path.suffix not in {".ts", ".tsx"} or path.name.endswith(".d.ts"):
            continue
        if _is_allowed_api_file(path):
            continue
        try:
            lines = path.read_text(encoding="utf-8").splitlines()
        except UnicodeDecodeError:
            lines = path.read_text(encoding="utf-8-sig").splitlines()
        for line_number, line in enumerate(lines, start=1):
            if any(marker in line for marker in DISALLOWED_MARKERS):
                relative = path.relative_to(ROOT)
                violations.append(f"{relative}:{line_number}: {line.strip()}")
    return violations


def main() -> int:
    violations = _find_violations()
    if not violations:
        print("Frontend API boundary check passed.")
        return 0

    print(
        "Frontend API boundary violations found. Move HTTP calls to workspace-api.ts "
        "or a dedicated *-api.ts client.",
        file=sys.stderr,
    )
    for violation in violations:
        print(f"- {violation}", file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
