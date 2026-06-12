from __future__ import annotations

import argparse
import json
import os
import sys
import tomllib
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
CORE_SRC = ROOT / "packages" / "core" / "src"
if str(CORE_SRC) not in sys.path:
    sys.path.insert(0, str(CORE_SRC))

from formulia_core import FormulaItem, ParameterValue, RawMaterial, calculate_formula  # noqa: E402


TECHNICAL_COLUMNS = [
    "Ntotal",
    "Norg",
    "Nnitr",
    "Nure",
    "Namo",
    "K2O",
    "P2O5",
    "CaO",
    "MgO",
    "SO3",
    "Zn",
    "Mn",
    "Fe",
    "Cu",
    "B",
    "Mo",
    "Co",
    "SiO2",
    "Mseca",
    "Morg",
    "Corg",
    "Extracto Humico total",
    "Acidos fulvicos",
    "Acidos humicos",
    "Extracto de Algas",
    "Polisacaridos",
    "Sum AA totales",
    "Sum AA libres",
    "Ac aspartico",
    "Ac glutamico",
    "Alanina",
    "Glicina",
    "Histidina",
    "Isoleucina",
    "Leucina",
    "Lisina",
    "Serina",
    "Tirosina",
    "Treonina",
    "Valina",
    "Arginina",
    "Fenilalanina",
    "Metionina",
    "Prolina",
    "Hidroxiprolina",
    "Triptofano",
    "As",
    "Hg",
    "Pb",
    "Cd",
    "Cr",
    "Ni",
]

NAME_CANDIDATES = ["Materia Prima", "materia_prima", "materia prima", "nombre", "name"]
PERCENTAGE_CANDIDATES = ["%", "Porcentaje", "percentage", "pct"]
PRICE_CANDIDATES = ["Precio €/kg", "Precio â‚¬/kg", "precio_eur_kg", "precio/kg", "precio"]
SAVED_PRICE_CANDIDATES = ["precio_total", "Precio total", "price_total"]


def _load_env_file(path: Path) -> None:
    if not path.exists():
        return

    for line in path.read_text(encoding="utf-8-sig").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, value = stripped.split("=", 1)
        key = key.strip()
        value = value.strip().strip("'\"")
        if key and key not in os.environ:
            os.environ[key] = value


def _load_legacy_config(secrets_path: Path) -> tuple[str, str]:
    with secrets_path.open("rb") as handle:
        secrets = tomllib.load(handle)

    url = secrets.get("SUPABASE_URL") or secrets.get("supabase_url")
    key = secrets.get("SUPABASE_KEY") or secrets.get("supabase_key")
    if not url or not key:
        raise RuntimeError("Legacy secrets file must contain SUPABASE_URL and SUPABASE_KEY.")
    return str(url).rstrip("/"), str(key)


