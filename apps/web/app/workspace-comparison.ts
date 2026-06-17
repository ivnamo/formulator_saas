import type { CalculationResult, FormulaRead } from "./formula-model";
import { compareParameterCodes } from "./parameter-order";
import type { FormulaLine } from "./workspace-base-model";

export {
  buildConstraintComplianceSummary,
  buildConstraintEvaluations,
  hasConstraintIssue,
} from "./workspace-comparison-constraints";
export type {
  ConstraintComplianceCounts,
  ConstraintStatus,
  SavedFormulaComparisonConstraints,
  SavedFormulaComplianceSummary,
  SavedFormulaConstraintEvaluation,
} from "./workspace-comparison-constraints";

export type DraftReviewLineSnapshot = {
  rawMaterialId: string;
  name: string;
  percentage: number;
};

export type DraftReviewState = {
  candidateName: string;
  baselineLines: DraftReviewLineSnapshot[];
  baselineResult: CalculationResult;
  reviewedResult: CalculationResult | null;
  requiredParameterCodes: string[];
  status: "pending" | "confirmed";
  notes: string;
};

export type DraftLineComparison = {
  rawMaterialId: string;
  name: string;
  proposed: number;
  reviewed: number;
  delta: number;
};

export type DraftComparison = {
  priceDelta: number | null;
  totalDelta: number;
  proposedLineCount: number;
  reviewedLineCount: number;
  lineChanges: DraftLineComparison[];
};

export type SavedFormulaParameterComparison = {
  code: string;
  baseline: number | null;
  candidate: number | null;
  unit: string | null;
  delta: number | null;
};

export type SavedFormulaComparison = {
  baseline: FormulaRead;
  candidate: FormulaRead;
  baselineResult: CalculationResult;
  candidateResult: CalculationResult;
  priceDelta: number | null;
  totalDelta: number;
  lineChanges: DraftLineComparison[];
  parameterChanges: SavedFormulaParameterComparison[];
};

function addLineTotal(
  totals: Map<string, { name: string; percentage: number }>,
  rawMaterialId: string,
  name: string,
  percentage: number,
) {
  const current = totals.get(rawMaterialId);
  totals.set(rawMaterialId, {
    name: current?.name ?? name,
    percentage: (current?.percentage ?? 0) + percentage,
  });
}

export function buildDraftComparison(
  review: DraftReviewState | null,
  currentLines: FormulaLine[],
  rawMaterialsById: Map<string, { name: string }>,
): DraftComparison | null {
  if (!review?.reviewedResult) {
    return null;
  }

  const proposedTotals = new Map<string, { name: string; percentage: number }>();
  review.baselineLines.forEach((line) =>
    addLineTotal(proposedTotals, line.rawMaterialId, line.name, line.percentage),
  );

  const reviewedTotals = new Map<string, { name: string; percentage: number }>();
  currentLines.forEach((line) =>
    addLineTotal(
      reviewedTotals,
      line.rawMaterialId,
      rawMaterialsById.get(line.rawMaterialId)?.name ?? "Unknown material",
      line.percentage,
    ),
  );

  const materialIds = Array.from(
    new Set([...proposedTotals.keys(), ...reviewedTotals.keys()]),
  );
  const lineChanges = materialIds
    .map((rawMaterialId) => {
      const proposed = proposedTotals.get(rawMaterialId);
      const reviewed = reviewedTotals.get(rawMaterialId);
      const proposedPercentage = proposed?.percentage ?? 0;
      const reviewedPercentage = reviewed?.percentage ?? 0;
      return {
        rawMaterialId,
        name: reviewed?.name ?? proposed?.name ?? "Unknown material",
        proposed: proposedPercentage,
        reviewed: reviewedPercentage,
        delta: reviewedPercentage - proposedPercentage,
      };
    })
    .filter((line) => Math.abs(line.delta) >= 0.0001)
    .sort((left, right) => left.name.localeCompare(right.name));

  return {
    priceDelta:
      review.baselineResult.price_total === null ||
      review.reviewedResult.price_total === null
        ? null
        : review.reviewedResult.price_total - review.baselineResult.price_total,
    totalDelta: review.reviewedResult.total_percentage - review.baselineResult.total_percentage,
    proposedLineCount: review.baselineLines.length,
    reviewedLineCount: currentLines.length,
    lineChanges,
  };
}

function materialLabel(rawMaterialId: string, rawMaterialsById: Map<string, { name: string }>) {
  return rawMaterialsById.get(rawMaterialId)?.name ?? `Material ${rawMaterialId.slice(0, 8)}`;
}

export function buildSavedFormulaComparison(
  baseline: FormulaRead,
  candidate: FormulaRead,
  baselineResult: CalculationResult,
  candidateResult: CalculationResult,
  rawMaterialsById: Map<string, { name: string }>,
): SavedFormulaComparison {
  const baselineTotals = new Map<string, { name: string; percentage: number }>();
  baseline.items.forEach((item) =>
    addLineTotal(
      baselineTotals,
      item.raw_material_id,
      materialLabel(item.raw_material_id, rawMaterialsById),
      item.percentage,
    ),
  );

  const candidateTotals = new Map<string, { name: string; percentage: number }>();
  candidate.items.forEach((item) =>
    addLineTotal(
      candidateTotals,
      item.raw_material_id,
      materialLabel(item.raw_material_id, rawMaterialsById),
      item.percentage,
    ),
  );

  const materialIds = Array.from(
    new Set([...baselineTotals.keys(), ...candidateTotals.keys()]),
  );
  const lineChanges = materialIds
    .map((rawMaterialId) => {
      const baselineLine = baselineTotals.get(rawMaterialId);
      const candidateLine = candidateTotals.get(rawMaterialId);
      const baselinePercentage = baselineLine?.percentage ?? 0;
      const candidatePercentage = candidateLine?.percentage ?? 0;
      return {
        rawMaterialId,
        name:
          candidateLine?.name ??
          baselineLine?.name ??
          materialLabel(rawMaterialId, rawMaterialsById),
        proposed: baselinePercentage,
        reviewed: candidatePercentage,
        delta: candidatePercentage - baselinePercentage,
      };
    })
    .filter((line) => Math.abs(line.delta) >= 0.0001)
    .sort((left, right) => left.name.localeCompare(right.name));

  const baselineParameters = new Map(
    baselineResult.parameters.map((parameter) => [parameter.code, parameter]),
  );
  const candidateParameters = new Map(
    candidateResult.parameters.map((parameter) => [parameter.code, parameter]),
  );
  const parameterCodes = Array.from(
    new Set([...baselineParameters.keys(), ...candidateParameters.keys()]),
  );
  const parameterChanges = parameterCodes.sort(compareParameterCodes).map((code) => {
    const baselineParameter = baselineParameters.get(code);
    const candidateParameter = candidateParameters.get(code);
    const baselineValue = baselineParameter?.value ?? null;
    const candidateValue = candidateParameter?.value ?? null;
    return {
      code,
      baseline: baselineValue,
      candidate: candidateValue,
      unit: candidateParameter?.unit ?? baselineParameter?.unit ?? null,
      delta:
        baselineValue === null || candidateValue === null
          ? null
          : candidateValue - baselineValue,
    };
  });

  return {
    baseline,
    candidate,
    baselineResult,
    candidateResult,
    priceDelta:
      baselineResult.price_total === null || candidateResult.price_total === null
        ? null
        : candidateResult.price_total - baselineResult.price_total,
    totalDelta: candidateResult.total_percentage - baselineResult.total_percentage,
    lineChanges,
    parameterChanges,
  };
}
