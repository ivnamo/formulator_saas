import { formulaLinePercentageValue } from "./formula-builder-model";
import type { CalculationResult } from "./formula-model";
import type { FormulaLine } from "./workspace-base-model";
import { request } from "./workspace-api";

export function calculateAdHocFormula(
  headers: HeadersInit,
  lines: FormulaLine[],
  requiredParameterCodes: string[] = [],
): Promise<CalculationResult> {
  return request<CalculationResult>("/api/v1/formulas/calculate", {
    method: "POST",
    headers,
    body: JSON.stringify({
      items: lines.map((line, index) => ({
        raw_material_id: line.rawMaterialId,
        percentage: formulaLinePercentageValue(line.percentage),
        order_index: index,
      })),
      required_parameter_codes: requiredParameterCodes,
    }),
  });
}
