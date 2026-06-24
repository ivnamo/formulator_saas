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

export type JiraReviewPanelProps = {
  activeJiraConnection: JiraConnection | null;
  formulaReviewRequests: FormulaReviewRequest[];
  formulaReviewArtifacts: Record<string, FormulaReviewArtifact[]>;
  canSendCurrentFormulaToJira: boolean;
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
  canSendCurrentFormulaToJira,
  isBusy,
  onSendCurrentFormulaToJira,
  onGenerateReviewExcel,
  onDownloadArtifact,
  onSendReviewToJira,
  onSyncReviewStatus,
  onRetryReviewAttachment,
}: JiraReviewPanelProps) {
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
          data-track-click="jira_prepare_and_send_current_formula"
          data-track-section="jira_review"
          onClick={() => void onSendCurrentFormulaToJira()}
          disabled={!canSendCurrentFormulaToJira}
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
                  {review.snapshot.jira?.technical_result_raw ? (
                    <small>
                      Resultado I+D: {review.snapshot.jira.technical_result_raw}
                      {review.snapshot.jira.technical_result
                        ? ` (${review.snapshot.jira.technical_result})`
                        : ""}
                    </small>
                  ) : null}
                  {review.snapshot.iso?.design_project_id ? (
                    <small>ISO: {review.snapshot.iso.design_project_id}</small>
                  ) : null}
                </span>
                <div className="jiraReviewActions">
                  <button
                    className="iconButton"
                    type="button"
                    data-track-click="jira_review_generate_excel"
                    data-track-section="jira_review"
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
                      data-track-click="jira_review_download_excel"
                      data-track-section="jira_review"
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
                      data-track-click="jira_review_send"
                      data-track-section="jira_review"
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
                        data-track-click="jira_review_sync"
                        data-track-section="jira_review"
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
                          data-track-click="jira_review_retry_attachment"
                          data-track-section="jira_review"
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
                          data-track-click="jira_review_open_issue"
                          data-track-section="jira_review"
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
