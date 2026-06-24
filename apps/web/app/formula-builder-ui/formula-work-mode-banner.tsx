import type { FormulaBuilderMode } from "../formula-builder-model";
import { suggestNextFormulaVersionName } from "../formula-version-name";
import type { WorkspaceState } from "../workspace-state-model";

type FormulaWorkModeValue = Pick<
  WorkspaceState,
  "formulaId" | "formulaBaseName" | "formulaBuilderMode" | "formulaName"
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
  const selectedMode = modeForDisplay(values.formulaBuilderMode, values.formulaId);
  const formulaName = values.formulaName.trim();
  const formulaBaseName = values.formulaBaseName?.trim() || formulaName;
  const suggestedVersionName = suggestNextFormulaVersionName(formulaBaseName);
  const canUseSuggestedVersionName =
    selectedMode === "version" &&
    Boolean(formulaBaseName) &&
    suggestedVersionName !== formulaName;
  const intent = workKindIntent(selectedMode, hasLoadedFormula);

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
          {hasLoadedFormula ? formulaBaseName || "Formula sin nombre" : "Ninguna"}
        </strong>
        <small>{intent.context}</small>
      </div>
      <div className="formulaWorkModeDecision">
        <span>Indica que estas haciendo</span>
        <div
          className="formulaModeChoices formulaModeChoicesCompact"
          aria-label="Tipo de trabajo en Formula Builder"
        >
          {formulaModeOptions.map((option) => {
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
                  isLocked ? "Carga una formula de biblioteca para activar este modo." : undefined
                }
              >
                <span>{option.label}</span>
                <small>{isLocked ? "Requiere formula cargada" : option.helper}</small>
              </button>
            );
          })}
        </div>
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

const formulaModeOptions: Array<{
  mode: FormulaBuilderMode;
  label: string;
  helper: string;
  requiresLoadedFormula: boolean;
}> = [
  {
    mode: "new",
    label: "Nueva independiente",
    helper: "Crea registro nuevo",
    requiresLoadedFormula: false,
  },
  {
    mode: "editing",
    label: "Modificar cargada",
    helper: "Actualiza el registro",
    requiresLoadedFormula: true,
  },
  {
    mode: "version",
    label: "Nueva version",
    helper: "Liga con el origen",
    requiresLoadedFormula: true,
  },
];

function modeForDisplay(mode: FormulaBuilderMode, formulaId: string | null) {
  if (!formulaId) {
    return "new";
  }
  return mode;
}

function workKindIntent(mode: FormulaBuilderMode, hasLoadedFormula: boolean) {
  if (mode === "editing") {
    return {
      title: "Modificacion de formula cargada",
      badge: "Editando existente",
      helper: "Guardar actualizara el registro abierto en biblioteca.",
      context: "Cualquier cambio sustituye los datos de esta misma formula.",
    };
  }
  if (mode === "version") {
    return {
      title: "Nueva version ligada",
      badge: "Version",
      helper: "Guardar creara otro registro ligado a la formula cargada.",
      context: "La formula cargada se conserva y queda como origen.",
    };
  }
  if (hasLoadedFormula) {
    return {
      title: "Formula nueva independiente",
      badge: "Nueva",
      helper: "Guardar creara otro registro y no pisara la formula cargada.",
      context: "La formula cargada solo sirve como punto de partida visual.",
    };
  }
  return {
    title: "Formula nueva desde cero",
    badge: "Nueva",
    helper: "Guardar creara una formula nueva en biblioteca.",
    context: "Modificar y versionar se activan al abrir una formula desde biblioteca.",
  };
}
