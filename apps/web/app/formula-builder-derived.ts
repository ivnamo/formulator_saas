import {
  PARAMETER_VIEW_PRESETS,
  materialParametersForView,
  parameterFamilyForCode,
  parameterFamilyRank,
  parameterMatchesPositiveFilter,
  type ParameterViewPresetKey,
} from "./formula-builder-model";
import type {
  CalculationResult,
  FormulaLine,
  Parameter,
  RawMaterial,
} from "./workspace-model";

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

export type CalculationParameterRow = {
  code: string;
  value: number;
  unit: string | null;
  family: string;
  source: string;
};

export type LocalFormulaPreview = {
  priceTotal: number | null;
  parameters: CalculationParameterRow[];
  warnings: CalculationResult["warnings"];
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

export function buildLocalFormulaPreview(
  formulaLineDetails: FormulaLineDetail[],
  visibleParameterCodeSet: ReadonlySet<string>,
): LocalFormulaPreview {
  let priceTotal = 0;
  let hasMissingPrice = false;
  const parameterTotals = new Map<string, CalculationParameterRow>();
  const previewWarnings: CalculationResult["warnings"] = [];
  const previewTotal = formulaLineDetails.reduce((sum, line) => sum + line.percentage, 0);

  if (formulaLineDetails.length > 0 && Math.abs(previewTotal - 100) > 0.01) {
    previewWarnings.push({
      code: "total_percentage_not_100",
      message: `Formula percentage total is ${previewTotal.toFixed(2)}, expected 100.`,
      severity: "warning",
    });
  }

  for (const line of formulaLineDetails) {
    if (line.percentage <= 0) {
      continue;
    }
    if (!line.material) {
      previewWarnings.push({
        code: "missing_raw_material",
        message: `Formula line ${line.index + 1} has no raw material.`,
        severity: "warning",
      });
      continue;
    }
    if (line.material.price === null) {
      hasMissingPrice = true;
      previewWarnings.push({
        code: "missing_price",
        message: `${line.material.name} has no current price.`,
        severity: "warning",
      });
    } else {
      priceTotal += (line.material.price * line.percentage) / 100;
    }
    if (!line.material.isActive || line.material.isObsolete) {
      previewWarnings.push({
        code: "material_status",
        message: `${line.material.name} is ${line.material.isObsolete ? "obsolete" : "inactive"}.`,
        severity: line.material.isObsolete ? "blocker" : "warning",
      });
    }
    for (const parameter of Object.values(line.material.parameters)) {
      if (!visibleParameterCodeSet.has(parameter.code)) {
        continue;
      }
      const contribution = (parameter.value * line.percentage) / 100;
      const existing = parameterTotals.get(parameter.code);
      if (existing) {
        existing.value += contribution;
        continue;
      }
      parameterTotals.set(parameter.code, {
        code: parameter.code,
        value: contribution,
        unit: parameter.unit,
        family: parameterFamilyForCode(parameter.code),
        source: "Preview",
      });
    }
  }

  return {
    priceTotal: hasMissingPrice ? null : priceTotal,
    parameters: Array.from(parameterTotals.values()).sort(compareParameterRows),
    warnings: previewWarnings,
  };
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
    .filter((material) => !selectedIds.has(material.id));
}

export function getSelectedMaterial(
  selectedMaterialId: string | null,
  rawMaterialsById: ReadonlyMap<string, RawMaterial>,
) {
  return selectedMaterialId ? (rawMaterialsById.get(selectedMaterialId) ?? null) : null;
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
    .filter((material): material is RawMaterial => Boolean(material));
}

export function buildCalculationParameterRows(
  result: CalculationResult | null,
  localPreview: LocalFormulaPreview,
  visibleParameterCodeSet: ReadonlySet<string>,
  showOnlyPositiveParameters: boolean,
): CalculationParameterRow[] {
  const rows = result
    ? result.parameters.map((parameter) => ({
        ...parameter,
        family: parameterFamilyForCode(parameter.code),
        source: "Backend",
      }))
    : localPreview.parameters;

  return rows.filter((parameter) => {
    const visibleSelected = visibleParameterCodeSet.has(parameter.code);
    const positiveSelected = parameterMatchesPositiveFilter(
      parameter.value,
      showOnlyPositiveParameters,
    );
    return visibleSelected && positiveSelected;
  });
}

export function calculateFormulaTotalPercentage(formulaLines: FormulaLine[]) {
  return formulaLines.reduce((sum, line) => sum + line.percentage, 0);
}

export function isFormulaPercentageBalanced(totalPercentage: number) {
  return Math.abs(totalPercentage - 100) <= 0.01;
}

function compareParameterRows(
  left: { family: string; code: string },
  right: { family: string; code: string },
) {
  const familyDelta = parameterFamilyRank(left.family) - parameterFamilyRank(right.family);
  if (familyDelta !== 0) {
    return familyDelta;
  }
  return left.code.localeCompare(right.code);
}
