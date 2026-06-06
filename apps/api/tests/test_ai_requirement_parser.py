import httpx
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import SQLModel, create_engine

from formulia_api.main import create_app


USER_A = "10000000-0000-0000-0000-000000000001"


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


def test_deterministic_requirement_parser_logs_ai_run(monkeypatch) -> None:
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
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
        "/api/v1/ai/requirements/parse",
        headers=headers,
        json={"text": "Liquido barato con contenido activo minimo 12% y precio maximo 2 EUR/kg"},
    )

    assert response.status_code == 200
    parsed = response.json()
    assert parsed["source"] == "deterministic"
    assert parsed["product_type"] == "liquido"
    assert "minimize_price" in parsed["objectives"]
    assert parsed["technical_constraints"][0]["target"] == "active_content"
    assert parsed["economic_constraints"][0]["target"] == "price_total"
    assert parsed["mandatory_raw_materials"] == []
    runs = client.get("/api/v1/ai/runs", headers=headers).json()
    assert runs[0]["id"] == parsed["run_id"]
    assert runs[0]["provider"] == "deterministic"
    assert runs[0]["status"] == "success"


def test_llm_requirement_parser_requires_openai_key(monkeypatch) -> None:
    monkeypatch.setenv("REQUIREMENT_PARSER_PROVIDER", "llm")
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    client = make_client()
    tenant_id = create_tenant(client, USER_A, "tenant-a")
    headers = {"X-User-Id": USER_A, "X-Tenant-Id": tenant_id}

    response = client.post(
        "/api/v1/ai/requirements/parse",
        headers=headers,
        json={"text": "Necesito 2 alternativas de formula economica."},
    )

    assert response.status_code == 503
    runs = client.get("/api/v1/ai/runs", headers=headers).json()
    assert runs[0]["provider"] == "openai"
    assert runs[0]["model"] == "gpt-5-nano"
    assert runs[0]["status"] == "error"


def test_llm_requirement_parser_calls_openai_with_structured_output(monkeypatch) -> None:
    captured_request = {}

    def fake_post(url, headers, json, timeout):
        captured_request["url"] = url
        captured_request["headers"] = headers
        captured_request["json"] = json
        captured_request["timeout"] = timeout
        return httpx.Response(
            200,
            json={
                "output": [
                    {
                        "type": "message",
                        "content": [
                            {
                                "type": "output_text",
                                "text": (
                                    '{"product_type":"liquido","objectives":["minimize_price"],'
                                    '"technical_constraints":[],"economic_constraints":[],'
                                    '"mandatory_raw_materials":[],"excluded_raw_materials":[],'
                                    '"preferences":{"only_active_materials":true,'
                                    '"avoid_incompatibilities":true,"notes":[]},'
                                    '"alternatives":2,"uncertainties":[]}'
                                ),
                            }
                        ],
                    }
                ],
                "usage": {"input_tokens": 100, "output_tokens": 50},
            },
        )

    monkeypatch.setenv("OPENAI_API_KEY", "test-redacted-key")
    monkeypatch.setenv("REQUIREMENT_PARSER_PROVIDER", "llm")
    monkeypatch.setenv("REQUIREMENT_PARSER_MODEL", "gpt-5-nano")
    monkeypatch.setattr("formulia_api.ai_requirement_parser.httpx.post", fake_post)
    client = make_client()
    tenant_id = create_tenant(client, USER_A, "tenant-a")
    headers = {"X-User-Id": USER_A, "X-Tenant-Id": tenant_id}

    response = client.post(
        "/api/v1/ai/requirements/parse",
        headers=headers,
        json={"text": "Dame 2 alternativas liquidas economicas."},
    )

    assert response.status_code == 200
    parsed = response.json()
    assert parsed["source"] == "llm"
    assert parsed["model"] == "gpt-5-nano"
    assert parsed["alternatives"] == 2
    assert captured_request["url"] == "https://api.openai.com/v1/responses"
    assert captured_request["headers"]["Authorization"] == "Bearer test-redacted-key"
    assert captured_request["json"]["text"]["format"]["type"] == "json_schema"
    runs = client.get("/api/v1/ai/runs", headers=headers).json()
    assert runs[0]["provider"] == "openai"
    assert runs[0]["prompt_tokens"] == 100
    assert runs[0]["completion_tokens"] == 50
    assert runs[0]["cost_estimate_usd"] == 0.000025
