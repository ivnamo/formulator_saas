import { useCallback, type Dispatch, type SetStateAction } from "react";
import { request } from "./workspace-api";
import type { BuilderSectionKey } from "./formula-builder-model";
import {
  toEditableFormulaMetadata,
  toEditableFormulaState,
} from "./formula-read-model";
import { buildManualFormulaSavePayload } from "./formula-save-model";
import type { FormulaCompareSelection } from "./saved-formula-comparison-state";
import {
  buildSavedFormulaComparison,
  type DraftReviewState,
  type SavedFormulaComparison,
} from "./workspace-comparison";
import {
  type CalculationResult,
  type FormulaCalculationHistory,
  type FormulaRead,
  type FormulaReviewArtifact,
  type FormulaReviewRequest,
  type RawMaterial,
  type WorkspaceState,
} from "./workspace-model";

type SavedFormulaActionsOptions = {
  workspace: WorkspaceState;
  formulas: FormulaRead[];
  formulaCompareSelection: FormulaCompareSelection;
  rawMaterialsById: Map<string, RawMaterial>;
  headers: HeadersInit;
  isFormulaBalanced: boolean;
  hasPendingDraftReview: boolean;
  setWorkspace: Dispatch<SetStateAction<WorkspaceState>>;
  setFormulas: Dispatch<SetStateAction<FormulaRead[]>>;
  setCalculationHistory: Dispatch<SetStateAction<FormulaCalculationHistory[]>>;
  setFormulaReviewRequests: Dispatch<SetStateAction<FormulaReviewRequest[]>>;
  setFormulaReviewArtifacts: Dispatch<
    SetStateAction<Record<string, FormulaReviewArtifact[]>>
  >;
  setResult: Dispatch<SetStateAction<CalculationResult | null>>;
  setDraftReview: Dispatch<SetStateAction<DraftReviewState | null>>;
  setSavedFormulaComparison: Dispatch<SetStateAction<SavedFormulaComparison | null>>;
  setBuilderSections: Dispatch<SetStateAction<Record<BuilderSectionKey, boolean>>>;
  ensureRawMaterialDetail: (rawMaterialId: string) => Promise<RawMaterial | null>;
  resetImportState: () => void;
  runAction: (label: string, action: () => Promise<void>) => Promise<void>;
  setError: (message: string) => void;
  setMessage: (message: string) => void;
};

