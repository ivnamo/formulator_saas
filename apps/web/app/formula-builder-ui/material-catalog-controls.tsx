import { Filter, Plus, Search, Trash2 } from "lucide-react";
import type { ParameterCatalogItem } from "../formula-builder-derived";
import { parameterDisplayCode } from "../formula-builder-model";

type CatalogParameterConditionPatch = Partial<{
  code: string;
  min: string;
  max: string;
}>;

type MaterialCatalogControlsProps = {
  query: string;
  canSearch: boolean;
  catalogParameterConditions: Array<{ id: string; code: string; min: string; max: string }>;
  catalogFamilyFilter: string;
  catalogMaterialFamilies: string[];
  catalogPriceFilter: "all" | "with_price" | "missing_price";
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
  onPriceFilterChange: (value: "all" | "with_price" | "missing_price") => void;
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
      <details className="materialFilterPanel">
        <summary>
          <Filter size={16} />
          Filtros avanzados
          {catalogParameterConditions.length ? <code>{catalogParameterConditions.length}</code> : null}
        </summary>
        <div className="materialFilterGrid">
          <label>
            <span>Familia materia</span>
            <select
              value={catalogFamilyFilter}
              onChange={(event) => onFamilyFilterChange(event.target.value)}
            >
              <option value="all">Todas</option>
              {catalogMaterialFamilies.map((family) => (
                <option key={family} value={family}>
                  {family}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Precio</span>
            <select
              value={catalogPriceFilter}
              onChange={(event) =>
                onPriceFilterChange(event.target.value as "all" | "with_price" | "missing_price")
              }
            >
              <option value="all">Todos</option>
              <option value="with_price">Con precio</option>
              <option value="missing_price">Sin precio</option>
            </select>
          </label>
          <label>
            <span>Precio min</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={catalogPriceMin}
              onChange={(event) => onPriceMinChange(event.target.value)}
              placeholder="0.00"
            />
          </label>
          <label>
            <span>Precio max</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={catalogPriceMax}
              onChange={(event) => onPriceMaxChange(event.target.value)}
              placeholder="Sin limite"
            />
          </label>
          <label className="parameterFilterAdd">
            <span>Parametro tecnico</span>
            <select
              value={catalogParameterToAdd}
              onChange={(event) => onParameterToAddChange(event.target.value)}
            >
              <option value="">Selecciona parametro</option>
              {parameterCatalog.map((parameter) => (
                <option key={parameter.code} value={parameter.code}>
                  {parameterDisplayCode(parameter.code)} - {parameter.family}
                </option>
              ))}
            </select>
          </label>
          <button
            className="secondaryButton compactButton"
            type="button"
            onClick={() => onAddCondition()}
            disabled={!catalogParameterToAdd}
          >
            <Plus size={15} />
            Anadir filtro
          </button>
        </div>
        {catalogParameterConditions.length ? (
          <div className="parameterRangeFilters">
            {catalogParameterConditions.map((condition) => {
              const parameter = parameterCatalog.find(
                (candidate) => candidate.code === condition.code,
              );
              return (
                <div key={condition.id} className="parameterRangeFilter">
                  <label>
                    <span>Parametro</span>
                    <select
                      value={condition.code}
                      onChange={(event) =>
                        onUpdateCondition(condition.id, { code: event.target.value })
                      }
                    >
                      {parameterCatalog.map((candidate) => (
                        <option key={candidate.code} value={candidate.code}>
                          {parameterDisplayCode(candidate.code)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Min</span>
                    <input
                      type="number"
                      step="0.01"
                      value={condition.min}
                      onChange={(event) =>
                        onUpdateCondition(condition.id, { min: event.target.value })
                      }
                      placeholder="sin min"
                    />
                  </label>
                  <label>
                    <span>Max</span>
                    <input
                      type="number"
                      step="0.01"
                      value={condition.max}
                      onChange={(event) =>
                        onUpdateCondition(condition.id, { max: event.target.value })
                      }
                      placeholder="sin max"
                    />
                  </label>
                  <span>
                    {parameter?.unit ?? ""}
                    <small>{parameter?.family ?? "Parametro"}</small>
                  </span>
                  <button
                    className="iconButton danger"
                    type="button"
                    onClick={() => onRemoveCondition(condition.id)}
                    title="Quitar filtro"
                    aria-label={`Quitar filtro ${condition.code}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="filterHint">Ejemplo: B entre 4 y 10, y Sum AA libres con minimo 0.01.</p>
        )}
        <div className="quickFilterChips" aria-label="Parametros visibles para filtrar">
          {parameterCatalog
            .filter((parameter) => visibleParameterCodeSet.has(parameter.code))
            .slice(0, 12)
            .map((parameter) => (
              <button
                key={parameter.code}
                className="segmentedChip"
                type="button"
                data-selected={catalogParameterConditions.some(
                  (condition) => condition.code === parameter.code,
                )}
                onClick={() => onAddCondition(parameter.code)}
              >
                {parameterDisplayCode(parameter.code)}
              </button>
            ))}
        </div>
      </details>
      <div className="catalogResultMeta">
        <span>
          Mostrando {resultCount} de {catalogTotal}
          {catalogLoading ? " - cargando" : ""}
        </span>
        <div>
          {materialResultLimit < catalogTotal ? (
            <button className="textButton" type="button" onClick={onLoadMore}>
              Ver 60 mas
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
