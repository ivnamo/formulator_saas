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
  isFormulaBalanced: boolean;
  totalPercentage: number;
  isBusy: boolean;
  canSaveFormula: boolean;
  onToggle: (section: BuilderSectionKey) => void;
  onSaveFormula: () => void | Promise<void>;
  onExportExcel: () => void | Promise<void>;
};

export function FormulaCalculationStep({
  isOpen,
  isBackendResult,
  parameterRows,
  visibleWarnings,
  selectedPresetLabel,
  visibleParameterSummary,
  isFormulaBalanced,
  totalPercentage,
  isBusy,
  canSaveFormula,
  onToggle,
  onSaveFormula,
  onExportExcel,
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
        isFormulaBalanced={isFormulaBalanced}
        totalPercentage={totalPercentage}
        isBusy={isBusy}
        canSaveFormula={canSaveFormula}
        onSaveFormula={onSaveFormula}
        onExportExcel={onExportExcel}
      />
    </BuilderStep>
  );
}
