from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import time
import uuid
from dataclasses import dataclass
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from .local_env import save_local_env_values
from .tenant import TenantContext


ATLASSIAN_AUTHORIZE_URL = "https://auth.atlassian.com/authorize"
ATLASSIAN_TOKEN_URL = "https://auth.atlassian.com/oauth/token"
ATLASSIAN_ACCESSIBLE_RESOURCES_URL = (
    "https://api.atlassian.com/oauth/token/accessible-resources"
)
DEFAULT_JIRA_SITE_URL = "https://example.atlassian.net"
DEFAULT_JIRA_CLOUD_ID = "61c328dd-e711-487e-9cfc-931d7a48d006"
DEFAULT_JIRA_REDIRECT_URI = "http://localhost:3000/callback"
DEFAULT_JIRA_OAUTH_CLIENT_ID = "IKEbZY7kAaSaBxF6VilwuWJxI4w8Y7A4"
JIRA_OAUTH_SCOPES = [
    "read:issue:jira",
    "write:issue:jira",
    "read:issue-meta:jira",
    "read:issue-details:jira",
    "read:issue-field-values:jira",
    "read:issue.transition:jira",
    "read:issue-type:jira",
    "read:issue-status:jira",
    "read:field:jira",
    "write:field:jira",
    "read:field.option:jira",
    "write:field.option:jira",
    "read:project:jira",
    "read:user:jira",
    "read:comment:jira",
    "write:comment:jira",
    "read:attachment:jira",
    "write:attachment:jira",
    "read:label:jira",
    "read:priority:jira",
    "offline_access",
]


class JiraOAuthError(RuntimeError):
    pass


@dataclass(frozen=True)
class JiraOAuthTokenSet:
    access_token: str
    refresh_token: str | None
    expires_at: int
    scope: str | None = None


@dataclass(frozen=True)
class JiraAccessibleResource:
    id: str
    url: str
    name: str | None = None


@dataclass(frozen=True)
class JiraOAuthCallbackResult:
    cloud_id: str
    site_url: str
    expires_at: int
    scope: str | None


def build_jira_oauth_authorization_url(tenant: TenantContext) -> tuple[str, str]:
    state = _build_signed_state(tenant)
    query = urlencode(
        {
            "audience": "api.atlassian.com",
            "client_id": _client_id(),
            "scope": " ".join(JIRA_OAUTH_SCOPES),
            "redirect_uri": _redirect_uri(),
            "state": state,
            "response_type": "code",
            "prompt": "consent",
        }
    )
    return f"{ATLASSIAN_AUTHORIZE_URL}?{query}", state


def complete_jira_oauth_callback(code: str, state: str) -> JiraOAuthCallbackResult:
    _verify_signed_state(state)
    token_set = exchange_jira_authorization_code(code)
    if not token_set.refresh_token:
        raise JiraOAuthError("Jira did not return a refresh token; add offline_access scope.")
    resource = resolve_jira_cloud_resource(token_set.access_token)
    save_jira_oauth_tokens(token_set, resource)
    return JiraOAuthCallbackResult(
        cloud_id=resource.id,
        site_url=resource.url,
        expires_at=token_set.expires_at,
        scope=token_set.scope,
    )


def exchange_jira_authorization_code(code: str) -> JiraOAuthTokenSet:
    payload = {
        "grant_type": "authorization_code",
        "client_id": _client_id(),
        "client_secret": _client_secret(),
        "code": code,
        "redirect_uri": _redirect_uri(),
    }
    response = _json_request(
        ATLASSIAN_TOKEN_URL,
        method="POST",
        payload=payload,
    )
    return _token_set_from_response(response)


def refresh_jira_oauth_access_token(refresh_token: str) -> JiraOAuthTokenSet:
    payload = {
        "grant_type": "refresh_token",
        "client_id": _client_id(),
        "client_secret": _client_secret(),
        "refresh_token": refresh_token,
    }
    response = _json_request(
        ATLASSIAN_TOKEN_URL,
        method="POST",
        payload=payload,
    )
    return _token_set_from_response(response, fallback_refresh_token=refresh_token)


def resolve_jira_cloud_resource(access_token: str) -> JiraAccessibleResource:
    response = _json_request(
        ATLASSIAN_ACCESSIBLE_RESOURCES_URL,
        method="GET",
        bearer_token=access_token,
    )
    if not isinstance(response, list):
        raise JiraOAuthError("Jira accessible resources response was not a list.")
    resources = [
        JiraAccessibleResource(
            id=str(resource.get("id") or ""),
            url=str(resource.get("url") or "").rstrip("/"),
            name=resource.get("name"),
        )
        for resource in response
        if isinstance(resource, dict)
    ]
    cloud_id = _cloud_id()
    site_url = _site_url()
    for resource in resources:
        if resource.id == cloud_id or resource.url == site_url:
            return resource
    if resources:
        return resources[0]
    raise JiraOAuthError("No accessible Jira resources were returned.")


def save_jira_oauth_tokens(
    token_set: JiraOAuthTokenSet,
    resource: JiraAccessibleResource,
) -> None:
    values = {
        "FORMULIA_JIRA_OAUTH_ACCESS_TOKEN": token_set.access_token,
        "FORMULIA_JIRA_OAUTH_EXPIRES_AT": str(token_set.expires_at),
        "FORMULIA_JIRA_CLOUD_ID": resource.id,
        "FORMULIA_JIRA_SITE_URL": resource.url,
    }
    if token_set.refresh_token:
        values["FORMULIA_JIRA_OAUTH_REFRESH_TOKEN"] = token_set.refresh_token
    save_local_env_values(values)


