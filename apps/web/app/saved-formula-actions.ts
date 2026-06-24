import { useCallback, type Dispatch, type SetStateAction } from "react";
import type { BuilderSectionKey } from "./formula-builder-model";
import {
  toEditableFormulaMetadata,
  toEditableFormulaState,
} from "./formula-read-model";
import { buildManualFormulaSavePayload } from "./formula-save-model";
import {
  downloadBlob,
  downloadDraftFormulaIdLabExcel,
  downloadSavedFormulaIdLabExcel,
} from "./formula-excel-export-api";
import {
  archiveSavedFormula,
  calculateSavedFormula,
  fetchFormulaCalculationHistory,
  fetchFormulaReviewArtifactsByReview,
  fetchFormulaReviewRequests,
  listSavedFormulas,
  persistSavedFormula,
  restoreSavedFormula,
} from "./saved-formula-api";
import {
  getFormulaSaveBlocker,
  resolveSavedFormulaComparisonPair,
} from "./saved-formula-action-guards";
import type { FormulaCompareSelection } from "./saved-formula-comparison-state";
import {
  buildSavedFormulaComparison,
  type DraftReviewState,
  type SavedFormulaComparison,
} from "./workspace-comparison";
import type {
  CalculationResult,
  FormulaCalculationHistory,
  FormulaRead,
  FormulaReviewArtifact,
  FormulaReviewRequest,
} from "./formula-model";
import type { RawMaterial } from "./raw-material-model";
import type { WorkspaceState } from "./workspace-state-model";

