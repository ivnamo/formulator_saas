import { useCallback, type Dispatch, type SetStateAction } from "react";
import { request } from "./workspace-api";
import type {
  AiRun,
  AgentPlan,
  RequirementParse,
} from "./ai-workflow-model";
import type { WorkspaceState } from "./workspace-state-model";

type AiAssistantActionsOptions = {
  workspace: WorkspaceState;
  requirementText: string;
  headers: HeadersInit;
  setRequirementParse: Dispatch<SetStateAction<RequirementParse | null>>;
  setAgentPlan: Dispatch<SetStateAction<AgentPlan | null>>;
  setAiRuns: Dispatch<SetStateAction<AiRun[]>>;
  setRequirementText: Dispatch<SetStateAction<string>>;
  runAction: (label: string, action: () => Promise<void>) => Promise<void>;
  setError: (message: string) => void;
  setMessage: (message: string) => void;
};

export function useAiAssistantActions({
  workspace,
  requirementText,
  headers,
  setRequirementParse,
  setAgentPlan,
  setAiRuns,
  setRequirementText,
  runAction,
  setError,
  setMessage,
}: AiAssistantActionsOptions) {
  const refreshAiRuns = useCallback(
    async (options: { silent?: boolean } = {}) => {
      if (!workspace.tenant) {
        setError("Create a workspace first");
        return;
      }
      const loadRuns = async () => {
        const runs = await request<AiRun[]>("/api/v1/ai/runs", { method: "GET", headers });
        setAiRuns(runs);
        return runs;
      };
      if (options.silent) {
        await loadRuns();
        return;
      }
      await runAction("Refreshing AI runs", async () => {
        await loadRuns();
        setMessage("AI runs refreshed");
      });
    },
    [headers, runAction, setAiRuns, setError, setMessage, workspace.tenant],
  );

  const parseRequirements = useCallback(async () => {
    if (!workspace.tenant) {
      setError("Create a workspace first");
      return;
    }
    const text = requirementText.trim();
    if (text.length < 3) {
      setError("Requirement text is required");
      return;
    }

    await runAction("Parsing requirements", async () => {
      const parsed = await request<RequirementParse>("/api/v1/ai/requirements/parse", {
        method: "POST",
        headers,
        body: JSON.stringify({ text }),
      });
      setRequirementParse(parsed);
      await refreshAiRuns({ silent: true });
      setMessage("Requirements parsed");
    });
  }, [
    headers,
    refreshAiRuns,
    requirementText,
    runAction,
    setError,
    setMessage,
    setRequirementParse,
    workspace.tenant,
  ]);

  const planRequirements = useCallback(async () => {
    if (!workspace.tenant) {
      setError("Create a workspace first");
      return;
    }
    const text = requirementText.trim();
    if (text.length < 3) {
      setError("Requirement text is required");
      return;
    }

    await runAction("Planning with supervisor", async () => {
      const plan = await request<AgentPlan>("/api/v1/ai/supervisor/plan", {
        method: "POST",
        headers,
        body: JSON.stringify({ text }),
      });
      setAgentPlan(plan);
      await refreshAiRuns({ silent: true });
      setMessage("Supervisor plan ready");
    });
  }, [
    headers,
    refreshAiRuns,
    requirementText,
    runAction,
    setAgentPlan,
    setError,
    setMessage,
    workspace.tenant,
  ]);

  const reuseInfeasibilityAction = useCallback(
    (action: string) => {
      const suggestedAction = action.trim();
      if (!suggestedAction) {
        return;
      }

      setRequirementText((current) => {
        const currentText = current.trim();
        if (!currentText) {
          return suggestedAction;
        }
        if (currentText.includes(suggestedAction)) {
          return current;
        }
        return `${currentText}\n${suggestedAction}`;
      });
      setMessage("Action added to requirement");
    },
    [setMessage, setRequirementText],
  );

  return {
    parseRequirements,
    planRequirements,
    refreshAiRuns,
    reuseInfeasibilityAction,
  };
}
