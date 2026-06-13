import {
  formatFormulaNumber,
  formatParameterValue,
  materialParametersForView,
} from "../formula-builder-model";
import type { RawMaterial } from "../raw-material-model";

type MaterialComparePanelProps = {
  comparisonMaterials: RawMaterial[];
  visibleParameterCodes: string[];
  showOnlyPositiveParameters: boolean;
  onClearComparison: () => void;
};

export function MaterialComparePanel({
  comparisonMaterials,
  visibleParameterCodes,
  showOnlyPositiveParameters,
  onClearComparison,
}: MaterialComparePanelProps) {
  return (
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
  );
}
