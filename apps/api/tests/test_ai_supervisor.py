from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import SQLModel, create_engine

from formulia_api.agents.deepagents_adapter import DeepAgentsUnavailableError
from formulia_api.main import create_app


USER_A = "10000000-0000-0000-0000-000000000001"
USER_B = "20000000-0000-0000-0000-000000000001"


def make_client() -> TestClient:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    app = create_app(engine)
    SQLModel.metadata.create_all(engine)
    return TestClient(app)


def create_tenant(client: TestClient, user_id: str, slug: str) -> str:
    response = client.post(
        "/api/v1/tenants",
        headers={"X-User-Id": user_id},
        json={"name": slug.title(), "slug": slug},
    )
    assert response.status_code == 201
    return response.json()["id"]


def create_parameter(client: TestClient, headers: dict[str, str]) -> dict:
    response = client.post(
        "/api/v1/parameters",
        headers=headers,
        json={"code": "active_content", "name": "Active Content", "unit": "% p/p"},
    )
    assert response.status_code == 201
    return response.json()


def create_raw_material(
    client: TestClient,
    headers: dict[str, str],
    parameter_id: str,
    *,
    name: str,
    code: str,
    price: float | None = None,
    active_content: float | None = None,
    is_active: bool = True,
    is_obsolete: bool = False,
) -> dict:
    response = client.post(
        "/api/v1/raw-materials",
        headers=headers,
        json={"name": name, "code": code},
    )
    assert response.status_code == 201
    material = response.json()
    if not is_active or is_obsolete:
        update = client.patch(
            f"/api/v1/raw-materials/{material['id']}",
            headers=headers,
            json={"is_active": is_active, "is_obsolete": is_obsolete},
        )
        assert update.status_code == 200
        material = update.json()
    if price is not None:
        price_response = client.post(
            f"/api/v1/raw-materials/{material['id']}/prices",
            headers=headers,
            json={"price": price, "currency": "EUR", "unit": "kg"},
        )
        assert price_response.status_code == 201
    if active_content is not None:
        value_response = client.post(
            f"/api/v1/raw-materials/{material['id']}/parameter-values",
            headers=headers,
            json={"parameter_id": parameter_id, "value": active_content},
        )
        assert value_response.status_code == 201
    return material


def test_supervisor_plan_uses_requirement_parser_tool(monkeypatch) -> None:
    monkeypatch.delenv("AGENT_ORCHESTRATOR_PROVIDER", raising=False)
    monkeypatch.delenv("REQUIREMENT_PARSER_PROVIDER", raising=False)
    client = make_client()
    tenant_id = create_tenant(client, USER_A, "tenant-a")
    headers = {"X-User-Id": USER_A, "X-Tenant-Id": tenant_id}
    create_parameter(client, headers)

    response = client.post(
        "/api/v1/ai/supervisor/plan",
        headers=headers,
        json={"text": "Liquido barato con contenido activo minimo 12% y precio maximo 2 EUR/kg"},
    )

    assert response.status_code == 200
    plan = response.json()
    assert plan["orchestrator"] == "deterministic"
    assert plan["parsed_requirements"]["product_type"] == "liquido"
    assert [step["tool"] for step in plan["steps"]] == [
        "RawMaterialResearchAgent",
        "OptimizationAgent",
        "FormulaCalculationAgent",
        "HumanReviewAgent",
    ]
    assert plan["candidate_research"]["candidate_count"] == 0
    assert plan["optimization_plan"]["status"] == "blocked"
    assert plan["optimization_plan"]["infeasibility_explanations"] == [
        {
            "code": "no_candidates",
            "severity": "blocker",
            "message": "No tenant raw material candidates are available.",
            "action": (
                "Create active raw materials or relax excluded and mandatory material terms."
            ),
        }
    ]
    detail = client.get(f"/api/v1/ai/runs/{plan['run_id']}", headers=headers)
    assert detail.status_code == 200
    run = detail.json()
    assert run["run_type"] == "formulation_supervisor"
    assert [call["tool_name"] for call in run["tool_calls"]] == [
        "RequirementParserAgent",
        "RawMaterialResearchAgent",
        "OptimizationAgent",
    ]
    assert all(call["status"] == "success" for call in run["tool_calls"])


