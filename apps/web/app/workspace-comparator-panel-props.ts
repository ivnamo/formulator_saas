import type { WorkspaceHomePanels } from "./workspace-home-view";

type ComparatorPanelProps = WorkspaceHomePanels["comparator"];

type BuildWorkspaceComparatorPanelPropsArgs = {
  formulaComparison: ComparatorPanelProps["formulaComparison"];
  rawMaterials: ComparatorPanelProps["rawMaterials"];
  materialComparisonIds: ComparatorPanelProps["materialComparisonIds"];
  materialComparisonMaterials: ComparatorPanelProps["materialComparisonMaterials"];
  visibleParameterCodes: ComparatorPanelProps["visibleParameterCodes"];
  showOnlyPositiveParameters: ComparatorPanelProps["showOnlyPositiveParameters"];
  canEditTenantData: ComparatorPanelProps["canEditTenantData"];
  isBusy: ComparatorPanelProps["isBusy"];
  selectMaterialForComparison: ComparatorPanelProps["onSelectMaterialComparison"];
  clearComparisonMaterials: ComparatorPanelProps["onClearMaterialComparison"];
  setShowOnlyPositiveParameters: ComparatorPanelProps["onShowOnlyPositiveParametersChange"];
};

export function buildWorkspaceComparatorPanelProps(
  args: BuildWorkspaceComparatorPanelPropsArgs,
): ComparatorPanelProps {
  return {
    formulaComparison: args.formulaComparison,
    rawMaterials: args.rawMaterials,
    materialComparisonIds: args.materialComparisonIds,
    materialComparisonMaterials: args.materialComparisonMaterials,
    visibleParameterCodes: args.visibleParameterCodes,
    showOnlyPositiveParameters: args.showOnlyPositiveParameters,
    canEditTenantData: args.canEditTenantData,
    isBusy: args.isBusy,
    onSelectMaterialComparison: args.selectMaterialForComparison,
    onClearMaterialComparison: args.clearComparisonMaterials,
    onShowOnlyPositiveParametersChange: args.setShowOnlyPositiveParameters,
  };
}
