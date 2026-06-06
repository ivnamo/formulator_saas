from __future__ import annotations

from dataclasses import dataclass, field
from enum import StrEnum
from math import isclose


class WarningCode(StrEnum):
    MISSING_RAW_MATERIAL = "missing_raw_material"
    MISSING_PRICE = "missing_price"
    MISSING_PARAMETER = "missing_parameter"
    TOTAL_PERCENTAGE_NOT_100 = "total_percentage_not_100"


@dataclass(frozen=True)
class ParameterValue:
    code: str
    value: float
    unit: str | None = None


@dataclass(frozen=True)
class RawMaterial:
    id: str
    name: str
    price: float | None = None
    currency: str = "EUR"
    parameters: dict[str, ParameterValue] = field(default_factory=dict)


@dataclass(frozen=True)
class FormulaItem:
    raw_material_id: str
    percentage: float


@dataclass(frozen=True)
class FormulaWarning:
    code: WarningCode
    message: str
    raw_material_id: str | None = None
    parameter_code: str | None = None


@dataclass(frozen=True)
class FormulaCalculation:
    total_percentage: float
    price_total: float | None
    currency: str
    parameters: dict[str, ParameterValue]
    warnings: tuple[FormulaWarning, ...]


def calculate_formula(
    *,
    items: list[FormulaItem],
    raw_materials: list[RawMaterial],
    required_parameter_codes: set[str] | None = None,
    expected_total_percentage: float = 100.0,
    percentage_tolerance: float = 0.0001,
) -> FormulaCalculation:
    """Calculate weighted price and parameters for a formula.

    The calculation is deterministic and deliberately unaware of tenants,
    databases, APIs, or AI orchestration.
    """

    materials_by_id = {material.id: material for material in raw_materials}
    required_parameters = required_parameter_codes or set()
    warnings: list[FormulaWarning] = []
    total_percentage = sum(item.percentage for item in items)
    price_total = 0.0
    has_missing_price = False
    weighted_parameters: dict[str, tuple[float, str | None]] = {}

    if not isclose(
        total_percentage,
        expected_total_percentage,
        rel_tol=0,
        abs_tol=percentage_tolerance,
    ):
        warnings.append(
            FormulaWarning(
                code=WarningCode.TOTAL_PERCENTAGE_NOT_100,
                message=(
                    f"Formula percentage total is {total_percentage}, "
                    f"expected {expected_total_percentage}."
                ),
            )
        )

    for item in items:
        material = materials_by_id.get(item.raw_material_id)
        if material is None:
            warnings.append(
                FormulaWarning(
                    code=WarningCode.MISSING_RAW_MATERIAL,
                    message=f"Raw material {item.raw_material_id} was not found.",
                    raw_material_id=item.raw_material_id,
                )
            )
            continue

        weight = item.percentage / expected_total_percentage
        if material.price is None:
            has_missing_price = True
            warnings.append(
                FormulaWarning(
                    code=WarningCode.MISSING_PRICE,
                    message=f"Raw material {material.name} has no current price.",
                    raw_material_id=material.id,
                )
            )
        else:
            price_total += material.price * weight

        for parameter_code in required_parameters:
            if parameter_code not in material.parameters:
                warnings.append(
                    FormulaWarning(
                        code=WarningCode.MISSING_PARAMETER,
                        message=(
                            f"Raw material {material.name} has no value for "
                            f"parameter {parameter_code}."
                        ),
                        raw_material_id=material.id,
                        parameter_code=parameter_code,
                    )
                )

        for parameter in material.parameters.values():
            current_value, current_unit = weighted_parameters.get(
                parameter.code,
                (0.0, parameter.unit),
            )
            weighted_parameters[parameter.code] = (
                current_value + parameter.value * weight,
                current_unit,
            )

    parameters = {
        code: ParameterValue(code=code, value=value, unit=unit)
        for code, (value, unit) in weighted_parameters.items()
    }

    return FormulaCalculation(
        total_percentage=total_percentage,
        price_total=None if has_missing_price else price_total,
        currency=_resolve_currency(raw_materials),
        parameters=parameters,
        warnings=tuple(warnings),
    )


def _resolve_currency(raw_materials: list[RawMaterial]) -> str:
    currencies = {material.currency for material in raw_materials if material.price is not None}
    if len(currencies) == 1:
        return next(iter(currencies))
    return "EUR"
