from __future__ import annotations

import json
import os
import re
from typing import Any

import httpx


DEFAULT_REQUIREMENT_MODEL = "gpt-5-nano"
OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses"

PRICE_PER_MILLION_USD = {
    "gpt-5-nano": {"input": 0.05, "output": 0.40},
    "gpt-5.4-nano": {"input": 0.20, "output": 1.25},
}

REQUIREMENT_JSON_SCHEMA: dict[str, Any] = {
    "type": "object",
    "additionalProperties": False,
    "required": [
        "product_type",
        "objectives",
        "technical_constraints",
        "economic_constraints",
        "mandatory_raw_materials",
        "excluded_raw_materials",
        "preferences",
        "alternatives",
        "uncertainties",
    ],
    "properties": {
        "product_type": {"type": ["string", "null"]},
        "objectives": {"type": "array", "items": {"type": "string"}},
        "technical_constraints": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "required": ["kind", "target", "operator", "value", "unit", "raw_text"],
                "properties": {
                    "kind": {"type": "string"},
                    "target": {"type": "string"},
                    "operator": {"type": "string"},
                    "value": {"type": ["number", "null"]},
                    "unit": {"type": ["string", "null"]},
                    "raw_text": {"type": ["string", "null"]},
                },
            },
        },
        "economic_constraints": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "required": ["kind", "target", "operator", "value", "unit", "raw_text"],
                "properties": {
                    "kind": {"type": "string"},
                    "target": {"type": "string"},
                    "operator": {"type": "string"},
                    "value": {"type": ["number", "null"]},
                    "unit": {"type": ["string", "null"]},
                    "raw_text": {"type": ["string", "null"]},
                },
            },
        },
        "mandatory_raw_materials": {"type": "array", "items": {"type": "string"}},
        "excluded_raw_materials": {"type": "array", "items": {"type": "string"}},
        "preferences": {
            "type": "object",
            "additionalProperties": False,
            "required": ["only_active_materials", "avoid_incompatibilities", "notes"],
            "properties": {
                "only_active_materials": {"type": ["boolean", "null"]},
                "avoid_incompatibilities": {"type": ["boolean", "null"]},
                "notes": {"type": "array", "items": {"type": "string"}},
            },
        },
        "alternatives": {"type": ["integer", "null"]},
        "uncertainties": {"type": "array", "items": {"type": "string"}},
    },
}

SYSTEM_PROMPT = """Eres RequirementParserAgent de FormulIA Cloud.
Convierte una peticion de formulacion tecnica en JSON estructurado.
No inventes valores ni materias primas. Si algo no esta explicito o claramente implicito, dejalo vacio o null y anadelo a uncertainties.
Usa los parametros activos del tenant como vocabulario preferente para constraints tecnicas.
Devuelve solo el JSON que cumple el schema.
"""


class MissingOpenAIKeyError(RuntimeError):
    pass


class OpenAIRequirementParserError(RuntimeError):
    pass


def requirement_parser_provider() -> str:
    return os.getenv("REQUIREMENT_PARSER_PROVIDER", "deterministic").strip().lower()


def requirement_parser_model() -> str:
    return os.getenv("REQUIREMENT_PARSER_MODEL", DEFAULT_REQUIREMENT_MODEL).strip()


def parse_requirements_deterministic(
    text: str,
    active_parameters: list[dict[str, str]],
) -> dict[str, Any]:
    normalized = text.strip()
    text_lower = normalized.lower()
    technical_constraints = _extract_technical_constraints(text_lower, active_parameters)
    economic_constraints = _extract_price_constraints(text_lower)
    result = _empty_requirement_result()
    result.update(
        {
            "source": "deterministic",
            "product_type": _infer_product_type(text_lower),
            "objectives": _infer_objectives(text_lower),
            "technical_constraints": technical_constraints,
            "economic_constraints": economic_constraints,
            "mandatory_raw_materials": _extract_materials_after(text_lower, ("con ", "usar ", "incluye ")),
            "excluded_raw_materials": _extract_materials_after(text_lower, ("sin ", "evitar ", "excluir ")),
            "alternatives": _extract_alternatives(text_lower),
        }
    )
    if not result["objectives"]:
        result["uncertainties"].append("No se detecto un objetivo explicito.")
    if not technical_constraints and not economic_constraints:
        result["uncertainties"].append("No se detectaron restricciones numericas.")
    return result


