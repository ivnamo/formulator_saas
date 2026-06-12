import { useCallback, useState } from "react";
import {
  type CalculationResult,
  type FormulaCalculationHistory,
  type FormulaRead,
  type FormulaReviewArtifact,
  type FormulaReviewRequest,
} from "./workspace-model";

export function useFormulaWorkspaceState() {
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [formulas, setFormulas] = useState<FormulaRead[]>([]);
  const [calculationHistory, setCalculationHistory] = useState<FormulaCalculationHistory[]>([]);
  const [formulaReviewRequests, setFormulaReviewRequests] = useState<FormulaReviewRequest[]>([]);
  const [formulaReviewArtifacts, setFormulaReviewArtifacts] = useState<
    Record<string, FormulaReviewArtifact[]>
  >({});
  const resetFormulaWorkspaceState = useCallback(() => {
    setResult(null);
    setFormulas([]);
    setCalculationHistory([]);
    setFormulaReviewRequests([]);
    setFormulaReviewArtifacts({});
  }, []);

  return {
    result,
    setResult,
    formulas,
    setFormulas,
    calculationHistory,
    setCalculationHistory,
    formulaReviewRequests,
    setFormulaReviewRequests,
    formulaReviewArtifacts,
    setFormulaReviewArtifacts,
    resetFormulaWorkspaceState,
  };
}
