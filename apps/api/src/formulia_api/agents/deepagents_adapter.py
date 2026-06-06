from __future__ import annotations

from collections.abc import Callable
from typing import Any


class DeepAgentsUnavailableError(RuntimeError):
    pass


def build_deepagents_supervisor(
    *,
    model: str,
    tools: list[Callable[..., Any]],
    system_prompt: str,
) -> Any:
    try:
        from deepagents import create_deep_agent
    except ImportError as exc:
        raise DeepAgentsUnavailableError(
            "DeepAgents is not installed. Install the API agents extra to enable it."
        ) from exc

    return create_deep_agent(
        model=f"openai:{model}",
        tools=tools,
        system_prompt=system_prompt,
    )


def extract_final_message_content(result: dict[str, Any]) -> str:
    messages = result.get("messages") if isinstance(result, dict) else None
    if not isinstance(messages, list) or not messages:
        return ""
    content = getattr(messages[-1], "content", None)
    if isinstance(content, str):
        return content
    if isinstance(messages[-1], dict):
        value = messages[-1].get("content")
        return value if isinstance(value, str) else ""
    return ""