def parse_requirements_with_openai(
    text: str,
    active_parameters: list[dict[str, str]],
    model: str,
) -> tuple[dict[str, Any], dict[str, int | float | None]]:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise MissingOpenAIKeyError("OPENAI_API_KEY is required for the OpenAI requirement parser.")

    request_body = {
        "model": model,
        "input": [
            {
                "role": "system",
                "content": [{"type": "input_text", "text": SYSTEM_PROMPT}],
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "input_text",
                        "text": json.dumps(
                            {
                                "request": text,
                                "active_parameters": active_parameters,
                            },
                            ensure_ascii=False,
                        ),
                    }
                ],
            },
        ],
        "text": {
            "format": {
                "type": "json_schema",
                "name": "formulia_requirement_parse",
                "schema": REQUIREMENT_JSON_SCHEMA,
                "strict": True,
            }
        },
        "max_output_tokens": 1400,
    }

    response_json = _create_openai_response(api_key, request_body)
    parsed = _extract_structured_output(response_json)
    parsed["source"] = "llm"
    usage = _extract_usage(response_json, model)
    return parsed, usage


def _create_openai_response(api_key: str, body: dict[str, Any]) -> dict[str, Any]:
    try:
        response = httpx.post(
            OPENAI_RESPONSES_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json=body,
            timeout=30,
        )
    except httpx.RequestError as exc:
        raise OpenAIRequirementParserError("OpenAI request failed.") from exc

    if response.status_code >= 400:
        message = _safe_openai_error(response)
        raise OpenAIRequirementParserError(message)
    return response.json()


def _extract_structured_output(response_json: dict[str, Any]) -> dict[str, Any]:
    parsed = response_json.get("output_parsed")
    if isinstance(parsed, dict):
        return parsed

    output_text = response_json.get("output_text")
    if isinstance(output_text, str) and output_text.strip():
        return _load_model_json(output_text)

    for item in response_json.get("output", []):
        if not isinstance(item, dict):
            continue
        for content in item.get("content", []):
            if not isinstance(content, dict):
                continue
            if content.get("type") == "refusal":
                raise OpenAIRequirementParserError("OpenAI refused to parse this requirement.")
            text = content.get("text")
            if isinstance(text, str) and text.strip():
                return _load_model_json(text)

    raise OpenAIRequirementParserError("OpenAI response did not include structured output.")


def _load_model_json(value: str) -> dict[str, Any]:
    try:
        parsed = json.loads(value)
    except json.JSONDecodeError as exc:
        raise OpenAIRequirementParserError("OpenAI response was not valid JSON.") from exc
    if not isinstance(parsed, dict):
        raise OpenAIRequirementParserError("OpenAI response JSON was not an object.")
    return parsed


def _extract_usage(response_json: dict[str, Any], model: str) -> dict[str, int | float | None]:
    raw_usage = response_json.get("usage") or {}
    input_tokens = _optional_int(raw_usage.get("input_tokens"))
    output_tokens = _optional_int(raw_usage.get("output_tokens"))
    return {
        "prompt_tokens": input_tokens,
        "completion_tokens": output_tokens,
        "cost_estimate_usd": _estimate_cost_usd(model, input_tokens, output_tokens),
    }


def _estimate_cost_usd(
    model: str,
    input_tokens: int | None,
    output_tokens: int | None,
) -> float | None:
    prices = PRICE_PER_MILLION_USD.get(model)
    if prices is None or input_tokens is None or output_tokens is None:
        return None
    return round(
        (input_tokens / 1_000_000 * prices["input"])
        + (output_tokens / 1_000_000 * prices["output"]),
        8,
    )


def _safe_openai_error(response: httpx.Response) -> str:
    if response.status_code in {401, 403}:
        return "OpenAI authentication failed."
    try:
        payload = response.json()
    except ValueError:
        return f"OpenAI request failed with status {response.status_code}."
    error = payload.get("error") if isinstance(payload, dict) else None
    message = error.get("message") if isinstance(error, dict) else None
    if isinstance(message, str) and message:
        return f"OpenAI request failed: {message[:300]}"
    return f"OpenAI request failed with status {response.status_code}."


def _empty_requirement_result() -> dict[str, Any]:
    return {
        "source": "deterministic",
        "product_type": None,
        "objectives": [],
        "technical_constraints": [],
        "economic_constraints": [],
        "mandatory_raw_materials": [],
        "excluded_raw_materials": [],
        "preferences": {
            "only_active_materials": None,
            "avoid_incompatibilities": True,
            "notes": [],
        },
        "alternatives": None,
        "uncertainties": [],
    }


def _infer_product_type(text_lower: str) -> str | None:
    product_patterns = (
        ("liquido", ("liquido", "liquid")),
        ("gel", ("gel",)),
        ("emulsion", ("emulsion", "emulsionado")),
        ("polvo", ("polvo", "powder")),
        ("suspension", ("suspension", "suspension")),
    )
    for product_type, patterns in product_patterns:
        if any(pattern in text_lower for pattern in patterns):
            return product_type
    return None


