import { useCallback, type Dispatch, type SetStateAction } from "react";
import { apiUrl, request } from "./workspace-api";
import type {
  CalculationResult,
  FormulaReviewArtifact,
  FormulaReviewRequest,
  JiraConnection,
  WorkspaceState,
} from "./workspace-model";

type JiraReviewActionsOptions = {
  workspace: WorkspaceState;
  activeJiraConnection: JiraConnection | null;
  result: CalculationResult | null;
  formulaReviewRequests: FormulaReviewRequest[];
  headers: HeadersInit;
  uploadHeaders: HeadersInit;
  setFormulaReviewRequests: Dispatch<SetStateAction<FormulaReviewRequest[]>>;
  setFormulaReviewArtifacts: Dispatch<
    SetStateAction<Record<string, FormulaReviewArtifact[]>>
  >;
  loadFormulaReviewRequests: (formulaId: string) => Promise<void>;
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
  headers,
  uploadHeaders,
  setFormulaReviewRequests,
  setFormulaReviewArtifacts,
  loadFormulaReviewRequests,
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

    await runAction("Sending formula to Jira", async () => {
      const existingDraftReview = formulaReviewRequests.find((review) => !review.jira_issue_key);
      const review =
        existingDraftReview ??
        (await request<FormulaReviewRequest>(
          `/api/v1/formulas/${workspace.formulaId}/reviews/jira`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({}),
          },
        ));
      const sentReview = await request<FormulaReviewRequest>(
        `/api/v1/formula-reviews/${review.id}/jira/send`,
        {
          method: "POST",
          headers,
        },
      );
      setFormulaReviewRequests((current) => [
        sentReview,
        ...current.filter((item) => item.id !== sentReview.id),
      ]);
      await loadFormulaReviewRequests(sentReview.formula_id);
      setMessage(jiraSendMessage(sentReview));
    });
  }, [
    activeJiraConnection,
    formulaReviewRequests,
    headers,
    loadFormulaReviewRequests,
    result,
    runAction,
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
        const artifact = await request<FormulaReviewArtifact>(
          `/api/v1/formula-reviews/${reviewId}/artifacts/excel`,
          {
            method: "POST",
            headers,
          },
        );
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
        const response = await fetch(
          `${apiUrl}/api/v1/formula-review-artifacts/${artifact.id}/download`,
          { method: "GET", headers: uploadHeaders },
        );
        if (!response.ok) {
          throw new Error(`API ${response.status}: ${await response.text()}`);
        }
        const blobUrl = URL.createObjectURL(await response.blob());
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
        const review = await request<FormulaReviewRequest>(
          `/api/v1/formula-reviews/${reviewId}/jira/send`,
          {
            method: "POST",
            headers,
          },
        );
        setFormulaReviewRequests((current) =>
          current.map((item) => (item.id === review.id ? review : item)),
        );
        await loadFormulaReviewRequests(review.formula_id);
        setMessage(jiraSendMessage(review));
      });
    },
    [headers, loadFormulaReviewRequests, runAction, setFormulaReviewRequests, setMessage],
  );

  const retryJiraReviewAttachment = useCallback(
    async (reviewId: string) => {
      await runAction("Retrying Jira Excel attachment", async () => {
        const review = await request<FormulaReviewRequest>(
          `/api/v1/formula-reviews/${reviewId}/jira/retry-attachment`,
          {
            method: "POST",
            headers,
          },
        );
        setFormulaReviewRequests((current) =>
          current.map((item) => (item.id === review.id ? review : item)),
        );
        await loadFormulaReviewRequests(review.formula_id);
        setMessage("Jira Excel attachment retried");
      });
    },
    [headers, loadFormulaReviewRequests, runAction, setFormulaReviewRequests, setMessage],
  );

  const syncJiraReviewStatus = useCallback(
    async (reviewId: string) => {
      await runAction("Syncing Jira review", async () => {
        const review = await request<FormulaReviewRequest>(
          `/api/v1/formula-reviews/${reviewId}/sync`,
          {
            method: "POST",
            headers,
          },
        );
        setFormulaReviewRequests((current) =>
          current.map((item) => (item.id === review.id ? review : item)),
        );
        setMessage("Jira status synced");
      });
    },
    [headers, runAction, setFormulaReviewRequests, setMessage],
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
