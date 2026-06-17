import type { BuilderSectionKey } from "./formula-builder-model";
import type { WorkspaceHomePanels } from "./workspace-home-view";
import type { WorkspaceState } from "./workspace-state-model";

type FormulaBuilderPanelProps = WorkspaceHomePanels["formulaBuilder"];
type FormulaBuilderBasicsProps = FormulaBuilderPanelProps["basics"];
type FormulaBuilderMaterialsProps = FormulaBuilderPanelProps["materials"];
type FormulaBuilderCompositionProps = FormulaBuilderPanelProps["composition"];
type FormulaBuilderCalculationProps = FormulaBuilderPanelProps["calculation"];

const DEFAULT_JIRA_ISSUE_TYPE_OPTIONS = ["Calidad", "Prototipo", "PoC", "Muestra"];
const DEFAULT_JIRA_PRODUCT_TYPE_OPTIONS = ["Nuevo", "Mod A", "Mod B", "Mod C"];

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
  isoDesignProjects: FormulaBuilderCompositionProps["isoDesignProjects"];
  jiraIssueTypeOptions: FormulaBuilderBasicsProps["jiraIssueTypeOptions"];
  formulaJiraProjectId: FormulaBuilderCompositionProps["formulaJiraProjectId"];
  formulaJiraIssueType: FormulaBuilderCompositionProps["formulaJiraIssueType"];
  formulaJiraDescription: FormulaBuilderCompositionProps["formulaJiraDescription"];
  selectedIsoDesignProjectId: FormulaBuilderCompositionProps["selectedIsoDesignProjectId"];
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
  setSelectedIsoDesignProjectId: FormulaBuilderCompositionProps["onSelectedIsoDesignProjectChange"];
  setFormulaJiraDescription: FormulaBuilderCompositionProps["onJiraDescriptionChange"];
  prepareIsoProjectFromFormula: FormulaBuilderCompositionProps["onPrepareIsoProject"];
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
  exportCurrentFormulaIdLabExcel: FormulaBuilderCalculationProps["onExportExcel"];
};

function buildFormulaBuilderBasicsProps(
  args: BuildFormulaBuilderPanelPropsArgs,
): FormulaBuilderBasicsProps {
  return {
    isOpen: args.builderSections.basics,
    isBusy: args.isBusy,
    hasActiveJiraConnection: Boolean(args.activeJiraConnection),
    values: args.formulaBasicsValue,
    jiraProjectIdOptions: buildJiraProjectIdOptions(args.isoDesignProjects),
    jiraIssueTypeOptions: args.jiraIssueTypeOptions.length
      ? args.jiraIssueTypeOptions
      : DEFAULT_JIRA_ISSUE_TYPE_OPTIONS,
    jiraProductTypeOptions: DEFAULT_JIRA_PRODUCT_TYPE_OPTIONS,
    onToggle: args.toggleBuilderSection,
    onChange: args.updateFormulaBasics,
  };
}

function buildFormulaBuilderMaterialsProps(
  args: BuildFormulaBuilderPanelPropsArgs,
): FormulaBuilderMaterialsProps {
  return {
    isOpen: args.builderSections.materials,
    catalogLoading: args.catalogLoading,
    catalogTotal: args.catalogTotal,
    visibleParameterSummary: args.visibleParameterSummary,
    selectedPresetHelper: args.selectedParameterPreset.helper,
    showOnlyPositiveParameters: args.showOnlyPositiveParameters,
    parameterViewPreset: args.parameterViewPreset,
    parameterCatalog: args.parameterCatalog,
    customParameterCodes: args.customParameterCodes,
    formulaMaterialQuery: args.formulaMaterialQuery,
    canSearch: args.canSearchCatalog,
    catalogParameterConditions: args.catalogParameterConditions,
    catalogFamilyFilter: args.catalogFamilyFilter,
    catalogMaterialFamilies: args.catalogMaterialFamilies,
    catalogPriceFilter: args.catalogPriceFilter,
    catalogPriceMin: args.catalogPriceMin,
    catalogPriceMax: args.catalogPriceMax,
    catalogParameterToAdd: args.catalogParameterToAdd,
    visibleParameterCodeSet: args.visibleParameterCodeSet,
    materialResultLimit: args.materialResultLimit,
    materialSearchResults: args.materialSearchResults,
    workspaceMaterialCount: args.workspace.rawMaterials.length,
    formulaLines: args.workspace.formulaLines,
    selectedMaterialId: args.selectedMaterialId,
    selectedMaterial: args.selectedMaterial,
    selectedMaterialParameters: args.selectedMaterialParameters,
    comparisonMaterials: args.comparisonMaterials,
    detailedMaterialIds: args.detailedMaterialIds,
    expandedMaterialIds: args.expandedMaterialIds,
    comparisonMaterialIds: args.comparisonMaterialIds,
    visibleParameterCodes: args.visibleParameterCodes,
    isBusy: args.isBusy,
    onToggle: args.toggleBuilderSection,
    onShowOnlyPositiveChange: args.setShowOnlyPositiveParameters,
    onSelectParameterView: args.selectCurrentParameterView,
    onToggleCustomParameterCode: args.toggleCustomParameterCode,
    onQueryChange: args.setFormulaMaterialQuery,
    onFamilyFilterChange: args.setCatalogFamilyFilter,
    onPriceFilterChange: args.setCatalogPriceFilter,
    onPriceMinChange: args.setCatalogPriceMin,
    onPriceMaxChange: args.setCatalogPriceMax,
    onParameterToAddChange: args.setCatalogParameterToAdd,
    onAddCondition: args.addCatalogParameterCondition,
    onUpdateCondition: args.updateCatalogParameterCondition,
    onRemoveCondition: args.removeCatalogParameterCondition,
    onLoadMoreMaterials: args.loadMoreCatalogMaterials,
    onResetFilters: args.resetCatalogFilters,
    onInspectMaterial: args.inspectMaterial,
    onToggleCompareMaterial: args.toggleCompareMaterial,
    onAddFormulaLine: args.addFormulaLine,
    onToggleExpandedMaterial: args.toggleExpandedMaterial,
    onClearComparison: args.clearComparisonMaterials,
  };
}

