from formulia_core import parse_requirements


def test_parses_cost_objective_bounds_price_and_material_preferences() -> None:
    result = parse_requirements(
        (
            "Minimiza coste con contenido activo entre 20 y 40, "
            "precio maximo 2,5 EUR/kg, 3 alternativas, incluye active a y sin carrier b."
        ),
        active_parameter_code="active_content",
        active_parameter_name="Active content",
    )

    assert result.source == "deterministic"
    assert [(objective.type, objective.target) for objective in result.objectives] == [
        ("minimize", "price")
    ]
    assert len(result.parameter_bounds) == 1
    assert result.parameter_bounds[0].code == "active_content"
    assert result.parameter_bounds[0].min_value == 20
    assert result.parameter_bounds[0].max_value == 40
    assert result.price_constraint is not None
    assert result.price_constraint.max_price == 2.5
    assert result.price_constraint.currency == "EUR"
    assert result.alternatives == 3
    assert result.mandatory_raw_materials == ("active a",)
    assert result.excluded_raw_materials == ("carrier b",)
    assert result.uncertainties == ()


def test_does_not_invent_numeric_bounds_for_vague_request() -> None:
    result = parse_requirements("Quiero una formula barata con riqueza alta")

    assert [(objective.type, objective.target) for objective in result.objectives] == [
        ("minimize", "price")
    ]
    assert result.parameter_bounds == ()
    assert result.price_constraint is None
    assert "Technical requirement is vague and has no numeric bound." in result.uncertainties


def test_parses_single_sided_active_parameter_bounds() -> None:
    result = parse_requirements("Active content al menos 12 y maximo 18")

    assert len(result.parameter_bounds) == 1
    assert result.parameter_bounds[0].min_value == 12
    assert result.parameter_bounds[0].max_value == 18


def test_empty_text_reports_uncertainty_without_defaults() -> None:
    result = parse_requirements("")

    assert result.objectives == ()
    assert result.parameter_bounds == ()
    assert result.price_constraint is None
    assert result.uncertainties == ("Empty requirement text.",)
