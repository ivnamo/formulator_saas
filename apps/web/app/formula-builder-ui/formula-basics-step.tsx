import type { BuilderSectionKey } from "../formula-builder-model";
import {
  formatLoadedFormulaSource,
  FORMULA_WORK_MODE_OPTIONS,
  formulaBuilderModeForDisplay,
  formulaWorkKindIntent,
} from "../formula-work-mode-model";
import type { IsoDesignProject } from "../iso-design-model";
import type { WorkspaceState } from "../workspace-state-model";
import { BuilderStep } from "./builder-step";
import { FormulaIsoLinkPanel } from "./formula-iso-link-panel";

export type FormulaBasicsValue = Pick<
  WorkspaceState,
  | "formulaId"
  | "formulaBaseName"
  | "formulaBaseVersion"
  | "formulaBuilderMode"
  | "formulaName"
  | "formulaJiraDescription"
  | "formulaJiraProjectId"
  | "formulaJiraIssueType"
  | "formulaJiraProductType"
>;

export type FormulaBasicsStepProps = {
  isOpen: boolean;
  isBusy: boolean;
  hasActiveJiraConnection: boolean;
  values: FormulaBasicsValue;
  jiraProjectIdOptions: Array<{ value: string; label: string }>;
  jiraIssueTypeOptions: string[];
  jiraProductTypeOptions: string[];
  isoDesignProjects: IsoDesignProject[];
  selectedIsoDesignProjectId: string;
  onToggle: (section: BuilderSectionKey) => void;
  onChange: (patch: Partial<FormulaBasicsValue>) => void;
  onSelectedIsoDesignProjectChange: (projectId: string) => void;
  onPrepareIsoProject: () => void | Promise<void>;
};

