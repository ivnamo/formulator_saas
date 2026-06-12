import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Beaker,
  ChevronDown,
  Copy,
  Filter,
  ListChecks,
  Loader2,
  Plus,
  Save,
  Search,
  Trash2,
} from "lucide-react";
import type { ReactNode } from "react";
import {
  PARAMETER_VIEW_PRESETS,
  formatFormulaNumber,
  formatParameterValue,
  materialParametersForView,
  parameterDisplayCode,
  parameterFamilyForCode,
  type BuilderSectionKey,
  type ParameterViewPresetKey,
} from "./formula-builder-model";
import type { CalculationResult, FormulaLine, RawMaterial } from "./workspace-model";

type BuilderStepProps = {
  section: BuilderSectionKey;
  title: string;
  summary: ReactNode;
  isOpen: boolean;
  bodyClassName?: string;
  onToggle: (section: BuilderSectionKey) => void;
  children: ReactNode;
};

export function BuilderStep({
  section,
  title,
  summary,
  isOpen,
  bodyClassName = "",
  onToggle,
  children,
}: BuilderStepProps) {
  return (
    <section className="builderStep" data-open={isOpen}>
      <button className="builderStepHeader" type="button" onClick={() => onToggle(section)}>
        <span>
          <strong>{title}</strong>
          <small>{summary}</small>
        </span>
        <ChevronDown size={18} />
      </button>
      {isOpen ? <div className={`builderStepBody ${bodyClassName}`.trim()}>{children}</div> : null}
    </section>
  );
}

type ParameterPresetPickerProps = {
  value: ParameterViewPresetKey;
  onChange: (value: ParameterViewPresetKey) => void;
  compact?: boolean;
};

