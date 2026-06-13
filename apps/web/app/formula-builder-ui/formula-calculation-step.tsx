import type { CalculationParameterRow } from "../formula-builder-derived";
import type {
  BuilderSectionKey,
  ParameterViewPresetKey,
} from "../formula-builder-model";
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
  showOnlyPositiveParameters: boolean;
  parameterViewPreset: ParameterViewPresetKey;
  isFormulaBalanced: boolean;
  totalPercentage: number;
  isBusy: boolean;
  canSaveFormula: boolean;
  onToggle: (section: BuilderSectionKey) => void;
  onShowOnlyPositiveChange: (value: boolean) => void;
  onSelectParameterView: (value: ParameterViewPresetKey) => void;
  onSaveFormula: () => void | Promise<void>;
};

export function FormulaCalculationStep({
  isOpen,
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
  onToggle,
  onShowOnlyPositiveChange,
  onSelectParameterView,
  onSaveFormula,
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
        showOnlyPositiveParameters={showOnlyPositiveParameters}
        parameterViewPreset={parameterViewPreset}
        isFormulaBalanced={isFormulaBalanced}
        totalPercentage={totalPercentage}
        isBusy={isBusy}
        canSaveFormula={canSaveFormula}
        onShowOnlyPositiveChange={onShowOnlyPositiveChange}
        onSelectParameterView={onSelectParameterView}
        onSaveFormula={onSaveFormula}
      />
    </BuilderStep>
  );
}
