import type { CalculationResult, FormulaRead } from "./formula-model";
import type { SavedFormulaComparison } from "./workspace-comparison";

export type SavedFormulaComparisonConstraints = {
  maxPrice: number | null;
  parameterCode: string;
  minParameterValue: number | null;
  materialId: string;
  materialName: string;
  minMaterialPercentage: number | null;
  maxMaterialPercentage: number | null;
};

export type ConstraintStatus = "passed" | "failed" | "missing";

export type SavedFormulaConstraintEvaluation = {
  key: string;
  label: string;
  rule: string;
  unit: string | null;
  baselineValue: number | null;
  candidateValue: number | null;
  baselineStatus: ConstraintStatus;
  candidateStatus: ConstraintStatus;
  baselineExplanation: string | null;
  candidateExplanation: string | null;
};

export type ConstraintComplianceCounts = {
  passed: number;
  failed: number;
  missing: number;
  total: number;
  status: ConstraintStatus;
};

export type SavedFormulaComplianceSummary = {
  baseline: ConstraintComplianceCounts;
  candidate: ConstraintComplianceCounts;
  leader: "baseline" | "candidate" | "tie";
};

export function hasConstraintIssue(evaluation: SavedFormulaConstraintEvaluation) {
  return evaluation.baselineStatus !== "passed" || evaluation.candidateStatus !== "passed";
}

function evaluateMaximum(value: number | null, limit: number): ConstraintStatus {
  if (value === null) {
    return "missing";
  }
  return value <= limit ? "passed" : "failed";
}

function evaluateMinimum(value: number | null, limit: number): ConstraintStatus {
  if (value === null) {
    return "missing";
  }
  return value >= limit ? "passed" : "failed";
}

function formatConstraintAmount(value: number, unit: string | null) {
  if (unit === "%") {
    return `${value.toFixed(2)}%`;
  }
  return `${value.toFixed(2)}${unit ? ` ${unit}` : ""}`;
}

function maximumExplanation(value: number | null, limit: number, unit: string | null) {
  if (value === null) {
    return "Missing calculated value for this limit.";
  }
  if (value <= limit) {
    return null;
  }
  return `Reduce by ${formatConstraintAmount(value - limit, unit)} to meet the maximum.`;
}

function minimumExplanation(value: number | null, limit: number, unit: string | null) {
  if (value === null) {
    return "Missing calculated value for this limit.";
  }
  if (value >= limit) {
    return null;
  }
  return `Increase by ${formatConstraintAmount(limit - value, unit)} to meet the minimum.`;
}

function getParameterValue(result: CalculationResult, code: string) {
  return result.parameters.find((parameter) => parameter.code === code) ?? null;
}

function getMaterialPercentage(formula: FormulaRead, rawMaterialId: string) {
  return formula.items
    .filter((item) => item.raw_material_id === rawMaterialId)
    .reduce((sum, item) => sum + item.percentage, 0);
}

