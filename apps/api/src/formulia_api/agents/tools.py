from __future__ import annotations

import uuid
from typing import Any

from sqlmodel import Session, select

from formulia_api.models import (
    Parameter,
    RawMaterial,
    RawMaterialParameterValue,
    RawMaterialPrice,
)


DEFAULT_CANDIDATE_LIMIT = 8


def research_raw_material_candidates(
    *,
    session: Session,
    tenant_id: uuid.UUID,
    parsed_requirements: dict[str, Any],
    limit: int = DEFAULT_CANDIDATE_LIMIT,
) -> dict[str, Any]:
    materials = session.exec(
        select(RawMaterial)
        .where(
            RawMaterial.tenant_id == tenant_id,
            RawMaterial.is_active.is_(True),
            RawMaterial.is_obsolete.is_(False),
        )
        .order_by(RawMaterial.name)
    ).all()
    excluded_terms = _normalized_terms(parsed_requirements.get("excluded_raw_materials", []))
    mandatory_terms = _normalized_terms(parsed_requirements.get("mandatory_raw_materials", []))
    candidates = [
        _candidate_from_material(
            session=session,
            tenant_id=tenant_id,
            material=material,
            parsed_requirements=parsed_requirements,
            mandatory_terms=mandatory_terms,
        )
        for material in materials
        if not _matches_any_term(material, excluded_terms)
    ]
    candidates.sort(key=lambda candidate: candidate["score"], reverse=True)
    limited_candidates = candidates[:limit]
    return {
        "candidate_count": len(limited_candidates),
        "total_available": len(candidates),
        "filters": {
            "active_only": True,
            "exclude_obsolete": True,
            "excluded_terms": excluded_terms,
            "mandatory_terms": mandatory_terms,
            "limit": limit,
        },
        "candidates": limited_candidates,
        "warnings": _research_warnings(parsed_requirements, limited_candidates),
    }


def build_optimization_plan(
    *,
    parsed_requirements: dict[str, Any],
    candidate_research: dict[str, Any],
) -> dict[str, Any]:
    candidates = candidate_research.get("candidates", [])
    technical_constraints = parsed_requirements.get("technical_constraints", [])
    economic_constraints = parsed_requirements.get("economic_constraints", [])
    blocking_reasons: list[str] = []
    warnings: list[str] = []

    if not candidates:
        blocking_reasons.append("No tenant raw material candidates are available.")

    for constraint in technical_constraints:
        target = constraint.get("target")
        if not target:
            continue
        has_coverage = any(
            target in candidate.get("parameters", {})
            for candidate in candidates
        )
        if not has_coverage:
            blocking_reasons.append(f"No candidate has parameter {target}.")

    priced_candidates = [
        candidate for candidate in candidates if candidate.get("price_eur_per_kg") is not None
    ]
    if candidates and not priced_candidates:
        warnings.append("No candidate has a current price.")
        if any(constraint.get("target") == "price_total" for constraint in economic_constraints):
            blocking_reasons.append("No priced candidate can satisfy price constraints.")

    objective = _optimization_objective(parsed_requirements)
    constraints = [
        _constraint_status(constraint, "technical")
        for constraint in technical_constraints
    ] + [
        _constraint_status(constraint, "economic")
        for constraint in economic_constraints
    ]
    return {
        "status": "blocked" if blocking_reasons else "ready",
        "objective": objective,
        "candidate_raw_material_ids": [
            candidate["raw_material_id"] for candidate in candidates
        ],
        "constraints": constraints,
        "blocking_reasons": blocking_reasons,
        "warnings": warnings,
        "solver": "not_started",
    }


def _candidate_from_material(
    *,
    session: Session,
    tenant_id: uuid.UUID,
    material: RawMaterial,
    parsed_requirements: dict[str, Any],
    mandatory_terms: list[str],
) -> dict[str, Any]:
    price = _latest_price(session, tenant_id, material.id)
    parameters = _parameter_values(session, tenant_id, material.id)
    matched_constraints, warnings = _constraint_matches(
        parameters,
        parsed_requirements.get("technical_constraints", []),
    )
    score = _candidate_score(
        material=material,
        price=price,
        parameters=parameters,
        matched_constraints=matched_constraints,
        mandatory_terms=mandatory_terms,
        economic_constraints=parsed_requirements.get("economic_constraints", []),
    )
    if price is None:
        warnings.append("missing_price")
    return {
        "raw_material_id": str(material.id),
        "code": material.code,
        "name": material.name,
        "price_eur_per_kg": price.price if price else None,
        "parameters": parameters,
        "matched_constraints": matched_constraints,
        "warnings": warnings,
        "score": score,
    }


