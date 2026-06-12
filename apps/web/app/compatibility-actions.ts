import { useCallback, type Dispatch, type SetStateAction } from "react";
import type { CompatibilityRuleForm } from "./compatibility-state";
import { request } from "./workspace-api";
import type {
  CalculationResult,
  CompatibilityRuleRead,
  WorkspaceState,
} from "./workspace-model";

type CompatibilityActionsOptions = {
  workspace: WorkspaceState;
  compatibilityRuleForm: CompatibilityRuleForm;
  headers: HeadersInit;
  setCompatibilityRules: Dispatch<SetStateAction<CompatibilityRuleRead[]>>;
  setCompatibilityRuleForm: Dispatch<SetStateAction<CompatibilityRuleForm>>;
  setResult: Dispatch<SetStateAction<CalculationResult | null>>;
  runAction: (label: string, action: () => Promise<void>) => Promise<void>;
  setError: (message: string) => void;
  setMessage: (message: string) => void;
};

export function useCompatibilityActions({
  workspace,
  compatibilityRuleForm,
  headers,
  setCompatibilityRules,
  setCompatibilityRuleForm,
  setResult,
  runAction,
  setError,
  setMessage,
}: CompatibilityActionsOptions) {
  const createCompatibilityRule = useCallback(async () => {
    if (!workspace.tenant) {
      setError("Create a workspace first");
      return;
    }
    if (!compatibilityRuleForm.materialAId || !compatibilityRuleForm.materialBId) {
      setError("Select two raw materials");
      return;
    }
    if (compatibilityRuleForm.materialAId === compatibilityRuleForm.materialBId) {
      setError("Select two different raw materials");
      return;
    }
    const message = compatibilityRuleForm.message.trim();
    if (!message) {
      setError("Compatibility message is required");
      return;
    }

    await runAction("Creating compatibility rule", async () => {
      const rule = await request<CompatibilityRuleRead>("/api/v1/compatibility-rules", {
        method: "POST",
        headers,
        body: JSON.stringify({
          material_a_id: compatibilityRuleForm.materialAId,
          material_b_id: compatibilityRuleForm.materialBId,
          severity: compatibilityRuleForm.severity,
          message,
          recommended_action: compatibilityRuleForm.recommendedAction.trim() || null,
        }),
      });
      setCompatibilityRules((current) => [rule, ...current]);
      setCompatibilityRuleForm((current) => ({
        ...current,
        message: "",
        recommendedAction: "",
      }));
      setResult(null);
      setMessage("Compatibility rule ready");
    });
  }, [
    compatibilityRuleForm,
    headers,
    runAction,
    setCompatibilityRuleForm,
    setCompatibilityRules,
    setError,
    setMessage,
    setResult,
    workspace.tenant,
  ]);

  return { createCompatibilityRule };
}
