from __future__ import annotations

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