def test_supervisor_researches_tenant_candidates_and_optimizer_inputs(monkeypatch) -> None:
    monkeypatch.delenv("AGENT_ORCHESTRATOR_PROVIDER", raising=False)
    monkeypatch.delenv("REQUIREMENT_PARSER_PROVIDER", raising=False)
    client = make_client()
    tenant_a = create_tenant(client, USER_A, "tenant-a")
    tenant_b = create_tenant(client, USER_B, "tenant-b")
    headers_a = {"X-User-Id": USER_A, "X-Tenant-Id": tenant_a}
    headers_b = {"X-User-Id": USER_B, "X-Tenant-Id": tenant_b}
    parameter_a = create_parameter(client, headers_a)
    parameter_b = create_parameter(client, headers_b)
    active = create_raw_material(
        client,
        headers_a,
        parameter_a["id"],
        name="Active A 40",
        code="ACT-A",
        price=1.5,
        active_content=40,
    )
    carrier = create_raw_material(
        client,
        headers_a,
        parameter_a["id"],
        name="Carrier B",
        code="CAR-B",
        price=0.5,
        active_content=10,
    )
    create_raw_material(
        client,
        headers_a,
        parameter_a["id"],
        name="Banned Material",
        code="BAN",
        price=0.2,
        active_content=80,
    )
    create_raw_material(
        client,
        headers_a,
        parameter_a["id"],
        name="Inactive Active",
        code="INA",
        price=0.8,
        active_content=60,
        is_active=False,
    )
    create_raw_material(
        client,
        headers_b,
        parameter_b["id"],
        name="Other Tenant Active",
        code="OTH",
        price=0.1,
        active_content=90,
    )

    response = client.post(
        "/api/v1/ai/supervisor/plan",
        headers=headers_a,
        json={
            "text": (
                "Liquido barato con contenido activo minimo 12% "
                "y precio maximo 2 EUR/kg sin banned."
            )
        },
    )

    assert response.status_code == 200
    plan = response.json()
    candidate_ids = [
        candidate["raw_material_id"]
        for candidate in plan["candidate_research"]["candidates"]
    ]
    candidate_names = {
        candidate["name"]
        for candidate in plan["candidate_research"]["candidates"]
    }
    assert candidate_ids == [active["id"], carrier["id"]]
    assert "Banned Material" not in candidate_names
    assert "Inactive Active" not in candidate_names
    assert "Other Tenant Active" not in candidate_names
    assert plan["optimization_plan"]["status"] == "solved"
    assert plan["optimization_plan"]["solver"] == "grid_v1"
    assert plan["optimization_plan"]["objective"] == {
        "type": "minimize",
        "target": "price_total",
    }
    assert plan["optimization_plan"]["candidate_raw_material_ids"] == [
        active["id"],
        carrier["id"],
    ]
    formula = plan["optimization_plan"]["formula_candidates"][0]
    assert formula["status"] == "draft"
    assert formula["total_percentage"] == 100
    assert round(formula["price_total"], 6) == 0.6
    assert formula["items"] == [
        {"raw_material_id": active["id"], "name": "Active A 40", "percentage": 10.0},
        {"raw_material_id": carrier["id"], "name": "Carrier B", "percentage": 90.0},
    ]
    assert formula["parameters"] == [
        {"code": "active_content", "value": 13.0, "unit": "% p/p"}
    ]
    assert {constraint["status"] for constraint in formula["constraints_status"]} == {
        "satisfied"
    }
    assert plan["optimization_plan"]["infeasibility_explanations"] == []
    assert [step["status"] for step in plan["steps"]] == [
        "completed",
        "completed",
        "completed",
        "required",
    ]


