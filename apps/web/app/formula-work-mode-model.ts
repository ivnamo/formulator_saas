import type { FormulaBuilderMode } from "./formula-builder-model";

export type FormulaWorkModeOption = {
  mode: FormulaBuilderMode;
  label: string;
  helper: string;
  requiresLoadedFormula: boolean;
};

export const FORMULA_WORK_MODE_OPTIONS: FormulaWorkModeOption[] = [
  {
    mode: "new",
    label: "Formula nueva independiente",
    helper: "Crea otro registro y no pisa nada cargado.",
    requiresLoadedFormula: false,
  },
  {
    mode: "editing",
    label: "Modificar formula cargada",
    helper: "Actualiza el registro abierto en biblioteca.",
    requiresLoadedFormula: true,
  },
  {
    mode: "version",
    label: "Nueva version ligada",
    helper: "Crea otro registro enlazado al origen.",
    requiresLoadedFormula: true,
  },
];

export function formulaBuilderModeForDisplay(
  mode: FormulaBuilderMode,
  formulaId: string | null,
) {
  if (!formulaId) {
    return "new";
  }
  return mode;
}

export function formulaWorkKindIntent(
  mode: FormulaBuilderMode,
  hasLoadedFormula: boolean,
) {
  if (mode === "editing" && hasLoadedFormula) {
    return {
      title: "Modificacion de formula cargada",
      badge: "Editando existente",
      helper: "Guardar actualizara el registro abierto en biblioteca.",
      context: "Cualquier cambio sustituye los datos de esta misma formula.",
    };
  }
  if (mode === "version" && hasLoadedFormula) {
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

export function formatLoadedFormulaSource(
  name: string | null | undefined,
  version: number | null | undefined,
) {
  const cleanName = name?.trim() || "Formula sin nombre";
  return version ? `${cleanName} - v${version}` : cleanName;
}
