from __future__ import annotations

import base64
import json
import os
import uuid
from dataclasses import dataclass
from typing import Any, Protocol
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin
from urllib.request import Request, urlopen

from .jira_excel import JiraReviewExcel
from .jira_oauth import JiraOAuthError, get_jira_cloud_id, get_valid_jira_oauth_access_token
from .models import JiraConnection

ATLANTICA_JIRA_REPORTER_ACCOUNT_ID = "712020:d8d35c01-546b-498f-aa7f-dbe2c966820c"
JIRA_PROJECT_ID_FIELD_ID = "customfield_10658"
JIRA_PRODUCT_TYPE_FIELD_ID = "customfield_10856"
DEFAULT_JIRA_PRODUCT_TYPE = "Nuevo"
JIRA_FORMULA_REVIEW_ISSUE_TYPES = {"Calidad", "Prototipo"}
JIRA_API_TOKEN_CREDENTIAL_KEY = "api_token"


class JiraClientError(RuntimeError):
    pass


class JiraConfigurationError(JiraClientError):
    pass


@dataclass(frozen=True)
class JiraIssueResult:
    key: str
    url: str
    status: str = "created"


@dataclass(frozen=True)
class JiraAttachmentResult:
    attachment_id: str | None
    file_name: str
    status: str = "attached"


@dataclass(frozen=True)
class JiraConnectionCheckResult:
    status: str
    message: str


class JiraClient(Protocol):
    def create_issue(self, payload: dict[str, Any]) -> JiraIssueResult:
        ...

    def get_current_user(self) -> dict[str, Any]:
        ...

    def get_project(self, project_key: str) -> dict[str, Any]:
        ...

    def add_attachment(
        self,
        issue_key: str,
        artifact: JiraReviewExcel,
    ) -> JiraAttachmentResult:
        ...


