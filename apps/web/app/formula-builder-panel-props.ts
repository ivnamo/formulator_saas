import type { BuilderSectionKey } from "./formula-builder-model";
import type { WorkspaceHomePanels } from "./workspace-home-view";
import type { WorkspaceState } from "./workspace-state-model";

type FormulaBuilderPanelProps = WorkspaceHomePanels["formulaBuilder"];
type FormulaBuilderBasicsProps = FormulaBuilderPanelProps["basics"];
type FormulaBuilderMaterialsProps = FormulaBuilderPanelProps["materials"];
type FormulaBuilderCompositionProps = FormulaBuilderPanelProps["composition"];
type FormulaBuilderCalculationProps = FormulaBuilderPanelProps["calculation"];

type BuildFormulaBuilderPanelPropsArgs = {
  workspace: WorkspaceState;
  builderSections: Record<BuilderSectionKey, boolean>;
  totalPercentage: FormulaBuilderPanelProps["totalPercentage"];
  isFormulaBalanced: FormulaBuilderPanelProps["isFormulaBalanced"];
  isBusy: FormulaBuilderBasicsProps["isBusy"];
  activeJiraConnection: FormulaBuilderCompositionProps["activeJiraConnection"];
  formulaBasicsValue: FormulaBuilderBasicsProps["values"];
  catalogLoading: FormulaBuilderMaterialsProps["catalogLoading"];
  catalogTotal: FormulaBuilderMaterialsProps["catalogTotal"];
  visibleParameterSummary: FormulaBuilderMaterialsProps["visibleParameterSummary"];
  selectedParameterPreset: {
    helper: FormulaBuilderMaterialsProps["selectedPresetHelper"];
    label: FormulaBuilderCalculationProps["selectedPresetLabel"];
  };
  showOnlyPositiveParameters: FormulaBuilderMaterialsProps["showOnlyPositiveParameters"];
  parameterViewPreset: FormulaBuilderMaterialsProps["parameterViewPreset"];
  parameterCatalog: FormulaBuilderMaterialsProps["parameterCatalog"];
  customParameterCodes: FormulaBuilderMaterialsProps["customParameterCodes"];
  formulaMaterialQuery: FormulaBuilderMaterialsProps["formulaMaterialQuery"];
  canSearchCatalog: FormulaBuilderMaterialsProps["canSearch"];
  catalogParameterConditions: FormulaBuilderMaterialsProps["catalogParameterConditions"];
  catalogFamilyFilter: FormulaBuilderMaterialsProps["catalogFamilyFilter"];
  catalogMaterialFamilies: FormulaBuilderMaterialsProps["catalogMaterialFamilies"];
  catalogPriceFilter: FormulaBuilderMaterialsProps["catalogPriceFilter"];
  catalogPriceMin: FormulaBuilderMaterialsProps["catalogPriceMin"];
  catalogPriceMax: FormulaBuilderMaterialsProps["catalogPriceMax"];
  catalogParameterToAdd: FormulaBuilderMaterialsProps["catalogParameterToAdd"];
  visibleParameterCodeSet: FormulaBuilderMaterialsProps["visibleParameterCodeSet"];
  materialResultLimit: FormulaBuilderMaterialsProps["materialResultLimit"];
  materialSearchResults: FormulaBuilderMaterialsProps["materialSearchResults"];
  selectedMaterialId: FormulaBuilderMaterialsProps["selectedMaterialId"];
  selectedMaterial: FormulaBuilderMaterialsProps["selectedMaterial"];
  selectedMaterialParameters: FormulaBuilderMaterialsProps["selectedMaterialParameters"];
  comparisonMaterials: FormulaBuilderMaterialsProps["comparisonMaterials"];
  detailedMaterialIds: FormulaBuilderMaterialsProps["detailedMaterialIds"];
  expandedMaterialIds: FormulaBuilderMaterialsProps["expandedMaterialIds"];
  comparisonMaterialIds: FormulaBuilderMaterialsProps["comparisonMaterialIds"];
  visibleParameterCodes: FormulaBuilderMaterialsProps["visibleParameterCodes"];
  formulaCompositionPrice: FormulaBuilderCompositionProps["price"];
  formulaCompositionPriceSource: FormulaBuilderCompositionProps["priceSource"];
  draftReview: FormulaBuilderCompositionProps["draftReview"];
  draftComparison: FormulaBuilderCompositionProps["draftComparison"];
  canConfirmDraftReview: FormulaBuilderCompositionProps["canConfirmDraftReview"];
  formulaReviewRequests: FormulaBuilderCompositionProps["formulaReviewRequests"];
  formulaReviewArtifacts: FormulaBuilderCompositionProps["formulaReviewArtifacts"];
  canPrepareJiraReview: FormulaBuilderCompositionProps["canPrepareJiraReview"];
  formulaLineDetails: FormulaBuilderCompositionProps["formulaLineDetails"];
  parameterRows: FormulaBuilderCalculationProps["parameterRows"];
  visibleWarnings: FormulaBuilderCalculationProps["visibleWarnings"];
  hasBackendResult: FormulaBuilderCalculationProps["isBackendResult"];
  canSaveFormula: FormulaBuilderCalculationProps["canSaveFormula"];
  toggleBuilderSection: FormulaBuilderBasicsProps["onToggle"];
  updateFormulaBasics: FormulaBuilderBasicsProps["onChange"];
  setShowOnlyPositiveParameters: FormulaBuilderMaterialsProps["onShowOnlyPositiveChange"];
  selectCurrentParameterView: FormulaBuilderMaterialsProps["onSelectParameterView"];
  toggleCustomParameterCode: FormulaBuilderMaterialsProps["onToggleCustomParameterCode"];
  setFormulaMaterialQuery: FormulaBuilderMaterialsProps["onQueryChange"];
  setCatalogFamilyFilter: FormulaBuilderMaterialsProps["onFamilyFilterChange"];
  setCatalogPriceFilter: FormulaBuilderMaterialsProps["onPriceFilterChange"];
  setCatalogPriceMin: FormulaBuilderMaterialsProps["onPriceMinChange"];
  setCatalogPriceMax: FormulaBuilderMaterialsProps["onPriceMaxChange"];
  setCatalogParameterToAdd: FormulaBuilderMaterialsProps["onParameterToAddChange"];
  addCatalogParameterCondition: FormulaBuilderMaterialsProps["onAddCondition"];
  updateCatalogParameterCondition: FormulaBuilderMaterialsProps["onUpdateCondition"];
  removeCatalogParameterCondition: FormulaBuilderMaterialsProps["onRemoveCondition"];
  loadMoreCatalogMaterials: FormulaBuilderMaterialsProps["onLoadMoreMaterials"];
  resetCatalogFilters: FormulaBuilderMaterialsProps["onResetFilters"];
  inspectMaterial: FormulaBuilderMaterialsProps["onInspectMaterial"];
  toggleCompareMaterial: FormulaBuilderMaterialsProps["onToggleCompareMaterial"];
  addFormulaLine: FormulaBuilderMaterialsProps["onAddFormulaLine"];
  toggleExpandedMaterial: FormulaBuilderMaterialsProps["onToggleExpandedMaterial"];
  clearComparisonMaterials: FormulaBuilderMaterialsProps["onClearComparison"];
  updateDraftReviewNotes: FormulaBuilderCompositionProps["onNotesChange"];
  confirmDraftReview: FormulaBuilderCompositionProps["onConfirmDraftReview"];
  sendCurrentFormulaToJira: FormulaBuilderCompositionProps["onSendCurrentFormulaToJira"];
  generateJiraReviewExcel: FormulaBuilderCompositionProps["onGenerateReviewExcel"];
  downloadJiraReviewArtifact: FormulaBuilderCompositionProps["onDownloadArtifact"];
  sendJiraReviewToJira: FormulaBuilderCompositionProps["onSendReviewToJira"];
  syncJiraReviewStatus: FormulaBuilderCompositionProps["onSyncReviewStatus"];
  retryJiraReviewAttachment: FormulaBuilderCompositionProps["onRetryReviewAttachment"];
  moveFormulaLine: FormulaBuilderCompositionProps["onMoveLine"];
  updateFormulaLine: FormulaBuilderCompositionProps["onUpdateLine"];
  duplicateFormulaLine: FormulaBuilderCompositionProps["onDuplicateLine"];
  removeFormulaLine: FormulaBuilderCompositionProps["onRemoveLine"];
  saveFormula: FormulaBuilderCalculationProps["onSaveFormula"];
};

