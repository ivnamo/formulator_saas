import type { BuilderSectionKey } from "../formula-builder-model";
import type { WorkspaceState } from "../workspace-model";
import { BuilderStep } from "./builder-step";

export type FormulaBasicsValue = Pick<
  WorkspaceState,
  | "formulaName"
  | "formulaJiraProjectId"
  | "formulaJiraIssueType"
  | "formulaJiraProductType"
>;

type FormulaBasicsStepProps = {
  isOpen: boolean;
  isBusy: boolean;
  hasActiveJiraConnection: boolean;
  values: FormulaBasicsValue;
  onToggle: (section: BuilderSectionKey) => void;
  onChange: (patch: Partial<FormulaBasicsValue>) => void;
};

export function FormulaBasicsStep({
  isOpen,
  isBusy,
  hasActiveJiraConnection,
  values,
  onToggle,
  onChange,
}: FormulaBasicsStepProps) {
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
            <span>ProyectoID Jira opcional</span>
            <input
              placeholder="FLOWER"
              value={values.formulaJiraProjectId}
              onChange={(event) => onChange({ formulaJiraProjectId: event.target.value })}
              disabled={isBusy}
            />
          </label>
          <label>
            <span>Jira activity</span>
            <input
              list="jira-activity-options"
              value={values.formulaJiraIssueType}
              onChange={(event) => onChange({ formulaJiraIssueType: event.target.value })}
              disabled={isBusy}
            />
          </label>
          <label>
            <span>Tipo producto</span>
            <input
              list="jira-product-type-options"
              value={values.formulaJiraProductType}
              onChange={(event) => onChange({ formulaJiraProductType: event.target.value })}
              disabled={isBusy}
            />
          </label>
          <datalist id="jira-activity-options">
            <option value="Calidad" />
            <option value="Prototipo" />
            <option value="PoC" />
          </datalist>
          <datalist id="jira-product-type-options">
            <option value="Nuevo" />
            <option value="Mod A" />
            <option value="Mod B" />
            <option value="Mod C" />
          </datalist>
        </div>
      ) : null}
    </BuilderStep>
  );
}
