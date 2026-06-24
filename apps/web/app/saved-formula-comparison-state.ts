import { useMemo, useState } from "react";
import {
  buildConstraintComplianceSummary,
  buildConstraintEvaluations,
  hasConstraintIssue,
  type SavedFormulaComparison,
} from "./workspace-comparison";
import type { FormulaRead } from "./formula-model";
import { isSelectableRawMaterial, type RawMaterial } from "./raw-material-model";
import { normalizeCode, parseOptionalNumber } from "./workspace-utils";

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
  parameterCode: "",
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
  const [showArchivedFormulas, setShowArchivedFormulas] = useState(false);
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
    setShowArchivedFormulas(false);
    setSavedFormulaComparison(null);
  }

  return {
    formulaCompareSelection,
    comparisonConstraintForm,
    showOnlyConstraintIssues,
    showArchivedFormulas,
    savedFormulaComparison,
    selectFormulaForComparison,
    updateComparisonConstraint,
    resetSavedFormulaComparisonState,
    setShowOnlyConstraintIssues,
    setShowArchivedFormulas,
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
    const rawMaterialsById = new Map(rawMaterials.map((material) => [material.id, material]));
    rawMaterials
      .filter(isSelectableRawMaterial)
      .forEach((material) => options.set(material.id, material.name));
    const selectedFormulaIds = new Set([
      formulaCompareSelection.baselineId,
      formulaCompareSelection.candidateId,
    ]);
    formulas
      .filter((formula) => selectedFormulaIds.has(formula.id))
      .flatMap((formula) => formula.items)
      .forEach((item) => {
        const material = rawMaterialsById.get(item.raw_material_id);
        if (material && !isSelectableRawMaterial(material)) {
          return;
        }
        if (!options.has(item.raw_material_id)) {
          options.set(
            item.raw_material_id,
            material?.name ?? `Material ${item.raw_material_id.slice(0, 8)}`,
          );
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
