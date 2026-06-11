from __future__ import annotations

import json
import os
import time
import uuid
from urllib.parse import parse_qs, urlparse

from formulia_api import jira_oauth
from formulia_api.tenant import TenantContext


class FakeHttpResponse:
    def __init__(self, body: object) -> None:
        self.body = json.dumps(body).encode("utf-8")

    def __enter__(self) -> "FakeHttpResponse":
        return self

    def __exit__(self, *args: object) -> None:
        return None

    def read(self) -> bytes:
        return self.body


def configure_oauth_env(monkeypatch) -> None:
    monkeypatch.setenv("FORMULIA_JIRA_OAUTH_CLIENT_ID", "client-id")
    monkeypatch.setenv("FORMULIA_JIRA_OAUTH_CLIENT_SECRET", "client-secret")
    monkeypatch.setenv("FORMULIA_JIRA_OAUTH_REDIRECT_URI", "http://localhost:3000/callback")
    monkeypatch.setenv("FORMULIA_JIRA_CLOUD_ID", "cloud-123")
    monkeypatch.setenv("FORMULIA_JIRA_SITE_URL", "https://example.atlassian.net")


def tenant_context() -> TenantContext:
    return TenantContext(
        tenant_id=uuid.UUID("10000000-0000-0000-0000-000000000001"),
        user_id=uuid.UUID("20000000-0000-0000-0000-000000000001"),
        role="owner",
    )


def test_build_jira_oauth_authorization_url_contains_configured_scopes(monkeypatch) -> None:
    configure_oauth_env(monkeypatch)

    authorization_url, state = jira_oauth.build_jira_oauth_authorization_url(tenant_context())
    query = parse_qs(urlparse(authorization_url).query)
    scopes = set(query["scope"][0].split())

    assert authorization_url.startswith("https://auth.atlassian.com/authorize?")
    assert query["audience"] == ["api.atlassian.com"]
    assert query["client_id"] == ["client-id"]
    assert query["redirect_uri"] == ["http://localhost:3000/callback"]
    assert query["response_type"] == ["code"]
    assert query["prompt"] == ["consent"]
    assert query["state"] == [state]
    assert {"read:issue:jira", "write:issue:jira", "offline_access"}.issubset(scopes)


def test_complete_jira_oauth_callback_exchanges_code_and_saves_tokens(monkeypatch) -> None:
    configure_oauth_env(monkeypatch)
    saved_values: dict[str, str] = {}
    requests: list[dict[str, object]] = []

    def fake_urlopen(request, timeout):  # noqa: ANN001
        requests.append(
            {
                "url": request.full_url,
                "method": request.get_method(),
                "authorization": request.get_header("Authorization"),
                "payload": json.loads(request.data.decode("utf-8")) if request.data else None,
                "timeout": timeout,
            }
        )
        if request.full_url == jira_oauth.ATLASSIAN_TOKEN_URL:
            return FakeHttpResponse(
                {
                    "access_token": "access-token",
                    "refresh_token": "refresh-token",
                    "expires_in": 3600,
                    "scope": "read:issue:jira write:issue:jira offline_access",
                }
            )
        return FakeHttpResponse(
            [
                {
                    "id": "cloud-123",
                    "url": "https://example.atlassian.net",
                    "name": "Example",
                }
            ]
        )

    def fake_save(values: dict[str, str]) -> None:
        saved_values.update(values)
        os.environ.update(values)

    monkeypatch.setattr(jira_oauth, "urlopen", fake_urlopen)
    monkeypatch.setattr(jira_oauth, "save_local_env_values", fake_save)
    _, state = jira_oauth.build_jira_oauth_authorization_url(tenant_context())

    result = jira_oauth.complete_jira_oauth_callback("authorization-code", state)

    assert result.cloud_id == "cloud-123"
    assert result.site_url == "https://example.atlassian.net"
    assert result.scope == "read:issue:jira write:issue:jira offline_access"
    assert saved_values["FORMULIA_JIRA_OAUTH_ACCESS_TOKEN"] == "access-token"
    assert saved_values["FORMULIA_JIRA_OAUTH_REFRESH_TOKEN"] == "refresh-token"
    assert saved_values["FORMULIA_JIRA_CLOUD_ID"] == "cloud-123"
    assert int(saved_values["FORMULIA_JIRA_OAUTH_EXPIRES_AT"]) > int(time.time())
    assert requests[0]["payload"] == {
        "grant_type": "authorization_code",
        "client_id": "client-id",
        "client_secret": "client-secret",
        "code": "authorization-code",
        "redirect_uri": "http://localhost:3000/callback",
    }
    assert requests[1]["authorization"] == "Bearer access-token"


def test_get_valid_jira_oauth_access_token_refreshes_expired_token(monkeypatch) -> None:
    configure_oauth_env(monkeypatch)
    monkeypatch.setenv("FORMULIA_JIRA_OAUTH_ACCESS_TOKEN", "expired-access")
    monkeypatch.setenv("FORMULIA_JIRA_OAUTH_REFRESH_TOKEN", "old-refresh")
    monkeypatch.setenv("FORMULIA_JIRA_OAUTH_EXPIRES_AT", str(int(time.time()) - 10))
    saved_values: dict[str, str] = {}
    captured_payload: dict[str, object] = {}

    def fake_urlopen(request, timeout):  # noqa: ANN001, ARG001
        captured_payload.update(json.loads(request.data.decode("utf-8")))
        return FakeHttpResponse(
            {
                "access_token": "fresh-access",
                "refresh_token": "rotated-refresh",
                "expires_in": 3600,
            }
        )

    def fake_save(values: dict[str, str]) -> None:
        saved_values.update(values)
        os.environ.update(values)

    monkeypatch.setattr(jira_oauth, "urlopen", fake_urlopen)
    monkeypatch.setattr(jira_oauth, "save_local_env_values", fake_save)

    access_token = jira_oauth.get_valid_jira_oauth_access_token()

    assert access_token == "fresh-access"
    assert captured_payload["grant_type"] == "refresh_token"
    assert captured_payload["refresh_token"] == "old-refresh"
    assert saved_values["FORMULIA_JIRA_OAUTH_ACCESS_TOKEN"] == "fresh-access"
    assert saved_values["FORMULIA_JIRA_OAUTH_REFRESH_TOKEN"] == "rotated-refresh"


def test_get_valid_jira_oauth_access_token_requires_refresh_for_expired_token(
    monkeypatch,
) -> None:
    configure_oauth_env(monkeypatch)
    monkeypatch.setenv("FORMULIA_JIRA_OAUTH_ACCESS_TOKEN", "expired-access")
    monkeypatch.delenv("FORMULIA_JIRA_OAUTH_REFRESH_TOKEN", raising=False)
    monkeypatch.setenv("FORMULIA_JIRA_OAUTH_EXPIRES_AT", str(int(time.time()) - 10))

    try:
        jira_oauth.get_valid_jira_oauth_access_token()
    except jira_oauth.JiraOAuthError as exc:
        assert "FORMULIA_JIRA_OAUTH_REFRESH_TOKEN is required" in str(exc)
    else:
        raise AssertionError("Expected expired Jira OAuth token without refresh token to fail.")
