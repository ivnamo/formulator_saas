import { AlertTriangle, Beaker } from "lucide-react";
import type { CalculationParameterRow } from "../formula-builder-derived";
import {
  parameterDisplayCode,
} from "../formula-builder-model";
import { normalizeWarningSeverity } from "../formula-formatters";
import type { CalculationResult } from "../formula-model";

type FormulaCalculationPanelProps = {
  isBackendResult: boolean;
  parameterRows: CalculationParameterRow[];
  visibleWarnings: CalculationResult["warnings"];
  selectedPresetLabel: string;
  visibleParameterSummary: string;
};

export function FormulaCalculationPanel({
  isBackendResult,
  parameterRows,
  visibleWarnings,
  selectedPresetLabel,
  visibleParameterSummary,
}: FormulaCalculationPanelProps) {
  return (
    <>
      <div className="panelHeader">
        <h2>Calculo vivo</h2>
        <span>{isBackendResult ? "Backend" : "Preview"}</span>
      </div>
      <div className="parameterControls">
        <div>
          <strong>Vista {selectedPresetLabel}</strong>
          <span>{visibleParameterSummary}</span>
        </div>
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
    </>
  );
}
