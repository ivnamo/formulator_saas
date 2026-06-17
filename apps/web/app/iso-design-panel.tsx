import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Download,
  Eye,
  ExternalLink,
  FileSpreadsheet,
  Play,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  Upload,
} from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { FileDropzone } from "./file-dropzone";
import {
  isoFormatLabel,
  isoJiraIssueTypeLabels,
  isoLegacyImportFormatLabels,
  isoTechnicalResults,
  type IsoDesignProject,
  type IsoDesignProjectForm,
  type IsoDesignTrial,
  type IsoLegacyImportFormat,
  type IsoLegacyImportPreview,
  type IsoProductValidation,
  type IsoValidationCheck,
  type IsoTenantSettings,
} from "./iso-design-model";

type IsoDesignPanelProps = {
  active: boolean;
  settings: IsoTenantSettings | null;
  projects: IsoDesignProject[];
  trialsByProjectId: Record<string, IsoDesignTrial[]>;
  validationsByProjectId: Record<string, IsoProductValidation | null>;
  selectedProjectId: string;
  projectForm: IsoDesignProjectForm;
  legacyImportFormat: IsoLegacyImportFormat;
  legacyImportPreview: IsoLegacyImportPreview | null;
  legacyImportFileName: string;
  selectedLegacyImportSheet: string;
  isPreparedFromFormulaBuilder: boolean;
  isBusy: boolean;
  canEditTenantData: boolean;
  canManageIsoSettings: boolean;
  onSelectedProjectChange: (projectId: string) => void;
  onProjectFormChange: Dispatch<SetStateAction<IsoDesignProjectForm>>;
  onLoadIsoModule: () => void | Promise<void>;
  onEnableIsoModule: () => void | Promise<void>;
  onCreateIsoDesignProject: () => void | Promise<void>;
  onLegacyImportFormatChange: (format: IsoLegacyImportFormat) => void;
  onSelectLegacyImportFile: (file: File | null) => void | Promise<void>;
  onPreviewLegacyImportSheet: (sheetName: string) => void | Promise<void>;
  onApplyLegacyImport: () => void | Promise<void>;
  onCreateIsoProductValidation: (projectId: string, trialId: string) => void | Promise<void>;
  onUpdateIsoProductValidationChecks: (
    validationId: string,
    checks: IsoValidationCheck[],
  ) => void | Promise<void>;
  onPublishIsoProductValidation: (validationId: string) => void | Promise<void>;
  onExportIsoF1001: (year?: number | null) => void | Promise<void>;
  onExportIsoF1002: (projectId: string) => void | Promise<void>;
  onExportIsoF1003: (projectId: string) => void | Promise<void>;
  onExportIsoDossier: (projectId: string) => void | Promise<void>;
  onReturnToFormulaBuilder: () => void | Promise<void>;
};

