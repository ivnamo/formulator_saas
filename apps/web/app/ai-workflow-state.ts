import { useCallback, useState } from "react";
import type { DraftReviewState } from "./workspace-comparison";
import type { AiRun, AgentPlan, RequirementParse } from "./ai-workflow-model";

const defaultRequirementText =
  "Liquido barato con contenido activo minimo 12% y precio maximo 2 EUR/kg. Dame 2 alternativas.";

export function useAiWorkflowState() {
  const [requirementText, setRequirementText] = useState(defaultRequirementText);
  const [requirementParse, setRequirementParse] = useState<RequirementParse | null>(null);
  const [agentPlan, setAgentPlan] = useState<AgentPlan | null>(null);
  const [draftReview, setDraftReview] = useState<DraftReviewState | null>(null);
  const [aiRuns, setAiRuns] = useState<AiRun[]>([]);
  const resetAiWorkflowState = useCallback(() => {
    setRequirementParse(null);
    setAgentPlan(null);
    setDraftReview(null);
    setAiRuns([]);
  }, []);

  return {
    requirementText,
    setRequirementText,
    requirementParse,
    setRequirementParse,
    agentPlan,
    setAgentPlan,
    draftReview,
    setDraftReview,
    aiRuns,
    setAiRuns,
    resetAiWorkflowState,
  };
}
