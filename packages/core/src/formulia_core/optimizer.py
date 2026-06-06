from __future__ import annotations

from dataclasses import dataclass, field
from enum import StrEnum

from scipy.optimize import linprog

from .calculator import (
    FormulaCalculation,
    FormulaItem,
    ParameterValue,
    RawMaterial,
    calculate_formula,
)


class OptimizationStatus(StrEnum):
    SUCCESS = "success"
    INFEASIBLE = "infeasible"
    INVALID = "invalid"


@dataclass(frozen=True)
class RawMaterialBound:
    raw_material_id: str
    min_percentage: float | None = None
    max_percentage: float | None = None


@dataclass(frozen=True)
class ParameterBound:
    code: str
    min_value: float | None = None
    max_value: float | None = None


@dataclass(frozen=True)
class OptimizationProblem:
    raw_materials: list[RawMaterial]
    raw_material_bounds: list[RawMaterialBound] = field(default_factory=list)
    parameter_bounds: list[ParameterBound] = field(default_factory=list)


@dataclass(frozen=True)
class OptimizationResult:
    status: OptimizationStatus
    items: list[FormulaItem]
    calculation: FormulaCalculation | None
    messages: tuple[str, ...] = ()


def minimize_price(problem: OptimizationProblem) -> OptimizationResult:
    """Find the lowest-price formula that satisfies linear constraints."""

    validation_messages = _problem_validation_messages(problem)
    if validation_messages:
        return OptimizationResult(
            status=OptimizationStatus.INVALID,
            items=[],
            calculation=None,
            messages=tuple(validation_messages),
        )

    raw_materials = problem.raw_materials
    material_ids = [material.id for material in raw_materials]
    objective = [_price(material) for material in raw_materials]
    bounds = _variable_bounds(material_ids, problem.raw_material_bounds)
    parameter_matrix, parameter_limits = _parameter_constraints(
        raw_materials,
        problem.parameter_bounds,
    )

    result = linprog(
        c=objective,
        A_ub=parameter_matrix or None,
        b_ub=parameter_limits or None,
        A_eq=[[1.0 for _ in raw_materials]],
        b_eq=[100.0],
        bounds=bounds,
        method="highs",
    )

    if not result.success:
        return OptimizationResult(
            status=OptimizationStatus.INFEASIBLE,
            items=[],
            calculation=None,
            messages=(result.message,),
        )

    items = [
        FormulaItem(raw_material_id=raw_material_id, percentage=_clean_percentage(value))
        for raw_material_id, value in zip(material_ids, result.x, strict=True)
        if value > 0.000001
    ]
    calculation = calculate_formula(
        items=items,
        raw_materials=raw_materials,
        required_parameter_codes={bound.code for bound in problem.parameter_bounds},
    )
    return OptimizationResult(
        status=OptimizationStatus.SUCCESS,
        items=items,
        calculation=calculation,
        messages=(),
    )


def _problem_validation_messages(problem: OptimizationProblem) -> list[str]:
    messages: list[str] = []
    if not problem.raw_materials:
        messages.append("At least one raw material candidate is required")

    material_ids = [material.id for material in problem.raw_materials]
    if len(set(material_ids)) != len(material_ids):
        messages.append("Candidate raw material ids must be unique")

    materials_by_id = {material.id: material for material in problem.raw_materials}
    for material in problem.raw_materials:
        if material.price is None:
            messages.append(f"Raw material {material.id} has no price")

    for bound in problem.raw_material_bounds:
        if bound.raw_material_id not in materials_by_id:
            messages.append(f"Raw material bound {bound.raw_material_id} is not a candidate")
        if _invalid_range(bound.min_percentage, bound.max_percentage):
            messages.append(f"Raw material bound {bound.raw_material_id} has an invalid range")

    for bound in problem.parameter_bounds:
        if _invalid_range(bound.min_value, bound.max_value):
            messages.append(f"Parameter bound {bound.code} has an invalid range")
        if not any(bound.code in material.parameters for material in problem.raw_materials):
            messages.append(f"Parameter {bound.code} is not available in candidate materials")

    return messages


def _variable_bounds(
    material_ids: list[str],
    raw_material_bounds: list[RawMaterialBound],
) -> list[tuple[float, float]]:
    bounds_by_id = {bound.raw_material_id: bound for bound in raw_material_bounds}
    variable_bounds = []
    for material_id in material_ids:
        bound = bounds_by_id.get(material_id)
        minimum = 0.0 if bound is None or bound.min_percentage is None else bound.min_percentage
        maximum = 100.0 if bound is None or bound.max_percentage is None else bound.max_percentage
        variable_bounds.append((minimum, maximum))
    return variable_bounds


def _parameter_constraints(
    raw_materials: list[RawMaterial],
    parameter_bounds: list[ParameterBound],
) -> tuple[list[list[float]], list[float]]:
    matrix: list[list[float]] = []
    limits: list[float] = []
    for bound in parameter_bounds:
        coefficients = [
            _parameter_value(material.parameters.get(bound.code)) / 100.0
            for material in raw_materials
        ]
        if bound.max_value is not None:
            matrix.append(coefficients)
            limits.append(bound.max_value)
        if bound.min_value is not None:
            matrix.append([-coefficient for coefficient in coefficients])
            limits.append(-bound.min_value)
    return matrix, limits


def _price(material: RawMaterial) -> float:
    return 0.0 if material.price is None else material.price


def _parameter_value(parameter: ParameterValue | None) -> float:
    return 0.0 if parameter is None else parameter.value


def _invalid_range(minimum: float | None, maximum: float | None) -> bool:
    return minimum is not None and maximum is not None and minimum > maximum


def _clean_percentage(value: float) -> float:
    rounded = round(float(value), 10)
    return 0.0 if abs(rounded) < 0.0000001 else rounded