export function IsoDesignPanel({
  active,
  settings,
  projects,
  trialsByProjectId,
  validationsByProjectId,
  selectedProjectId,
  projectForm,
  legacyImportFormat,
  legacyImportPreview,
  legacyImportFileName,
  selectedLegacyImportSheet,
  isPreparedFromFormulaBuilder,
  isBusy,
  canEditTenantData,
  canManageIsoSettings,
  onSelectedProjectChange,
  onProjectFormChange,
  onLoadIsoModule,
  onEnableIsoModule,
  onCreateIsoDesignProject,
  onLegacyImportFormatChange,
  onSelectLegacyImportFile,
  onPreviewLegacyImportSheet,
  onApplyLegacyImport,
  onCreateIsoProductValidation,
  onUpdateIsoProductValidationChecks,
  onPublishIsoProductValidation,
  onExportIsoF1001,
  onExportIsoF1002,
  onExportIsoF1003,
  onExportIsoDossier,
  onReturnToFormulaBuilder,
}: IsoDesignPanelProps) {
  const isEnabled = Boolean(settings?.enabled);
  const f1001Label = isoFormatLabel(settings, "f10_01", "F10-01");
  const f1002Label = isoFormatLabel(settings, "f10_02", "F10-02");
  const f1003Label = isoFormatLabel(settings, "f10_03", "F10-03");
  const issueTypes = isoJiraIssueTypeLabels(settings);
  const technicalResults = isoTechnicalResults(settings);
  const legacyImportRows = legacyImportPreview?.rows.slice(0, 8) ?? [];
  const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? null;
  const selectedTrials = selectedProject ? (trialsByProjectId[selectedProject.id] ?? []) : [];
  const selectedValidation = selectedProject
    ? (validationsByProjectId[selectedProject.id] ?? null)
    : null;
  const releasedTrials = selectedTrials.filter((trial) => trial.technical_result === "LIBERADO");
  const canPublishSelectedValidation =
    selectedValidation !== null &&
    selectedValidation.status !== "published" &&
    selectedValidation.validation_checks.every(
      (check) => !check.required || check.result === "ok",
    );
  const canApplyLegacyImport =
    isEnabled &&
    canEditTenantData &&
    !isBusy &&
    legacyImportPreview !== null &&
    legacyImportPreview.ready_rows > 0;
  const showFormulaBuilderReturn = isPreparedFromFormulaBuilder;

  return (
    <section id="iso" className="panel isoPanel" hidden={!active}>
      <div className="panelHeader">
        <h2>ISO 9001</h2>
        <span>{isEnabled ? `${projects.length} proyectos` : "Modulo desactivado"}</span>
      </div>

      <div className="isoToolbar">
        <div className="isoStatus" data-enabled={isEnabled}>
          <ShieldCheck size={18} />
          <strong>{isEnabled ? "Activo en este tenant" : "No activo en este tenant"}</strong>
        </div>
        <button
          className="secondaryButton"
          type="button"
          onClick={() => void onLoadIsoModule()}
          disabled={!canEditTenantData || isBusy}
        >
          <RefreshCw size={17} />
          Actualizar
        </button>
        <button
          className="secondaryButton"
          type="button"
          onClick={() => void onExportIsoF1001(selectedProject?.year ?? null)}
          disabled={!isEnabled || !canEditTenantData || isBusy}
        >
          <Download size={17} />
          Exportar {f1001Label}
        </button>
        {!isEnabled ? (
          <button
            className="primaryButton"
            type="button"
            onClick={() => void onEnableIsoModule()}
            disabled={!canManageIsoSettings || isBusy}
          >
            <ShieldCheck size={17} />
            Activar
          </button>
        ) : null}
      </div>

      <div className="isoConfigSummary" aria-label="ISO tenant configuration">
        <div>
          <span>Jira</span>
          <strong>{settings?.config.jira?.project_key ?? "-"}</strong>
        </div>
        <div>
          <span>Tipos formula</span>
          <strong>{issueTypes.length ? issueTypes.join(", ") : "-"}</strong>
        </div>
        <div>
          <span>Resultados I+D</span>
          <strong>{technicalResults.length ? technicalResults.join(", ") : "-"}</strong>
        </div>
        <div>
          <span>Formatos</span>
          <strong>
            {f1001Label}, {f1002Label}, {f1003Label}
          </strong>
        </div>
      </div>

      {isEnabled ? (
        <>
          <div className="isoImportSection" aria-label="ISO legacy import">
            <div className="isoImportHeader">
              <div>
                <span>Importacion historica</span>
                <strong>{legacyImportPreview ? `${legacyImportPreview.total_rows} filas` : "Sin preview"}</strong>
              </div>
              <div className="isoImportCounters">
                <span data-state="ready">{legacyImportPreview?.ready_rows ?? 0} ready</span>
                <span data-state="ambiguous">
                  {legacyImportPreview?.ambiguous_rows ?? 0} ambiguas
                </span>
              </div>
            </div>
            <div className="isoImportControls">
              <label>
                <span>Formato</span>
                <select
                  value={legacyImportFormat}
                  onChange={(event) =>
                    onLegacyImportFormatChange(event.target.value as IsoLegacyImportFormat)
                  }
                  disabled={!canEditTenantData || isBusy}
                >
                  {Object.entries(isoLegacyImportFormatLabels).map(([format, label]) => (
                    <option key={format} value={format}>
                      {isoFormatLabel(settings, format, label)}
                    </option>
                  ))}
                </select>
              </label>
              <FileDropzone
                accept=".xlsx"
                disabled={!canEditTenantData || isBusy}
                fileName={legacyImportFileName}
                helper="Solo .xlsx"
                label="Excel"
                onFile={onSelectLegacyImportFile}
              />
              <label>
                <span>Hoja</span>
                <select
                  value={selectedLegacyImportSheet}
                  onChange={(event) => void onPreviewLegacyImportSheet(event.target.value)}
                  disabled={
                    !canEditTenantData ||
                    isBusy ||
                    !legacyImportPreview ||
                    legacyImportPreview.available_sheets.length === 0
                  }
                >
                  <option value="">Todas</option>
                  {legacyImportPreview?.available_sheets.map((sheet) => (
                    <option key={sheet} value={sheet}>
                      {sheet}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="secondaryButton"
                type="button"
                onClick={() => void onPreviewLegacyImportSheet(selectedLegacyImportSheet)}
                disabled={!canEditTenantData || isBusy || !legacyImportFileName}
              >
                <Eye size={17} />
                Preview
              </button>
              <button
                className="primaryButton"
                type="button"
                onClick={() => void onApplyLegacyImport()}
                disabled={!canApplyLegacyImport}
              >
                <Play size={17} />
                Aplicar
              </button>
            </div>
            <div className="isoImportSummary">
              <div>
                <FileSpreadsheet size={17} />
                <strong>{legacyImportFileName || "-"}</strong>
              </div>
              <div>
                <Upload size={17} />
                <strong>{isoLegacyImportFormatLabels[legacyImportFormat]}</strong>
              </div>
            </div>
            {legacyImportPreview ? (
              <div className="isoImportTable">
                <div className="isoImportHead">
                  <span>Hoja</span>
                  <span>Fila</span>
                  <span>Registro</span>
                  <span>Accion</span>
                  <span>Estado</span>
                </div>
                {legacyImportRows.map((row) => (
                  <div
                    className="isoImportRow"
                    key={`${row.sheet_name}-${row.row_number}-${row.action}`}
                  >
                    <span>{row.sheet_name}</span>
                    <span>{row.row_number}</span>
                    <span>{row.record_key ?? "-"}</span>
                    <span>{row.action}</span>
                    <span className="isoPill" data-state={row.status}>
                      {row.message ?? row.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {showFormulaBuilderReturn ? (
            <div className="isoBuilderReturn" aria-label="Formula Builder return">
              <div>
                <span>Preparado desde Formula Builder</span>
                <strong>{projectForm.projectCode || "ProyectoID se generara al crear"}</strong>
              </div>
              <button
                className="secondaryButton"
                type="button"
                onClick={() => void onReturnToFormulaBuilder()}
                disabled={isBusy}
              >
                <ArrowLeft size={17} />
                Volver al Formula Builder
              </button>
            </div>
          ) : null}

          <div className="isoProjectForm" aria-label="Create ISO design project">
            <label>
              <span>{f1001Label} No Solicitud</span>
              <input
                value={projectForm.isoRequestNumber}
                placeholder="12/2026"
                onChange={(event) =>
                  onProjectFormChange((current) => ({
                    ...current,
                    isoRequestNumber: event.target.value,
                  }))
                }
                disabled={!canEditTenantData || isBusy}
              />
            </label>
            <label>
              <span>Ano</span>
              <input
                inputMode="numeric"
                value={projectForm.year}
                onChange={(event) =>
                  onProjectFormChange((current) => ({ ...current, year: event.target.value }))
                }
                disabled={!canEditTenantData || isBusy}
              />
            </label>
            <label>
              <span>ProyectoID autonumerico</span>
              <input
                value={projectForm.projectCode || "Se generara al crear"}
                disabled
              />
            </label>
            <label>
              <span>Producto</span>
              <input
                value={projectForm.productName}
                onChange={(event) =>
                  onProjectFormChange((current) => ({
                    ...current,
                    productName: event.target.value,
                  }))
                }
                disabled={!canEditTenantData || isBusy}
              />
            </label>
            <label>
              <span>Solicitante</span>
              <input
                value={projectForm.requester}
                onChange={(event) =>
                  onProjectFormChange((current) => ({
                    ...current,
                    requester: event.target.value,
                  }))
                }
                disabled={!canEditTenantData || isBusy}
              />
            </label>
            <label>
              <span>Tipo producto</span>
              <input
                value={projectForm.productType}
                onChange={(event) =>
                  onProjectFormChange((current) => ({
                    ...current,
                    productType: event.target.value,
                  }))
                }
                disabled={!canEditTenantData || isBusy}
              />
            </label>
            <label>
              <span>Pais</span>
              <input
                value={projectForm.destinationCountry}
                onChange={(event) =>
                  onProjectFormChange((current) => ({
                    ...current,
                    destinationCountry: event.target.value,
                  }))
                }
                disabled={!canEditTenantData || isBusy}
              />
            </label>
            <label>
              <span>Estado aceptacion</span>
              <select
                value={projectForm.acceptedStatus}
                onChange={(event) =>
                  onProjectFormChange((current) => ({
                    ...current,
                    acceptedStatus: event.target.value,
                  }))
                }
                disabled={!canEditTenantData || isBusy}
              >
                <option value="pending">Pendiente</option>
                <option value="accepted">Aceptado</option>
                <option value="rejected">Rechazado</option>
              </select>
            </label>
            <label>
              <span>Estado ciclo</span>
              <select
                value={projectForm.lifecycleStatus}
                onChange={(event) =>
                  onProjectFormChange((current) => ({
                    ...current,
                    lifecycleStatus: event.target.value,
                  }))
                }
                disabled={!canEditTenantData || isBusy}
              >
                <option value="intake">Entrada</option>
                <option value="planned">Planificado</option>
                <option value="in_progress">En curso</option>
                <option value="finished">Finalizado</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </label>
            <label>
              <span>Fin planificado</span>
              <input
                type="date"
                value={projectForm.plannedFinishAt}
                onChange={(event) =>
                  onProjectFormChange((current) => ({
                    ...current,
                    plannedFinishAt: event.target.value,
                  }))
                }
                disabled={!canEditTenantData || isBusy}
              />
            </label>
            <label className="isoWideField">
              <span>Necesidad</span>
              <textarea
                value={projectForm.need}
                onChange={(event) =>
                  onProjectFormChange((current) => ({ ...current, need: event.target.value }))
                }
                disabled={!canEditTenantData || isBusy}
              />
            </label>
            <label className="isoWideField">
              <span>Comentarios</span>
              <textarea
                value={projectForm.comments}
                onChange={(event) =>
                  onProjectFormChange((current) => ({
                    ...current,
                    comments: event.target.value,
                  }))
                }
                disabled={!canEditTenantData || isBusy}
              />
            </label>
            <label className="isoWideField">
              <span>Motivo rechazo</span>
              <input
                value={projectForm.rejectionReason}
                onChange={(event) =>
                  onProjectFormChange((current) => ({
                    ...current,
                    rejectionReason: event.target.value,
                  }))
                }
                disabled={!canEditTenantData || isBusy}
              />
            </label>
            <button
              className="primaryButton"
              type="button"
              onClick={() => void onCreateIsoDesignProject()}
              disabled={!canEditTenantData || isBusy}
            >
              <Plus size={17} />
              Crear {f1001Label}
            </button>
          </div>

          <div className="isoProjectTable">
            <div className="isoProjectHead">
              <span>{f1001Label}</span>
              <span>ProyectoID</span>
              <span>Producto</span>
              <span>Estado</span>
              <span>{f1002Label}</span>
              <span>{f1003Label}</span>
            </div>
            {projects.length === 0 ? (
              <div className="empty">No hay proyectos ISO todavia.</div>
            ) : (
              projects.map((project) => (
                <div className="isoProjectRow" key={project.id}>
                  <span>
                    <strong>{project.iso_request_number}</strong>
                    <small>{project.year}</small>
                  </span>
                  <code>{project.project_code ?? "-"}</code>
                  <span>
                    <strong>{project.product_name}</strong>
                    <small>{project.requester ?? "-"}</small>
                  </span>
                  <span className="isoPill" data-state={project.accepted_status}>
                    {project.accepted_status}
                  </span>
                  <span>{project.trial_count}</span>
                  <span>
                    <strong>
                      {validationsByProjectId[project.id]?.status === "published"
                        ? "Publicado"
                        : validationsByProjectId[project.id]
                          ? "Borrador"
                          : "Pendiente"}
                    </strong>
                    <small>{project.lifecycle_status}</small>
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="isoTrialSection">
            <div className="isoTrialHeader">
              <div>
                <span>{f1002Label}</span>
                <strong>{selectedTrials.length} ensayos</strong>
              </div>
              <button
                className="secondaryButton"
                type="button"
                onClick={() => void onExportIsoF1002(selectedProjectId)}
                disabled={!selectedProjectId || !canEditTenantData || isBusy}
              >
                <Download size={17} />
                Exportar {f1002Label}
              </button>
              <label>
                <span>Expediente</span>
                <select
                  value={selectedProjectId}
                  onChange={(event) => onSelectedProjectChange(event.target.value)}
                  disabled={!projects.length || isBusy}
                >
                  <option value="">Selecciona proyecto</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.iso_request_number} - {project.product_name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="isoTrialTable">
              <div className="isoTrialHead">
                <span>Ensayo</span>
                <span>Formula</span>
                <span>Resultado tecnico</span>
                <span>Jira</span>
                <span>Estado Jira</span>
              </div>
              {!selectedProject ? (
                <div className="empty">Selecciona un expediente para ver {f1002Label}.</div>
              ) : selectedTrials.length === 0 ? (
                <div className="empty">No hay ensayos F10-02 vinculados a este expediente.</div>
              ) : (
                selectedTrials.map((trial) => (
                  <div className="isoTrialRow" key={trial.id}>
                    <span>
                      <strong>{trial.trial_number ? `Ensayo ${trial.trial_number}` : "Ensayo"}</strong>
                      <small>{trial.trial_code ?? trial.id.slice(0, 8)}</small>
                    </span>
                    <span>
                      <strong>{trial.trial_name ?? "Formula review"}</strong>
                      <small>{trial.formula_version ? `v${trial.formula_version}` : "-"}</small>
                    </span>
                    <span className="isoPill" data-state={trial.technical_result}>
                      {trial.technical_result}
                    </span>
                    <span>
                      {trial.jira_issue_url ? (
                        <a
                          className="textLink"
                          href={trial.jira_issue_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <ExternalLink size={14} />
                          {trial.jira_issue_key ?? "Jira"}
                        </a>
                      ) : (
                        (trial.jira_issue_key ?? "-")
                      )}
                    </span>
                    <span>
                      <strong>{trial.raw_status_label ?? "-"}</strong>
                      <small>{trial.raw_result_label ?? trial.result_source}</small>
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="isoValidationSection">
            <div className="isoValidationHeader">
              <div>
                <span>{f1003Label}</span>
                <strong>
                  {selectedValidation
                    ? selectedValidation.status === "published"
                      ? "Publicado"
                      : "Borrador"
                    : "Sin validacion final"}
                </strong>
              </div>
              <div className="isoExportActions">
                <button
                  className="secondaryButton"
                  type="button"
                  onClick={() => void onExportIsoDossier(selectedProjectId)}
                  disabled={!selectedProjectId || !canEditTenantData || isBusy}
                >
                  <Download size={17} />
                  Dossier
                </button>
                {selectedValidation ? (
                  <button
                    className="secondaryButton"
                    type="button"
                    onClick={() => void onExportIsoF1003(selectedProjectId)}
                    disabled={!selectedProjectId || !canEditTenantData || isBusy}
                  >
                    <Download size={17} />
                    Exportar {f1003Label}
                  </button>
                ) : null}
                <button
                  className="primaryButton"
                  type="button"
                  onClick={() => {
                    if (selectedValidation) {
                      void onPublishIsoProductValidation(selectedValidation.id);
                    }
                  }}
                  disabled={
                    !selectedValidation ||
                    !canEditTenantData ||
                    isBusy ||
                    !canPublishSelectedValidation
                  }
                >
                  <Send size={17} />
                  Publicar {f1003Label}
                </button>
              </div>
            </div>

            {!selectedProject ? (
              <div className="empty">Selecciona un expediente para ver {f1003Label}.</div>
            ) : selectedValidation ? (
              <>
                <div className="isoValidationSummary">
                  <div>
                    <span>Producto</span>
                    <strong>{selectedValidation.product_name}</strong>
                  </div>
                  <div>
                    <span>Formula OK</span>
                    <strong>{selectedValidation.formula_ok ?? "-"}</strong>
                  </div>
                  <div>
                    <span>Ensayo liberado</span>
                    <strong>
                      {selectedTrials.find(
                        (trial) => trial.id === selectedValidation.released_trial_id,
                      )?.trial_code ?? selectedValidation.released_trial_id.slice(0, 8)}
                    </strong>
                  </div>
                  <div>
                    <span>Fecha validacion</span>
                    <strong>{formatIsoDateTime(selectedValidation.validation_at)}</strong>
                  </div>
                </div>
                <div className="isoValidationTable">
                  <div className="isoValidationHead">
                    <span>Area</span>
                    <span>Aspecto</span>
                    <span>Requerido</span>
                    <span>Resultado</span>
                  </div>
                  {selectedValidation.validation_checks.map((check, index) => (
                    <div className="isoValidationRow" key={`${check.area}-${check.aspect}`}>
                      <span>{check.area}</span>
                      <span>{check.aspect}</span>
                      <span>{check.required ? "Si" : "No"}</span>
                      <select
                        value={check.result}
                        onChange={(event) => {
                          const checks = selectedValidation.validation_checks.map(
                            (current, currentIndex) =>
                              currentIndex === index
                                ? { ...current, result: event.target.value }
                                : current,
                          );
                          void onUpdateIsoProductValidationChecks(
                            selectedValidation.id,
                            checks,
                          );
                        }}
                        disabled={
                          !canEditTenantData ||
                          isBusy ||
                          selectedValidation.status === "published"
                        }
                      >
                        <option value="pending">Pendiente</option>
                        <option value="ok">OK</option>
                        <option value="nok">NOK</option>
                        <option value="not_applicable">No aplica</option>
                      </select>
                    </div>
                  ))}
                </div>
              </>
            ) : releasedTrials.length === 0 ? (
              <div className="isoValidationEmpty">
                <CheckCircle2 size={20} />
                <strong>No hay formula LIBERADA para {f1003Label}.</strong>
                <span>
                  Cuando Jira devuelva Resultado I+D LIBERADO, el ensayo F10-02 sera candidato.
                </span>
              </div>
            ) : (
              <div className="isoReleasedTrialList">
                {releasedTrials.map((trial) => (
                  <button
                    className="secondaryButton"
                    type="button"
                    key={trial.id}
                    onClick={() =>
                      void onCreateIsoProductValidation(selectedProject.id, trial.id)
                    }
                    disabled={!canEditTenantData || isBusy}
                  >
                    <CheckCircle2 size={17} />
                    Crear {f1003Label} desde {trial.trial_code ?? trial.trial_name ?? "ensayo"}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="isoInactive">
          <ClipboardCheck size={22} />
          <strong>ISO 9001 no esta activo para este tenant.</strong>
          <span>Atlantica debe aparecer activo; otros tenants pueden mantenerlo apagado.</span>
        </div>
      )}
    </section>
  );
}

function formatIsoDateTime(value: string | null): string {
  if (!value) {
    return "-";
  }
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}
