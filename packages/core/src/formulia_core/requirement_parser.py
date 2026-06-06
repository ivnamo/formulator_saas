from __future__ import annotations

from dataclasses import dataclass
import re
import unicodedata


@dataclass(frozen=True)
class RequirementObjective:
    type: str
    target: str


@dataclass(frozen=True)
class RequirementParameterBound:
    code: str
    min_value: float | None = None
    max_value: float | None = None
    source_text: str = ""


@dataclass(frozen=True)
class RequirementPriceConstraint:
    max_price: float
    currency: str = "EUR"
    unit: str = "kg"
    source_text: str = ""


@dataclass(frozen=True)
class RequirementParseResult:
    source: str
    objectives: tuple[RequirementObjective, ...]
    parameter_bounds: tuple[RequirementParameterBound, ...]
    price_constraint: RequirementPriceConstraint | None
    alternatives: int | None
    mandatory_raw_materials: tuple[str, ...]
    excluded_raw_materials: tuple[str, ...]
    uncertainties: tuple[str, ...]


_NUMBER = r"([0-9]+(?:[\.,][0-9]+)?)"
_MIN_WORDS = r"(?:min(?:imo|imum)?|al menos|>=|mayor(?: o igual)? que|por encima de|at least)"
_MAX_WORDS = r"(?:max(?:imo|imum)?|<=|menor(?: o igual)? que|no mas de|hasta|under|below|less than)"
_ACTIVE_TERMS = (
    "active_content",
    "active content",
    "contenido activo",
    "activo",
    "riqueza",
)


def parse_requirements(
    text: str,
    *,
    active_parameter_code: str = "active_content",
    active_parameter_name: str | None = None,
) -> RequirementParseResult:
    normalized_text = _normalize_text(text)
    objectives = _parse_objectives(normalized_text)
    parameter_bounds = _parse_active_parameter_bounds(
        normalized_text,
        active_parameter_code=active_parameter_code,
        active_parameter_name=active_parameter_name,
    )
    price_constraint = _parse_price_constraint(normalized_text)
    alternatives = _parse_alternatives(normalized_text)
    mandatory_raw_materials = _parse_named_items(normalized_text, ("incluye", "incluir", "usar", "usa"))
    excluded_raw_materials = _parse_named_items(normalized_text, ("sin", "excluye", "excluir", "evita", "avoid"))
    uncertainties = _parse_uncertainties(
        normalized_text,
        objectives=objectives,
        parameter_bounds=parameter_bounds,
        price_constraint=price_constraint,
    )
    return RequirementParseResult(
        source="deterministic",
        objectives=objectives,
        parameter_bounds=parameter_bounds,
        price_constraint=price_constraint,
        alternatives=alternatives,
        mandatory_raw_materials=mandatory_raw_materials,
        excluded_raw_materials=excluded_raw_materials,
        uncertainties=uncertainties,
    )


def _parse_objectives(text: str) -> tuple[RequirementObjective, ...]:
    if re.search(r"\b(barat[oa]|bajo coste|menor coste|minimi[sz]a(?:r)? coste|low cost|lowest cost|minimi[sz]e price)\b", text):
        return (RequirementObjective(type="minimize", target="price"),)
    return ()


def _parse_active_parameter_bounds(
    text: str,
    *,
    active_parameter_code: str,
    active_parameter_name: str | None,
) -> tuple[RequirementParameterBound, ...]:
    aliases = _active_aliases(active_parameter_code, active_parameter_name)
    minimum, maximum, source_parts = _parse_between_bound(text, aliases)
    min_word_value, min_word_source = _parse_single_parameter_bound(text, aliases, _MIN_WORDS)
    max_word_value, max_word_source = _parse_single_parameter_bound(text, aliases, _MAX_WORDS)

    if min_word_value is not None:
        minimum = min_word_value
        source_parts.append(min_word_source)
    if max_word_value is not None:
        maximum = max_word_value
        source_parts.append(max_word_source)
    if minimum is None and maximum is None:
        return ()
    return (
        RequirementParameterBound(
            code=active_parameter_code,
            min_value=minimum,
            max_value=maximum,
            source_text="; ".join(_unique(source_parts)),
        ),
    )


def _parse_between_bound(text: str, aliases: tuple[str, ...]) -> tuple[float | None, float | None, list[str]]:
    alias_pattern = _alias_pattern(aliases)
    patterns = [
        re.compile(rf"\b{alias_pattern}\b[^.;,]*\bentre\s+{_NUMBER}\s*(?:%|por ciento)?\s+y\s+{_NUMBER}", re.I),
        re.compile(rf"\bbetween\s+{_NUMBER}\s+and\s+{_NUMBER}[^.;,]*\b{alias_pattern}\b", re.I),
        re.compile(rf"\bentre\s+{_NUMBER}\s*(?:%|por ciento)?\s+y\s+{_NUMBER}[^.;,]*\b{alias_pattern}\b", re.I),
    ]
    for pattern in patterns:
        match = pattern.search(text)
        if match:
            return _number(match.group(1)), _number(match.group(2)), [match.group(0)]
    return None, None, []