def _infer_objectives(text_lower: str) -> list[str]:
    objectives: list[str] = []
    if any(token in text_lower for token in ("barato", "coste", "precio", "economico", "cheap")):
        objectives.append("minimize_price")
    if any(token in text_lower for token in ("estable", "estabilidad", "stability")):
        objectives.append("improve_stability")
    if any(token in text_lower for token in ("viscosidad", "viscosity")):
        objectives.append("control_viscosity")
    return objectives


def _extract_technical_constraints(
    text_lower: str,
    active_parameters: list[dict[str, str]],
) -> list[dict[str, Any]]:
    constraints: list[dict[str, Any]] = []
    targets = {
        "ph": ("ph",),
        "viscosity": ("viscosidad", "viscosity"),
        "active_content": ("contenido activo", "riqueza", "active content"),
    }
    for parameter in active_parameters:
        code = parameter.get("code", "")
        name = parameter.get("name", "")
        patterns = tuple(value for value in (code, name) if value)
        if patterns:
            targets[code] = tuple(dict.fromkeys((*targets.get(code, ()), *patterns)))

    for target, patterns in targets.items():
        for pattern in patterns:
            escaped = re.escape(pattern.lower())
            match = re.search(
                rf"(?P<raw>{escaped}.{{0,24}}?(?P<operator>>=|<=|>|<|=|minimo|minima|maximo|maxima|al menos|por debajo de|menos de)?\s*(?P<value>\d+(?:[\.,]\d+)?)\s*(?P<unit>%|cp|cps)?)",
                text_lower,
            )
            if match:
                constraints.append(
                    {
                        "kind": "parameter",
                        "target": target,
                        "operator": _normalize_operator(match.group("operator")),
                        "value": _parse_float(match.group("value")),
                        "unit": match.group("unit") or None,
                        "raw_text": match.group("raw"),
                    }
                )
                break
    return constraints


def _extract_price_constraints(text_lower: str) -> list[dict[str, Any]]:
    patterns = (
        r"(?P<raw>(?:precio|coste|cost).{0,24}?(?P<operator><=|<|=|maximo|maxima|menos de|por debajo de)?\s*(?P<value>\d+(?:[\.,]\d+)?)\s*(?P<unit>eur/kg|euro/kg))",
        r"(?P<raw>(?P<value>\d+(?:[\.,]\d+)?)\s*(?P<unit>eur/kg|euro/kg).{0,24}?(?:maximo|maxima|tope|limite)?)",
    )
    for pattern in patterns:
        match = re.search(pattern, text_lower)
        if match:
            return [
                {
                    "kind": "price",
                    "target": "price_total",
                    "operator": _normalize_operator(match.groupdict().get("operator")),
                    "value": _parse_float(match.group("value")),
                    "unit": match.group("unit"),
                    "raw_text": match.group("raw"),
                }
            ]
    return []


def _extract_materials_after(text_lower: str, prefixes: tuple[str, ...]) -> list[str]:
    materials: list[str] = []
    for prefix in prefixes:
        for match in re.finditer(rf"{re.escape(prefix)}([^.;\n]+)", text_lower):
            value = match.group(1).strip(" ,")
            value = re.split(r"\s+(?:y|pero|con|sin|para)\s+", value)[0].strip(" ,")
            if value and len(value) <= 80 and not _looks_like_constraint(value):
                materials.append(value)
    return list(dict.fromkeys(materials))


def _looks_like_constraint(value: str) -> bool:
    constraint_tokens = (
        "%",
        "active content",
        "alternativa",
        "contenido activo",
        "coste",
        "eur/kg",
        "maximo",
        "minimo",
        "ph",
        "precio",
        "riqueza",
        "viscosidad",
    )
    return any(token in value for token in constraint_tokens)


def _extract_alternatives(text_lower: str) -> int | None:
    match = re.search(r"(\d+)\s+alternativas?", text_lower)
    return int(match.group(1)) if match else None


def _normalize_operator(value: str | None) -> str:
    if value in {">=", ">", "<=", "<", "="}:
        return value
    if value in {"minimo", "minima", "al menos"}:
        return ">="
    if value in {"maximo", "maxima", "menos de", "por debajo de"}:
        return "<="
    return "="


def _parse_float(value: str) -> float:
    return float(value.replace(",", "."))


def _optional_int(value: Any) -> int | None:
    return value if isinstance(value, int) else None
