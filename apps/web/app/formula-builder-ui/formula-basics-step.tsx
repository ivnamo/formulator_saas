import type { BuilderSectionKey } from "../formula-builder-model";
import type { WorkspaceState } from "../workspace-state-model";
import { BuilderStep } from "./builder-step";

export type FormulaBasicsValue = Pick<
  WorkspaceState,
  | "formulaName"
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
  onToggle: (section: BuilderSectionKey) => void;
  onChange: (patch: Partial<FormulaBasicsValue>) => void;
};

export function FormulaBasicsStep({
  isOpen,
  isBusy,
  hasActiveJiraConnection,
  values,
  jiraProjectIdOptions,
  jiraIssueTypeOptions,
  jiraProductTypeOptions,
  onToggle,
  onChange,
}: FormulaBasicsStepProps) {
  const issueTypeOptions = withCurrentOption(jiraIssueTypeOptions, values.formulaJiraIssueType);
  const productTypeOptions = withCurrentOption(
    jiraProductTypeOptions,
    values.formulaJiraProductType,
  );

  return (
    <BuilderStep
      section="basics"
      title="1. Datos basicos"
      summary="Nombre de formula y, solo si procede, datos de revision."
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <label className="fullWidthLabel">
        <span>Name</span>
        <input
          value={values.formulaName}
          onChange={(event) => onChange({ formulaName: event.target.value })}
          disabled={isBusy}
        />
      </label>
      {hasActiveJiraConnection ? (
        <div className="formulaMetaGrid">
          <label>
            <span>ProyectoID</span>
            <input
              aria-label="ProyectoID"
              list="jira-project-id-options"
              placeholder="Selecciona un ProyectoID"
              value={values.formulaJiraProjectId}
              onChange={(event) => onChange({ formulaJiraProjectId: event.target.value })}
              disabled={isBusy}
            />
          </label>
          <label>
            <span>Issue type Jira</span>
            <select
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
            <span>Tipo producto</span>
            <select
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
          <datalist id="jira-project-id-options">
            {jiraProjectIdOptions.map((option) => (
              <option key={option.value} value={option.value} label={option.label} />
            ))}
          </datalist>
        </div>
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