def test_optimization_blocks_price_constraints_without_prices(monkeypatch) -> None:
    monkeypatch.delenv("AGENT_ORCHESTRATOR_PROVIDER", raising=False)
    monkeypatch.delenv("REQUIREMENT_PARSER_PROVIDER", raising=False)
    client = make_client()
    tenant_id = create_tenant(client, USER_A, "tenant-a")
    headers = {"X-User-Id": USER_A, "X-Tenant-Id": tenant_id}
    parameter = create_parameter(client, headers)
    create_raw_material(
        client,
        headers,
        parameter["id"],
        name="Active No Price",
        code="ACT-NP",
        active_content=45,
    )

    response = client.post(
        "/api/v1/ai/supervisor/plan",
        headers=headers,
        json={"text": "Liquido con contenido activo minimo 12% y precio maximo 2 EUR/kg."},
    )

    assert response.status_code == 200
    plan = response.json()
    assert plan["candidate_research"]["candidate_count"] == 1
    assert plan["optimization_plan"]["status"] == "blocked"
    assert "No priced candidate can satisfy price constraints." in plan["optimization_plan"][
        "blocking_reasons"
    ]
    assert plan["optimization_plan"]["infeasibility_explanations"] == [
        {
            "code": "missing_price_coverage",
            "severity": "blocker",
            "message": "No priced candidate can satisfy price constraints.",
            "action": (
                "Add current EUR/kg prices to candidate raw materials or remove the price constraint."
            ),
        }
    ]


def test_optimization_explains_missing_parameter_coverage(monkeypatch) -> None:
    monkeypatch.delenv("AGENT_ORCHESTRATOR_PROVIDER", raising=False)
    monkeypatch.delenv("REQUIREMENT_PARSER_PROVIDER", raising=False)
    client = make_client()
    tenant_id = create_tenant(client, USER_A, "tenant-a")
    headers = {"X-User-Id": USER_A, "X-Tenant-Id": tenant_id}
    parameter = create_parameter(client, headers)
    create_raw_material(
        client,
        headers,
        parameter["id"],
        name="Priced Carrier",
        code="CAR-P",
        price=0.8,
    )

    response = client.post(
        "/api/v1/ai/supervisor/plan",
        headers=headers,
        json={"text": "Liquido con contenido activo minimo 12%."},
    )

    assert response.status_code == 200
    plan = response.json()
    assert plan["candidate_research"]["candidate_count"] == 1
    assert plan["optimization_plan"]["status"] == "blocked"
    assert plan["optimization_plan"]["infeasibility_explanations"] == [
        {
            "code": "missing_parameter_coverage",
            "severity": "blocker",
            "message": "No candidate has parameter active_content.",
            "action": (
                "Add measured values for parameter active_content to candidate raw materials "
                "or remove that technical constraint."
            ),
        }
    ]


def test_optimization_marks_infeasible_when_grid_has_no_solution(monkeypatch) -> None:
    monkeypatch.delenv("AGENT_ORCHESTRATOR_PROVIDER", raising=False)
    monkeypatch.delenv("REQUIREMENT_PARSER_PROVIDER", raising=False)
    client = make_client()
    tenant_id = create_tenant(client, USER_A, "tenant-a")
    headers = {"X-User-Id": USER_A, "X-Tenant-Id": tenant_id}
    parameter = create_parameter(client, headers)
    create_raw_material(
        client,
        headers,
        parameter["id"],
        name="Active Expensive",
        code="ACT-EXP",
        price=3.0,
        active_content=45,
    )

    response = client.post(
        "/api/v1/ai/supervisor/plan",
        headers=headers,
        json={"text": "Liquido con contenido activo minimo 12% y precio maximo 1 EUR/kg."},
    )

    assert response.status_code == 200
    plan = response.json()
    assert plan["optimization_plan"]["status"] == "infeasible"
    assert plan["optimization_plan"]["solver"] == "grid_v1"
    assert plan["optimization_plan"]["formula_candidates"] == []
    assert "No grid solution satisfies supported constraints." in plan["optimization_plan"][
        "blocking_reasons"
    ]
    assert plan["optimization_plan"]["infeasibility_explanations"] == [
        {
            "code": "grid_no_solution",
            "severity": "blocker",
            "message": "No grid solution satisfies supported constraints.",
            "action": (
                "Relax at least one numeric constraint, add more priced materials with required "
                "parameters, or reduce the requested constraint set."
            ),
        }
    ]


