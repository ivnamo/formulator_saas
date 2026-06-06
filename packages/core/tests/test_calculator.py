from formulia_core import FormulaItem, ParameterValue, RawMaterial, WarningCode, calculate_formula


def test_calculates_weighted_price_and_parameters() -> None:
    result = calculate_formula(
        items=[
            FormulaItem(raw_material_id="rm-1", percentage=25),
            FormulaItem(raw_material_id="rm-2", percentage=75),
        ],
        raw_materials=[
            RawMaterial(
                id="rm-1",
                name="Active A",
                price=2.0,
                parameters={
                    "active_content": ParameterValue(
                        code="active_content",
                        value=40,
                        unit="% p/p",
                    )
                },
            ),
            RawMaterial(
                id="rm-2",
                name="Carrier B",
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
    )

    assert result.total_percentage == 100
    assert result.price_total == 1.25
    assert result.parameters["active_content"].value == 17.5
    assert result.warnings == ()


def test_warns_when_total_percentage_is_not_100() -> None:
    result = calculate_formula(
        items=[FormulaItem(raw_material_id="rm-1", percentage=90)],
        raw_materials=[RawMaterial(id="rm-1", name="Active A", price=2.0)],
    )

    assert result.total_percentage == 90
    assert [warning.code for warning in result.warnings] == [
        WarningCode.TOTAL_PERCENTAGE_NOT_100
    ]


def test_missing_price_returns_no_official_price_total() -> None:
    result = calculate_formula(
        items=[
            FormulaItem(raw_material_id="rm-1", percentage=50),
            FormulaItem(raw_material_id="rm-2", percentage=50),
        ],
        raw_materials=[
            RawMaterial(id="rm-1", name="Active A", price=2.0),
            RawMaterial(id="rm-2", name="Carrier B", price=None),
        ],
    )

    assert result.price_total is None
    assert WarningCode.MISSING_PRICE in {warning.code for warning in result.warnings}


def test_warns_for_required_missing_parameter() -> None:
    result = calculate_formula(
        items=[FormulaItem(raw_material_id="rm-1", percentage=100)],
        raw_materials=[RawMaterial(id="rm-1", name="Active A", price=2.0)],
        required_parameter_codes={"viscosity"},
    )

    assert result.parameters == {}
    assert result.warnings[0].code == WarningCode.MISSING_PARAMETER
    assert result.warnings[0].parameter_code == "viscosity"
