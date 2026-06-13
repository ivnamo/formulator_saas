import { useCallback, type Dispatch, type SetStateAction } from "react";
import {
  createJiraFormulaReview,
  downloadFormulaReviewArtifactBlob,
  generateJiraReviewExcelArtifact,
  retryJiraReviewExcelAttachment,
  sendFormulaReviewToJira,
  syncFormulaReviewJiraStatus,
} from "./jira-review-api";
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
  result: CalculationResult | null;
  formulaReviewRequests: FormulaReviewRequest[];
  selectedJiraIsoDesignProjectId: string;
  headers: HeadersInit;
  uploadHeaders: HeadersInit;
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
  result,
  formulaReviewRequests,
  selectedJiraIsoDesignProjectId,
  headers,
  uploadHeaders,
  setFormulaReviewRequests,
  setFormulaReviewArtifacts,
  loadFormulaReviewRequests,
  onIsoModuleRefresh,
  runAction,
  setError,
  setMessage,
}: JiraReviewActionsOptions) {
  const sendCurrentFormulaToJira = useCallback(async () => {
    if (!workspace.tenant || !workspace.formulaId) {
      setError("Save and calculate the formula before sending to Jira");
      return;
    }
    if (!activeJiraConnection) {
      setError("Configure Jira before sending");
      return;
    }
    if (result === null) {
      setError("Calculate before sending to Jira");
      return;
    }
    if (!workspace.formulaJiraProjectId.trim()) {
      setError("ProyectoID is required before sending to Jira");
      return;
    }
    const formulaId = workspace.formulaId;
    const isoProjectId = selectedJiraIsoDesignProjectId || null;

    await runAction("Sending formula to Jira", async () => {
      const existingDraftReview = formulaReviewRequests.find(
        (review) =>
          !review.jira_issue_key &&
          (isoProjectId
            ? review.snapshot.iso?.design_project_id === isoProjectId
            : !review.snapshot.iso?.design_project_id),
      );
      const review =
        existingDraftReview ??
        (await createJiraFormulaReview(headers, formulaId, {
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
    headers,
    loadFormulaReviewRequests,
    onIsoModuleRefresh,
    result,
    runAction,
    selectedJiraIsoDesignProjectId,
    setError,
    setFormulaReviewRequests,
    setMessage,
    workspace.formulaId,
    workspace.formulaJiraProjectId,
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
