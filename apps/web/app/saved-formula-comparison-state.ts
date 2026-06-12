import { useMemo, useState } from "react";
import {
  buildConstraintComplianceSummary,
  buildConstraintEvaluations,
  hasConstraintIssue,
  type SavedFormulaComparison,
} from "./workspace-comparison";
import {
  normalizeCode,
  parseOptionalNumber,
  type FormulaRead,
  type RawMaterial,
} from "./workspace-model";

export type FormulaCompareSelection = {
  baselineId: string;
  candidateId: string;
};

export type FormulaCompareSelectionField = keyof FormulaCompareSelection;

export type ComparisonConstraintForm = {
  maxPrice: string;
  parameterCode: string;
  minParameterValue: string;
  materialId: string;
  minMaterialPercentage: string;
  maxMaterialPercentage: string;
};

export type ComparisonConstraintField = keyof ComparisonConstraintForm;

type ComparisonMaterialOption = {
  id: string;
  name: string;
};

type SavedFormulaComparisonDerivedStateOptions = {
  formulas: FormulaRead[];
  rawMaterials: RawMaterial[];
  formulaCompareSelection: FormulaCompareSelection;
  comparisonConstraintForm: ComparisonConstraintForm;
  savedFormulaComparison: SavedFormulaComparison | null;
  showOnlyConstraintIssues: boolean;
};

const defaultFormulaCompareSelection: FormulaCompareSelection = {
  baselineId: "",
  candidateId: "",
};

const defaultComparisonConstraintForm: ComparisonConstraintForm = {
  maxPrice: "",
  parameterCode: "active_content",
  minParameterValue: "",
  materialId: "",
  minMaterialPercentage: "",
  maxMaterialPercentage: "",
};

export function useSavedFormulaComparisonState() {
  const [formulaCompareSelection, setFormulaCompareSelection] =
    useState<FormulaCompareSelection>(defaultFormulaCompareSelection);
  const [comparisonConstraintForm, setComparisonConstraintForm] =
    useState<ComparisonConstraintForm>(defaultComparisonConstraintForm);
  const [showOnlyConstraintIssues, setShowOnlyConstraintIssues] = useState(false);
  const [savedFormulaComparison, setSavedFormulaComparison] =
    useState<SavedFormulaComparison | null>(null);

  function selectFormulaForComparison(
    field: FormulaCompareSelectionField,
    formulaId: string,
  ) {
    setFormulaCompareSelection((current) => ({
      ...current,
      [field]: formulaId,
    }));
    setSavedFormulaComparison(null);
  }

  function updateComparisonConstraint(field: ComparisonConstraintField, value: string) {
    setComparisonConstraintForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function resetSavedFormulaComparisonState() {
    setFormulaCompareSelection(defaultFormulaCompareSelection);
    setComparisonConstraintForm(defaultComparisonConstraintForm);
    setShowOnlyConstraintIssues(false);
    setSavedFormulaComparison(null);
  }

  return {
    formulaCompareSelection,
    comparisonConstraintForm,
    showOnlyConstraintIssues,
    savedFormulaComparison,
    selectFormulaForComparison,
    updateComparisonConstraint,
    resetSavedFormulaComparisonState,
    setShowOnlyConstraintIssues,
    setSavedFormulaComparison,
  };
}

export function useSavedFormulaComparisonDerivedState({
  formulas,
  rawMaterials,
  formulaCompareSelection,
  comparisonConstraintForm,
  savedFormulaComparison,
  showOnlyConstraintIssues,
}: SavedFormulaComparisonDerivedStateOptions) {
  const comparisonMaterialOptions = useMemo<ComparisonMaterialOption[]>(() => {
    const options = new Map<string, string>();
    rawMaterials.forEach((material) => options.set(material.id, material.name));
    const selectedFormulaIds = new Set([
      formulaCompareSelection.baselineId,
      formulaCompareSelection.candidateId,
    ]);
    formulas
      .filter((formula) => selectedFormulaIds.has(formula.id))
      .flatMap((formula) => formula.items)
      .forEach((item) => {
        if (!options.has(item.raw_material_id)) {
          options.set(item.raw_material_id, `Material ${item.raw_material_id.slice(0, 8)}`);
        }
      });
    return Array.from(options, ([id, name]) => ({ id, name })).sort((left, right) =>
      left.name.localeCompare(right.name),
    );
  }, [formulaCompareSelection, formulas, rawMaterials]);

  const comparisonConstraints = useMemo(
    () => ({
      maxPrice: parseOptionalNumber(comparisonConstraintForm.maxPrice),
      parameterCode: normalizeCode(comparisonConstraintForm.parameterCode),
      minParameterValue: parseOptionalNumber(comparisonConstraintForm.minParameterValue),
      materialId: comparisonConstraintForm.materialId,
      materialName:
        comparisonMaterialOptions.find(
          (material) => material.id === comparisonConstraintForm.materialId,
        )?.name ?? "Selected material",
      minMaterialPercentage: parseOptionalNumber(comparisonConstraintForm.minMaterialPercentage),
      maxMaterialPercentage: parseOptionalNumber(comparisonConstraintForm.maxMaterialPercentage),
    }),
    [comparisonConstraintForm, comparisonMaterialOptions],
  );

  const comparisonConstraintEvaluations = useMemo(
    () => buildConstraintEvaluations(savedFormulaComparison, comparisonConstraints),
    [comparisonConstraints, savedFormulaComparison],
  );
  const comparisonComplianceSummary = useMemo(
    () => buildConstraintComplianceSummary(comparisonConstraintEvaluations),
    [comparisonConstraintEvaluations],
  );
  const comparisonConstraintIssueCount = useMemo(
    () => comparisonConstraintEvaluations.filter(hasConstraintIssue).length,
    [comparisonConstraintEvaluations],
  );
  const visibleComparisonConstraintEvaluations = useMemo(
    () =>
      showOnlyConstraintIssues
        ? comparisonConstraintEvaluations.filter(hasConstraintIssue)
        : comparisonConstraintEvaluations,
    [comparisonConstraintEvaluations, showOnlyConstraintIssues],
  );

  return {
    comparisonMaterialOptions,
    comparisonConstraints,
    comparisonConstraintEvaluations,
    comparisonComplianceSummary,
    comparisonConstraintIssueCount,
    visibleComparisonConstraintEvaluations,
  };
}