export function buildConstraintEvaluations(
  comparison: SavedFormulaComparison | null,
  constraints: SavedFormulaComparisonConstraints,
): SavedFormulaConstraintEvaluation[] {
  if (!comparison) {
    return [];
  }

  const evaluations: SavedFormulaConstraintEvaluation[] = [];
  if (constraints.maxPrice !== null) {
    const unit = `${comparison.candidateResult.currency}/kg`;
    evaluations.push({
      key: "price_total",
      label: "Price",
      rule: `<= ${constraints.maxPrice.toFixed(2)} ${comparison.candidateResult.currency}/kg`,
      unit,
      baselineValue: comparison.baselineResult.price_total,
      candidateValue: comparison.candidateResult.price_total,
      baselineStatus: evaluateMaximum(comparison.baselineResult.price_total, constraints.maxPrice),
      candidateStatus: evaluateMaximum(comparison.candidateResult.price_total, constraints.maxPrice),
      baselineExplanation: maximumExplanation(
        comparison.baselineResult.price_total,
        constraints.maxPrice,
        unit,
      ),
      candidateExplanation: maximumExplanation(
        comparison.candidateResult.price_total,
        constraints.maxPrice,
        unit,
      ),
    });
  }

  const parameterCode = constraints.parameterCode.trim();
  if (parameterCode && constraints.minParameterValue !== null) {
    const baselineParameter = getParameterValue(comparison.baselineResult, parameterCode);
    const candidateParameter = getParameterValue(comparison.candidateResult, parameterCode);
    const parameterUnit = candidateParameter?.unit ?? baselineParameter?.unit ?? null;
    evaluations.push({
      key: `parameter:${parameterCode}`,
      label: parameterCode,
      rule: `>= ${constraints.minParameterValue.toFixed(2)}${
        parameterUnit ? ` ${parameterUnit}` : ""
      }`,
      unit: parameterUnit,
      baselineValue: baselineParameter?.value ?? null,
      candidateValue: candidateParameter?.value ?? null,
      baselineStatus: evaluateMinimum(
        baselineParameter?.value ?? null,
        constraints.minParameterValue,
      ),
      candidateStatus: evaluateMinimum(
        candidateParameter?.value ?? null,
        constraints.minParameterValue,
      ),
      baselineExplanation: minimumExplanation(
        baselineParameter?.value ?? null,
        constraints.minParameterValue,
        parameterUnit,
      ),
      candidateExplanation: minimumExplanation(
        candidateParameter?.value ?? null,
        constraints.minParameterValue,
        parameterUnit,
      ),
    });
  }

  if (constraints.materialId && constraints.minMaterialPercentage !== null) {
    const baselineValue = getMaterialPercentage(comparison.baseline, constraints.materialId);
    const candidateValue = getMaterialPercentage(comparison.candidate, constraints.materialId);
    evaluations.push({
      key: `material:min:${constraints.materialId}`,
      label: `${constraints.materialName} min`,
      rule: `>= ${constraints.minMaterialPercentage.toFixed(2)}%`,
      unit: "%",
      baselineValue,
      candidateValue,
      baselineStatus: evaluateMinimum(baselineValue, constraints.minMaterialPercentage),
      candidateStatus: evaluateMinimum(candidateValue, constraints.minMaterialPercentage),
      baselineExplanation: minimumExplanation(
        baselineValue,
        constraints.minMaterialPercentage,
        "%",
      ),
      candidateExplanation: minimumExplanation(
        candidateValue,
        constraints.minMaterialPercentage,
        "%",
      ),
    });
  }

  if (constraints.materialId && constraints.maxMaterialPercentage !== null) {
    const baselineValue = getMaterialPercentage(comparison.baseline, constraints.materialId);
    const candidateValue = getMaterialPercentage(comparison.candidate, constraints.materialId);
    evaluations.push({
      key: `material:max:${constraints.materialId}`,
      label: `${constraints.materialName} max`,
      rule: `<= ${constraints.maxMaterialPercentage.toFixed(2)}%`,
      unit: "%",
      baselineValue,
      candidateValue,
      baselineStatus: evaluateMaximum(baselineValue, constraints.maxMaterialPercentage),
      candidateStatus: evaluateMaximum(candidateValue, constraints.maxMaterialPercentage),
      baselineExplanation: maximumExplanation(
        baselineValue,
        constraints.maxMaterialPercentage,
        "%",
      ),
      candidateExplanation: maximumExplanation(
        candidateValue,
        constraints.maxMaterialPercentage,
        "%",
      ),
    });
  }

  return evaluations;
}

function summarizeConstraintStatuses(statuses: ConstraintStatus[]): ConstraintComplianceCounts {
  const passed = statuses.filter((status) => status === "passed").length;
  const failed = statuses.filter((status) => status === "failed").length;
  const missing = statuses.filter((status) => status === "missing").length;
  return {
    passed,
    failed,
    missing,
    total: statuses.length,
    status: failed > 0 ? "failed" : missing > 0 ? "missing" : "passed",
  };
}

function compareCompliance(left: ConstraintComplianceCounts, right: ConstraintComplianceCounts) {
  if (left.passed !== right.passed) {
    return left.passed - right.passed;
  }
  if (left.failed !== right.failed) {
    return right.failed - left.failed;
  }
  return right.missing - left.missing;
}

export function buildConstraintComplianceSummary(
  evaluations: SavedFormulaConstraintEvaluation[],
): SavedFormulaComplianceSummary | null {
  if (!evaluations.length) {
    return null;
  }

  const baseline = summarizeConstraintStatuses(
    evaluations.map((evaluation) => evaluation.baselineStatus),
  );
  const candidate = summarizeConstraintStatuses(
    evaluations.map((evaluation) => evaluation.candidateStatus),
  );
  const comparison = compareCompliance(baseline, candidate);

  return {
    baseline,
    candidate,
    leader: comparison > 0 ? "baseline" : comparison < 0 ? "candidate" : "tie",
  };
}
