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
from .tools import build_optimization_plan, research_raw_material_candidates


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
    candidate_research = _call_raw_material_research_tool(
        session=session,
        run=run,
        parsed_requirements=parsed,
    )
    optimization_plan = _call_optimization_tool(
        session=session,
        run=run,
        parsed_requirements=parsed,
        candidate_research=candidate_research,
    )
    steps = _next_steps_from_requirements(
        parsed,
        candidate_research=candidate_research,
        optimization_plan=optimization_plan,
    )
    return {
        "orchestrator": "deterministic",
        "model": None,
        "parsed_requirements": parsed,
        "candidate_research": candidate_research,
        "optimization_plan": optimization_plan,
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
    parsed_cache: dict[str, Any] | None = None
    research_cache: dict[str, Any] | None = None
    optimization_cache: dict[str, Any] | None = None

    def parse_requirements(requirement_text: str) -> dict[str, Any]:
        """Parse a formulation request into structured requirements."""
        nonlocal parsed_cache
        if parsed_cache is not None:
            return parsed_cache
        parsed_cache = _call_requirement_parser_tool(
            session=session,
            run=run,
            text=requirement_text,
            active_parameters=active_parameters,
        )
        return parsed_cache

    def find_raw_material_candidates(requirement_text: str) -> dict[str, Any]:
        """Find tenant raw material candidates for parsed formulation requirements."""
        nonlocal research_cache
        parsed = parse_requirements(requirement_text)
        if research_cache is not None:
            return research_cache
        research_cache = _call_raw_material_research_tool(
            session=session,
            run=run,
            parsed_requirements=parsed,
        )
        return research_cache

    def plan_optimization(requirement_text: str) -> dict[str, Any]:
        """Build an optimization problem plan from parsed requirements and candidates."""
        nonlocal optimization_cache
        parsed = parse_requirements(requirement_text)
        research = find_raw_material_candidates(requirement_text)
        if optimization_cache is not None:
            return optimization_cache
        optimization_cache = _call_optimization_tool(
            session=session,
            run=run,
            parsed_requirements=parsed,
            candidate_research=research,
        )
        return optimization_cache

    agent = build_deepagents_supervisor(
        model=model,
        tools=[parse_requirements, find_raw_material_candidates, plan_optimization],
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
        "parsed_requirements": parsed_cache,
        "candidate_research": research_cache,
        "optimization_plan": optimization_cache,
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


def _call_raw_material_research_tool(
    *,
    session: Session,
    run: AiRun,
    parsed_requirements: dict[str, Any],
) -> dict[str, Any]:
    tool_call = start_ai_tool_call(
        session,
        run,
        tool_name="RawMaterialResearchAgent",
        input_json={"parsed_requirements": parsed_requirements},
    )
    try:
        research = research_raw_material_candidates(
            session=session,
            tenant_id=run.tenant_id,
            parsed_requirements=parsed_requirements,
        )
    except Exception as exc:
        finish_ai_tool_call(session, tool_call, status="error", error=str(exc))
        raise AgentOrchestrationError("Raw material research failed.") from exc
    finish_ai_tool_call(session, tool_call, status="success", output_json=research)
    return research


def _call_optimization_tool(
    *,
    session: Session,
    run: AiRun,
    parsed_requirements: dict[str, Any],
    candidate_research: dict[str, Any],
) -> dict[str, Any]:
    tool_call = start_ai_tool_call(
        session,
        run,
        tool_name="OptimizationAgent",
        input_json={
            "parsed_requirements": parsed_requirements,
            "candidate_research": candidate_research,
        },
    )
    try:
        plan = build_optimization_plan(
            parsed_requirements=parsed_requirements,
            candidate_research=candidate_research,
        )
    except Exception as exc:
        finish_ai_tool_call(session, tool_call, status="error", error=str(exc))
        raise AgentOrchestrationError("Optimization planning failed.") from exc
    finish_ai_tool_call(session, tool_call, status="success", output_json=plan)
    return plan


def _next_steps_from_requirements(
    parsed: dict[str, Any],
    *,
    candidate_research: dict[str, Any],
    optimization_plan: dict[str, Any],
) -> list[dict[str, str]]:
    candidate_count = candidate_research.get("candidate_count", 0)
    optimization_status = optimization_plan.get("status", "blocked")
    steps = [
        {
            "tool": "RawMaterialResearchAgent",
            "status": "completed" if candidate_count else "blocked",
            "summary": f"Found {candidate_count} tenant raw material candidates.",
        },
        {
            "tool": "OptimizationAgent",
            "status": "ready" if optimization_status == "ready" else "blocked",
            "summary": "Prepared optimizer inputs without generating formula percentages.",
        },
        {
            "tool": "FormulaCalculationAgent",
            "status": "blocked",
            "summary": "Wait for optimizer-generated formula lines before calculating cost and technical parameters.",
        },
        {
            "tool": "HumanReviewAgent",
            "status": "required",
            "summary": "Review uncertainties before any formula proposal leaves draft state.",
        },
    ]
    if not parsed.get("technical_constraints") and not parsed.get("economic_constraints"):
        steps[1]["summary"] = "No numeric constraints were detected for optimizer inputs."
    return steps