export function useSavedFormulaActions({
  workspace,
  formulas,
  formulaCompareSelection,
  rawMaterialsById,
  headers,
  isFormulaBalanced,
  hasPendingDraftReview,
  setWorkspace,
  setFormulas,
  setCalculationHistory,
  setFormulaReviewRequests,
  setFormulaReviewArtifacts,
  setResult,
  setDraftReview,
  setSavedFormulaComparison,
  setBuilderSections,
  ensureRawMaterialDetail,
  resetImportState,
  runAction,
  setError,
  setMessage,
}: SavedFormulaActionsOptions) {
  const calculatePersistedFormula = useCallback(
    async (formulaId: string): Promise<CalculationResult> =>
      request<CalculationResult>(`/api/v1/formulas/${formulaId}/calculate`, {
        method: "POST",
        headers,
      }),
    [headers],
  );

  const loadFormulaReviewArtifacts = useCallback(
    async (reviews: FormulaReviewRequest[]) => {
      const entries = await Promise.all(
        reviews.map(async (review) => {
          const artifacts = await request<FormulaReviewArtifact[]>(
            `/api/v1/formula-reviews/${review.id}/artifacts`,
            { method: "GET", headers },
          );
          return [review.id, artifacts] as const;
        }),
      );
      setFormulaReviewArtifacts(Object.fromEntries(entries));
    },
    [headers, setFormulaReviewArtifacts],
  );

  const loadFormulaReviewRequests = useCallback(
    async (formulaId: string) => {
      const reviews = await request<FormulaReviewRequest[]>(
        `/api/v1/formulas/${formulaId}/reviews`,
        { method: "GET", headers },
      );
      setFormulaReviewRequests(reviews);
      await loadFormulaReviewArtifacts(reviews);
    },
    [headers, loadFormulaReviewArtifacts, setFormulaReviewRequests],
  );

  const loadCalculationHistory = useCallback(
    async (formulaId: string) => {
      const history = await request<FormulaCalculationHistory[]>(
        `/api/v1/formulas/${formulaId}/calculations`,
        { method: "GET", headers },
      );
      setCalculationHistory(history);
    },
    [headers, setCalculationHistory],
  );

  const refreshFormulaLibrary = useCallback(
    async (options: { silent?: boolean } = {}) => {
      if (!workspace.tenant) {
        setError("Create a workspace first");
        return;
      }
      if (options.silent) {
        const nextFormulas = await request<FormulaRead[]>("/api/v1/formulas", {
          method: "GET",
          headers,
        });
        setFormulas(nextFormulas);
        return;
      }
      await runAction("Refreshing formula library", async () => {
        const nextFormulas = await request<FormulaRead[]>("/api/v1/formulas", {
          method: "GET",
          headers,
        });
        setFormulas(nextFormulas);
        setMessage("Formula library refreshed");
      });
    },
    [headers, runAction, setError, setFormulas, setMessage, workspace.tenant],
  );

  const compareSavedFormulas = useCallback(async () => {
    if (!workspace.tenant) {
      setError("Create a workspace first");
      return;
    }
    if (
      !formulaCompareSelection.baselineId ||
      !formulaCompareSelection.candidateId ||
      formulaCompareSelection.baselineId === formulaCompareSelection.candidateId
    ) {
      setError("Select two different saved formulas");
      return;
    }

    const baseline = formulas.find(
      (formula) => formula.id === formulaCompareSelection.baselineId,
    );
    const candidate = formulas.find(
      (formula) => formula.id === formulaCompareSelection.candidateId,
    );
    if (!baseline || !candidate) {
      setError("Refresh the formula library before comparing");
      return;
    }

    await runAction("Comparing saved formulas", async () => {
      const [baselineResult, candidateResult] = await Promise.all([
        calculatePersistedFormula(baseline.id),
        calculatePersistedFormula(candidate.id),
      ]);
      setSavedFormulaComparison(
        buildSavedFormulaComparison(
          baseline,
          candidate,
          baselineResult,
          candidateResult,
          rawMaterialsById,
        ),
      );
      await refreshFormulaLibrary({ silent: true });
      setMessage("Formula comparison ready");
    });
  }, [
    calculatePersistedFormula,
    formulaCompareSelection.baselineId,
    formulaCompareSelection.candidateId,
    formulas,
    rawMaterialsById,
    refreshFormulaLibrary,
    runAction,
    setError,
    setMessage,
    setSavedFormulaComparison,
    workspace.tenant,
  ]);

  const saveFormula = useCallback(async () => {
    if (!workspace.tenant) {
      setError("Create a workspace first");
      return;
    }
    if (!workspace.formulaLines.length) {
      setError("Add at least one formula line");
      return;
    }
    if (!isFormulaBalanced) {
      setError("La formula debe sumar exactamente 100% para poder guardarse.");
      setBuilderSections((current) => ({
        ...current,
        formula: true,
        calculation: true,
      }));
      return;
    }
    if (hasPendingDraftReview) {
      setError("Confirm draft review before saving");
      return;
    }

    await runAction("Saving formula", async () => {
      const payload = buildManualFormulaSavePayload(workspace, workspace.formulaLines);
      const formula = workspace.formulaId
        ? await request<FormulaRead>(`/api/v1/formulas/${workspace.formulaId}`, {
            method: "PATCH",
            headers,
            body: JSON.stringify(payload),
          })
        : await request<FormulaRead>("/api/v1/formulas", {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
          });
      const calculation = await calculatePersistedFormula(formula.id);
      setWorkspace((current) => ({
        ...current,
        ...toEditableFormulaMetadata(formula),
      }));
      setResult(calculation);
      setDraftReview(null);
      setSavedFormulaComparison(null);
      setBuilderSections((current) => ({
        ...current,
        calculation: true,
      }));
      await refreshFormulaLibrary({ silent: true });
      await loadCalculationHistory(formula.id);
      await loadFormulaReviewRequests(formula.id);
      setMessage("Formula saved");
    });
  }, [
    calculatePersistedFormula,
    hasPendingDraftReview,
    headers,
    isFormulaBalanced,
    loadCalculationHistory,
    loadFormulaReviewRequests,
    refreshFormulaLibrary,
    runAction,
    setBuilderSections,
    setDraftReview,
    setError,
    setMessage,
    setResult,
    setSavedFormulaComparison,
    setWorkspace,
    workspace.formulaId,
    workspace.formulaJiraIssueType,
    workspace.formulaJiraProductType,
    workspace.formulaJiraProjectId,
    workspace.formulaLines,
    workspace.formulaName,
    workspace.tenant,
  ]);

  const openFormula = useCallback(
    async (formula: FormulaRead) => {
      await runAction("Opening formula", async () => {
        setWorkspace((current) => ({
          ...current,
          ...toEditableFormulaState(formula),
        }));
        setResult(null);
        setDraftReview(null);
        setFormulaReviewArtifacts({});
        setBuilderSections((current) => ({
          ...current,
          formula: true,
          calculation: true,
        }));
        resetImportState();
        await Promise.all(
          formula.items.map((item) => ensureRawMaterialDetail(item.raw_material_id)),
        );
        await loadCalculationHistory(formula.id);
        await loadFormulaReviewRequests(formula.id);
        setMessage("Formula opened");
      });
    },
    [
      ensureRawMaterialDetail,
      loadCalculationHistory,
      loadFormulaReviewRequests,
      resetImportState,
      runAction,
      setBuilderSections,
      setDraftReview,
      setFormulaReviewArtifacts,
      setMessage,
      setResult,
      setWorkspace,
    ],
  );

  return {
    compareSavedFormulas,
    saveFormula,
    refreshFormulaLibrary,
    openFormula,
    loadCalculationHistory,
    loadFormulaReviewRequests,
  };
}
