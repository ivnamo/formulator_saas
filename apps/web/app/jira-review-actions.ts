import { useCallback, type Dispatch, type SetStateAction } from "react";
import { toEditableFormulaMetadata } from "./formula-read-model";
import { buildManualFormulaSavePayload } from "./formula-save-model";
import {
  createJiraFormulaReview,
  downloadFormulaReviewArtifactBlob,
  generateJiraReviewExcelArtifact,
  retryJiraReviewExcelAttachment,
  sendFormulaReviewToJira,
  syncFormulaReviewJiraStatus,
} from "./jira-review-api";
import {
  calculateSavedFormula,
  persistSavedFormula,
} from "./saved-formula-api";
import { getFormulaSaveBlocker } from "./saved-formula-action-guards";
import type {
  CalculationResult,
  FormulaReviewArtifact,
  FormulaReviewRequest,
} from "./formula-model";
import type { JiraConnection } from "./jira-connection-model";
import type { WorkspaceState } from "./workspace-state-model";

type JiraReviewActionsOptions = {
  workspace: WorkspaceState;
  activeJiraConnection: JiraConnection | null;
  isFormulaBalanced: boolean;
  hasPendingDraftReview: boolean;
  formulaReviewRequests: FormulaReviewRequest[];
  selectedJiraIsoDesignProjectId: string;
  headers: HeadersInit;
  uploadHeaders: HeadersInit;
  setWorkspace: Dispatch<SetStateAction<WorkspaceState>>;
  setResult: Dispatch<SetStateAction<CalculationResult | null>>;
  setFormulaReviewRequests: Dispatch<SetStateAction<FormulaReviewRequest[]>>;
  setFormulaReviewArtifacts: Dispatch<
    SetStateAction<Record<string, FormulaReviewArtifact[]>>
  >;
  loadFormulaReviewRequests: (formulaId: string) => Promise<void>;
  onIsoModuleRefresh: () => Promise<void>;
  runAction: (label: string, action: () => Promise<void>) => Promise<void>;
  setError: (message: string) => void;
  setMessage: (message: string) => void;
};

function jiraSendMessage(review: FormulaReviewRequest) {
  return review.review_status === "partial_failure"
    ? "Jira issue created; Excel attachment failed"
    : "Jira issue created";
}

