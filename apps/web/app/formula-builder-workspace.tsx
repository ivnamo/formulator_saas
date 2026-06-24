import {
  FormulaBasicsStep,
  type FormulaBasicsStepProps,
} from "./formula-builder-ui/formula-basics-step";
import {
  FormulaCalculationStep,
  type FormulaCalculationStepProps,
} from "./formula-builder-ui/formula-calculation-step";
import {
  FormulaCompositionStep,
  type FormulaCompositionStepProps,
} from "./formula-builder-ui/formula-composition-step";
import {
  FormulaMaterialsStep,
  type FormulaMaterialsStepProps,
} from "./formula-builder-ui/formula-materials-step";
import {
  FormulaReviewStep,
  type FormulaReviewStepProps,
} from "./formula-builder-ui/formula-review-step";
import { FormulaWorkModeBanner } from "./formula-builder-ui/formula-work-mode-banner";
import type { FormulaBuilderMode } from "./formula-builder-model";
import {
  formatResultPrice,
  formatSignedDelta,
  formatSignedInteger,
} from "./formula-formatters";

type FormulaCompositionWorkspaceProps = Omit<
  FormulaCompositionStepProps,
  "formatResultPrice" | "formatSignedDelta" | "formatSignedInteger"
>;

type FormulaBuilderWorkspaceProps = {
  active: boolean;
  totalPercentage: number;
  isFormulaBalanced: boolean;
  basics: FormulaBasicsStepProps;
  materials: FormulaMaterialsStepProps;
  composition: FormulaCompositionWorkspaceProps;
  calculation: FormulaCalculationStepProps;
  review: FormulaReviewStepProps;
};

export function FormulaBuilderWorkspace({
  active,
  totalPercentage,
  isFormulaBalanced,
  basics,
  materials,
  composition,
  calculation,
  review,
}: FormulaBuilderWorkspaceProps) {
  const workKindLabel = formulaBuilderWorkKindLabel(
    basics.values.formulaBuilderMode,
    Boolean(basics.values.formulaId),
  );
  const balanceLabel = isFormulaBalanced ? "Balanced" : `${totalPercentage.toFixed(1)}%`;

  return (
    <section id="formula" className="panel formulaPanel formulaBuilder" hidden={!active}>
      <div className="panelHeader">
        <h2>Formula Builder</h2>
        <span>
          {workKindLabel} - {balanceLabel}
        </span>
      </div>
      <FormulaWorkModeBanner
        values={basics.values}
        isBusy={basics.isBusy}
        onChange={basics.onChange}
      />
      <FormulaBasicsStep {...basics} />
      <FormulaMaterialsStep {...materials} />
      <FormulaCompositionStep
        {...composition}
        formatResultPrice={formatResultPrice}
        formatSignedDelta={formatSignedDelta}
        formatSignedInteger={formatSignedInteger}
      />
      <FormulaCalculationStep {...calculation} />
      <FormulaReviewStep {...review} />
    </section>
  );
}

function formulaBuilderWorkKindLabel(mode: FormulaBuilderMode, hasLoadedFormula: boolean) {
  if (hasLoadedFormula && mode === "editing") {
    return "Modificando cargada";
  }
  if (hasLoadedFormula && mode === "version") {
    return "Nueva version";
  }
  return "Nueva";
}
