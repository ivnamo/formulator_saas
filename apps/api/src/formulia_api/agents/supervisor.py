from __future__ import annotations

import os
from typing import Any

from sqlmodel import Session

from formulia_api.ai_audit import finish_ai_tool_call, start_ai_tool_call
from formulia_api.ai_requirement_parser import (
    MissingOpenAIKeyError,
    OpenAIRequirementParserError,
    parse_requirements_deterministic,
    parse_requirements_with_openai,
    requirement_parser_model,
    requirement_parser_provider,
)
from formulia_api.models import AiRun

from .deepagents_adapter import (
    DeepAgentsUnavailableError,
    build_deepagents_supervisor,
    extract_final_message_content,
)


DEFAULT_AGENT_MODEL = "gpt-5-nano"
SUPPORTED_ORCHESTRATORS = {"deterministic", "deepagents"}

SUPERVISOR_SYSTEM_PROMPT = """Eres FormulationSupervisorAgent de FormulIA Cloud.
No generes formulas finales ni porcentajes.
Usa tools deterministas para extraer requisitos y decide el siguiente plan tecnico.
Toda propuesta futura debe pasar por calculo, compatibilidad y revision humana cuando falte evidencia.
Devuelve un plan breve, con pasos accionables y riesgos.
"""


class AgentOrchestrationError(RuntimeError):
    pass


def agent_orchestrator_provider() -> str:
    return os.getenv("AGENT_ORCHESTRATOR_PROVIDER", "deterministic").strip().lower()


def agent_orchestrator_model() -> str:
    return os.getenv("AGENT_ORCHESTRATOR_MODEL", DEFAULT_AGENT_MODEL).strip()


def plan_formulation_request(
    *,
    session: Session,
    run: AiRun,
    text: str,
    active_parameters: list[dict[str, str]],
) -> dict[str, Any]:
    provider = agent_orchestrator_provider()
    if provider not in SUPPORTED_ORCHESTRATORS:
        raise AgentOrchestrationError(f"Unsupported agent orchestrator provider: {provider}")
    if provider == "deepagents":
        return _plan_with_deepagents(
            session=session,
            run=run,
            text=text,
            active_parameters=active_parameters,
        )
    return _plan_deterministic(
        session=session,
        run=run,
        text=text,
        active_parameters=active_parameters,
    )


def _plan_deterministic(
    *,
    session: Session,
    run: AiRun,
    text: str,
    active_parameters: list[dict[str, str]],
) -> dict[str, Any]:
    parsed = _call_requirement_parser_tool(
        session=session,
        run=run,
        text=text,
        active_parameters=active_parameters,
    )
    steps = _next_steps_from_requirements(parsed)
    return {
        "orchestrator": "deterministic",
        "model": None,
        "parsed_requirements": parsed,
        "steps": steps,
        "human_review_required": True,
        "notes": [
            "Supervisor is planning only; formula generation remains gated by deterministic tools.",
        ],
    }


def _plan_with_deepagents(
    *,
    session: Session,
    run: AiRun,
    text: str,
    active_parameters: list[dict[str, str]],
) -> dict[str, Any]:
    model = agent_orchestrator_model()

    def parse_requirements(requirement_text: str) -> dict[str, Any]:
        """Parse a formulation request into structured requirements."""
        return _call_requirement_parser_tool(
            session=session,
            run=run,
            text=requirement_text,
            active_parameters=active_parameters,
        )

    agent = build_deepagents_supervisor(
        model=model,
        tools=[parse_requirements],
        system_prompt=SUPERVISOR_SYSTEM_PROMPT,
    )
    try:
        result = agent.invoke({"messages": [{"role": "user", "content": text}]})
    except Exception as exc:
        raise AgentOrchestrationError("DeepAgents supervisor failed.") from exc
    message = extract_final_message_content(result)
    return {
        "orchestrator": "deepagents",
        "model": model,
        "parsed_requirements": None,
        "steps": [
            {
                "tool": "deepagents_supervisor",
                "status": "planned",
                "summary": message or "DeepAgents supervisor completed without a text response.",
            }
        ],
        "human_review_required": True,
        "notes": [
            "DeepAgents supervisor is active; downstream formula tools are still gated.",
        ],
    }


def _call_requirement_parser_tool(
    *,
    session: Session,
    run: AiRun,
    text: str,
    active_parameters: list[dict[str, str]],
) -> dict[str, Any]:
    provider = requirement_parser_provider()
    tool_call = start_ai_tool_call(
        session,
        run,
        tool_name="RequirementParserAgent",
        input_json={
            "text": text,
            "active_parameters": active_parameters,
            "provider": provider,
        },
    )
    try:
        if provider in {"llm", "openai"}:
            parsed, _usage = parse_requirements_with_openai(
                text,
                active_parameters,
                requirement_parser_model(),
            )
        elif provider == "deterministic":
            parsed = parse_requirements_deterministic(text, active_parameters)
        else:
            raise OpenAIRequirementParserError(
                f"Unsupported requirement parser provider: {provider}"
            )
    except (MissingOpenAIKeyError, OpenAIRequirementParserError) as exc:
        finish_ai_tool_call(session, tool_call, status="error", error=str(exc))
        raise
    finish_ai_tool_call(session, tool_call, status="success", output_json=parsed)
    return parsed


def _next_steps_from_requirements(parsed: dict[str, Any]) -> list[dict[str, str]]:
    steps = [
        {
            "tool": "RawMaterialResearchAgent",
            "status": "pending",
            "summary": "Find tenant raw materials that satisfy mandatory and excluded material constraints.",
        },
        {
            "tool": "FormulaCalculationAgent",
            "status": "blocked",
            "summary": "Wait for candidate formula lines before calculating cost and technical parameters.",
        },
        {
            "tool": "HumanReviewAgent",
            "status": "required",
            "summary": "Review uncertainties before any formula proposal leaves draft state.",
        },
    ]
    if parsed.get("economic_constraints"):
        steps.insert(
            1,
            {
                "tool": "OptimizationAgent",
                "status": "pending",
                "summary": "Translate economic constraints into optimizer bounds once candidate materials exist.",
            },
        )
    return steps
