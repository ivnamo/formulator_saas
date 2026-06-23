import { useMemo } from "react";
import { formatResultPrice } from "./formula-formatters";
import {
  PARAMETER_VIEW_PRESETS,
  formatFormulaNumber,
  type ParameterViewPresetKey,
} from "./formula-builder-model";
import {
  buildComparisonMaterials,
  buildFormulaLineDetails,
  buildMaterialSearchResults,
  buildParameterCatalog,
  buildRawMaterialsById,
  formatVisibleParameterSummary,
  getSelectedMaterial,
  getSelectedMaterialParameters,
  selectVisibleParameterCodes,
} from "./formula-builder-derived-model";
import {
  buildCalculationParameterRows,
  buildLocalFormulaPreview,
  calculateFormulaTotalPercentage,
  isFormulaPercentageBalanced,
} from "./formula-builder-preview";
import { buildDraftComparison, type DraftReviewState } from "./workspace-comparison";
import type { CalculationResult } from "./formula-model";
import type { WorkspaceState } from "./workspace-state-model";

export type { CalculationParameterRow, LocalFormulaPreview } from "./formula-builder-preview";
export type {
  FormulaLineDetail,
  ParameterCatalogItem,
} from "./formula-builder-derived-model";

type FormulaBuilderDerivedStateOptions = {
  workspace: WorkspaceState;
  catalogMaterialIds: string[];
  catalogFamilies: string[];
  parameterViewPreset: ParameterViewPresetKey;
  customParameterCodes: string[];
  selectedMaterialId: string | null;
  showOnlyPositiveParameters: boolean;
  comparisonMaterialIds: string[];
  result: CalculationResult | null;
  draftReview: DraftReviewState | null;
};

export function useFormulaBuilderDerivedState({
  workspace,
  catalogMaterialIds,
  catalogFamilies,
  parameterViewPreset,
  customParameterCodes,
  selectedMaterialId,
  showOnlyPositiveParameters,
  comparisonMaterialIds,
  result,
  draftReview,
}: FormulaBuilderDerivedStateOptions) {
  const rawMaterialsById = useMemo(
    () => buildRawMaterialsById(workspace.rawMaterials),
    [workspace.rawMaterials],
  );
  const formulaLineDetails = useMemo(
    () => buildFormulaLineDetails(workspace.formulaLines, rawMaterialsById),
    [rawMaterialsById, workspace.formulaLines],
  );
  const parameterCatalog = useMemo(
    () => buildParameterCatalog(workspace.parameters, workspace.rawMaterials),
    [workspace.parameters, workspace.rawMaterials],
  );
  const visibleParameterCodes = useMemo(
    () =>
      selectVisibleParameterCodes(
        parameterCatalog,
        parameterViewPreset,
        customParameterCodes,
      ),
    [customParameterCodes, parameterCatalog, parameterViewPreset],
  );
  const visibleParameterCodeSet = useMemo(
    () => new Set(visibleParameterCodes),
    [visibleParameterCodes],
  );
  const selectedParameterPreset =
    PARAMETER_VIEW_PRESETS.find((option) => option.key === parameterViewPreset) ??
    PARAMETER_VIEW_PRESETS[0];
  const formulaBasicsValue = useMemo(
    () => ({
      formulaId: workspace.formulaId,
      formulaBaseName: workspace.formulaBaseName,
      formulaBuilderMode: workspace.formulaBuilderMode,
      formulaName: workspace.formulaName,
      formulaJiraDescription: workspace.formulaJiraDescription,
      formulaJiraProjectId: workspace.formulaJiraProjectId,
      formulaJiraIssueType: workspace.formulaJiraIssueType,
      formulaJiraProductType: workspace.formulaJiraProductType,
    }),
    [
      workspace.formulaId,
      workspace.formulaBaseName,
      workspace.formulaBuilderMode,
      workspace.formulaJiraDescription,
      workspace.formulaJiraIssueType,
      workspace.formulaJiraProductType,
      workspace.formulaJiraProjectId,
      workspace.formulaName,
    ],
  );
  const visibleParameterSummary = formatVisibleParameterSummary(visibleParameterCodes);
  const localPreview = useMemo(
    () => buildLocalFormulaPreview(formulaLineDetails, visibleParameterCodeSet),
    [formulaLineDetails, visibleParameterCodeSet],
  );
  const materialSearchResults = useMemo(
    () => buildMaterialSearchResults(catalogMaterialIds, rawMaterialsById, workspace.formulaLines),
    [catalogMaterialIds, rawMaterialsById, workspace.formulaLines],
  );
  const selectedMaterial = useMemo(
    () => getSelectedMaterial(selectedMaterialId, rawMaterialsById),
    [rawMaterialsById, selectedMaterialId],
  );
  const selectedMaterialParameters = useMemo(
    () =>
      getSelectedMaterialParameters(
        selectedMaterial,
        visibleParameterCodes,
        showOnlyPositiveParameters,
      ),
    [selectedMaterial, showOnlyPositiveParameters, visibleParameterCodes],
  );
  const comparisonMaterials = useMemo(
    () => buildComparisonMaterials(comparisonMaterialIds, rawMaterialsById),
    [comparisonMaterialIds, rawMaterialsById],
  );
  const parameterRows = useMemo(
    () =>
      buildCalculationParameterRows(
        result,
        localPreview,
        visibleParameterCodeSet,
        showOnlyPositiveParameters,
      ),
    [localPreview, result, showOnlyPositiveParameters, visibleParameterCodeSet],
  );
  const draftComparison = useMemo(
    () => buildDraftComparison(draftReview, workspace.formulaLines, rawMaterialsById),
    [draftReview, rawMaterialsById, workspace.formulaLines],
  );
  const totalPercentage = useMemo(
    () => calculateFormulaTotalPercentage(workspace.formulaLines),
    [workspace.formulaLines],
  );
  const isFormulaBalanced = isFormulaPercentageBalanced(totalPercentage);
  const formulaCompositionPrice = result
    ? formatResultPrice(result)
    : formatFormulaNumber(localPreview.priceTotal, " EUR/kg");
  const formulaCompositionPriceSource = result ? "Backend official" : "Local preview";
  const visibleWarnings = result?.warnings ?? localPreview.warnings;

  return {
    rawMaterialsById,
    formulaLineDetails,
    parameterCatalog,
    visibleParameterCodes,
    visibleParameterCodeSet,
    selectedParameterPreset,
    formulaBasicsValue,
    visibleParameterSummary,
    localPreview,
    materialSearchResults,
    selectedMaterial,
    selectedMaterialParameters,
    comparisonMaterials,
    parameterRows,
    catalogMaterialFamilies: catalogFamilies,
    draftComparison,
    totalPercentage,
    isFormulaBalanced,
    formulaCompositionPrice,
    formulaCompositionPriceSource,
    visibleWarnings,
  };
}
