import {
  Download,
  ExternalLink,
  FileSpreadsheet,
  RefreshCw,
  Send,
} from "lucide-react";
import type { FormulaReviewArtifact, FormulaReviewRequest } from "../formula-model";
import type { JiraConnection } from "../jira-connection-model";
import { formatDateTime } from "../workspace-utils";

type JiraReviewPanelProps = {
  activeJiraConnection: JiraConnection | null;
  formulaReviewRequests: FormulaReviewRequest[];
  formulaReviewArtifacts: Record<string, FormulaReviewArtifact[]>;
  canPrepareJiraReview: boolean;
  isBusy: boolean;
  onSendCurrentFormulaToJira: () => void | Promise<void>;
  onGenerateReviewExcel: (reviewId: string) => void | Promise<void>;
  onDownloadArtifact: (artifact: FormulaReviewArtifact) => void | Promise<void>;
  onSendReviewToJira: (reviewId: string) => void | Promise<void>;
  onSyncReviewStatus: (reviewId: string) => void | Promise<void>;
  onRetryReviewAttachment: (reviewId: string) => void | Promise<void>;
};

export function JiraReviewPanel({
  activeJiraConnection,
  formulaReviewRequests,
  formulaReviewArtifacts,
  canPrepareJiraReview,
  isBusy,
  onSendCurrentFormulaToJira,
  onGenerateReviewExcel,
  onDownloadArtifact,
  onSendReviewToJira,
  onSyncReviewStatus,
  onRetryReviewAttachment,
}: JiraReviewPanelProps) {
  if (!activeJiraConnection && formulaReviewRequests.length === 0) {
    return null;
  }

  return (
    <div className="jiraReviewBox">
      <div className="jiraReviewHeader">
        <div>
          <span>Jira review</span>
          <strong>{activeJiraConnection ? "Configured" : "Not configured"}</strong>
        </div>
        <button
          className="secondaryButton"
          type="button"
          onClick={() => void onSendCurrentFormulaToJira()}
          disabled={!canPrepareJiraReview}
        >
          <Send size={16} />
          Send to Jira
        </button>
      </div>
      {formulaReviewRequests.length === 0 ? (
        <div className="jiraReviewEmpty">No Jira review prepared for this formula.</div>
      ) : (
        <div className="jiraReviewList">
          {formulaReviewRequests.map((review) => {
            const excelArtifact =
              (formulaReviewArtifacts[review.id] ?? []).find(
                (artifact) => artifact.artifact_type === "jira_review_xlsx",
              ) ?? null;

            return (
              <div className="jiraReviewRow" key={review.id}>
                <code>{review.review_status}</code>
                <span>
                  <strong>{review.snapshot.jira?.issue_summary ?? "Formula review"}</strong>
                  {review.snapshot.jira?.project_key ?? "-"} - v{review.formula_version} -{" "}
                  {formatDateTime(review.created_at)}
                  <small>
                    {review.jira_issue_key
                      ? `${review.jira_issue_key} - ${excelArtifact?.file_name ?? "Excel pending"}`
                      : (excelArtifact?.file_name ?? "Excel pending")}
                  </small>
                </span>
                <div className="jiraReviewActions">
                  <button
                    className="iconButton"
                    type="button"
                    onClick={() => void onGenerateReviewExcel(review.id)}
                    disabled={isBusy}
                    title="Generate Excel"
                    aria-label="Generate Jira review Excel"
                  >
                    <FileSpreadsheet size={16} />
                  </button>
                  {excelArtifact ? (
                    <button
                      className="iconButton"
                      type="button"
                      onClick={() => void onDownloadArtifact(excelArtifact)}
                      disabled={isBusy}
                      title="Download Excel"
                      aria-label="Download Jira review Excel"
                    >
                      <Download size={16} />
                    </button>
                  ) : null}
                  {!review.jira_issue_key ? (
                    <button
                      className="iconButton"
                      type="button"
                      onClick={() => void onSendReviewToJira(review.id)}
                      disabled={isBusy}
                      title="Send to Jira"
                      aria-label="Send review to Jira"
                    >
                      <Send size={16} />
                    </button>
                  ) : (
                    <>
                      <button
                        className="iconButton"
                        type="button"
                        onClick={() => void onSyncReviewStatus(review.id)}
                        disabled={isBusy}
                        title="Sync Jira status"
                        aria-label="Sync Jira status"
                      >
                        <RefreshCw size={16} />
                      </button>
                      {review.review_status === "partial_failure" ? (
                        <button
                          className="iconButton"
                          type="button"
                          onClick={() => void onRetryReviewAttachment(review.id)}
                          disabled={isBusy}
                          title="Retry Excel attachment"
                          aria-label="Retry Jira Excel attachment"
                        >
                          <RefreshCw size={16} />
                        </button>
                      ) : null}
                      {review.jira_issue_url ? (
                        <a
                          className="iconButton"
                          href={review.jira_issue_url}
                          target="_blank"
                          rel="noreferrer"
                          title="Open Jira issue"
                          aria-label="Open Jira issue"
                        >
                          <ExternalLink size={16} />
                        </a>
                      ) : null}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
