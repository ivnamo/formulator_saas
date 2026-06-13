import { Plus } from "lucide-react";
import {
  formatFormulaNumber,
  formatParameterValue,
  parameterDisplayCode,
  parameterFamilyForCode,
} from "../formula-builder-model";
import type { RawMaterial } from "../raw-material-model";
import type { FormulaLine } from "../workspace-base-model";

type MaterialInspectorPanelProps = {
  selectedMaterial: RawMaterial;
  selectedMaterialParameters: Array<RawMaterial["parameters"][string]>;
  detailedMaterialIds: string[];
  formulaLines: FormulaLine[];
  isBusy: boolean;
  onAddFormulaLine: (rawMaterialId: string) => void | Promise<void>;
};

export function MaterialInspectorPanel({
  selectedMaterial,
  selectedMaterialParameters,
  detailedMaterialIds,
  formulaLines,
  isBusy,
  onAddFormulaLine,
}: MaterialInspectorPanelProps) {
  return (
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
            isBusy || formulaLines.some((line) => line.rawMaterialId === selectedMaterial.id)
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
  );
}
