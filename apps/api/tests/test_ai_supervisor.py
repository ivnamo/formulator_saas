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


def test_supervisor_plan_uses_requirement_parser_tool(monkeypatch) -> None:
    monkeypatch.delenv("AGENT_ORCHESTRATOR_PROVIDER", raising=False)
    monkeypatch.delenv("REQUIREMENT_PARSER_PROVIDER", raising=False)
    client = make_client()
    tenant_id = create_tenant(client, USER_A, "tenant-a")
    headers = {"X-User-Id": USER_A, "X-Tenant-Id": tenant_id}
    parameter = client.post(
        "/api/v1/parameters",
        headers=headers,
        json={"code": "active_content", "name": "Active Content", "unit": "% p/p"},
    )
    assert parameter.status_code == 201

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
    detail = client.get(f"/api/v1/ai/runs/{plan['run_id']}", headers=headers)
    assert detail.status_code == 200
    run = detail.json()
    assert run["run_type"] == "formulation_supervisor"
    assert run["tool_calls"][0]["tool_name"] == "RequirementParserAgent"
    assert run["tool_calls"][0]["status"] == "success"


def test_supervisor_deepagents_provider_invokes_harness(monkeypatch) -> None:
    captured = {}

    class FakeAgent:
        def invoke(self, payload):
            captured["payload"] = payload
            captured["tool_result"] = captured["tools"][0](payload["messages"][0]["content"])
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
    assert len(captured["tools"]) == 1
    assert "FormulationSupervisorAgent" in captured["system_prompt"]
    assert captured["payload"]["messages"][0]["content"] == "Planifica una formula liquida economica."
    assert captured["tool_result"]["source"] == "deterministic"
    assert plan["orchestrator"] == "deepagents"
    assert plan["steps"][0]["tool"] == "deepagents_supervisor"
    detail = client.get(f"/api/v1/ai/runs/{plan['run_id']}", headers=headers)
    assert detail.json()["tool_calls"][0]["tool_name"] == "RequirementParserAgent"


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
