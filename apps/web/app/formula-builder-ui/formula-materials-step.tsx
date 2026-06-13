import type { ParameterCatalogItem } from "../formula-builder-derived";
import type {
  BuilderSectionKey,
  CatalogParameterCondition,
  ParameterViewPresetKey,
} from "../formula-builder-model";
import type { RawMaterial } from "../raw-material-model";
import type { FormulaLine } from "../workspace-base-model";
import { BuilderStep } from "./builder-step";
import { MaterialCatalogControls } from "./material-catalog-controls";
import { MaterialCatalogWorkspace } from "./material-catalog-workspace";
import { ParameterViewPanel } from "./parameter-view-panel";

type CatalogParameterConditionPatch = Partial<{
  code: string;
  min: string;
  max: string;
}>;

export type FormulaMaterialsStepProps = {
  isOpen: boolean;
  catalogLoading: boolean;
  catalogTotal: number;
  visibleParameterSummary: string;
  selectedPresetHelper: string;
  showOnlyPositiveParameters: boolean;
  parameterViewPreset: ParameterViewPresetKey;
  parameterCatalog: ParameterCatalogItem[];
  customParameterCodes: string[];
  formulaMaterialQuery: string;
  canSearch: boolean;
  catalogParameterConditions: CatalogParameterCondition[];
  catalogFamilyFilter: string;
  catalogMaterialFamilies: string[];
  catalogPriceFilter: "all" | "with_price" | "missing_price";
  catalogPriceMin: string;
  catalogPriceMax: string;
  catalogParameterToAdd: string;
  visibleParameterCodeSet: Set<string>;
  materialResultLimit: number;
  materialSearchResults: RawMaterial[];
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
  isBusy: boolean;
  onToggle: (section: BuilderSectionKey) => void;
  onShowOnlyPositiveChange: (value: boolean) => void;
  onSelectParameterView: (value: ParameterViewPresetKey) => void;
  onToggleCustomParameterCode: (code: string) => void;
  onQueryChange: (value: string) => void;
  onFamilyFilterChange: (value: string) => void;
  onPriceFilterChange: (value: "all" | "with_price" | "missing_price") => void;
  onPriceMinChange: (value: string) => void;
  onPriceMaxChange: (value: string) => void;
  onParameterToAddChange: (value: string) => void;
  onAddCondition: (code?: string) => void;
  onUpdateCondition: (id: string, patch: CatalogParameterConditionPatch) => void;
  onRemoveCondition: (id: string) => void;
  onLoadMoreMaterials: () => void;
  onResetFilters: () => void;
  onInspectMaterial: (rawMaterialId: string) => void | Promise<void>;
  onToggleCompareMaterial: (rawMaterialId: string) => void | Promise<void>;
  onAddFormulaLine: (rawMaterialId: string) => void | Promise<void>;
  onToggleExpandedMaterial: (rawMaterialId: string) => void | Promise<void>;
  onClearComparison: () => void;
};

export function FormulaMaterialsStep({
  isOpen,
  catalogLoading,
  catalogTotal,
  visibleParameterSummary,
  selectedPresetHelper,
  showOnlyPositiveParameters,
  parameterViewPreset,
  parameterCatalog,
  customParameterCodes,
  formulaMaterialQuery,
  canSearch,
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
  isBusy,
  onToggle,
  onShowOnlyPositiveChange,
  onSelectParameterView,
  onToggleCustomParameterCode,
  onQueryChange,
  onFamilyFilterChange,
  onPriceFilterChange,
  onPriceMinChange,
  onPriceMaxChange,
  onParameterToAddChange,
  onAddCondition,
  onUpdateCondition,
  onRemoveCondition,
  onLoadMoreMaterials,
  onResetFilters,
  onInspectMaterial,
  onToggleCompareMaterial,
  onAddFormulaLine,
  onToggleExpandedMaterial,
  onClearComparison,
}: FormulaMaterialsStepProps) {
  return (
    <BuilderStep
      section="materials"
      title="2. Materias primas"
      summary={
        <>
          {catalogLoading ? "Cargando catalogo" : `${catalogTotal} disponibles`} -{" "}
          {visibleParameterSummary}
        </>
      }
      isOpen={isOpen}
      bodyClassName="builderSearch"
      onToggle={onToggle}
    >
      <ParameterViewPanel
        selectedPresetHelper={selectedPresetHelper}
        showOnlyPositiveParameters={showOnlyPositiveParameters}
        parameterViewPreset={parameterViewPreset}
        parameterCatalog={parameterCatalog}
        customParameterCodes={customParameterCodes}
        onShowOnlyPositiveChange={onShowOnlyPositiveChange}
        onSelectParameterView={onSelectParameterView}
        onToggleCustomParameterCode={onToggleCustomParameterCode}
      />
      <MaterialCatalogControls
        query={formulaMaterialQuery}
        canSearch={canSearch}
        catalogParameterConditions={catalogParameterConditions}
        catalogFamilyFilter={catalogFamilyFilter}
        catalogMaterialFamilies={catalogMaterialFamilies}
        catalogPriceFilter={catalogPriceFilter}
        catalogPriceMin={catalogPriceMin}
        catalogPriceMax={catalogPriceMax}
        catalogParameterToAdd={catalogParameterToAdd}
        parameterCatalog={parameterCatalog}
        visibleParameterCodeSet={visibleParameterCodeSet}
        resultCount={materialSearchResults.length}
        catalogTotal={catalogTotal}
        catalogLoading={catalogLoading}
        materialResultLimit={materialResultLimit}
        onQueryChange={onQueryChange}
        onFamilyFilterChange={onFamilyFilterChange}
        onPriceFilterChange={onPriceFilterChange}
        onPriceMinChange={onPriceMinChange}
        onPriceMaxChange={onPriceMaxChange}
        onParameterToAddChange={onParameterToAddChange}
        onAddCondition={onAddCondition}
        onUpdateCondition={onUpdateCondition}
        onRemoveCondition={onRemoveCondition}
        onLoadMore={onLoadMoreMaterials}
        onResetFilters={onResetFilters}
      />
      <MaterialCatalogWorkspace
        catalogLoading={catalogLoading}
        catalogTotal={catalogTotal}
        materials={materialSearchResults}
        workspaceMaterialCount={workspaceMaterialCount}
        formulaLines={formulaLines}
        selectedMaterialId={selectedMaterialId}
        selectedMaterial={selectedMaterial}
        selectedMaterialParameters={selectedMaterialParameters}
        comparisonMaterials={comparisonMaterials}
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
        onClearComparison={onClearComparison}
      />
    </BuilderStep>
  );
}
