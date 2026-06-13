import { AlertTriangle, Beaker, Loader2, Save } from "lucide-react";
import type { CalculationParameterRow } from "../formula-builder-derived";
import {
  parameterDisplayCode,
  type ParameterViewPresetKey,
} from "../formula-builder-model";
import { normalizeWarningSeverity } from "../formula-formatters";
import type { CalculationResult } from "../formula-model";
import { ParameterPresetPicker } from "./parameter-preset-picker";

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
