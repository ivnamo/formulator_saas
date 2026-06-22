import type { FormulaRead } from "./formula-model";
import type { FormulaCompareSelection } from "./saved-formula-comparison-state";
import type { WorkspaceState } from "./workspace-state-model";

export type FormulaSaveBlockerReason =
  | "missing_workspace"
  | "missing_formula_name"
  | "missing_formula_description"
  | "empty_formula"
  | "unbalanced_formula"
  | "pending_draft_review";

export type FormulaSaveBlocker = {
  reason: FormulaSaveBlockerReason;
  message: string;
};

type FormulaSaveGuardOptions = {
  workspace: WorkspaceState;
  isFormulaBalanced: boolean;
  hasPendingDraftReview: boolean;
};

type SavedFormulaComparisonPairOptions = {
  formulas: FormulaRead[];
  selection: FormulaCompareSelection;
};

type SavedFormulaComparisonPairResult =
  | {
      ok: true;
      baseline: FormulaRead;
      candidate: FormulaRead;
    }
  | {
      ok: false;
      baseline: null;
      candidate: null;
      error: string;
    };

export function getFormulaSaveBlocker({
  workspace,
  isFormulaBalanced,
  hasPendingDraftReview,
}: FormulaSaveGuardOptions): FormulaSaveBlocker | null {
  if (!workspace.tenant) {
    return {
      reason: "missing_workspace",
      message: "Create a workspace first",
    };
  }
  if (!workspace.formulaName.trim()) {
    return {
      reason: "missing_formula_name",
      message: "Indica un nombre de formula antes de guardar.",
    };
  }
  if (!workspace.formulaJiraDescription.trim()) {
    return {
      reason: "missing_formula_description",
      message: "Indica una descripcion de formula antes de guardar.",
    };
  }
  if (!workspace.formulaLines.length) {
    return {
      reason: "empty_formula",
      message: "Add at least one formula line",
    };
  }
  if (!isFormulaBalanced) {
    return {
      reason: "unbalanced_formula",
      message: "La formula debe sumar exactamente 100% para poder guardarse.",
    };
  }
  if (hasPendingDraftReview) {
    return {
      reason: "pending_draft_review",
      message: "Confirm draft review before saving",
    };
  }

  return null;
}

export function resolveSavedFormulaComparisonPair({
  formulas,
  selection,
}: SavedFormulaComparisonPairOptions): SavedFormulaComparisonPairResult {
  if (
    !selection.baselineId ||
    !selection.candidateId ||
    selection.baselineId === selection.candidateId
  ) {
    return {
      ok: false,
      baseline: null,
      candidate: null,
      error: "Select two different saved formulas",
    };
  }

  const baseline = formulas.find((formula) => formula.id === selection.baselineId);
  const candidate = formulas.find((formula) => formula.id === selection.candidateId);

  if (!baseline || !candidate) {
    return {
      ok: false,
      baseline: null,
      candidate: null,
      error: "Refresh the formula library before comparing",
    };
  }

  return {
    ok: true,
    baseline,
    candidate,
  };
}