def test_supervisor_deepagents_provider_invokes_harness(monkeypatch) -> None:
    captured = {}

    class FakeAgent:
        def invoke(self, payload):
            captured["payload"] = payload
            captured["tool_result"] = captured["tools"][0](payload["messages"][0]["content"])
            captured["research_result"] = captured["tools"][1](payload["messages"][0]["content"])
            captured["optimization_result"] = captured["tools"][2](payload["messages"][0]["content"])
            return {"messages": [{"content": "Plan with gated deterministic tools."}]}

    def fake_build_deepagents_supervisor(*, model, tools, system_prompt):
        captured["model"] = model
        captured["tools"] = tools
        captured["system_prompt"] = system_prompt
        return FakeAgent()

    monkeypatch.setenv("AGENT_ORCHESTRATOR_PROVIDER", "deepagents")
    monkeypatch.setenv("AGENT_ORCHESTRATOR_MODEL", "gpt-5-nano")
    monkeypatch.setattr(
        "formulia_api.agents.supervisor.build_deepagents_supervisor",
        fake_build_deepagents_supervisor,
    )
    client = make_client()
    tenant_id = create_tenant(client, USER_A, "tenant-a")
    headers = {"X-User-Id": USER_A, "X-Tenant-Id": tenant_id}

    response = client.post(
        "/api/v1/ai/supervisor/plan",
        headers=headers,
        json={"text": "Planifica una formula liquida economica."},
    )

    assert response.status_code == 200
    plan = response.json()
    assert captured["model"] == "gpt-5-nano"
    assert len(captured["tools"]) == 3
    assert "FormulationSupervisorAgent" in captured["system_prompt"]
    assert captured["payload"]["messages"][0]["content"] == "Planifica una formula liquida economica."
    assert captured["tool_result"]["source"] == "deterministic"
    assert captured["research_result"]["candidate_count"] == 0
    assert captured["optimization_result"]["status"] == "blocked"
    assert plan["orchestrator"] == "deepagents"
    assert plan["steps"][0]["tool"] == "deepagents_supervisor"
    detail = client.get(f"/api/v1/ai/runs/{plan['run_id']}", headers=headers)
    assert [call["tool_name"] for call in detail.json()["tool_calls"]] == [
        "RequirementParserAgent",
        "RawMaterialResearchAgent",
        "OptimizationAgent",
    ]


def test_supervisor_deepagents_provider_reports_missing_harness(monkeypatch) -> None:
    def fake_build_deepagents_supervisor(*, model, tools, system_prompt):
        raise DeepAgentsUnavailableError("DeepAgents is not installed.")

    monkeypatch.setenv("AGENT_ORCHESTRATOR_PROVIDER", "deepagents")
    monkeypatch.setattr(
        "formulia_api.agents.supervisor.build_deepagents_supervisor",
        fake_build_deepagents_supervisor,
    )
    client = make_client()
    tenant_id = create_tenant(client, USER_A, "tenant-a")
    headers = {"X-User-Id": USER_A, "X-Tenant-Id": tenant_id}

    response = client.post(
        "/api/v1/ai/supervisor/plan",
        headers=headers,
        json={"text": "Planifica una formula liquida economica."},
    )

    assert response.status_code == 501
    runs = client.get("/api/v1/ai/runs", headers=headers).json()
    assert runs[0]["provider"] == "deepagents"
    assert runs[0]["status"] == "error"


def test_ai_run_detail_is_tenant_scoped(monkeypatch) -> None:
    monkeypatch.delenv("AGENT_ORCHESTRATOR_PROVIDER", raising=False)
    client = make_client()
    tenant_a = create_tenant(client, USER_A, "tenant-a")
    tenant_b = create_tenant(client, USER_B, "tenant-b")
    headers_a = {"X-User-Id": USER_A, "X-Tenant-Id": tenant_a}
    headers_b = {"X-User-Id": USER_B, "X-Tenant-Id": tenant_b}

    response = client.post(
        "/api/v1/ai/supervisor/plan",
        headers=headers_a,
        json={"text": "Necesito una formula economica."},
    )

    assert response.status_code == 200
    run_id = response.json()["run_id"]
    forbidden = client.get(f"/api/v1/ai/runs/{run_id}", headers=headers_b)
    assert forbidden.status_code == 404