export function buildFormulaBuilderPanelProps({
  workspace,
  builderSections,
  totalPercentage,
  isFormulaBalanced,
  isBusy,
  activeJiraConnection,
  formulaBasicsValue,
  catalogLoading,
  catalogTotal,
  visibleParameterSummary,
  selectedParameterPreset,
  showOnlyPositiveParameters,
  parameterViewPreset,
  parameterCatalog,
  customParameterCodes,
  formulaMaterialQuery,
  canSearchCatalog,
  catalogParameterConditions,
  catalogFamilyFilter,
  catalogMaterialFamilies,
  catalogPriceFilter,
  catalogPriceMin,
  catalogPriceMax,
  catalogParameterToAdd,
  visibleParameterCodeSet,
  materialResultLimit,
  materialSearchResults,
  selectedMaterialId,
  selectedMaterial,
  selectedMaterialParameters,
  comparisonMaterials,
  detailedMaterialIds,
  expandedMaterialIds,
  comparisonMaterialIds,
  visibleParameterCodes,
  formulaCompositionPrice,
  formulaCompositionPriceSource,
  draftReview,
  draftComparison,
  canConfirmDraftReview,
  formulaReviewRequests,
  formulaReviewArtifacts,
  canPrepareJiraReview,
  formulaLineDetails,
  parameterRows,
  visibleWarnings,
  hasBackendResult,
  canSaveFormula,
  toggleBuilderSection,
  updateFormulaBasics,
  setShowOnlyPositiveParameters,
  selectCurrentParameterView,
  toggleCustomParameterCode,
  setFormulaMaterialQuery,
  setCatalogFamilyFilter,
  setCatalogPriceFilter,
  setCatalogPriceMin,
  setCatalogPriceMax,
  setCatalogParameterToAdd,
  addCatalogParameterCondition,
  updateCatalogParameterCondition,
  removeCatalogParameterCondition,
  loadMoreCatalogMaterials,
  resetCatalogFilters,
  inspectMaterial,
  toggleCompareMaterial,
  addFormulaLine,
  toggleExpandedMaterial,
  clearComparisonMaterials,
  updateDraftReviewNotes,
  confirmDraftReview,
  sendCurrentFormulaToJira,
  generateJiraReviewExcel,
  downloadJiraReviewArtifact,
  sendJiraReviewToJira,
  syncJiraReviewStatus,
  retryJiraReviewAttachment,
  moveFormulaLine,
  updateFormulaLine,
  duplicateFormulaLine,
  removeFormulaLine,
  saveFormula,
}: BuildFormulaBuilderPanelPropsArgs): FormulaBuilderPanelProps {
  return {
    totalPercentage,
    isFormulaBalanced,
    basics: {
      isOpen: builderSections.basics,
      isBusy,
      hasActiveJiraConnection: Boolean(activeJiraConnection),
      values: formulaBasicsValue,
      onToggle: toggleBuilderSection,
      onChange: updateFormulaBasics,
    },
    materials: {
      isOpen: builderSections.materials,
      catalogLoading,
      catalogTotal,
      visibleParameterSummary,
      selectedPresetHelper: selectedParameterPreset.helper,
      showOnlyPositiveParameters,
      parameterViewPreset,
      parameterCatalog,
      customParameterCodes,
      formulaMaterialQuery,
      canSearch: canSearchCatalog,
      catalogParameterConditions,
      catalogFamilyFilter,
      catalogMaterialFamilies,
      catalogPriceFilter,
      catalogPriceMin,
      catalogPriceMax,
      catalogParameterToAdd,
      visibleParameterCodeSet,
      materialResultLimit,
      materialSearchResults,
      workspaceMaterialCount: workspace.rawMaterials.length,
      formulaLines: workspace.formulaLines,
      selectedMaterialId,
      selectedMaterial,
      selectedMaterialParameters,
      comparisonMaterials,
      detailedMaterialIds,
      expandedMaterialIds,
      comparisonMaterialIds,
      visibleParameterCodes,
      isBusy,
      onToggle: toggleBuilderSection,
      onShowOnlyPositiveChange: setShowOnlyPositiveParameters,
      onSelectParameterView: selectCurrentParameterView,
      onToggleCustomParameterCode: toggleCustomParameterCode,
      onQueryChange: setFormulaMaterialQuery,
      onFamilyFilterChange: setCatalogFamilyFilter,
      onPriceFilterChange: setCatalogPriceFilter,
      onPriceMinChange: setCatalogPriceMin,
      onPriceMaxChange: setCatalogPriceMax,
      onParameterToAddChange: setCatalogParameterToAdd,
      onAddCondition: addCatalogParameterCondition,
      onUpdateCondition: updateCatalogParameterCondition,
      onRemoveCondition: removeCatalogParameterCondition,
      onLoadMoreMaterials: loadMoreCatalogMaterials,
      onResetFilters: resetCatalogFilters,
      onInspectMaterial: inspectMaterial,
      onToggleCompareMaterial: toggleCompareMaterial,
      onAddFormulaLine: addFormulaLine,
      onToggleExpandedMaterial: toggleExpandedMaterial,
      onClearComparison: clearComparisonMaterials,
    },
    composition: {
      isOpen: builderSections.formula,
      lineCount: workspace.formulaLines.length,
      totalPercentage,
      isFormulaBalanced,
      price: formulaCompositionPrice,
      priceSource: formulaCompositionPriceSource,
      draftReview,
      draftComparison,
      isBusy,
      canConfirmDraftReview,
      activeJiraConnection,
      formulaReviewRequests,
      formulaReviewArtifacts,
      canPrepareJiraReview,
      formulaLineDetails,
      visibleParameterCodes,
      showOnlyPositiveParameters,
      onToggle: toggleBuilderSection,
      onNotesChange: updateDraftReviewNotes,
      onConfirmDraftReview: confirmDraftReview,
      onSendCurrentFormulaToJira: sendCurrentFormulaToJira,
      onGenerateReviewExcel: generateJiraReviewExcel,
      onDownloadArtifact: downloadJiraReviewArtifact,
      onSendReviewToJira: sendJiraReviewToJira,
      onSyncReviewStatus: syncJiraReviewStatus,
      onRetryReviewAttachment: retryJiraReviewAttachment,
      onMoveLine: moveFormulaLine,
      onUpdateLine: updateFormulaLine,
      onDuplicateLine: duplicateFormulaLine,
      onRemoveLine: removeFormulaLine,
    },
    calculation: {
      isOpen: builderSections.calculation,
      isBackendResult: hasBackendResult,
      parameterRows,
      visibleWarnings,
      selectedPresetLabel: selectedParameterPreset.label,
      visibleParameterSummary,
      showOnlyPositiveParameters,
      parameterViewPreset,
      isFormulaBalanced,
      totalPercentage,
      isBusy,
      canSaveFormula,
      onToggle: toggleBuilderSection,
      onShowOnlyPositiveChange: setShowOnlyPositiveParameters,
      onSelectParameterView: selectCurrentParameterView,
      onSaveFormula: saveFormula,
    },
  };
}
