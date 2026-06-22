import type { CalculationParameterRow } from "../formula-builder-derived";
import type { BuilderSectionKey } from "../formula-builder-model";
import type { CalculationResult } from "../formula-model";
import { BuilderStep } from "./builder-step";
import { FormulaCalculationPanel } from "./formula-calculation-panel";

export type FormulaCalculationStepProps = {
  isOpen: boolean;
  isBackendResult: boolean;
  parameterRows: CalculationParameterRow[];
  visibleWarnings: CalculationResult["warnings"];
  selectedPresetLabel: string;
  visibleParameterSummary: string;
  onToggle: (section: BuilderSectionKey) => void;
};

export function FormulaCalculationStep({
  isOpen,
  isBackendResult,
  parameterRows,
  visibleWarnings,
  selectedPresetLabel,
  visibleParameterSummary,
  onToggle,
}: FormulaCalculationStepProps) {
  return (
    <BuilderStep
      section="calculation"
      title="4. Calculo vivo"
      summary={
        <>
          {isBackendResult ? "Backend oficial" : "Preview local"} - {parameterRows.length} parametros
        </>
      }
      isOpen={isOpen}
      bodyClassName="builderCalculationPanel"
      onToggle={onToggle}
    >
      <FormulaCalculationPanel
        isBackendResult={isBackendResult}
        parameterRows={parameterRows}
        visibleWarnings={visibleWarnings}
        selectedPresetLabel={selectedPresetLabel}
        visibleParameterSummary={visibleParameterSummary}
      />
    </BuilderStep>
  );
}
