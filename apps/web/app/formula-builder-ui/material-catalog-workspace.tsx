import { ChevronDown, Copy, ListChecks, Plus } from "lucide-react";
import {
  formatFormulaNumber,
  formatParameterValue,
  materialParametersForView,
  parameterDisplayCode,
  parameterFamilyForCode,
} from "../formula-builder-model";
import type { FormulaLine, RawMaterial } from "../workspace-model";

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
