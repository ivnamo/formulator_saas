export const PARAMETER_ORDER = [
  "Ntotal",
  "Norg",
  "Nnitr",
  "Nure",
  "Namo",
  "K2O",
  "P2O5",
  "CaO",
  "MgO",
  "SO3",
  "Zn",
  "Mn",
  "Fe",
  "Cu",
  "B",
  "Mo",
  "Co",
  "SiO2",
  "Mseca",
  "Morg",
  "Corg",
  "Extracto Húmico total",
  "Acidos fulvicos",
  "Acidos húmicos",
  "Extracto de Algas",
  "Polisacaridos",
  "Sum AA totales",
  "Sum AA libres",
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
  "As",
  "Hg",
  "Pb",
  "Cd",
  "Cr",
  "Ni",
] as const;

const PARAMETER_INDEX = new Map(
  PARAMETER_ORDER.map((code, index) => [normalizeParameterKey(code), index]),
);

export function normalizeParameterKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

export function parameterOrderIndex(value: string): number {
  return PARAMETER_INDEX.get(normalizeParameterKey(value)) ?? 10_000;
}

export function compareParameterCodes(left: string, right: string): number {
  const leftIndex = parameterOrderIndex(left);
  const rightIndex = parameterOrderIndex(right);
  if (leftIndex !== rightIndex) {
    return leftIndex - rightIndex;
  }
  return normalizeParameterKey(left).localeCompare(normalizeParameterKey(right));
}

export function sortByParameterCode<T>(
  values: T[],
  getCode: (value: T) => string,
): T[] {
  return [...values].sort((left, right) => compareParameterCodes(getCode(left), getCode(right)));
}
