import type { RawMaterial } from "./raw-material-model";
import {
  compareParameterCodes,
  normalizeParameterKey,
  PARAMETER_ORDER,
} from "./parameter-order";

export const PARAMETER_FAMILIES: Record<string, string[]> = {
  Macronutriente: ["Ntotal", "Norg", "Nnitr", "Nure", "Namo", "K2O", "P2O5"],
  Secundario: ["CaO", "MgO", "SO3"],
  Micronutriente: ["Zn", "Mn", "Fe", "Cu", "B", "Mo", "Co", "SiO2"],
  "Fraccion Organica": [
    "Mseca",
    "Morg",
    "Corg",
    "Extracto Humico total",
    "Acidos fulvicos",
    "Acidos húmicos",
    "Extracto de Algas",
    "Polisacaridos",
  ],
  Aminoacidos: ["Sum AA totales", "Sum AA libres"],
  Aminograma: [
    "Ac aspartico",
    "Ac glutamico",
    "Alanina",
    "Glicina",
    "Histidina",
    "Isoleucina",
    "Leucina",
    "Lisina",
    "Serina",
    "Tirosina",
    "Treonina",
    "Valina",
    "Arginina",
    "Fenilalanina",
    "Metionina",
    "Prolina",
    "Hidroxiprolina",
    "Triptofano",
  ],
  "Metales pesados": ["As", "Hg", "Pb", "Cd", "Cr", "Ni"],
};

export type ParameterViewPresetKey =
  | "core"
  | "macros"
  | "micros"
  | "secondary"
  | "organic"
  | "amino"
  | "metals"
  | "all"
  | "custom";

export type BuilderSectionKey = "basics" | "materials" | "formula" | "calculation" | "review";

export type CatalogParameterCondition = {
  id: string;
  code: string;
  min: string;
  max: string;
};

export const PARAMETER_VIEW_PRESETS: Array<{
  key: ParameterViewPresetKey;
  label: string;
  families: string[];
  helper: string;
}> = [
  {
    key: "core",
    label: "Esenciales",
    families: ["Macronutriente", "Micronutriente"],
    helper: "Macros y micros para decidir rapido.",
  },
  {
    key: "macros",
    label: "Macros",
    families: ["Macronutriente"],
    helper: "N, P, K y formas de nitrogeno.",
  },
  {
    key: "secondary",
    label: "Secundarios",
    families: ["Secundario"],
    helper: "Ca, Mg y azufre.",
  },
  {
    key: "micros",
    label: "Micros",
    families: ["Micronutriente"],
    helper: "Zn, Mn, Fe, Cu, B, Mo...",
  },
  {
    key: "organic",
    label: "Organica",
    families: ["Fraccion Organica"],
    helper: "Materia seca, carbono y extractos.",
  },
  {
    key: "amino",
    label: "Amino",
    families: ["Aminoacidos", "Aminograma"],
    helper: "Aminoacidos totales, libres y aminograma.",
  },
  {
    key: "metals",
    label: "Metales",
    families: ["Metales pesados"],
    helper: "As, Hg, Pb, Cd, Cr y Ni.",
  },
  {
    key: "all",
    label: "Todo",
    families: [],
    helper: "Todos los parametros disponibles.",
  },
  {
    key: "custom",
    label: "Personal",
    families: [],
    helper: "Elige parametro a parametro.",
  },
];

export const DEFAULT_BUILDER_SECTIONS: Record<BuilderSectionKey, boolean> = {
  basics: true,
  materials: false,
  formula: false,
  calculation: false,
  review: false,
};

export function normalizeParameterLookup(value: string | null | undefined) {
  return normalizeParameterKey(value ?? "");
}

export function parameterFamilyForCode(code: string) {
  const normalizedCode = normalizeParameterLookup(code);
  for (const [family, codes] of Object.entries(PARAMETER_FAMILIES)) {
    if (codes.some((candidate) => normalizeParameterLookup(candidate) === normalizedCode)) {
      return family;
    }
  }
  return "Otros";
}

export function parameterDisplayCode(code: string) {
  const normalizedCode = normalizeParameterLookup(code);
  const canonical = PARAMETER_ORDER.find(
    (candidate) => normalizeParameterLookup(candidate) === normalizedCode,
  );
  if (canonical) {
    return canonical;
  }
  return code;
}

export function formatFormulaNumber(value: number | null, suffix = "") {
  return value === null ? "-" : `${value.toFixed(2)}${suffix}`;
}

export function parameterFamilyRank(family: string) {
  const familyOrder = Object.keys(PARAMETER_FAMILIES);
  const index = familyOrder.indexOf(family);
  return index === -1 ? familyOrder.length : index;
}

export function formatParameterValue(
  parameter: { code: string; value: number; unit: string | null },
) {
  const unit = parameter.unit ? ` ${parameter.unit}` : "";
  return `${parameterDisplayCode(parameter.code)}: ${parameter.value.toFixed(2)}${unit}`;
}

export function parameterMatchesPositiveFilter(value: number, showOnlyPositive: boolean) {
  return !showOnlyPositive || Math.abs(value) > 0.0001;
}

export function materialParametersForView(
  material: RawMaterial,
  visibleParameterCodes: string[],
  showOnlyPositive: boolean,
  limit = 5,
) {
  const requestedCodes =
    visibleParameterCodes.length > 0
      ? visibleParameterCodes
      : Object.keys(material.parameters).sort(compareParameterCodes);
  return requestedCodes
    .map((code) => material.parameters[code])
    .filter((parameter): parameter is NonNullable<typeof parameter> => Boolean(parameter))
    .filter((parameter) => parameterMatchesPositiveFilter(parameter.value, showOnlyPositive))
    .sort((left, right) => {
      const familyDelta =
        parameterFamilyRank(parameterFamilyForCode(left.code)) -
        parameterFamilyRank(parameterFamilyForCode(right.code));
      if (familyDelta !== 0) {
        return familyDelta;
      }
      return compareParameterCodes(left.code, right.code);
    })
    .slice(0, limit);
}
