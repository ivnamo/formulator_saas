import type { BuilderSectionKey, FormulaBuilderMode } from "../formula-builder-model";
import type { IsoDesignProject } from "../iso-design-model";
import type { WorkspaceState } from "../workspace-state-model";
import { BuilderStep } from "./builder-step";
import { FormulaIsoLinkPanel } from "./formula-iso-link-panel";

export type FormulaBasicsValue = Pick<
  WorkspaceState,
  | "formulaId"
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
  const selectedMode = modeForDisplay(values.formulaBuilderMode, values.formulaId);
  const hasLoadedFormula = Boolean(values.formulaId);

  return (
    <BuilderStep
      section="basics"
      title="1. Datos basicos"
      summary="Nombre de formula y, solo si procede, datos de revision."
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <div className="formulaModePanel">
        <div className="formulaModeCopy">
          <span>Decision de guardado</span>
          <strong>{modeLabel(selectedMode)}</strong>
          <small>{modeHelper(selectedMode)}</small>
          <em>{modeContext(hasLoadedFormula)}</em>
        </div>
        <div className="formulaModeChoices" aria-label="Modo de Formula Builder">
          {formulaModeOptions.map((option) => {
            const isLocked = option.requiresLoadedFormula && !hasLoadedFormula;
            return (
              <button
                key={option.mode}
                type="button"
                aria-pressed={selectedMode === option.mode}
                onClick={() => onChange({ formulaBuilderMode: option.mode })}
                disabled={isBusy || isLocked}
                title={isLocked ? "Carga una formula de biblioteca para activar este modo." : undefined}
              >
                <span>{option.label}</span>
                <small>{isLocked ? "Requiere formula cargada" : option.helper}</small>
              </button>
            );
          })}
        </div>
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
              ProyectoID <span className="requiredMark">*</span>
            </span>
            <select
              aria-label="ProyectoID"
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

const formulaModeOptions: Array<{
  mode: FormulaBuilderMode;
  label: string;
  helper: string;
  requiresLoadedFormula: boolean;
}> = [
  {
    mode: "new",
    label: "Formula nueva",
    helper: "Guarda un registro nuevo",
    requiresLoadedFormula: false,
  },
  {
    mode: "editing",
    label: "Modificar cargada",
    helper: "Actualiza la formula abierta",
    requiresLoadedFormula: true,
  },
  {
    mode: "version",
    label: "Crear version",
    helper: "Guarda otra formula desde la cargada",
    requiresLoadedFormula: true,
  },
];

function modeForDisplay(mode: FormulaBuilderMode, formulaId: string | null) {
  if (!formulaId) {
    return "new";
  }
  return mode;
}

function modeLabel(mode: FormulaBuilderMode) {
  if (mode === "editing") {
    return "Modificacion de formula cargada";
  }
  if (mode === "version") {
    return "Nueva version de formula cargada";
  }
  return "Formula nueva";
}

function modeHelper(mode: FormulaBuilderMode) {
  if (mode === "editing") {
    return "Guardar actualizara la formula abierta en biblioteca.";
  }
  if (mode === "version") {
    return "Guardar creara otra formula a partir de la cargada.";
  }
  return "Guardar creara una formula nueva en biblioteca.";
}

function modeContext(hasLoadedFormula: boolean) {
  if (hasLoadedFormula) {
    return "Hay una formula cargada: elige si quieres pisarla o crear otra version antes de guardar.";
  }
  return "Sin formula cargada: estas creando desde cero; modificar y versionar se activan al abrir una formula.";
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