def _request_json(
    *,
    method: str,
    url: str,
    headers: dict[str, str],
    payload: dict[str, Any] | None = None,
) -> Any:
    data = None
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        headers = {**headers, "Content-Type": "application/json"}

    request = urllib.request.Request(url=url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            body = response.read().decode("utf-8")
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {exc.code} from legacy Supabase: {body[:500]}") from exc

    if not body:
        return None
    return json.loads(body)


def _legacy_auth_headers(supabase_url: str, anon_key: str) -> dict[str, str]:
    email = os.environ.get("LEGACY_SUPABASE_EMAIL")
    password = os.environ.get("LEGACY_SUPABASE_PASSWORD")

    token = anon_key
    if email and password:
        auth_response = _request_json(
            method="POST",
            url=f"{supabase_url}/auth/v1/token?grant_type=password",
            headers={"apikey": anon_key},
            payload={"email": email, "password": password},
        )
        token = auth_response.get("access_token")
        if not token:
            raise RuntimeError("Legacy Supabase auth did not return an access token.")

    return {
        "apikey": anon_key,
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
        "Prefer": "count=exact",
    }


def _fetch_legacy_formulas(supabase_url: str, anon_key: str, limit: int) -> list[dict[str, Any]]:
    headers = _legacy_auth_headers(supabase_url, anon_key)
    query = urllib.parse.urlencode({"select": "*", "limit": str(limit)})
    data = _request_json(
        method="GET",
        url=f"{supabase_url}/rest/v1/formulas?{query}",
        headers=headers,
    )
    if not isinstance(data, list):
        raise RuntimeError("Legacy formulas response was not a list.")
    return data


def _load_formulas_export(path: Path, limit: int) -> list[dict[str, Any]]:
    data = json.loads(path.read_text(encoding="utf-8-sig"))
    if isinstance(data, dict):
        data = data.get("formulas", [])
    if not isinstance(data, list):
        raise RuntimeError("Legacy export must be a JSON list or an object with a formulas list.")
    return [row for row in data if isinstance(row, dict)][:limit]


def _normalize_label(value: Any) -> str:
    text = str(value).strip().lower()
    text = text.replace("â‚¬", "eur").replace("€", "eur").replace("%", "pct")
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    return "".join(ch for ch in text if ch.isalnum())


def _mojibake_variant(value: str) -> str:
    try:
        return value.encode("utf-8").decode("cp1252")
    except UnicodeError:
        return value


def _candidate_keys(value: str) -> set[str]:
    return {_normalize_label(value), _normalize_label(_mojibake_variant(value))}


def _find_key(row: dict[str, Any], candidates: list[str]) -> str | None:
    normalized = {_normalize_label(key): key for key in row.keys()}
    for candidate in candidates:
        for normalized_candidate in _candidate_keys(candidate):
            match = normalized.get(normalized_candidate)
            if match is not None:
                return match
    return None


def _parse_float(value: Any) -> float:
    if value is None or value == "":
        return 0.0
    if isinstance(value, bool):
        return float(value)
    if isinstance(value, int | float):
        return float(value)

    text = str(value).strip()
    if not text:
        return 0.0
    text = (
        text.replace("\xa0", "")
        .replace("€", "")
        .replace("â‚¬", "")
        .replace("%", "")
        .replace(" ", "")
    )
    if "," in text and "." in text:
        text = text.replace(".", "").replace(",", ".")
    else:
        text = text.replace(",", ".")

    try:
        return float(text)
    except ValueError:
        return 0.0


def _formula_material_rows(formula: dict[str, Any]) -> list[dict[str, Any]]:
    raw_value = formula.get("materias_primas")
    if isinstance(raw_value, str):
        raw_value = json.loads(raw_value)
    if not isinstance(raw_value, list):
        raise ValueError("materias_primas is not a list.")
    return [row for row in raw_value if isinstance(row, dict)]


def _legacy_recalculate(rows: list[dict[str, Any]]) -> tuple[float, dict[str, float]]:
    price = 0.0
    parameters = {code: 0.0 for code in TECHNICAL_COLUMNS}

    for row in rows:
        percentage_key = _find_key(row, PERCENTAGE_CANDIDATES)
        if percentage_key is None:
            continue
        percentage = _parse_float(row.get(percentage_key))
        if percentage <= 0:
            continue

        price_key = _find_key(row, PRICE_CANDIDATES)
        unit_price = _parse_float(row.get(price_key)) if price_key else 0.0
        price += unit_price * percentage / 100

        for code in TECHNICAL_COLUMNS:
            value_key = _find_key(row, [code])
            value = _parse_float(row.get(value_key)) if value_key else 0.0
            parameters[code] += value * percentage / 100

    return price, parameters


def _core_calculate(rows: list[dict[str, Any]]) -> tuple[float | None, dict[str, float], list[str]]:
    items: list[FormulaItem] = []
    materials: dict[str, RawMaterial] = {}

    for index, row in enumerate(rows):
        percentage_key = _find_key(row, PERCENTAGE_CANDIDATES)
        percentage = _parse_float(row.get(percentage_key)) if percentage_key else 0.0
        if percentage <= 0:
            continue

        name_key = _find_key(row, NAME_CANDIDATES)
        price_key = _find_key(row, PRICE_CANDIDATES)
        material_id = str(row.get("id") or row.get("raw_material_id") or f"legacy-row-{index}")
        material_name = str(row.get(name_key) or material_id) if name_key else material_id
        unit_price = _parse_float(row.get(price_key)) if price_key else 0.0

        items.append(FormulaItem(raw_material_id=material_id, percentage=percentage))
        if material_id in materials:
            continue

        parameters = {}
        for code in TECHNICAL_COLUMNS:
            value_key = _find_key(row, [code])
            value = _parse_float(row.get(value_key)) if value_key else 0.0
            parameters[code] = ParameterValue(code=code, value=value, unit="% p/p")

        materials[material_id] = RawMaterial(
            id=material_id,
            name=material_name,
            price=unit_price,
            parameters=parameters,
        )

    calculation = calculate_formula(
        items=items,
        raw_materials=list(materials.values()),
        required_parameter_codes=set(TECHNICAL_COLUMNS),
    )
    return (
        calculation.price_total,
        {code: value.value for code, value in calculation.parameters.items()},
        [warning.code.value for warning in calculation.warnings],
    )


def _formula_label(formula: dict[str, Any]) -> str:
    return str(formula.get("nombre") or formula.get("name") or formula.get("id") or "unnamed")


def _saved_price(formula: dict[str, Any]) -> float | None:
    key = _find_key(formula, SAVED_PRICE_CANDIDATES)
    if key is None or formula.get(key) in (None, ""):
        return None
    return _parse_float(formula.get(key))


def compare_formulas(formulas: list[dict[str, Any]], *, tolerance: float) -> dict[str, Any]:
    checked = 0
    passed = 0
    skipped = 0
    failures: list[dict[str, Any]] = []
    max_price_delta = 0.0
    max_parameter_delta = 0.0
    max_saved_price_delta = 0.0

    for formula in formulas:
        label = _formula_label(formula)
        try:
            rows = _formula_material_rows(formula)
        except (json.JSONDecodeError, ValueError) as exc:
            skipped += 1
            failures.append({"formula": label, "reason": f"invalid materias_primas: {exc}"})
            continue

        if not rows:
            skipped += 1
            failures.append({"formula": label, "reason": "formula has no material rows"})
            continue

        checked += 1
        legacy_price, legacy_parameters = _legacy_recalculate(rows)
        core_price, core_parameters, core_warnings = _core_calculate(rows)
        price_delta = abs((core_price or 0.0) - legacy_price)
        parameter_deltas = {
            code: abs(core_parameters.get(code, 0.0) - legacy_parameters.get(code, 0.0))
            for code in TECHNICAL_COLUMNS
        }
        parameter_code, parameter_delta = max(parameter_deltas.items(), key=lambda item: item[1])
        saved_price = _saved_price(formula)
        saved_price_delta = (
            abs(round(legacy_price, 2) - saved_price) if saved_price is not None else 0.0
        )

        max_price_delta = max(max_price_delta, price_delta)
        max_parameter_delta = max(max_parameter_delta, parameter_delta)
        max_saved_price_delta = max(max_saved_price_delta, saved_price_delta)

        reasons = []
        if price_delta > tolerance:
            reasons.append(f"core price delta {price_delta:.10g}")
        if parameter_delta > tolerance:
            reasons.append(f"parameter {parameter_code} delta {parameter_delta:.10g}")
        if saved_price is not None and saved_price_delta > 0.011:
            reasons.append(f"saved rounded price delta {saved_price_delta:.10g}")

        if reasons:
            failures.append(
                {
                    "formula": label,
                    "reasons": reasons,
                    "core_warnings": core_warnings,
                    "legacy_price": legacy_price,
                    "core_price": core_price,
                    "saved_price": saved_price,
                }
            )
        else:
            passed += 1

    return {
        "formulas_available": len(formulas),
        "formulas_checked": checked,
        "passed": passed,
        "failed": len([failure for failure in failures if "reasons" in failure]),
        "skipped": skipped,
        "max_price_delta": max_price_delta,
        "max_parameter_delta": max_parameter_delta,
        "max_saved_price_delta": max_saved_price_delta,
        "failures": failures[:20],
    }


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Compare legacy Formulator formula price/richness calculations with the SaaS core."
    )
    parser.add_argument(
        "--legacy-secrets",
        default=str(ROOT.parent / "formulator" / ".streamlit" / "secrets.toml"),
    )
    parser.add_argument("--legacy-env", default=str(ROOT / ".env.legacy.local"))
    parser.add_argument("--legacy-export")
    parser.add_argument("--limit", type=int, default=10)
    parser.add_argument("--tolerance", type=float, default=1e-9)
    parser.add_argument("--allow-empty", action="store_true")
    parser.add_argument("--output")
    args = parser.parse_args()

    _load_env_file(Path(args.legacy_env))

    if args.legacy_export:
        formulas = _load_formulas_export(Path(args.legacy_export), args.limit)
        source = "export"
    else:
        supabase_url, anon_key = _load_legacy_config(Path(args.legacy_secrets))
        formulas = _fetch_legacy_formulas(supabase_url, anon_key, args.limit)
        source = "supabase"

    report = compare_formulas(formulas, tolerance=args.tolerance)
    report["source"] = source
    report["technical_parameter_count"] = len(TECHNICAL_COLUMNS)

    text = json.dumps(report, ensure_ascii=False, indent=2)
    print(text)
    if args.output:
        Path(args.output).write_text(text + "\n", encoding="utf-8")

    if not formulas and not args.allow_empty:
        print(
            "No legacy formulas were readable. Provide a legacy auth user with read access "
            "or pass --legacy-export with formula rows.",
            file=sys.stderr,
        )
        return 2
    if report["failed"] > 0 or report["skipped"] > 0:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
