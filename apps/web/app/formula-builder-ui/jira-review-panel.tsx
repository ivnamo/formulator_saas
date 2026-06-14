import {
  ClipboardCheck,
  Download,
  ExternalLink,
  FileSpreadsheet,
  RefreshCw,
  Send,
} from "lucide-react";
import type { FormulaReviewArtifact, FormulaReviewRequest } from "../formula-model";
import type { IsoDesignProject } from "../iso-design-model";
import type { JiraConnection } from "../jira-connection-model";
import { formatDateTime } from "../workspace-utils";

type JiraReviewPanelProps = {
  activeJiraConnection: JiraConnection | null;
  formulaReviewRequests: FormulaReviewRequest[];
  formulaReviewArtifacts: Record<string, FormulaReviewArtifact[]>;
  isoDesignProjects: IsoDesignProject[];
  formulaJiraProjectId: string;
  formulaJiraIssueType: string;
  selectedIsoDesignProjectId: string;
  canPrepareJiraReview: boolean;
  isBusy: boolean;
  onSelectedIsoDesignProjectChange: (projectId: string) => void;
  onPrepareIsoProject: () => void | Promise<void>;
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
  isoDesignProjects,
  formulaJiraProjectId,
  formulaJiraIssueType,
  selectedIsoDesignProjectId,
  canPrepareJiraReview,
  isBusy,
  onSelectedIsoDesignProjectChange,
  onPrepareIsoProject,
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

  const isQualityFormula = formulaJiraIssueType.trim().toLowerCase() === "calidad";
  const normalizedFormulaProjectId = formulaJiraProjectId.trim();
  const selectedIsoProject =
    isoDesignProjects.find((project) => project.id === selectedIsoDesignProjectId) ?? null;
  const canLinkIso = isQualityFormula;
  const isMissingRequiredIsoProject = isQualityFormula && !selectedIsoProject;
  const canSendToJira = canPrepareJiraReview && !isMissingRequiredIsoProject;

  return (
    <div className="jiraReviewBox">
      <div className="jiraReviewHeader">
        <div>
          <span>Jira review</span>
          <strong>{activeJiraConnection ? "Configured" : "Not configured"}</strong>
        </div>
        {isoDesignProjects.length ? (
          <label className="jiraIsoSelector">
            <span>Expediente ISO</span>
            <select
              value={selectedIsoDesignProjectId}
              onChange={(event) => onSelectedIsoDesignProjectChange(event.target.value)}
              disabled={isBusy || !canLinkIso || normalizedFormulaProjectId.length === 0}
            >
              <option value="">Sin expediente ISO</option>
              {isoDesignProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.project_code ? `${project.project_code} - ` : ""}
                  {project.iso_request_number} - {project.product_name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <button
          className="secondaryButton"
          type="button"
          onClick={() => void onSendCurrentFormulaToJira()}
          disabled={!canSendToJira}
        >
          <Send size={16} />
          Send to Jira
        </button>
      </div>
      <div className="jiraIsoLinkStatus" data-state={selectedIsoProject ? "linked" : "missing"}>
        {selectedIsoProject ? (
          <>
            <strong>ISO enlazada por ProyectoID {selectedIsoProject.project_code}</strong>
            <span>
              {selectedIsoProject.iso_request_number} - {selectedIsoProject.product_name}. Esta
              formula de Calidad creara/actualizara F10-02 en ese expediente.
            </span>
          </>
        ) : isQualityFormula ? (
          <>
            <strong>
              {normalizedFormulaProjectId
                ? `Sin expediente ISO para ProyectoID ${normalizedFormulaProjectId}`
                : "Sin ProyectoID ISO"}
            </strong>
            <span>
              {normalizedFormulaProjectId
                ? "Crea o importa primero el F10-01 de ese ProyectoID para que la formula de Calidad se registre como F10-02."
                : "Crea el F10-01 desde aqui; el sistema generara el ProyectoID y lo asignara a la formula al volver al builder."}
            </span>
            <button
              className="secondaryButton"
              type="button"
              onClick={() => void onPrepareIsoProject()}
              disabled={isBusy}
            >
              <ClipboardCheck size={16} />
              Crear F10-01
            </button>
          </>
        ) : (
          <>
            <strong>ISO no aplica a esta formula</strong>
            <span>Solo se vinculan automaticamente formulas con issue type Jira Calidad.</span>
          </>
        )}
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
