import {
  parameterFamilyForCode,
  parameterFamilyRank,
  parameterMatchesPositiveFilter,
} from "./formula-builder-model";
import type { CalculationResult, FormulaLine, RawMaterial } from "./workspace-model";

type PreviewFormulaLineDetail = FormulaLine & {
  index: number;
  material?: RawMaterial;
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

export function buildLocalFormulaPreview(
  formulaLineDetails: PreviewFormulaLineDetail[],
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

export function compareParameterRows(
  left: { family: string; code: string },
  right: { family: string; code: string },
) {
  const familyDelta = parameterFamilyRank(left.family) - parameterFamilyRank(right.family);
  if (familyDelta !== 0) {
    return familyDelta;
  }
  return left.code.localeCompare(right.code);
}