def _parse_single_parameter_bound(
    text: str,
    aliases: tuple[str, ...],
    qualifier_pattern: str,
) -> tuple[float | None, str]:
    alias_pattern = _alias_pattern(aliases)
    patterns = [
        re.compile(rf"\b{alias_pattern}\b[^.;,]{{0,40}}\b{qualifier_pattern}\s*(?:de\s*)?{_NUMBER}", re.I),
        re.compile(rf"\b{qualifier_pattern}\s*(?:de\s*)?{_NUMBER}\s*(?:%|por ciento)?[^.;,]{{0,40}}\b{alias_pattern}\b", re.I),
    ]
    for pattern in patterns:
        match = pattern.search(text)
        if match:
            if _has_price_language(match.group(0)):
                continue
            return _number(match.group(1)), match.group(0)
    return None, ""


def _parse_price_constraint(text: str) -> RequirementPriceConstraint | None:
    patterns = [
        re.compile(rf"\b(?:precio|coste|costo|price|cost)[^.;,]{{0,30}}\b{_MAX_WORDS}\s*(?:de\s*)?{_NUMBER}", re.I),
        re.compile(rf"\b{_MAX_WORDS}\s*(?:de\s*)?{_NUMBER}\s*(?:eur|euro|€/kg|eur/kg)?[^.;,]{{0,20}}\b(?:precio|coste|costo|price|cost)\b", re.I),
    ]
    for pattern in patterns:
        match = pattern.search(text)
        if match:
            return RequirementPriceConstraint(
                max_price=_number(match.group(1)),
                currency=_currency(match.group(0)),
                unit="kg",
                source_text=match.group(0),
            )
    return None


def _parse_alternatives(text: str) -> int | None:
    match = re.search(rf"\b{_NUMBER}\s+(?:alternativas|alternatives|opciones|options)\b", text)
    if not match:
        return None
    return max(1, int(_number(match.group(1))))


def _parse_named_items(text: str, verbs: tuple[str, ...]) -> tuple[str, ...]:
    verb_pattern = "|".join(re.escape(verb) for verb in verbs)
    matches = re.finditer(
        rf"\b(?:{verb_pattern})\s+([a-z0-9][a-z0-9 _-]{{1,48}})",
        text,
        flags=re.I,
    )
    items: list[str] = []
    for match in matches:
        candidate = re.split(
            r"\b(?:y|and|con|sin|pero|excepto|precio|coste|costo|min|max|entre|al menos|hasta)\b|[.;]",
            match.group(1),
            maxsplit=1,
        )[0].strip(" ,")
        if candidate and not re.search(r"\d", candidate):
            items.append(candidate)
    return tuple(_unique(items))


def _parse_uncertainties(
    text: str,
    *,
    objectives: tuple[RequirementObjective, ...],
    parameter_bounds: tuple[RequirementParameterBound, ...],
    price_constraint: RequirementPriceConstraint | None,
) -> tuple[str, ...]:
    uncertainties: list[str] = []
    if not text.strip():
        uncertainties.append("Empty requirement text.")
        return tuple(uncertainties)
    if not objectives:
        uncertainties.append("No objective detected.")
    if _has_vague_technical_language(text) and not parameter_bounds:
        uncertainties.append("Technical requirement is vague and has no numeric bound.")
    if _has_price_language(text) and price_constraint is None and not objectives:
        uncertainties.append("Economic requirement has no numeric price bound.")
    return tuple(uncertainties)


def _active_aliases(active_parameter_code: str, active_parameter_name: str | None) -> tuple[str, ...]:
    aliases = [active_parameter_code.replace("_", " "), active_parameter_code, *_ACTIVE_TERMS]
    if active_parameter_name:
        aliases.extend([active_parameter_name, active_parameter_name.replace("_", " ")])
    return tuple(_unique(_normalize_text(alias) for alias in aliases if alias.strip()))


def _alias_pattern(aliases: tuple[str, ...]) -> str:
    return r"(?:%s)" % "|".join(re.escape(alias) for alias in aliases)


def _currency(source_text: str) -> str:
    if "€" in source_text or "eur" in source_text or "euro" in source_text:
        return "EUR"
    return "EUR"


def _number(value: str) -> float:
    return float(value.replace(",", "."))


def _normalize_text(value: str) -> str:
    without_accents = "".join(
        character
        for character in unicodedata.normalize("NFKD", value)
        if not unicodedata.combining(character)
    )
    return re.sub(r"\s+", " ", without_accents.lower()).strip()


def _has_vague_technical_language(text: str) -> bool:
    return bool(re.search(r"\b(riqueza|activo|active content|concentrado|potente|alto contenido)\b", text))


def _has_price_language(text: str) -> bool:
    return bool(re.search(r"\b(precio|coste|costo|price|cost|barat[oa])\b", text))


def _unique(items: list[str] | tuple[str, ...]) -> list[str]:
    seen: set[str] = set()
    unique_items: list[str] = []
    for item in items:
        if item not in seen:
            seen.add(item)
            unique_items.append(item)
    return unique_items
