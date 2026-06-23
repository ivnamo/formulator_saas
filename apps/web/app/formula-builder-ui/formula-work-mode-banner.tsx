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

  return (
    <div className="formulaWorkModeBanner" data-mode={selectedMode} aria-live="polite">
      <div className="formulaWorkModeStatus">
        <span>Modo de trabajo</span>
        <strong>{modeLabel(selectedMode)}</strong>
        <small>{modeHelper(selectedMode)}</small>
      </div>
      <div className="formulaWorkModeSource">
        <span>{hasLoadedFormula ? "Formula cargada" : "Sin formula cargada"}</span>
        <strong>
          {hasLoadedFormula ? formulaName || "Formula sin nombre" : "Creando desde cero"}
        </strong>
        <small>{modeContext(hasLoadedFormula)}</small>
      </div>
      <div
        className="formulaModeChoices formulaModeChoicesCompact"
        aria-label="Modo de Formula Builder"
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
    label: "Nueva",
    helper: "Guarda otro registro",
    requiresLoadedFormula: false,
  },
  {
    mode: "editing",
    label: "Modificar",
    helper: "Actualiza la cargada",
    requiresLoadedFormula: true,
  },
  {
    mode: "version",
    label: "Version",
    helper: "Guarda una version",
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
    return "Modificacion";
  }
  if (mode === "version") {
    return "Nueva version";
  }
  return "Formula nueva";
}

function modeHelper(mode: FormulaBuilderMode) {
  if (mode === "editing") {
    return "Guardar pisara la formula abierta en biblioteca.";
  }
  if (mode === "version") {
    return "Guardar creara otro registro desde la formula cargada.";
  }
  return "Guardar creara una formula nueva en biblioteca.";
}

function modeContext(hasLoadedFormula: boolean) {
  if (hasLoadedFormula) {
    return "Elige antes de guardar si quieres actualizarla o crear otra formula/version.";
  }
  return "Modificar y versionar se activan al abrir una formula desde biblioteca o importacion.";
}