def _latest_price(
    session: Session,
    tenant_id: uuid.UUID,
    raw_material_id: uuid.UUID,
) -> RawMaterialPrice | None:
    return session.exec(
        select(RawMaterialPrice)
        .where(
            RawMaterialPrice.tenant_id == tenant_id,
            RawMaterialPrice.raw_material_id == raw_material_id,
            RawMaterialPrice.currency == "EUR",
            RawMaterialPrice.unit == "kg",
        )
        .order_by(RawMaterialPrice.valid_from.desc(), RawMaterialPrice.created_at.desc())
    ).first()


def _parameter_values(
    session: Session,
    tenant_id: uuid.UUID,
    raw_material_id: uuid.UUID,
) -> dict[str, dict[str, Any]]:
    rows = session.exec(
        select(RawMaterialParameterValue, Parameter)
        .join(Parameter, RawMaterialParameterValue.parameter_id == Parameter.id)
        .where(
            RawMaterialParameterValue.tenant_id == tenant_id,
            RawMaterialParameterValue.raw_material_id == raw_material_id,
            Parameter.tenant_id == tenant_id,
        )
    ).all()
    return {
        parameter.code: {
            "name": parameter.name,
            "value": value.value,
            "unit": parameter.unit,
        }
        for value, parameter in rows
    }


def _constraint_matches(
    parameters: dict[str, dict[str, Any]],
    constraints: list[dict[str, Any]],
) -> tuple[list[str], list[str]]:
    matched: list[str] = []
    warnings: list[str] = []
    for constraint in constraints:
        target = constraint.get("target")
        if not target:
            continue
        parameter = parameters.get(target)
        if parameter is None:
            warnings.append(f"missing_parameter:{target}")
            continue
        value = constraint.get("value")
        operator = constraint.get("operator")
        if value is None or _satisfies(parameter["value"], operator, value):
            matched.append(target)
    return matched, warnings


def _candidate_score(
    *,
    material: RawMaterial,
    price: RawMaterialPrice | None,
    parameters: dict[str, dict[str, Any]],
    matched_constraints: list[str],
    mandatory_terms: list[str],
    economic_constraints: list[dict[str, Any]],
) -> float:
    score = 0.4
    score += min(len(parameters), 4) * 0.06
    score += len(matched_constraints) * 0.16
    if price is not None:
        score += 0.12
    if mandatory_terms:
        score += 0.18 if _matches_any_term(material, mandatory_terms) else -0.18
    for constraint in economic_constraints:
        if (
            constraint.get("target") == "price_total"
            and constraint.get("value") is not None
            and price is not None
            and _satisfies(price.price, constraint.get("operator"), constraint["value"])
        ):
            score += 0.08
    return round(max(0.0, min(score, 1.0)), 2)


def _research_warnings(
    parsed_requirements: dict[str, Any],
    candidates: list[dict[str, Any]],
) -> list[str]:
    warnings: list[str] = []
    if not candidates:
        warnings.append("No active non-obsolete raw materials matched the request.")
    for term in _normalized_terms(parsed_requirements.get("mandatory_raw_materials", [])):
        if not any(term in _candidate_match_text(candidate) for candidate in candidates):
            warnings.append(f"Mandatory material term was not found: {term}")
    return warnings


def _optimization_objective(parsed_requirements: dict[str, Any]) -> dict[str, str]:
    objectives = parsed_requirements.get("objectives", [])
    if "minimize_price" in objectives:
        return {"type": "minimize", "target": "price_total"}
    return {"type": "satisfy", "target": "constraints"}


def _constraint_status(constraint: dict[str, Any], scope: str) -> dict[str, Any]:
    return {
        "scope": scope,
        "target": constraint.get("target"),
        "operator": constraint.get("operator"),
        "value": constraint.get("value"),
        "unit": constraint.get("unit"),
        "status": "pending_solver",
    }


def _satisfies(actual: float, operator: str | None, expected: float) -> bool:
    if operator == ">=":
        return actual >= expected
    if operator == ">":
        return actual > expected
    if operator == "<=":
        return actual <= expected
    if operator == "<":
        return actual < expected
    return actual == expected


def _normalized_terms(values: Any) -> list[str]:
    if not isinstance(values, list):
        return []
    return [
        " ".join(value.strip().lower().split())
        for value in values
        if isinstance(value, str) and value.strip()
    ]


def _matches_any_term(material: RawMaterial, terms: list[str]) -> bool:
    if not terms:
        return False
    text = " ".join(
        value
        for value in (
            material.code or "",
            material.name,
            material.normalized_name,
            material.family or "",
            material.subfamily or "",
        )
        if value
    ).lower()
    return any(term in text for term in terms)


def _candidate_match_text(candidate: dict[str, Any]) -> str:
    return " ".join(
        value
        for value in (candidate.get("code") or "", candidate.get("name") or "")
        if value
    ).lower()
