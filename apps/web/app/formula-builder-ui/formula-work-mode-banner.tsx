import type { FormulaBuilderMode } from "../formula-builder-model";
import type { WorkspaceState } from "../workspace-state-model";

type FormulaWorkModeValue = Pick<
  WorkspaceState,
  "formulaId" | "formulaBuilderMode" | "formulaName"
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
  const intent = modeIntent(selectedMode, hasLoadedFormula);

  return (
    <div className="formulaWorkModeBanner" data-mode={selectedMode} aria-live="polite">
      <div className="formulaWorkModeStatus">
        <span>Operacion al guardar</span>
        <strong>{intent.label}</strong>
        <small>{intent.helper}</small>
      </div>
      <div className="formulaWorkModeSource">
        <span>{hasLoadedFormula ? "Formula base cargada" : "Formula base"}</span>
        <strong>
          {hasLoadedFormula ? formulaName || "Formula sin nombre" : "Creando desde cero"}
        </strong>
        <small>{intent.context}</small>
      </div>
      <div
        className="formulaModeChoices formulaModeChoicesCompact"
        aria-label="Operacion al guardar en Formula Builder"
      >
        {formulaModeOptions.map((option) => {
          const isLocked = option.requiresLoadedFormula && !hasLoadedFormula;
          return (
            <button
              key={option.mode}
              type="button"
              aria-pressed={selectedMode === option.mode}
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
    helper: "No pisa la cargada",
    requiresLoadedFormula: false,
  },
  {
    mode: "editing",
    label: "Modificar cargada",
    helper: "Actualiza la cargada",
    requiresLoadedFormula: true,
  },
  {
    mode: "version",
    label: "Nueva version",
    helper: "Crea otro registro",
    requiresLoadedFormula: true,
  },
];

function modeForDisplay(mode: FormulaBuilderMode, formulaId: string | null) {
  if (!formulaId) {
    return "new";
  }
  return mode;
}

function modeIntent(mode: FormulaBuilderMode, hasLoadedFormula: boolean) {
  if (mode === "editing") {
    return {
      label: "Modificar formula cargada",
      helper: "Guardar actualizara el registro abierto en biblioteca.",
      context: "Usalo cuando quieres que esta misma formula quede cambiada.",
    };
  }
  if (mode === "version") {
    return {
      label: "Guardar como nueva version",
      helper: "Guardar creara otro registro basado en la formula cargada.",
      context: "La formula cargada se conserva como origen de trabajo.",
    };
  }
  if (hasLoadedFormula) {
    return {
      label: "Guardar como formula nueva",
      helper: "Guardar creara otro registro y no pisara la formula cargada.",
      context: "Usalo para duplicar o derivar una formula sin tocar la original.",
    };
  }
  return {
    label: "Crear formula nueva",
    helper: "Guardar creara una formula nueva en biblioteca.",
    context: "Modificar y versionar se activan al abrir una formula desde biblioteca.",
  };
}