export function FormulaBasicsStep({
  isOpen,
  isBusy,
  hasActiveJiraConnection,
  values,
  jiraProjectIdOptions,
  jiraIssueTypeOptions,
  jiraProductTypeOptions,
  isoDesignProjects,
  selectedIsoDesignProjectId,
  onToggle,
  onChange,
  onSelectedIsoDesignProjectChange,
  onPrepareIsoProject,
}: FormulaBasicsStepProps) {
  const issueTypeOptions = withCurrentOption(jiraIssueTypeOptions, values.formulaJiraIssueType);
  const productTypeOptions = withCurrentOption(
    jiraProductTypeOptions,
    values.formulaJiraProductType,
  );
  const projectIdOptions = withCurrentProjectOption(
    jiraProjectIdOptions,
    values.formulaJiraProjectId,
  );
  const hasLoadedFormula = Boolean(values.formulaId);
  const selectedMode = formulaBuilderModeForDisplay(
    values.formulaBuilderMode,
    values.formulaId,
  );
  const workIntent = formulaWorkKindIntent(selectedMode, hasLoadedFormula);
  const sourceLabel = formatLoadedFormulaSource(
    values.formulaBaseName,
    values.formulaBaseVersion,
  );
  const isQualityJiraIssueType =
    values.formulaJiraIssueType.trim().toLowerCase() === "calidad";
  return (
    <BuilderStep
      section="basics"
      title="1. Datos basicos"
      summary="Nombre de formula y, solo si procede, datos de revision."
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <div className="formulaWorkTypeField" data-mode={selectedMode}>
        <div className="formulaWorkTypeHeader">
          <div>
            <span>
              Tipo de trabajo <span className="requiredMark">*</span>
            </span>
            <strong>{workIntent.title}</strong>
            <small>
              {hasLoadedFormula
                ? `Origen cargado: ${sourceLabel}.`
                : "Sin formula cargada: solo puedes crear una formula nueva."}
            </small>
          </div>
          <span className="formulaWorkModeBadge">{workIntent.badge}</span>
        </div>
        <div className="formulaModeChoices" role="group" aria-label="Tipo de trabajo">
          {FORMULA_WORK_MODE_OPTIONS.map((option) => {
            const isLocked = option.requiresLoadedFormula && !hasLoadedFormula;
            const isSelected = selectedMode === option.mode;
            return (
              <button
                key={option.mode}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onChange({ formulaBuilderMode: option.mode })}
                disabled={isBusy || isLocked}
                title={
                  isLocked ? "Abre una formula desde Biblioteca para activar este modo." : undefined
                }
              >
                <span>{option.label}</span>
                <small>{isLocked ? "Requiere formula cargada" : option.helper}</small>
              </button>
            );
          })}
        </div>
        <small className="formulaWorkTypeHelp">{workIntent.helper}</small>
      </div>
      <label className="fullWidthLabel">
        <span>
          Nombre <span className="requiredMark">*</span>
        </span>
        <input
          aria-required="true"
          placeholder="Nombre de formula"
          value={values.formulaName}
          onChange={(event) => onChange({ formulaName: event.target.value })}
          disabled={isBusy}
        />
      </label>
      <label className="fullWidthLabel">
        <span>
          Descripcion <span className="requiredMark">*</span>
        </span>
        <textarea
          aria-required="true"
          placeholder="Describe objetivo, cambio, uso previsto o contexto tecnico de la formula."
          rows={3}
          value={values.formulaJiraDescription}
          onChange={(event) => onChange({ formulaJiraDescription: event.target.value })}
          disabled={isBusy}
        />
      </label>
      {hasActiveJiraConnection ? (
        <div className="formulaMetaGrid">
          <label>
            <span>
              ProyectoID{" "}
              {isQualityJiraIssueType ? <span className="requiredMark">*</span> : null}
            </span>
            <select
              aria-label="ProyectoID"
              aria-required={isQualityJiraIssueType}
              value={values.formulaJiraProjectId}
              onChange={(event) => onChange({ formulaJiraProjectId: event.target.value })}
              disabled={isBusy}
            >
              <option value="">Sin ProyectoID</option>
              {projectIdOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <small>
              {isQualityJiraIssueType
                ? "Obligatorio para enviar una formula de Calidad a Jira."
                : "Opcional para este issue type; se puede asociar mas tarde."}
            </small>
          </label>
          <label>
            <span>
              Issue type Jira <span className="requiredMark">*</span>
            </span>
            <select
              aria-required="true"
              value={values.formulaJiraIssueType}
              onChange={(event) => onChange({ formulaJiraIssueType: event.target.value })}
              disabled={isBusy}
            >
              {issueTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>
              Tipo producto <span className="requiredMark">*</span>
            </span>
            <select
              aria-required="true"
              value={values.formulaJiraProductType}
              onChange={(event) => onChange({ formulaJiraProductType: event.target.value })}
              disabled={isBusy}
            >
              {productTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}
      {hasActiveJiraConnection ? (
        <FormulaIsoLinkPanel
          formulaJiraProjectId={values.formulaJiraProjectId}
          formulaJiraIssueType={values.formulaJiraIssueType}
          isoDesignProjects={isoDesignProjects}
          selectedIsoDesignProjectId={selectedIsoDesignProjectId}
          isBusy={isBusy}
          onSelectedIsoDesignProjectChange={onSelectedIsoDesignProjectChange}
          onPrepareIsoProject={onPrepareIsoProject}
        />
      ) : null}
    </BuilderStep>
  );
}

function withCurrentOption(options: string[], current: string) {
  const cleanedOptions = options.map((option) => option.trim()).filter(Boolean);
  const cleanedCurrent = current.trim();
  if (cleanedCurrent && !cleanedOptions.includes(cleanedCurrent)) {
    return [cleanedCurrent, ...cleanedOptions];
  }
  return cleanedOptions;
}

function withCurrentProjectOption(
  options: Array<{ value: string; label: string }>,
  current: string,
) {
  const cleanedCurrent = current.trim();
  if (!cleanedCurrent || options.some((option) => option.value === cleanedCurrent)) {
    return options;
  }
  return [{ value: cleanedCurrent, label: cleanedCurrent }, ...options];
}
