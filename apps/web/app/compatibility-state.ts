import { useState } from "react";
import type { CompatibilityRuleRead } from "./workspace-model";

export type CompatibilityRuleForm = {
  materialAId: string;
  materialBId: string;
  severity: string;
  message: string;
  recommendedAction: string;
};

export const emptyCompatibilityRuleForm: CompatibilityRuleForm = {
  materialAId: "",
  materialBId: "",
  severity: "warning",
  message: "",
  recommendedAction: "",
};

export function useCompatibilityState() {
  const [compatibilityRules, setCompatibilityRules] = useState<CompatibilityRuleRead[]>([]);
  const [compatibilityRuleForm, setCompatibilityRuleForm] = useState<CompatibilityRuleForm>(
    emptyCompatibilityRuleForm,
  );

  return {
    compatibilityRules,
    setCompatibilityRules,
    compatibilityRuleForm,
    setCompatibilityRuleForm,
  };
}