function buildFormulaBuilderCompositionProps(
  args: BuildFormulaBuilderPanelPropsArgs,
): FormulaBuilderCompositionProps {
  return {
    isOpen: args.builderSections.formula,
    lineCount: args.workspace.formulaLines.length,
    totalPercentage: args.totalPercentage,
    isFormulaBalanced: args.isFormulaBalanced,
    price: args.formulaCompositionPrice,
    priceSource: args.formulaCompositionPriceSource,
    draftReview: args.draftReview,
    draftComparison: args.draftComparison,
    isBusy: args.isBusy,
    canConfirmDraftReview: args.canConfirmDraftReview,
    activeJiraConnection: args.activeJiraConnection,
    formulaReviewRequests: args.formulaReviewRequests,
    formulaReviewArtifacts: args.formulaReviewArtifacts,
    isoDesignProjects: args.isoDesignProjects,
    formulaJiraProjectId: args.formulaJiraProjectId,
    formulaJiraIssueType: args.formulaJiraIssueType,
    formulaJiraDescription: args.formulaJiraDescription,
    selectedIsoDesignProjectId: args.selectedIsoDesignProjectId,
    canPrepareJiraReview: args.canPrepareJiraReview,
    formulaLineDetails: args.formulaLineDetails,
    visibleParameterCodes: args.visibleParameterCodes,
    showOnlyPositiveParameters: args.showOnlyPositiveParameters,
    onToggle: args.toggleBuilderSection,
    onNotesChange: args.updateDraftReviewNotes,
    onConfirmDraftReview: args.confirmDraftReview,
    onSelectedIsoDesignProjectChange: args.setSelectedIsoDesignProjectId,
    onJiraDescriptionChange: args.setFormulaJiraDescription,
    onPrepareIsoProject: args.prepareIsoProjectFromFormula,
    onSendCurrentFormulaToJira: args.sendCurrentFormulaToJira,
    onGenerateReviewExcel: args.generateJiraReviewExcel,
    onDownloadArtifact: args.downloadJiraReviewArtifact,
    onSendReviewToJira: args.sendJiraReviewToJira,
    onSyncReviewStatus: args.syncJiraReviewStatus,
    onRetryReviewAttachment: args.retryJiraReviewAttachment,
    onMoveLine: args.moveFormulaLine,
    onUpdateLine: args.updateFormulaLine,
    onDuplicateLine: args.duplicateFormulaLine,
    onRemoveLine: args.removeFormulaLine,
  };
}

function buildFormulaBuilderCalculationProps(
  args: BuildFormulaBuilderPanelPropsArgs,
): FormulaBuilderCalculationProps {
  return {
    isOpen: args.builderSections.calculation,
    isBackendResult: args.hasBackendResult,
    parameterRows: args.parameterRows,
    visibleWarnings: args.visibleWarnings,
    selectedPresetLabel: args.selectedParameterPreset.label,
    visibleParameterSummary: args.visibleParameterSummary,
    showOnlyPositiveParameters: args.showOnlyPositiveParameters,
    parameterViewPreset: args.parameterViewPreset,
    isFormulaBalanced: args.isFormulaBalanced,
    totalPercentage: args.totalPercentage,
    isBusy: args.isBusy,
    canSaveFormula: args.canSaveFormula,
    onToggle: args.toggleBuilderSection,
    onShowOnlyPositiveChange: args.setShowOnlyPositiveParameters,
    onSelectParameterView: args.selectCurrentParameterView,
    onSaveFormula: args.saveFormula,
    onExportExcel: args.exportCurrentFormulaIdLabExcel,
  };
}

function buildJiraProjectIdOptions(
  projects: FormulaBuilderCompositionProps["isoDesignProjects"],
): FormulaBuilderBasicsProps["jiraProjectIdOptions"] {
  const options = new Map<string, string>();
  for (const project of projects) {
    const projectCode = project.project_code?.trim();
    if (!projectCode || options.has(projectCode)) {
      continue;
    }
    options.set(projectCode, `${project.iso_request_number} - ${project.product_name}`);
  }
  return [...options.entries()]
    .map(([value, label]) => ({ value, label }))
    .sort((left, right) => left.value.localeCompare(right.value, "es"));
}

export function buildFormulaBuilderPanelProps(
  args: BuildFormulaBuilderPanelPropsArgs,
): FormulaBuilderPanelProps {
  return {
    totalPercentage: args.totalPercentage,
    isFormulaBalanced: args.isFormulaBalanced,
    basics: buildFormulaBuilderBasicsProps(args),
    materials: buildFormulaBuilderMaterialsProps(args),
    composition: buildFormulaBuilderCompositionProps(args),
    calculation: buildFormulaBuilderCalculationProps(args),
  };
}
