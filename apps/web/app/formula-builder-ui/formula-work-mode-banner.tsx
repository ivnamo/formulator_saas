import { suggestNextFormulaVersionName } from "../formula-version-name";
import {
  formatLoadedFormulaSource,
  formulaBuilderModeForDisplay,
  formulaWorkKindIntent,
} from "../formula-work-mode-model";
import type { WorkspaceState } from "../workspace-state-model";

type FormulaWorkModeValue = Pick<
  WorkspaceState,
  | "formulaId"
  | "formulaBaseName"
  | "formulaBaseVersion"
  | "formulaBuilderMode"
  | "formulaName"
>;

type FormulaWorkModeBannerProps = {
  values: FormulaWorkModeValue;
  isBusy: boolean;
  onChange: (patch: Partial<FormulaWorkModeValue>) => void;
};

export function FormulaWorkModeBanner({
  values,
  isBusy,
  onChange,
}: FormulaWorkModeBannerProps) {
  const hasLoadedFormula = Boolean(values.formulaId);
  const selectedMode = formulaBuilderModeForDisplay(
    values.formulaBuilderMode,
    values.formulaId,
  );
  const formulaName = values.formulaName.trim();
  const formulaBaseName = values.formulaBaseName?.trim() || formulaName;
  const suggestedVersionName = suggestNextFormulaVersionName(formulaBaseName);
  const canUseSuggestedVersionName =
    selectedMode === "version" &&
    Boolean(formulaBaseName) &&
    suggestedVersionName !== formulaName;
  const intent = formulaWorkKindIntent(selectedMode, hasLoadedFormula);
  const loadedFormulaLabel = formatLoadedFormulaSource(
    values.formulaBaseName,
    values.formulaBaseVersion,
  );

  return (
    <div className="formulaWorkModeBanner" data-mode={selectedMode} aria-live="polite">
      <div className="formulaWorkModeHeader">
        <div className="formulaWorkModeStatus">
          <span>Tipo de trabajo en Formula Builder</span>
          <strong>{intent.title}</strong>
          <small>{intent.helper}</small>
        </div>
        <span className="formulaWorkModeBadge">{intent.badge}</span>
      </div>
      <div className="formulaWorkModeSource">
        <span>{hasLoadedFormula ? "Formula cargada como origen" : "Formula cargada"}</span>
        <strong>
          {hasLoadedFormula ? loadedFormulaLabel : "Ninguna"}
        </strong>
        <small>{intent.context}</small>
      </div>
      {canUseSuggestedVersionName ? (
        <div className="formulaVersionSuggestion">
          <span>Nombre sugerido</span>
          <strong>{suggestedVersionName}</strong>
          <button
            type="button"
            className="compactButton"
            onClick={() => onChange({ formulaName: suggestedVersionName })}
            disabled={isBusy}
          >
            Usar sugerencia
          </button>
        </div>
      ) : null}
    </div>
  );
}
