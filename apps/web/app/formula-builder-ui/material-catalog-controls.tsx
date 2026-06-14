import { Search } from "lucide-react";
import type { ParameterCatalogItem } from "../formula-builder-derived";
import {
  type CatalogParameterConditionPatch,
  type CatalogPriceFilter,
  MaterialCatalogFilterPanel,
} from "./material-catalog-filter-panel";

type MaterialCatalogControlsProps = {
  query: string;
  canSearch: boolean;
  catalogParameterConditions: Array<{ id: string; code: string; min: string; max: string }>;
  catalogFamilyFilter: string;
  catalogMaterialFamilies: string[];
  catalogPriceFilter: CatalogPriceFilter;
  catalogPriceMin: string;
  catalogPriceMax: string;
  catalogParameterToAdd: string;
  parameterCatalog: ParameterCatalogItem[];
  visibleParameterCodeSet: Set<string>;
  resultCount: number;
  catalogTotal: number;
  catalogLoading: boolean;
  materialResultLimit: number;
  onQueryChange: (value: string) => void;
  onFamilyFilterChange: (value: string) => void;
  onPriceFilterChange: (value: CatalogPriceFilter) => void;
  onPriceMinChange: (value: string) => void;
  onPriceMaxChange: (value: string) => void;
  onParameterToAddChange: (value: string) => void;
  onAddCondition: (code?: string) => void;
  onUpdateCondition: (id: string, patch: CatalogParameterConditionPatch) => void;
  onRemoveCondition: (id: string) => void;
  onLoadMore: () => void;
  onResetFilters: () => void;
};

export function MaterialCatalogControls({
  query,
  canSearch,
  catalogParameterConditions,
  catalogFamilyFilter,
  catalogMaterialFamilies,
  catalogPriceFilter,
  catalogPriceMin,
  catalogPriceMax,
  catalogParameterToAdd,
  parameterCatalog,
  visibleParameterCodeSet,
  resultCount,
  catalogTotal,
  catalogLoading,
  materialResultLimit,
  onQueryChange,
  onFamilyFilterChange,
  onPriceFilterChange,
  onPriceMinChange,
  onPriceMaxChange,
  onParameterToAddChange,
  onAddCondition,
  onUpdateCondition,
  onRemoveCondition,
  onLoadMore,
  onResetFilters,
}: MaterialCatalogControlsProps) {
  const loadMoreCount = Math.min(500, Math.max(catalogTotal - materialResultLimit, 0));

  return (
    <>
      <label className="fullWidthLabel">
        <span>Buscar y anadir materia prima</span>
        <div className="searchInputWrap">
          <Search size={16} />
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Nombre, codigo, SAP/ERP, alias o familia"
            disabled={!canSearch}
          />
        </div>
      </label>
      <MaterialCatalogFilterPanel
        catalogParameterConditions={catalogParameterConditions}
        catalogFamilyFilter={catalogFamilyFilter}
        catalogMaterialFamilies={catalogMaterialFamilies}
        catalogPriceFilter={catalogPriceFilter}
        catalogPriceMin={catalogPriceMin}
        catalogPriceMax={catalogPriceMax}
        catalogParameterToAdd={catalogParameterToAdd}
        parameterCatalog={parameterCatalog}
        visibleParameterCodeSet={visibleParameterCodeSet}
        onFamilyFilterChange={onFamilyFilterChange}
        onPriceFilterChange={onPriceFilterChange}
        onPriceMinChange={onPriceMinChange}
        onPriceMaxChange={onPriceMaxChange}
        onParameterToAddChange={onParameterToAddChange}
        onAddCondition={onAddCondition}
        onUpdateCondition={onUpdateCondition}
        onRemoveCondition={onRemoveCondition}
      />
      <div className="catalogResultMeta">
        <span>
          Mostrando {resultCount} de {catalogTotal}
          {catalogLoading ? " - cargando" : ""}
        </span>
        <div>
          {materialResultLimit < catalogTotal ? (
            <button className="textButton" type="button" onClick={onLoadMore}>
              Ver {loadMoreCount} mas
            </button>
          ) : null}
          <button className="textButton" type="button" onClick={onResetFilters}>
            Reset filtros
          </button>
        </div>
      </div>
    </>
  );
}