export function ParameterPresetPicker({
  value,
  onChange,
  compact = false,
}: ParameterPresetPickerProps) {
  return (
    <div
      className={compact ? "parameterPresetList compactPresetList" : "parameterPresetList"}
      role="list"
      aria-label="Vistas de parametros"
    >
      {PARAMETER_VIEW_PRESETS.map((preset) => (
        <button
          key={preset.key}
          className="segmentedChip"
          data-selected={value === preset.key}
          type="button"
          onClick={() => onChange(preset.key)}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}

type FormulaProgressSummaryProps = {
  totalPercentage: number;
  isBalanced: boolean;
  price: string;
  source: string;
};

export function FormulaProgressSummary({
  totalPercentage,
  isBalanced,
  price,
  source,
}: FormulaProgressSummaryProps) {
  return (
    <>
      <div className="formulaMeter" aria-label="Formula percentage total">
        <div style={{ width: `${Math.min(Math.max(totalPercentage, 0), 100)}%` }} />
      </div>
      <div className="formulaSummary">
        <div>
          <span>Total percentage</span>
          <strong>{totalPercentage.toFixed(1)}%</strong>
        </div>
        <div>
          <span>Status</span>
          <strong>{isBalanced ? "Balanced" : "Draft"}</strong>
        </div>
        <div>
          <span>Price</span>
          <strong>{price}</strong>
        </div>
        <div>
          <span>Calculation source</span>
          <strong>{source}</strong>
        </div>
      </div>
    </>
  );
}

type FormulaLineDetail = {
  localId: string;
  rawMaterialId: string;
  percentage: number;
  index: number;
  material?: RawMaterial;
};

type FormulaLineTableProps = {
  lines: FormulaLineDetail[];
  visibleParameterCodes: string[];
  showOnlyPositiveParameters: boolean;
  isBusy: boolean;
  onMoveLine: (localId: string, direction: -1 | 1) => void;
  onUpdateLine: (localId: string, percentage: number) => void;
  onDuplicateLine: (localId: string) => void;
  onRemoveLine: (localId: string) => void;
};

export function FormulaLineTable({
  lines,
  visibleParameterCodes,
  showOnlyPositiveParameters,
  isBusy,
  onMoveLine,
  onUpdateLine,
  onDuplicateLine,
  onRemoveLine,
}: FormulaLineTableProps) {
  return (
    <div className="formulaLineTable">
      <div className="formulaLineHead">
        <span>Orden</span>
        <span>Codigo</span>
        <span>Materia prima</span>
        <span>%</span>
        <span>Parametros visibles</span>
        <span>Estado</span>
        <span>Acciones</span>
      </div>
      {lines.length === 0 ? (
        <div className="empty">Busca y anade materias primas para empezar.</div>
      ) : (
        lines.map((line) => {
          const material = line.material;
          const parameterPreview = material
            ? materialParametersForView(
                material,
                visibleParameterCodes,
                showOnlyPositiveParameters,
                4,
              )
            : [];
          const lineWarnings = [
            material?.price === null ? "sin precio" : null,
            material?.isObsolete ? "obsoleta" : null,
            material && !material.isActive ? "inactiva" : null,
          ].filter(Boolean);

          return (
            <div className="formulaLineRow" key={line.localId}>
              <div className="orderControls">
                <strong>{line.index + 1}</strong>
                <button
                  className="iconButton"
                  type="button"
                  onClick={() => onMoveLine(line.localId, -1)}
                  disabled={isBusy || line.index === 0}
                  title="Subir linea"
                  aria-label={`Subir ${material?.name ?? "linea"}`}
                >
                  <ArrowUp size={15} />
                </button>
                <button
                  className="iconButton"
                  type="button"
                  onClick={() => onMoveLine(line.localId, 1)}
                  disabled={isBusy || line.index === lines.length - 1}
                  title="Bajar linea"
                  aria-label={`Bajar ${material?.name ?? "linea"}`}
                >
                  <ArrowDown size={15} />
                </button>
              </div>
              <code>{material?.code ?? "-"}</code>
              <span className="formulaMaterialName">
                <strong>{material?.name ?? "Unknown material"}</strong>
                <small>
                  {material?.externalCode ? `ERP ${material.externalCode}` : "Sin ERP"}
                  {material?.family ? ` - ${material.family}` : ""}
                </small>
                {parameterPreview.length ? (
                  <span className="parameterBadgeList">
                    {parameterPreview.map((parameter) => (
                      <em key={parameter.code}>{formatParameterValue(parameter)}</em>
                    ))}
                  </span>
                ) : null}
              </span>
              <input
                aria-label={`${material?.name ?? "Material"} percentage`}
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={line.percentage}
                onChange={(event) => onUpdateLine(line.localId, Number(event.target.value))}
                disabled={isBusy}
              />
              <span className="lineParameterPreview">
                {parameterPreview.length
                  ? parameterPreview.map((parameter) => (
                      <em key={parameter.code}>{formatParameterValue(parameter)}</em>
                    ))
                  : "-"}
              </span>
              <span className="lineWarnings">
                {lineWarnings.length ? lineWarnings.join(", ") : "OK"}
              </span>
              <div className="lineActions">
                <button
                  className="iconButton"
                  type="button"
                  onClick={() => onDuplicateLine(line.localId)}
                  disabled={isBusy}
                  title="Duplicar linea"
                  aria-label={`Duplicar ${material?.name ?? "linea"}`}
                >
                  <Copy size={15} />
                </button>
                <button
                  className="iconButton danger"
                  type="button"
                  onClick={() => onRemoveLine(line.localId)}
                  disabled={isBusy}
                  title="Eliminar linea"
                  aria-label={`Eliminar ${material?.name ?? "linea"}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

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
      <div className="quickMaterialList">
        {catalogLoading && materials.length === 0 ? (
          <div className="empty">Cargando materias primas...</div>
        ) : workspaceMaterialCount === 0 && catalogTotal === 0 ? (
          <div className="empty">Crea o importa materias primas para empezar.</div>
        ) : materials.length === 0 ? (
          <div className="empty">No hay materias disponibles con ese filtro.</div>
        ) : (
          materials.map((material) => {
            const isSelected = formulaLines.some((line) => line.rawMaterialId === material.id);
            const hasMaterialDetail = detailedMaterialIds.includes(material.id);
            const parameterPreview = hasMaterialDetail
              ? materialParametersForView(
                  material,
                  visibleParameterCodes,
                  showOnlyPositiveParameters,
                  5,
                )
              : [];
            const detailParameters = hasMaterialDetail
              ? materialParametersForView(
                  material,
                  visibleParameterCodes,
                  showOnlyPositiveParameters,
                  120,
                )
              : [];
            const isExpanded = expandedMaterialIds.includes(material.id);
            const isCompared = comparisonMaterialIds.includes(material.id);

            return (
              <div
                className="quickMaterial"
                data-selected={isSelected || selectedMaterialId === material.id}
                key={material.id}
              >
                <span className="quickMaterialMain">
                  <strong>{material.name}</strong>
                  <small>
                    {material.code ?? "-"}
                    {material.externalCode ? ` - ${material.externalCode}` : ""}
                    {material.family ? ` - ${material.family}` : ""}
                  </small>
                  {parameterPreview.length ? (
                    <span className="parameterBadgeList">
                      {parameterPreview.map((parameter) => (
                        <em key={parameter.code}>{formatParameterValue(parameter)}</em>
                      ))}
                    </span>
                  ) : (
                    <span className="parameterBadgeList emptyBadges">
                      <em>
                        {hasMaterialDetail
                          ? showOnlyPositiveParameters
                            ? "Sin valores > 0 en esta vista"
                            : "Sin parametros en esta vista"
                          : `${material.positiveParameterCount} valores > 0 de ${material.parameterCount}`}
                      </em>
                    </span>
                  )}
                </span>
                <span className="quickMaterialMeta">
                  <code>{formatFormulaNumber(material.price, " EUR/kg")}</code>
                  <small>{material.parameterCount} parametros</small>
                </span>
                <div className="quickMaterialActions">
                  <button
                    className="iconButton"
                    type="button"
                    onClick={() => void onInspectMaterial(material.id)}
                    title="Inspeccionar materia"
                    aria-label={`Inspeccionar ${material.name}`}
                  >
                    <ListChecks size={16} />
                  </button>
                  <button
                    className="iconButton"
                    type="button"
                    data-selected={isCompared}
                    onClick={() => void onToggleCompareMaterial(material.id)}
                    title="Comparar materia"
                    aria-label={`Comparar ${material.name}`}
                  >
                    <Copy size={15} />
                  </button>
                  <button
                    className="secondaryButton compactButton"
                    type="button"
                    onClick={() => void onAddFormulaLine(material.id)}
                    disabled={isBusy || isSelected}
                  >
                    <Plus size={15} />
                    {isSelected ? "En formula" : "Anadir"}
                  </button>
                  <button
                    className="iconButton"
                    type="button"
                    onClick={() => void onToggleExpandedMaterial(material.id)}
                    aria-label={`Ver parametros de ${material.name}`}
                    title="Ver parametros"
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>
                {isExpanded ? (
                  <div className="materialParameterDetail">
                    {!hasMaterialDetail ? (
                      <div>
                        <span>Cargando detalle</span>
                        <code>-</code>
                      </div>
                    ) : detailParameters.length ? (
                      detailParameters.map((parameter) => (
                        <div key={parameter.code}>
                          <span>
                            {parameterDisplayCode(parameter.code)}
                            <small>{parameterFamilyForCode(parameter.code)}</small>
                          </span>
                          <code>{formatParameterValue(parameter)}</code>
                        </div>
                      ))
                    ) : (
                      <div>
                        <span>Sin parametros para la vista actual</span>
                        <code>-</code>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
      {selectedMaterial ? (
        <aside className="materialInspector">
          <div className="materialInspectorHeader">
            <div>
              <span>Materia seleccionada</span>
              <strong>{selectedMaterial.name}</strong>
              <small>
                {selectedMaterial.code ?? "-"}
                {selectedMaterial.externalCode ? ` - ERP ${selectedMaterial.externalCode}` : ""}
                {selectedMaterial.family ? ` - ${selectedMaterial.family}` : ""}
              </small>
            </div>
            <button
              className="secondaryButton compactButton"
              type="button"
              onClick={() => void onAddFormulaLine(selectedMaterial.id)}
              disabled={
                isBusy ||
                formulaLines.some((line) => line.rawMaterialId === selectedMaterial.id)
              }
            >
              <Plus size={15} />
              Anadir
            </button>
          </div>
          <div className="materialInspectorStats">
            <div>
              <span>Precio</span>
              <strong>{formatFormulaNumber(selectedMaterial.price, " EUR/kg")}</strong>
            </div>
            <div>
              <span>Parametros</span>
              <strong>{selectedMaterial.parameterCount}</strong>
            </div>
            <div>
              <span>&gt; 0</span>
              <strong>{selectedMaterial.positiveParameterCount}</strong>
            </div>
          </div>
          <div className="materialInspectorTable">
            {selectedMaterialParameters.length ? (
              selectedMaterialParameters.map((parameter) => (
                <div key={parameter.code}>
                  <span>
                    {parameterDisplayCode(parameter.code)}
                    <small>{parameterFamilyForCode(parameter.code)}</small>
                  </span>
                  <code>{formatParameterValue(parameter)}</code>
                </div>
              ))
            ) : (
              <div>
                <span>
                  {detailedMaterialIds.includes(selectedMaterial.id)
                    ? "Sin parametros para esta vista"
                    : "Abre el detalle para cargar parametros"}
                </span>
                <code>-</code>
              </div>
            )}
          </div>
        </aside>
      ) : null}
      {comparisonMaterials.length ? (
        <aside className="materialComparePanel">
          <div className="materialInspectorHeader">
            <div>
              <span>Comparacion rapida</span>
              <strong>{comparisonMaterials.length} materias</strong>
              <small>Usa los mismos parametros visibles.</small>
            </div>
            <button className="textButton" type="button" onClick={onClearComparison}>
              Limpiar
            </button>
          </div>
          <div className="materialCompareGrid">
            {comparisonMaterials.map((material) => {
              const parameters = materialParametersForView(
                material,
                visibleParameterCodes,
                showOnlyPositiveParameters,
                8,
              );
              return (
                <div key={material.id}>
                  <strong>{material.name}</strong>
                  <code>{formatFormulaNumber(material.price, " EUR/kg")}</code>
                  {parameters.length ? (
                    parameters.map((parameter) => (
                      <span key={parameter.code}>{formatParameterValue(parameter)}</span>
                    ))
                  ) : (
                    <span>Sin parametros en esta vista</span>
                  )}
                </div>
              );
            })}
          </div>
        </aside>
      ) : null}
    </div>
  );
}

type ParameterCatalogItem = {
  code: string;
  name: string;
  unit: string | null;
  family: string;
  materialCount: number;
  positiveMaterialCount: number;
};

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

type CalculationParameterRow = {
  code: string;
  value: number;
  unit: string | null;
  family: string;
  source: string;
};

type FormulaCalculationPanelProps = {
  isBackendResult: boolean;
  parameterRows: CalculationParameterRow[];
  visibleWarnings: CalculationResult["warnings"];
  selectedPresetLabel: string;
  visibleParameterSummary: string;
  showOnlyPositiveParameters: boolean;
  parameterViewPreset: ParameterViewPresetKey;
  isFormulaBalanced: boolean;
  totalPercentage: number;
  isBusy: boolean;
  canSaveFormula: boolean;
  onShowOnlyPositiveChange: (value: boolean) => void;
  onSelectParameterView: (value: ParameterViewPresetKey) => void;
  normalizeWarningSeverity: (warning: CalculationResult["warnings"][number]) => string;
  onSaveFormula: () => void | Promise<void>;
};

export function FormulaCalculationPanel({
  isBackendResult,
  parameterRows,
  visibleWarnings,
  selectedPresetLabel,
  visibleParameterSummary,
  showOnlyPositiveParameters,
  parameterViewPreset,
  isFormulaBalanced,
  totalPercentage,
  isBusy,
  canSaveFormula,
  onShowOnlyPositiveChange,
  onSelectParameterView,
  normalizeWarningSeverity,
  onSaveFormula,
}: FormulaCalculationPanelProps) {
  return (
    <>
      <div className="panelHeader">
        <h2>Calculo vivo</h2>
        <span>{isBackendResult ? "Backend" : "Preview"}</span>
      </div>
      <div className="parameterControls">
        <div>
          <strong>{selectedPresetLabel}</strong>
          <span>{visibleParameterSummary}</span>
        </div>
        <label className="switchControl">
          <input
            type="checkbox"
            checked={showOnlyPositiveParameters}
            onChange={(event) => onShowOnlyPositiveChange(event.target.checked)}
          />
          <span>Solo parametros &gt; 0</span>
        </label>
        <ParameterPresetPicker
          value={parameterViewPreset}
          onChange={onSelectParameterView}
          compact
        />
      </div>
      <div className="parameterList">
        {parameterRows.length ? (
          parameterRows.map((parameter) => (
            <div key={`${parameter.source}-${parameter.code}`}>
              <Beaker size={18} />
              <span>
                {parameterDisplayCode(parameter.code)}
                <small>{parameter.family}</small>
              </span>
              <code>
                {parameter.value.toFixed(2)} {parameter.unit ?? ""}
              </code>
            </div>
          ))
        ) : (
          <div>
            <Beaker size={18} />
            <span>No calculated parameters</span>
            <code>-</code>
          </div>
        )}
      </div>
      <div className="warningList">
        {visibleWarnings.length ? (
          visibleWarnings.map((warning, index) => {
            const severity = normalizeWarningSeverity(warning);
            return (
              <div
                data-severity={severity}
                key={`${warning.code}-${warning.rule_id ?? ""}-${warning.raw_material_id ?? ""}-${warning.parameter_code ?? ""}-${index}`}
              >
                <AlertTriangle size={16} />
                <span>
                  <strong>{severity}</strong>
                  {warning.message}
                  {warning.recommended_action ? <small>{warning.recommended_action}</small> : null}
                </span>
              </div>
            );
          })
        ) : (
          <div>No warnings</div>
        )}
      </div>
      <div className="formulaSavePanel" data-balanced={isFormulaBalanced}>
        <div>
          <span>Guardar formula</span>
          <strong>
            {isFormulaBalanced
              ? "Lista para guardar"
              : `No se puede guardar: suma ${totalPercentage.toFixed(1)}%`}
          </strong>
          <small>
            {isFormulaBalanced
              ? "Se guardara la formula y se recalculara el precio final oficial."
              : "El guardado queda bloqueado hasta que la formula sume 100.0%."}
          </small>
        </div>
        <button
          className="primaryButton"
          type="button"
          onClick={() => void onSaveFormula()}
          disabled={!canSaveFormula}
        >
          {isBusy ? <Loader2 className="spin" size={17} /> : <Save size={17} />}
          Guardar formula
        </button>
      </div>
    </>
  );
}
