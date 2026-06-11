from __future__ import annotations

import json

from formulia_api import jira_client
from formulia_api.jira_client import AtlassianOAuthJiraClient
from formulia_api.models import JiraConnection


class FakeHttpResponse:
    def __init__(self, body: bytes) -> None:
        self.body = body

    def __enter__(self) -> "FakeHttpResponse":
        return self

    def __exit__(self, *args: object) -> None:
        return None

    def read(self) -> bytes:
        return self.body


def test_oauth_jira_client_uses_cloud_api_base_and_bearer_token(monkeypatch) -> None:
    captured = {}

    def fake_urlopen(request, timeout):  # noqa: ANN001
        captured["url"] = request.full_url
        captured["authorization"] = request.get_header("Authorization")
        captured["timeout"] = timeout
        return FakeHttpResponse(b'{"key": "LAB-123"}')

    monkeypatch.setattr(jira_client, "urlopen", fake_urlopen)
    client = AtlassianOAuthJiraClient(
        site_base_url="https://example.atlassian.net",
        cloud_id="cloud-123",
        access_token="oauth-token",
        timeout_seconds=7,
    )

    result = client.create_issue({"fields": {"summary": "Review"}})

    assert captured == {
        "url": "https://api.atlassian.com/ex/jira/cloud-123/rest/api/3/issue",
        "authorization": "Bearer oauth-token",
        "timeout": 7,
    }
    assert result.key == "LAB-123"
    assert result.url == "https://example.atlassian.net/browse/LAB-123"


def test_make_jira_client_uses_refreshable_oauth_access_token(monkeypatch) -> None:
    monkeypatch.setattr(jira_client, "get_valid_jira_oauth_access_token", lambda: "fresh-token")
    monkeypatch.setattr(jira_client, "get_jira_cloud_id", lambda: "cloud-123")

    client = jira_client.make_jira_client(
        JiraConnection(
            tenant_id="10000000-0000-0000-0000-000000000001",
            base_url="https://example.atlassian.net",
            auth_type="oauth",
            default_project_key="LAB",
            default_issue_type="Revision de formula",
        )
    )

    assert isinstance(client, AtlassianOAuthJiraClient)
    assert client.base_url == "https://api.atlassian.com/ex/jira/cloud-123"
    assert client.api_token == "fresh-token"


def test_make_jira_client_uses_persisted_api_token(monkeypatch) -> None:
    monkeypatch.delenv("FORMULIA_JIRA_API_TOKEN", raising=False)

    client = jira_client.make_jira_client(
        JiraConnection(
            tenant_id="10000000-0000-0000-0000-000000000001",
            base_url="https://example.atlassian.net",
            auth_type="api_token",
            auth_email="lab@example.com",
            credential_json={"api_token": "persisted-token"},
            default_project_key="LAB",
            default_issue_type="Review",
        )
    )

    assert client.api_token == "persisted-token"


def test_check_jira_connection_validates_user_project_and_issue_type(monkeypatch) -> None:
    requests = []

    def fake_urlopen(request, timeout):  # noqa: ANN001
        requests.append((request.full_url, request.get_header("Authorization"), timeout))
        if request.full_url.endswith("/rest/api/3/myself"):
            return FakeHttpResponse(
                json.dumps({"displayName": "Lab User"}).encode("utf-8")
            )
        if request.full_url.endswith("/rest/api/3/project/LAB"):
            return FakeHttpResponse(
                json.dumps(
                    {
                        "name": "Formula Lab",
                        "issueTypes": [{"name": "Review"}, {"name": "Prototype"}],
                    }
                ).encode("utf-8")
            )
        raise AssertionError(f"Unexpected URL: {request.full_url}")

    monkeypatch.setattr(jira_client, "urlopen", fake_urlopen)

    result = jira_client.check_jira_connection(
        JiraConnection(
            tenant_id="10000000-0000-0000-0000-000000000001",
            base_url="https://example.atlassian.net",
            auth_type="api_token",
            auth_email="lab@example.com",
            credential_json={"api_token": "persisted-token"},
            default_project_key="LAB",
            default_issue_type="Review",
        )
    )

    assert result.status == "ready_for_client"
    assert "Lab User" in result.message
    assert "Formula Lab" in result.message
    assert len(requests) == 2


