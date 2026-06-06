from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Any

from sqlmodel import Session

from .models import AiRun, utc_now
from .tenant import TenantContext


SENSITIVE_AI_KEYS = ("api_key", "authorization", "password", "secret", "token")


def start_ai_run(
    session: Session,
    tenant: TenantContext,
    *,
    run_type: str,
    provider: str,
    model: str | None,
    input_json: dict[str, Any],
) -> AiRun:
    run = AiRun(
        tenant_id=tenant.tenant_id,
        user_id=tenant.user_id,
        run_type=run_type,
        provider=provider,
        model=model,
        status="running",
        input_json=redact_ai_payload(input_json),
    )
    session.add(run)
    session.commit()
    session.refresh(run)
    return run


def finish_ai_run(
    session: Session,
    run: AiRun,
    *,
    status: str,
    output_json: dict[str, Any] | None = None,
    error: str | None = None,
    prompt_tokens: int | float | None = None,
    completion_tokens: int | float | None = None,
    cost_estimate_usd: int | float | None = None,
) -> None:
    run.status = status
    run.output_json = redact_ai_payload(output_json) if output_json is not None else None
    run.error = error
    run.prompt_tokens = int(prompt_tokens) if isinstance(prompt_tokens, int) else None
    run.completion_tokens = int(completion_tokens) if isinstance(completion_tokens, int) else None
    run.cost_estimate_usd = (
        float(cost_estimate_usd) if isinstance(cost_estimate_usd, (int, float)) else None
    )
    run.completed_at = utc_now()
    session.add(run)
    session.commit()


def redact_ai_payload(value: Any) -> Any:
    if isinstance(value, dict):
        return {
            key: "[redacted]" if _is_sensitive_ai_key(key) else redact_ai_payload(item)
            for key, item in value.items()
        }
    if isinstance(value, list):
        return [redact_ai_payload(item) for item in value]
    if isinstance(value, uuid.UUID):
        return str(value)
    if isinstance(value, (date, datetime)):
        return value.isoformat()
    return value


def _is_sensitive_ai_key(key: str) -> bool:
    lowered = key.lower()
    return any(token in lowered for token in SENSITIVE_AI_KEYS)