def get_valid_jira_oauth_access_token() -> str:
    access_token = os.getenv("FORMULIA_JIRA_OAUTH_ACCESS_TOKEN", "").strip()
    expires_at = _int_env("FORMULIA_JIRA_OAUTH_EXPIRES_AT")
    if access_token and expires_at > int(time.time()) + 60:
        return access_token

    refresh_token = os.getenv("FORMULIA_JIRA_OAUTH_REFRESH_TOKEN", "").strip()
    if not refresh_token:
        if access_token and expires_at == 0:
            return access_token
        raise JiraOAuthError(
            "FORMULIA_JIRA_OAUTH_REFRESH_TOKEN is required; reauthorize Jira OAuth."
        )

    token_set = refresh_jira_oauth_access_token(refresh_token)
    resource = JiraAccessibleResource(id=_cloud_id(), url=_site_url())
    save_jira_oauth_tokens(token_set, resource)
    return token_set.access_token


def get_jira_cloud_id() -> str:
    return _cloud_id()


def get_jira_site_url() -> str:
    return _site_url()


def _token_set_from_response(
    response: Any,
    fallback_refresh_token: str | None = None,
) -> JiraOAuthTokenSet:
    if not isinstance(response, dict):
        raise JiraOAuthError("Jira token response was not a JSON object.")
    access_token = str(response.get("access_token") or "").strip()
    if not access_token:
        raise JiraOAuthError("Jira token response did not include access_token.")
    expires_in = int(response.get("expires_in") or 3600)
    refresh_token = str(response.get("refresh_token") or fallback_refresh_token or "").strip()
    return JiraOAuthTokenSet(
        access_token=access_token,
        refresh_token=refresh_token or None,
        expires_at=int(time.time()) + expires_in,
        scope=response.get("scope"),
    )


def _json_request(
    url: str,
    *,
    method: str,
    payload: dict[str, Any] | None = None,
    bearer_token: str | None = None,
) -> Any:
    headers = {"Accept": "application/json"}
    body: bytes | None = None
    if payload is not None:
        headers["Content-Type"] = "application/json"
        body = json.dumps(payload).encode("utf-8")
    if bearer_token:
        headers["Authorization"] = f"Bearer {bearer_token}"
    request = Request(url, data=body, method=method, headers=headers)
    try:
        with urlopen(request, timeout=20) as response:
            content = response.read()
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise JiraOAuthError(f"Jira OAuth HTTP {exc.code}: {detail}") from exc
    except URLError as exc:
        raise JiraOAuthError(f"Jira OAuth request failed: {exc.reason}") from exc
    try:
        return json.loads(content.decode("utf-8"))
    except json.JSONDecodeError as exc:
        raise JiraOAuthError("Jira OAuth response was not valid JSON.") from exc


def _build_signed_state(tenant: TenantContext) -> str:
    payload = {
        "tenant_id": str(tenant.tenant_id),
        "user_id": str(tenant.user_id),
        "nonce": uuid.uuid4().hex,
        "exp": int(time.time()) + 900,
    }
    payload_segment = _base64url(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signature = _base64url(
        hmac.new(_state_secret(), payload_segment.encode("ascii"), hashlib.sha256).digest()
    )
    return f"{payload_segment}.{signature}"


def _verify_signed_state(state: str) -> dict[str, Any]:
    if "." not in state:
        raise JiraOAuthError("Invalid OAuth state.")
    payload_segment, signature = state.split(".", 1)
    expected = _base64url(
        hmac.new(_state_secret(), payload_segment.encode("ascii"), hashlib.sha256).digest()
    )
    if not hmac.compare_digest(signature, expected):
        raise JiraOAuthError("Invalid OAuth state signature.")
    try:
        payload = json.loads(_unbase64url(payload_segment).decode("utf-8"))
    except (json.JSONDecodeError, ValueError) as exc:
        raise JiraOAuthError("Invalid OAuth state payload.") from exc
    if int(payload.get("exp") or 0) < int(time.time()):
        raise JiraOAuthError("OAuth state expired.")
    return payload


def _base64url(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode("ascii").rstrip("=")


def _unbase64url(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)


def _client_id() -> str:
    return os.getenv("FORMULIA_JIRA_OAUTH_CLIENT_ID", DEFAULT_JIRA_OAUTH_CLIENT_ID).strip()


def _client_secret() -> str:
    value = os.getenv("FORMULIA_JIRA_OAUTH_CLIENT_SECRET", "").strip()
    if not value:
        raise JiraOAuthError("FORMULIA_JIRA_OAUTH_CLIENT_SECRET is required.")
    return value


def _redirect_uri() -> str:
    return os.getenv("FORMULIA_JIRA_OAUTH_REDIRECT_URI", DEFAULT_JIRA_REDIRECT_URI).strip()


def _cloud_id() -> str:
    return os.getenv("FORMULIA_JIRA_CLOUD_ID", DEFAULT_JIRA_CLOUD_ID).strip()


def _site_url() -> str:
    return os.getenv("FORMULIA_JIRA_SITE_URL", DEFAULT_JIRA_SITE_URL).strip().rstrip("/")


def _state_secret() -> bytes:
    return _client_secret().encode("utf-8")


def _int_env(name: str) -> int:
    try:
        return int(os.getenv(name, "0"))
    except ValueError:
        return 0