export function useJiraReviewActions({
  workspace,
  activeJiraConnection,
  isFormulaBalanced,
  hasPendingDraftReview,
  formulaReviewRequests,
  selectedJiraIsoDesignProjectId,
  headers,
  uploadHeaders,
  setWorkspace,
  setResult,
  setFormulaReviewRequests,
  setFormulaReviewArtifacts,
  loadFormulaReviewRequests,
  onIsoModuleRefresh,
  runAction,
  setError,
  setMessage,
}: JiraReviewActionsOptions) {
  const sendCurrentFormulaToJira = useCallback(async () => {
    const blocker = getFormulaSaveBlocker({
      workspace,
      isFormulaBalanced,
      hasPendingDraftReview,
    });
    if (blocker) {
      setError(blocker.message);
      return;
    }
    if (!activeJiraConnection) {
      setError("Configure Jira before sending");
      return;
    }
    const isQualityJiraIssueType =
      workspace.formulaJiraIssueType.trim().toLowerCase() === "calidad";
    if (!workspace.formulaJiraProjectId.trim() && isQualityJiraIssueType) {
      setError(
        "Crea o selecciona un F10-01 para generar ProyectoID antes de enviar la formula de Calidad a Jira.",
      );
      return;
    }
    if (isQualityJiraIssueType && !selectedJiraIsoDesignProjectId) {
      setError(
        "No existe F10-01 para este ProyectoID. Crea el expediente ISO antes de enviar la formula de Calidad a Jira.",
      );
      return;
    }
    const isoProjectId = selectedJiraIsoDesignProjectId || null;

    await runAction("Sending formula to Jira", async () => {
      const payload = buildManualFormulaSavePayload(workspace, workspace.formulaLines);
      const formula = await persistSavedFormula(headers, workspace.formulaId, payload);
      const calculation = await calculateSavedFormula(headers, formula.id);
      setWorkspace((current) => ({
        ...current,
        ...toEditableFormulaMetadata(formula),
      }));
      setResult(calculation);

      const candidateReviews =
        workspace.formulaId === formula.id ? formulaReviewRequests : [];
      const existingDraftReview = candidateReviews.find(
        (review) =>
          !review.jira_issue_key &&
          (isoProjectId
            ? review.snapshot.iso?.design_project_id === isoProjectId
            : !review.snapshot.iso?.design_project_id),
      );
      const review =
        existingDraftReview ??
        (await createJiraFormulaReview(headers, formula.id, {
          design_project_id: isoProjectId,
        }));
      const sentReview = await sendFormulaReviewToJira(headers, review.id);
      setFormulaReviewRequests((current) => [
        sentReview,
        ...current.filter((item) => item.id !== sentReview.id),
      ]);
      await loadFormulaReviewRequests(sentReview.formula_id);
      await onIsoModuleRefresh();
      setMessage(jiraSendMessage(sentReview));
    });
  }, [
    activeJiraConnection,
    formulaReviewRequests,
    hasPendingDraftReview,
    headers,
    isFormulaBalanced,
    loadFormulaReviewRequests,
    onIsoModuleRefresh,
    runAction,
    selectedJiraIsoDesignProjectId,
    setError,
    setFormulaReviewRequests,
    setResult,
    setMessage,
    setWorkspace,
    workspace.formulaId,
    workspace.formulaJiraIssueType,
    workspace.formulaJiraProjectId,
    workspace.formulaJiraProductType,
    workspace.formulaLines,
    workspace.formulaName,
    workspace.tenant,
  ]);

  const generateJiraReviewExcel = useCallback(
    async (reviewId: string) => {
      await runAction("Generating Jira Excel", async () => {
        const artifact = await generateJiraReviewExcelArtifact(headers, reviewId);
        setFormulaReviewArtifacts((current) => ({
          ...current,
          [reviewId]: [
            artifact,
            ...(current[reviewId] ?? []).filter((item) => item.id !== artifact.id),
          ],
        }));
        setMessage("Jira Excel ready");
      });
    },
    [headers, runAction, setFormulaReviewArtifacts, setMessage],
  );

  const downloadJiraReviewArtifact = useCallback(
    async (artifact: FormulaReviewArtifact) => {
      await runAction("Downloading Jira Excel", async () => {
        const blobUrl = URL.createObjectURL(
          await downloadFormulaReviewArtifactBlob(uploadHeaders, artifact.id),
        );
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = artifact.file_name;
        document.body.append(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(blobUrl);
        setMessage("Jira Excel downloaded");
      });
    },
    [runAction, setMessage, uploadHeaders],
  );

  const sendJiraReviewToJira = useCallback(
    async (reviewId: string) => {
      await runAction("Sending Jira review", async () => {
        const review = await sendFormulaReviewToJira(headers, reviewId);
        setFormulaReviewRequests((current) =>
          current.map((item) => (item.id === review.id ? review : item)),
        );
        await loadFormulaReviewRequests(review.formula_id);
        await onIsoModuleRefresh();
        setMessage(jiraSendMessage(review));
      });
    },
    [
      headers,
      loadFormulaReviewRequests,
      onIsoModuleRefresh,
      runAction,
      setFormulaReviewRequests,
      setMessage,
    ],
  );

  const retryJiraReviewAttachment = useCallback(
    async (reviewId: string) => {
      await runAction("Retrying Jira Excel attachment", async () => {
        const review = await retryJiraReviewExcelAttachment(headers, reviewId);
        setFormulaReviewRequests((current) =>
          current.map((item) => (item.id === review.id ? review : item)),
        );
        await loadFormulaReviewRequests(review.formula_id);
        await onIsoModuleRefresh();
        setMessage("Jira Excel attachment retried");
      });
    },
    [
      headers,
      loadFormulaReviewRequests,
      onIsoModuleRefresh,
      runAction,
      setFormulaReviewRequests,
      setMessage,
    ],
  );

  const syncJiraReviewStatus = useCallback(
    async (reviewId: string) => {
      await runAction("Syncing Jira review", async () => {
        const review = await syncFormulaReviewJiraStatus(headers, reviewId);
        setFormulaReviewRequests((current) =>
          current.map((item) => (item.id === review.id ? review : item)),
        );
        await onIsoModuleRefresh();
        setMessage("Jira status synced");
      });
    },
    [headers, onIsoModuleRefresh, runAction, setFormulaReviewRequests, setMessage],
  );

  return {
    sendCurrentFormulaToJira,
    generateJiraReviewExcel,
    downloadJiraReviewArtifact,
    sendJiraReviewToJira,
    retryJiraReviewAttachment,
    syncJiraReviewStatus,
  };
}
