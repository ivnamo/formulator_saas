import {
  materialParametersForView,
  parameterFamilyForCode,
  PARAMETER_VIEW_PRESETS,
  type ParameterViewPresetKey,
} from "./formula-builder-model";
import { compareParameterRows } from "./formula-builder-preview";
import { isSelectableRawMaterial, type RawMaterial } from "./raw-material-model";
import type { FormulaLine, Parameter } from "./workspace-base-model";

export type FormulaLineDetail = FormulaLine & {
  index: number;
  material?: RawMaterial;
};

export type ParameterCatalogItem = {
  code: string;
  name: string;
  unit: string | null;
  family: string;
  materialCount: number;
  positiveMaterialCount: number;
};

export function buildRawMaterialsById(rawMaterials: RawMaterial[]) {
  return new Map(rawMaterials.map((material) => [material.id, material]));
}

export function buildFormulaLineDetails(
  formulaLines: FormulaLine[],
  rawMaterialsById: ReadonlyMap<string, RawMaterial>,
): FormulaLineDetail[] {
  return formulaLines.map((line, index) => ({
    ...line,
    index,
    material: rawMaterialsById.get(line.rawMaterialId),
  }));
}

export function buildParameterCatalog(
  parameters: Parameter[],
  rawMaterials: RawMaterial[],
): ParameterCatalogItem[] {
  const catalog = new Map<string, ParameterCatalogItem>();
  for (const parameter of parameters) {
    catalog.set(parameter.code, {
      code: parameter.code,
      name: parameter.name,
      unit: parameter.unit,
      family: parameterFamilyForCode(parameter.code),
      materialCount: 0,
      positiveMaterialCount: 0,
    });
  }

  for (const material of rawMaterials) {
    if (!isSelectableRawMaterial(material)) {
      continue;
    }
    for (const parameter of Object.values(material.parameters)) {
      const existing = catalog.get(parameter.code);
      if (existing) {
        existing.materialCount += 1;
        if (Math.abs(parameter.value) > 0.0001) {
          existing.positiveMaterialCount += 1;
        }
        continue;
      }
      catalog.set(parameter.code, {
        code: parameter.code,
        name: parameter.name,
        unit: parameter.unit,
        family: parameterFamilyForCode(parameter.code),
        materialCount: 1,
        positiveMaterialCount: Math.abs(parameter.value) > 0.0001 ? 1 : 0,
      });
    }
  }

  return Array.from(catalog.values()).sort(compareParameterRows);
}

export function selectVisibleParameterCodes(
  parameterCatalog: ParameterCatalogItem[],
  parameterViewPreset: ParameterViewPresetKey,
  customParameterCodes: string[],
) {
  const preset = PARAMETER_VIEW_PRESETS.find((option) => option.key === parameterViewPreset);
  if (!preset || preset.key === "all") {
    return parameterCatalog.map((parameter) => parameter.code);
  }
  if (preset.key === "custom") {
    return customParameterCodes.filter((code) =>
      parameterCatalog.some((parameter) => parameter.code === code),
    );
  }
  return parameterCatalog
    .filter((parameter) => preset.families.includes(parameter.family))
    .map((parameter) => parameter.code);
}

export function formatVisibleParameterSummary(visibleParameterCodes: string[]) {
  return visibleParameterCodes.length === 0
    ? "Sin parametros seleccionados"
    : `${visibleParameterCodes.length} parametros visibles`;
}

export function buildMaterialSearchResults(
  catalogMaterialIds: string[],
  rawMaterialsById: ReadonlyMap<string, RawMaterial>,
  formulaLines: FormulaLine[],
) {
  const selectedIds = new Set(formulaLines.map((line) => line.rawMaterialId));
  return catalogMaterialIds
    .map((id) => rawMaterialsById.get(id))
    .filter((material): material is RawMaterial => Boolean(material))
    .filter(isSelectableRawMaterial)
    .filter((material) => !selectedIds.has(material.id));
}

export function getSelectedMaterial(
  selectedMaterialId: string | null,
  rawMaterialsById: ReadonlyMap<string, RawMaterial>,
) {
  if (!selectedMaterialId) {
    return null;
  }
  const material = rawMaterialsById.get(selectedMaterialId) ?? null;
  return material && isSelectableRawMaterial(material) ? material : null;
}

export function getSelectedMaterialParameters(
  selectedMaterial: RawMaterial | null,
  visibleParameterCodes: string[],
  showOnlyPositiveParameters: boolean,
) {
  return selectedMaterial
    ? materialParametersForView(
        selectedMaterial,
        visibleParameterCodes,
        showOnlyPositiveParameters,
        200,
      )
    : [];
}

export function buildComparisonMaterials(
  comparisonMaterialIds: string[],
  rawMaterialsById: ReadonlyMap<string, RawMaterial>,
) {
  return comparisonMaterialIds
    .map((id) => rawMaterialsById.get(id))
    .filter((material): material is RawMaterial => Boolean(material))
    .filter(isSelectableRawMaterial);
}
