import { FlaskConical, GitCompareArrows } from "lucide-react";
import { MaterialComparePanel } from "./formula-builder-ui/material-compare-panel";
import type { RawMaterial } from "./raw-material-model";
import {
  SavedFormulaComparisonPanel,
  type SavedFormulaComparisonPanelProps,
} from "./saved-formula-comparison-panel";

type ComparatorPanelProps = {
  active: boolean;
  formulaComparison: Omit<SavedFormulaComparisonPanelProps, "active" | "variant">;
  rawMaterials: RawMaterial[];
  materialComparisonIds: string[];
  materialComparisonMaterials: RawMaterial[];
  visibleParameterCodes: string[];
  showOnlyPositiveParameters: boolean;
  canEditTenantData: boolean;
  isBusy: boolean;
  onSelectMaterialComparison: (slot: 0 | 1, rawMaterialId: string) => void | Promise<void>;
  onClearMaterialComparison: () => void;
  onShowOnlyPositiveParametersChange: (checked: boolean) => void;
};

export function ComparatorPanel({
  active,
  formulaComparison,
  rawMaterials,
  materialComparisonIds,
  materialComparisonMaterials,
  visibleParameterCodes,
  showOnlyPositiveParameters,
  canEditTenantData,
  isBusy,
  onSelectMaterialComparison,
  onClearMaterialComparison,
  onShowOnlyPositiveParametersChange,
}: ComparatorPanelProps) {
  return (
    <>
      <SavedFormulaComparisonPanel
        {...formulaComparison}
        active={active}
        variant="comparator"
      />
      <section id="material-comparator" className="panel materialComparatorPanel" hidden={!active}>
        <div className="panelHeader">
          <h2>Comparador de materias primas</h2>
          <span>{rawMaterials.length} disponibles</span>
        </div>
        <div className="materialComparatorControls">
          <label>
            <span>Materia A</span>
            <select
              value={materialComparisonIds[0] ?? ""}
              onChange={(event) => void onSelectMaterialComparison(0, event.target.value)}
              disabled={!canEditTenantData || isBusy || rawMaterials.length === 0}
            >
              <option value="">Selecciona materia</option>
              {rawMaterials.map((material) => (
                <option key={material.id} value={material.id}>
                  {material.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Materia B</span>
            <select
              value={materialComparisonIds[1] ?? ""}
              onChange={(event) => void onSelectMaterialComparison(1, event.target.value)}
              disabled={!canEditTenantData || isBusy || rawMaterials.length === 0}
            >
              <option value="">Selecciona materia</option>
              {rawMaterials.map((material) => (
                <option key={material.id} value={material.id}>
                  {material.name}
                </option>
              ))}
            </select>
          </label>
          <div className="segmentedButtons" aria-label="Parametros visibles en comparador">
            <button
              type="button"
              data-selected={showOnlyPositiveParameters}
              onClick={() => onShowOnlyPositiveParametersChange(true)}
            >
              Con valor
            </button>
            <button
              type="button"
              data-selected={!showOnlyPositiveParameters}
              onClick={() => onShowOnlyPositiveParametersChange(false)}
            >
              Todos
            </button>
          </div>
          <button
            className="secondaryButton"
            type="button"
            onClick={onClearMaterialComparison}
            disabled={isBusy || materialComparisonMaterials.length === 0}
          >
            <GitCompareArrows size={16} />
            Limpiar materias
          </button>
        </div>
        {materialComparisonMaterials.length ? (
          <MaterialComparePanel
            comparisonMaterials={materialComparisonMaterials}
            visibleParameterCodes={visibleParameterCodes}
            showOnlyPositiveParameters={showOnlyPositiveParameters}
            onClearComparison={onClearMaterialComparison}
          />
        ) : (
          <div className="empty comparatorEmpty">
            <FlaskConical size={18} />
            Selecciona dos materias primas para compararlas.
          </div>
        )}
      </section>
    </>
  );
}
