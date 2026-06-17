import { AlertTriangle, Beaker } from "lucide-react";
import {
  formatResultPrice,
  normalizeWarningSeverity,
} from "./formula-formatters";
import type { CalculationResult } from "./formula-model";
import { sortByParameterCode } from "./parameter-order";

type CalculationResultsPanelProps = {
  active: boolean;
  result: CalculationResult | null;
};

export function CalculationResultsPanel({ active, result }: CalculationResultsPanelProps) {
  return (
    <section id="results" className="panel resultPanel" hidden={!active}>
      <div className="panelHeader">
        <h2>Calculation results</h2>
        <span>{result ? result.currency : "Pending"}</span>
      </div>
      <div className="resultStats">
        <div>
          <span>Total price</span>
          <strong>{formatResultPrice(result)}</strong>
        </div>
        <div>
          <span>Total percentage</span>
          <strong>{result ? `${result.total_percentage.toFixed(1)}%` : "-"}</strong>
        </div>
        <div>
          <span>Warnings</span>
          <strong>{result?.warnings.length ?? 0}</strong>
        </div>
      </div>
      <div className="parameterList">
        {result?.parameters.length ? (
          sortByParameterCode(result.parameters, (parameter) => parameter.code).map((parameter) => (
            <div key={parameter.code}>
              <Beaker size={18} />
              <span>{parameter.code}</span>
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
        {result?.warnings.length ? (
          result.warnings.map((warning, index) => {
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
    </section>
  );
}
