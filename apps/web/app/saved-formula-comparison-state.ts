import { useState } from "react";
import type { SavedFormulaComparison } from "./workspace-comparison";

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