type SavedFormulaActionsOptions = {
  workspace: WorkspaceState;
  formulas: FormulaRead[];
  formulaCompareSelection: FormulaCompareSelection;
  rawMaterialsById: Map<string, RawMaterial>;
  headers: HeadersInit;
  isFormulaBalanced: boolean;
  hasPendingDraftReview: boolean;
  showArchivedFormulas: boolean;
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
  showArchivedFormulas,
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
      calculateSavedFormula(headers, formulaId),
    [headers],
  );

  const loadFormulaReviewArtifacts = useCallback(
    async (reviews: FormulaReviewRequest[]) => {
      setFormulaReviewArtifacts(await fetchFormulaReviewArtifactsByReview(headers, reviews));
    },
    [headers, setFormulaReviewArtifacts],
  );

  const loadFormulaReviewRequests = useCallback(
    async (formulaId: string) => {
      const reviews = await fetchFormulaReviewRequests(headers, formulaId);
      setFormulaReviewRequests(reviews);
      await loadFormulaReviewArtifacts(reviews);
    },
    [headers, loadFormulaReviewArtifacts, setFormulaReviewRequests],
  );

  const loadCalculationHistory = useCallback(
    async (formulaId: string) => {
      const history = await fetchFormulaCalculationHistory(headers, formulaId);
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
        const nextFormulas = await listSavedFormulas(headers, {
          includeArchived: showArchivedFormulas,
        });
        setFormulas(nextFormulas);
        return;
      }
      await runAction("Refreshing formula library", async () => {
        const nextFormulas = await listSavedFormulas(headers, {
          includeArchived: showArchivedFormulas,
        });
        setFormulas(nextFormulas);
        setMessage("Formula library refreshed");
      });
    },
    [
      headers,
      runAction,
      setError,
      setFormulas,
      setMessage,
      showArchivedFormulas,
      workspace.tenant,
    ],
  );

  const compareSavedFormulas = useCallback(async () => {
    if (!workspace.tenant) {
      setError("Create a workspace first");
      return;
    }

    const pair = resolveSavedFormulaComparisonPair({
      formulas,
      selection: formulaCompareSelection,
    });
    if (!pair.ok) {
      setError(pair.error);
      return;
    }
    const { baseline, candidate } = pair;

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
    const blocker = getFormulaSaveBlocker({
      workspace,
      isFormulaBalanced,
      hasPendingDraftReview,
    });
    if (blocker) {
      setError(blocker.message);
      if (blocker.reason === "unbalanced_formula") {
        setBuilderSections((current) => ({
          ...current,
          formula: true,
          calculation: true,
        }));
      }
      return;
    }

    await runAction("Saving formula", async () => {
      const saveMode = workspace.formulaId ? workspace.formulaBuilderMode : "new";
      const payload = buildManualFormulaSavePayload(workspace, workspace.formulaLines);
      const formulaId =
        workspace.formulaBuilderMode === "editing" ? workspace.formulaId : null;
      const formula = await persistSavedFormula(headers, formulaId, payload);
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
      setMessage(formulaSaveSuccessMessage(saveMode));
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
    workspace.formulaBuilderMode,
    workspace.formulaJiraIssueType,
    workspace.formulaJiraProductType,
    workspace.formulaJiraProjectId,
    workspace.formulaLines,
    workspace.formulaName,
    workspace.tenant,
  ]);

  const exportCurrentFormulaIdLabExcel = useCallback(async () => {
    if (!workspace.tenant) {
      setError("Create a workspace first");
      return;
    }
    if (workspace.formulaLines.length === 0) {
      setError("Add at least one material before exporting");
      return;
    }
    if (!workspace.formulaJiraDescription.trim()) {
      setError("Indica una descripcion de formula antes de exportar.");
      return;
    }

    await runAction("Exporting Excel I+D", async () => {
      const download =
        workspace.formulaId && workspace.formulaBuilderMode === "editing" && !hasPendingDraftReview
          ? await downloadSavedFormulaIdLabExcel(headers, workspace.formulaId)
          : await downloadDraftFormulaIdLabExcel(headers, workspace);
      downloadBlob(download);
      setMessage("Excel I+D downloaded");
    });
  }, [
    hasPendingDraftReview,
    headers,
    runAction,
    setError,
    setMessage,
    workspace,
  ]);

  const exportSavedFormulaIdLabExcel = useCallback(
    async (formula: FormulaRead) => {
      await runAction("Exporting saved Excel I+D", async () => {
        const download = await downloadSavedFormulaIdLabExcel(headers, formula.id);
        downloadBlob(download);
        setMessage("Saved Excel I+D downloaded");
      });
    },
    [headers, runAction, setMessage],
  );

  const archiveFormula = useCallback(
    async (formula: FormulaRead) => {
      const confirmed = window.confirm(
        `Archivar "${formula.name}"? Dejara de aparecer en la biblioteca operativa.`,
      );
      if (!confirmed) {
        return;
      }

      await runAction("Archiving formula", async () => {
        await archiveSavedFormula(headers, formula.id);
        await refreshFormulaLibrary({ silent: true });
        setSavedFormulaComparison(null);
        setFormulaReviewRequests((current) =>
          current.filter((review) => review.formula_id !== formula.id),
        );
        if (workspace.formulaId === formula.id) {
          setWorkspace((current) => ({
            ...current,
            formulaId: null,
            formulaBaseName: null,
            formulaBuilderMode: "new",
          }));
          setCalculationHistory([]);
        }
        setMessage("Formula archivada");
      });
    },
    [
      headers,
      runAction,
      setCalculationHistory,
      setFormulaReviewRequests,
      setMessage,
      setSavedFormulaComparison,
      setWorkspace,
      refreshFormulaLibrary,
      workspace.formulaId,
    ],
  );

  const restoreFormula = useCallback(
    async (formula: FormulaRead) => {
      const confirmed = window.confirm(
        `Restaurar "${formula.name}"? Volvera a aparecer en la biblioteca operativa.`,
      );
      if (!confirmed) {
        return;
      }

      await runAction("Restoring formula", async () => {
        await restoreSavedFormula(headers, formula.id);
        await refreshFormulaLibrary({ silent: true });
        setMessage("Formula restaurada");
      });
    },
    [headers, refreshFormulaLibrary, runAction, setMessage],
  );

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
    exportCurrentFormulaIdLabExcel,
    exportSavedFormulaIdLabExcel,
    archiveFormula,
    restoreFormula,
    refreshFormulaLibrary,
    openFormula,
    loadCalculationHistory,
    loadFormulaReviewRequests,
  };
}

function formulaSaveSuccessMessage(mode: WorkspaceState["formulaBuilderMode"]) {
  if (mode === "editing") {
    return "Formula cargada actualizada";
  }
  if (mode === "version") {
    return "Nueva version guardada";
  }
  return "Formula nueva guardada";
}
