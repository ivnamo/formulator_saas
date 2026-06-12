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
};

export function FormulaBuilderWorkspace({
  active,
  totalPercentage,
  isFormulaBalanced,
  basics,
  materials,
  composition,
  calculation,
}: FormulaBuilderWorkspaceProps) {
  return (
    <section id="formula" className="panel formulaPanel formulaBuilder" hidden={!active}>
      <div className="panelHeader">
        <h2>Formula Builder</h2>
        <span>{isFormulaBalanced ? "Balanced" : `${totalPercentage.toFixed(1)}%`}</span>
      </div>
      <FormulaBasicsStep {...basics} />
      <FormulaMaterialsStep {...materials} />
      <FormulaCompositionStep
        {...composition}
        formatResultPrice={formatResultPrice}
        formatSignedDelta={formatSignedDelta}
        formatSignedInteger={formatSignedInteger}
      />
      <FormulaCalculationStep {...calculation} />
    </section>
  );
}