class AtlassianJiraClient:
    def __init__(
        self,
        *,
        base_url: str,
        auth_email: str,
        api_token: str,
        browse_base_url: str | None = None,
        timeout_seconds: int = 20,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.browse_base_url = (browse_base_url or base_url).rstrip("/")
        self.auth_email = auth_email
        self.api_token = api_token
        self.timeout_seconds = timeout_seconds

    def create_issue(self, payload: dict[str, Any]) -> JiraIssueResult:
        response = self._json_request(
            "/rest/api/3/issue",
            method="POST",
            payload=payload,
        )
        key = str(response.get("key") or "").strip()
        if not key:
            raise JiraClientError("Jira did not return an issue key.")
        return JiraIssueResult(
            key=key,
            url=f"{self.browse_base_url}/browse/{key}",
            status="created",
        )

    def get_current_user(self) -> dict[str, Any]:
        return self._json_get("/rest/api/3/myself")

    def get_project(self, project_key: str) -> dict[str, Any]:
        return self._json_get(f"/rest/api/3/project/{project_key}")

    def add_attachment(
        self,
        issue_key: str,
        artifact: JiraReviewExcel,
    ) -> JiraAttachmentResult:
        boundary = f"formulia-{uuid.uuid4().hex}"
        body = _multipart_file_body(boundary, artifact)
        response = self._request(
            f"/rest/api/3/issue/{issue_key}/attachments",
            method="POST",
            body=body,
            headers={
                "Accept": "application/json",
                "Content-Type": f"multipart/form-data; boundary={boundary}",
                "X-Atlassian-Token": "no-check",
            },
        )
        attachments = _json_response(response)
        first_attachment = attachments[0] if isinstance(attachments, list) and attachments else {}
        return JiraAttachmentResult(
            attachment_id=str(first_attachment.get("id")) if first_attachment.get("id") else None,
            file_name=artifact.file_name,
            status="attached",
        )

    def _json_request(
        self,
        path: str,
        *,
        method: str,
        payload: dict[str, Any],
    ) -> dict[str, Any]:
        response = self._request(
            path,
            method=method,
            body=json.dumps(payload).encode("utf-8"),
            headers={
                "Accept": "application/json",
                "Content-Type": "application/json",
            },
        )
        parsed = _json_response(response)
        if not isinstance(parsed, dict):
            raise JiraClientError("Jira returned an unexpected JSON response.")
        return parsed

    def _json_get(self, path: str) -> dict[str, Any]:
        response = self._request(
            path,
            method="GET",
            body=None,
            headers={"Accept": "application/json"},
        )
        parsed = _json_response(response)
        if not isinstance(parsed, dict):
            raise JiraClientError("Jira returned an unexpected JSON response.")
        return parsed

    def _request(
        self,
        path: str,
        *,
        method: str,
        body: bytes | None,
        headers: dict[str, str],
    ) -> bytes:
        request = Request(
            urljoin(f"{self.base_url}/", path.lstrip("/")),
            data=body,
            method=method,
            headers={**headers, "Authorization": self._authorization_header()},
        )
        try:
            with urlopen(request, timeout=self.timeout_seconds) as response:
                return response.read()
        except HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            raise JiraClientError(f"Jira HTTP {exc.code}: {detail}") from exc
        except URLError as exc:
            raise JiraClientError(f"Jira request failed: {exc.reason}") from exc

    def _authorization_header(self) -> str:
        raw = f"{self.auth_email}:{self.api_token}".encode("utf-8")
        return f"Basic {base64.b64encode(raw).decode('ascii')}"


class AtlassianOAuthJiraClient(AtlassianJiraClient):
    def __init__(
        self,
        *,
        site_base_url: str,
        cloud_id: str,
        access_token: str,
        timeout_seconds: int = 20,
    ) -> None:
        super().__init__(
            base_url=f"https://api.atlassian.com/ex/jira/{cloud_id}",
            auth_email="",
            api_token=access_token,
            browse_base_url=site_base_url,
            timeout_seconds=timeout_seconds,
        )

    def _authorization_header(self) -> str:
        return f"Bearer {self.api_token}"


def make_jira_client(connection: JiraConnection) -> JiraClient:
    if connection.auth_type == "oauth":
        try:
            access_token = get_valid_jira_oauth_access_token()
        except JiraOAuthError as exc:
            raise JiraConfigurationError(str(exc)) from exc
        cloud_id = get_jira_cloud_id()
        if not cloud_id:
            raise JiraConfigurationError(
                "FORMULIA_JIRA_CLOUD_ID is required to send reviews to Jira."
            )
        return AtlassianOAuthJiraClient(
            site_base_url=connection.base_url,
            cloud_id=cloud_id,
            access_token=access_token,
        )

    if connection.auth_type != "api_token":
        raise JiraConfigurationError("Only Jira API token authentication is supported.")
    if not connection.auth_email:
        raise JiraConfigurationError("Jira auth email is required.")
    api_token = (
        connection.credential_json.get(JIRA_API_TOKEN_CREDENTIAL_KEY)
        or os.getenv("FORMULIA_JIRA_API_TOKEN", "")
    ).strip()
    if not api_token:
        raise JiraConfigurationError("Jira API token is required to send reviews to Jira.")
    return AtlassianJiraClient(
        base_url=connection.base_url,
        auth_email=connection.auth_email,
        api_token=api_token,
    )


def check_jira_connection(connection: JiraConnection) -> JiraConnectionCheckResult:
    client = make_jira_client(connection)
    current_user = client.get_current_user()
    project = client.get_project(connection.default_project_key)
    issue_types = [
        str(issue_type.get("name") or "")
        for issue_type in _sequence(project.get("issueTypes"))
        if isinstance(issue_type, dict)
    ]
    if connection.default_issue_type not in issue_types:
        return JiraConnectionCheckResult(
            status="configuration_error",
            message=(
                f"Jira project {connection.default_project_key} is reachable, but issue type "
                f"{connection.default_issue_type!r} is not available."
            ),
        )
    display_name = current_user.get("displayName") or current_user.get("emailAddress") or "Jira user"
    project_name = project.get("name") or connection.default_project_key
    return JiraConnectionCheckResult(
        status="ready_for_client",
        message=f"Connected to Jira as {display_name}; project {connection.default_project_key} ({project_name}) is ready.",
    )


def build_jira_issue_payload(snapshot: dict[str, Any], connection: JiraConnection) -> dict[str, Any]:
    jira = _mapping(snapshot.get("jira"))
    formula = _mapping(snapshot.get("formula"))
    summary = str(jira.get("issue_summary") or formula.get("name") or "Formula review")
    issue_type = str(jira.get("issue_type") or connection.default_issue_type)
    fields: dict[str, Any] = {
        "project": {"key": connection.default_project_key},
        "issuetype": {"name": issue_type},
        "summary": summary,
        "description": _adf_document(snapshot),
        "labels": ["formulia", "formula-review"],
    }
    fields["reporter"] = {"accountId": ATLANTICA_JIRA_REPORTER_ACCOUNT_ID}
    if connection.default_assignee:
        fields["assignee"] = {"accountId": connection.default_assignee}
    fields.update(_mapped_custom_fields(snapshot, connection.field_mapping_json))
    fields.update(_required_formula_review_fields(snapshot, issue_type))
    return {"fields": fields}


def _mapped_custom_fields(
    snapshot: dict[str, Any],
    field_mapping: dict[str, str],
) -> dict[str, Any]:
    values = {
        "formula_id": _mapping(snapshot.get("formula")).get("id"),
        "formula_short_id": _formula_short_id(snapshot),
        "formula_name": _mapping(snapshot.get("formula")).get("name"),
        "formula_version": _mapping(snapshot.get("formula")).get("version"),
        "formula_status": _mapping(snapshot.get("formula")).get("status"),
        "estimated_cost": _formula_cost(snapshot),
        "notes": snapshot.get("notes"),
    }
    return {
        jira_field: values[formulia_field]
        for formulia_field, jira_field in field_mapping.items()
        if formulia_field in values and values[formulia_field] is not None
    }


def _required_formula_review_fields(
    snapshot: dict[str, Any],
    issue_type: str,
) -> dict[str, Any]:
    if issue_type not in JIRA_FORMULA_REVIEW_ISSUE_TYPES:
        return {}

    formula = _mapping(snapshot.get("formula"))
    project_id = str(formula.get("jira_project_id") or "").strip()
    product_type = str(formula.get("jira_product_type") or DEFAULT_JIRA_PRODUCT_TYPE).strip()
    return {
        JIRA_PROJECT_ID_FIELD_ID: project_id or _formula_short_id(snapshot),
        JIRA_PRODUCT_TYPE_FIELD_ID: {"value": product_type},
    }


def _adf_document(snapshot: dict[str, Any]) -> dict[str, Any]:
    formula = _mapping(snapshot.get("formula"))
    jira = _mapping(snapshot.get("jira"))
    calculation = _mapping(snapshot.get("latest_calculation"))
    items = _sequence(snapshot.get("items"))
    parameter_lines = [
        f"{parameter.get('code')}: {parameter.get('value')} {parameter.get('unit') or ''}".strip()
        for parameter in _sequence(calculation.get("parameters"))
        if isinstance(parameter, dict)
    ]
    warning_lines = [
        f"{warning.get('code')}: {warning.get('message')}"
        for warning in _sequence(calculation.get("warnings"))
        if isinstance(warning, dict)
    ]
    paragraphs = [
        "Formula review prepared from FormulIA Cloud.",
        f"Formula: {formula.get('name') or '-'}",
        f"Version: {formula.get('version') or '-'}",
        f"Status: {formula.get('status') or '-'}",
        f"Objective: {formula.get('objective') or '-'}",
        f"Estimated cost: {_formula_cost(snapshot) or '-'} {calculation.get('currency') or formula.get('currency') or ''}".strip(),
        f"Jira project: {jira.get('project_key') or '-'}",
        f"Composition lines: {len(items)}",
    ]
    if parameter_lines:
        paragraphs.append(f"Parameters: {'; '.join(parameter_lines[:8])}")
    if warning_lines:
        paragraphs.append(f"Warnings: {'; '.join(warning_lines[:8])}")
    if snapshot.get("notes"):
        paragraphs.append(f"Notes: {snapshot['notes']}")
    paragraphs.append("The attached Excel is the technical snapshot submitted for review.")
    return {
        "type": "doc",
        "version": 1,
        "content": [_adf_paragraph(text) for text in paragraphs],
    }


def _adf_paragraph(text: str) -> dict[str, Any]:
    return {
        "type": "paragraph",
        "content": [{"type": "text", "text": text}],
    }


def _formula_cost(snapshot: dict[str, Any]) -> Any:
    calculation = _mapping(snapshot.get("latest_calculation"))
    formula = _mapping(snapshot.get("formula"))
    return calculation.get("price_total") or formula.get("total_price")


def _formula_short_id(snapshot: dict[str, Any]) -> str:
    formula_id = str(_mapping(snapshot.get("formula")).get("id") or "")
    return formula_id[:8] if formula_id else "unknown"


def _multipart_file_body(boundary: str, artifact: JiraReviewExcel) -> bytes:
    head = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="{artifact.file_name}"\r\n'
        f"Content-Type: {artifact.content_type}\r\n\r\n"
    ).encode("utf-8")
    tail = f"\r\n--{boundary}--\r\n".encode("utf-8")
    return head + artifact.content + tail


def _json_response(body: bytes) -> Any:
    if not body:
        return {}
    try:
        return json.loads(body.decode("utf-8"))
    except json.JSONDecodeError as exc:
        raise JiraClientError("Jira returned invalid JSON.") from exc


def _mapping(value: Any) -> dict[str, Any]:
    return value if isinstance(value, dict) else {}


def _sequence(value: Any) -> list[Any]:
    return value if isinstance(value, list) else []