def test_check_jira_connection_reports_missing_issue_type(monkeypatch) -> None:
    def fake_urlopen(request, timeout):  # noqa: ANN001
        if request.full_url.endswith("/rest/api/3/myself"):
            return FakeHttpResponse(b'{"displayName": "Lab User"}')
        if request.full_url.endswith("/rest/api/3/project/LAB"):
            return FakeHttpResponse(
                json.dumps({"name": "Formula Lab", "issueTypes": [{"name": "Prototype"}]}).encode(
                    "utf-8"
                )
            )
        raise AssertionError(f"Unexpected URL: {request.full_url}")

    monkeypatch.setattr(jira_client, "urlopen", fake_urlopen)

    result = jira_client.check_jira_connection(
        JiraConnection(
            tenant_id="10000000-0000-0000-0000-000000000001",
            base_url="https://example.atlassian.net",
            auth_type="api_token",
            auth_email="lab@example.com",
            credential_json={"api_token": "persisted-token"},
            default_project_key="LAB",
            default_issue_type="Review",
        )
    )

    assert result.status == "configuration_error"
    assert "issue type 'Review' is not available" in result.message


def test_build_jira_issue_payload_maps_configured_review_fields() -> None:
    payload = jira_client.build_jira_issue_payload(
        {
            "formula": {
                "id": "abc12345-0000-0000-0000-000000000000",
                "name": "FLOWER MEJORADO",
                "version": 2,
                "status": "draft",
                "jira_project_id": "FLOWER",
                "jira_issue_type": "Calidad",
                "jira_product_type": "Nuevo",
            },
            "jira": {"issue_summary": "CALIDAD - FLOWER MEJORADO", "issue_type": "Calidad"},
            "items": [],
        },
        JiraConnection(
            tenant_id="10000000-0000-0000-0000-000000000001",
            base_url="https://example.atlassian.net",
            auth_type="api_token",
            default_project_key="LAB",
            default_issue_type="Calidad",
            field_mapping_json={
                "jira_project_id": "customfield_20010",
                "jira_product_type_option": "customfield_20011",
            },
        ),
    )

    fields = payload["fields"]
    assert fields["customfield_20010"] == "FLOWER"
    assert fields["customfield_20011"] == {"value": "Nuevo"}


def test_build_jira_issue_payload_uses_formula_jira_fields() -> None:
    payload = jira_client.build_jira_issue_payload(
        {
            "formula": {
                "id": "abc12345-0000-0000-0000-000000000000",
                "name": "FLOWER MEJORADO",
                "version": 2,
                "status": "draft",
                "jira_project_id": "FLOWER-CHINA",
                "jira_issue_type": "Prototipo",
                "jira_product_type": "Mod A",
            },
            "jira": {"issue_summary": "PROTOTIPO - FLOWER MEJORADO", "issue_type": "Prototipo"},
            "items": [],
        },
        JiraConnection(
            tenant_id="10000000-0000-0000-0000-000000000001",
            base_url="https://example.atlassian.net",
            auth_type="api_token",
            default_project_key="LAB",
            default_issue_type="Prototipo",
            field_mapping_json={
                "jira_project_id": "customfield_20010",
                "jira_product_type_option": "customfield_20011",
            },
        ),
    )

    fields = payload["fields"]
    assert fields["customfield_20010"] == "FLOWER-CHINA"
    assert fields["customfield_20011"] == {"value": "Mod A"}


def test_build_jira_issue_payload_omits_unmapped_review_fields() -> None:
    payload = jira_client.build_jira_issue_payload(
        {
            "formula": {
                "id": "abc12345-0000-0000-0000-000000000000",
                "name": "FLOWER MEJORADO",
                "version": 2,
                "status": "draft",
                "jira_project_id": "FLOWER",
                "jira_issue_type": "PoC",
                "jira_product_type": "Nuevo",
            },
            "jira": {"issue_summary": "POC - FLOWER MEJORADO", "issue_type": "PoC"},
            "items": [],
        },
        JiraConnection(
            tenant_id="10000000-0000-0000-0000-000000000001",
            base_url="https://example.atlassian.net",
            auth_type="api_token",
            default_project_key="LAB",
            default_issue_type="PoC",
        ),
    )

    fields = payload["fields"]
    assert "reporter" not in fields
    assert "customfield_20010" not in fields
    assert "customfield_20011" not in fields
