from formulia_core import (
    OptimizationProblem,
    OptimizationStatus,
    ParameterBound,
    ParameterValue,
    RawMaterial,
    RawMaterialBound,
    minimize_price,
)


def test_minimizes_price_with_sum_100_constraint() -> None:
    result = minimize_price(
        OptimizationProblem(
            raw_materials=[
                RawMaterial(id="expensive", name="Expensive", price=2.0),
                RawMaterial(id="cheap", name="Cheap", price=1.0),
            ]
        )
    )

    assert result.status == OptimizationStatus.SUCCESS
    assert [(item.raw_material_id, item.percentage) for item in result.items] == [
        ("cheap", 100.0)
    ]
    assert result.calculation is not None
    assert result.calculation.price_total == 1.0


def test_respects_parameter_minimum_bound() -> None:
    result = minimize_price(
        OptimizationProblem(
            raw_materials=[
                RawMaterial(
                    id="active",
                    name="Active",
                    price=4.0,
                    parameters={
                        "active_content": ParameterValue(
                            code="active_content",
                            value=50,
                            unit="% p/p",
                        )
                    },
                ),
                RawMaterial(
                    id="carrier",
                    name="Carrier",
                    price=1.0,
                    parameters={
                        "active_content": ParameterValue(
                            code="active_content",
                            value=0,
                            unit="% p/p",
                        )
                    },
                ),
            ],
            parameter_bounds=[ParameterBound(code="active_content", min_value=20)],
        )
    )

    assert result.status == OptimizationStatus.SUCCESS
    assert [(item.raw_material_id, item.percentage) for item in result.items] == [
        ("active", 40.0),
        ("carrier", 60.0),
    ]
    assert result.calculation is not None
    assert result.calculation.parameters["active_content"].value == 20.0


def test_reports_infeasible_problem() -> None:
    result = minimize_price(
        OptimizationProblem(
            raw_materials=[
                RawMaterial(id="a", name="A", price=2.0),
                RawMaterial(id="b", name="B", price=1.0),
            ],
            raw_material_bounds=[
                RawMaterialBound(raw_material_id="a", max_percentage=40),
                RawMaterialBound(raw_material_id="b", max_percentage=40),
            ],
        )
    )

    assert result.status == OptimizationStatus.INFEASIBLE
    assert result.items == []
    assert result.calculation is None
    assert "No feasible formula found for the selected constraints." in result.messages
    assert "Raw material maximum percentages total 80%, below 100%." in result.messages


def test_explains_raw_material_minimums_above_100() -> None:
    result = minimize_price(
        OptimizationProblem(
            raw_materials=[
                RawMaterial(id="a", name="A", price=2.0),
                RawMaterial(id="b", name="B", price=1.0),
            ],
            raw_material_bounds=[
                RawMaterialBound(raw_material_id="a", min_percentage=60),
                RawMaterialBound(raw_material_id="b", min_percentage=50),
            ],
        )
    )

    assert result.status == OptimizationStatus.INFEASIBLE
    assert "Raw material minimum percentages total 110%, above 100%." in result.messages


def test_explains_parameter_minimum_above_attainable_range() -> None:
    result = minimize_price(
        OptimizationProblem(
            raw_materials=[
                RawMaterial(
                    id="active",
                    name="Active",
                    price=2.0,
                    parameters={
                        "active_content": ParameterValue(
                            code="active_content",
                            value=50,
                            unit="% p/p",
                        )
                    },
                ),
                RawMaterial(
                    id="carrier",
                    name="Carrier",
                    price=1.0,
                    parameters={
                        "active_content": ParameterValue(
                            code="active_content",
                            value=0,
                            unit="% p/p",
                        )
                    },
                ),
            ],
            parameter_bounds=[ParameterBound(code="active_content", min_value=60)],
        )
    )

    assert result.status == OptimizationStatus.INFEASIBLE
    assert (
        "Parameter active_content minimum 60 is above attainable maximum 50."
        in result.messages
    )


def test_explains_parameter_maximum_below_attainable_range() -> None:
    result = minimize_price(
        OptimizationProblem(
            raw_materials=[
                RawMaterial(
                    id="active",
                    name="Active",
                    price=2.0,
                    parameters={
                        "active_content": ParameterValue(
                            code="active_content",
                            value=50,
                            unit="% p/p",
                        )
                    },
                ),
                RawMaterial(
                    id="carrier",
                    name="Carrier",
                    price=1.0,
                    parameters={
                        "active_content": ParameterValue(
                            code="active_content",
                            value=10,
                            unit="% p/p",
                        )
                    },
                ),
            ],
            parameter_bounds=[ParameterBound(code="active_content", max_value=5)],
        )
    )

    assert result.status == OptimizationStatus.INFEASIBLE
    assert (
        "Parameter active_content maximum 5 is below attainable minimum 10."
        in result.messages
    )
