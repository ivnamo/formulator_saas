import type { FormulaLine, RawMaterial } from "../workspace-model";
import { MaterialCatalogList } from "./material-catalog-list";
import { MaterialComparePanel } from "./material-compare-panel";
import { MaterialInspectorPanel } from "./material-inspector-panel";

type MaterialCatalogWorkspaceProps = {
  catalogLoading: boolean;
  catalogTotal: number;
  materials: RawMaterial[];
  workspaceMaterialCount: number;
  formulaLines: FormulaLine[];
  selectedMaterialId: string | null;
  selectedMaterial: RawMaterial | null;
  selectedMaterialParameters: Array<RawMaterial["parameters"][string]>;
  comparisonMaterials: RawMaterial[];
  detailedMaterialIds: string[];
  expandedMaterialIds: string[];
  comparisonMaterialIds: string[];
  visibleParameterCodes: string[];
  showOnlyPositiveParameters: boolean;
  isBusy: boolean;
  onInspectMaterial: (rawMaterialId: string) => void | Promise<void>;
  onToggleCompareMaterial: (rawMaterialId: string) => void | Promise<void>;
  onAddFormulaLine: (rawMaterialId: string) => void | Promise<void>;
  onToggleExpandedMaterial: (rawMaterialId: string) => void | Promise<void>;
  onClearComparison: () => void;
};

export function MaterialCatalogWorkspace({
  catalogLoading,
  catalogTotal,
  materials,
  workspaceMaterialCount,
  formulaLines,
  selectedMaterialId,
  selectedMaterial,
  selectedMaterialParameters,
  comparisonMaterials,
  detailedMaterialIds,
  expandedMaterialIds,
  comparisonMaterialIds,
  visibleParameterCodes,
  showOnlyPositiveParameters,
  isBusy,
  onInspectMaterial,
  onToggleCompareMaterial,
  onAddFormulaLine,
  onToggleExpandedMaterial,
  onClearComparison,
}: MaterialCatalogWorkspaceProps) {
  return (
    <div className="catalogWorkspace">
      <MaterialCatalogList
        catalogLoading={catalogLoading}
        catalogTotal={catalogTotal}
        materials={materials}
        workspaceMaterialCount={workspaceMaterialCount}
        formulaLines={formulaLines}
        selectedMaterialId={selectedMaterialId}
        detailedMaterialIds={detailedMaterialIds}
        expandedMaterialIds={expandedMaterialIds}
        comparisonMaterialIds={comparisonMaterialIds}
        visibleParameterCodes={visibleParameterCodes}
        showOnlyPositiveParameters={showOnlyPositiveParameters}
        isBusy={isBusy}
        onInspectMaterial={onInspectMaterial}
        onToggleCompareMaterial={onToggleCompareMaterial}
        onAddFormulaLine={onAddFormulaLine}
        onToggleExpandedMaterial={onToggleExpandedMaterial}
      />
      {selectedMaterial ? (
        <MaterialInspectorPanel
          selectedMaterial={selectedMaterial}
          selectedMaterialParameters={selectedMaterialParameters}
          detailedMaterialIds={detailedMaterialIds}
          formulaLines={formulaLines}
          isBusy={isBusy}
          onAddFormulaLine={onAddFormulaLine}
        />
      ) : null}
      {comparisonMaterials.length ? (
        <MaterialComparePanel
          comparisonMaterials={comparisonMaterials}
          visibleParameterCodes={visibleParameterCodes}
          showOnlyPositiveParameters={showOnlyPositiveParameters}
          onClearComparison={onClearComparison}
        />
      ) : null}
    </div>
  );
}
