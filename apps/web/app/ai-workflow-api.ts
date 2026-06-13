import type { AiRun, AgentPlan, RequirementParse } from "./ai-workflow-model";
import { request } from "./workspace-api";

export function listAiRuns(headers: HeadersInit): Promise<AiRun[]> {
  return request<AiRun[]>("/api/v1/ai/runs", { method: "GET", headers });
}

export function parseRequirementText(
  headers: HeadersInit,
  text: string,
): Promise<RequirementParse> {
  return request<RequirementParse>("/api/v1/ai/requirements/parse", {
    method: "POST",
    headers,
    body: JSON.stringify({ text }),
  });
}

export function createSupervisorPlan(
  headers: HeadersInit,
  text: string,
): Promise<AgentPlan> {
  return request<AgentPlan>("/api/v1/ai/supervisor/plan", {
    method: "POST",
    headers,
    body: JSON.stringify({ text }),
  });
}
