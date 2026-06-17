import type { FormulaLineDetail } from "../formula-builder-derived";
import type { BuilderSectionKey } from "../formula-builder-model";
import type {
  CalculationResult,
} from "../formula-model";
import type { DraftComparison, DraftReviewState } from "../workspace-comparison";
import { BuilderStep } from "./builder-step";
import { DraftReviewPanel } from "./draft-review-panel";
import { FormulaLineTable } from "./formula-line-table";
import { FormulaProgressSummary } from "./formula-progress-summary";

export type FormulaCompositionStepProps = {
  isOpen: boolean;
  lineCount: number;
  totalPercentage: number;
  isFormulaBalanced: boolean;
  price: string;
  priceSource: string;
  draftReview: DraftReviewState | null;
  draftComparison: DraftComparison | null;
  isBusy: boolean;
  canConfirmDraftReview: boolean;
  formulaLineDetails: FormulaLineDetail[];
  visibleParameterCodes: string[];
  showOnlyPositiveParameters: boolean;
  formatResultPrice: (result: CalculationResult | null) => string;
  formatSignedDelta: (value: number | null, suffix?: string) => string;
  formatSignedInteger: (value: number) => string;
  onToggle: (section: BuilderSectionKey) => void;
  onNotesChange: (notes: string) => void;
  onConfirmDraftReview: () => void | Promise<void>;
  onMoveLine: (localId: string, direction: -1 | 1) => void;
  onUpdateLine: (localId: string, percentage: number) => void;
  onDuplicateLine: (localId: string) => void;
  onRemoveLine: (localId: string) => void;
};

export function FormulaCompositionStep({
  isOpen,
  lineCount,
  totalPercentage,
  isFormulaBalanced,
  price,
  priceSource,
  draftReview,
  draftComparison,
  isBusy,
  canConfirmDraftReview,
  formulaLineDetails,
  visibleParameterCodes,
  showOnlyPositiveParameters,
  formatResultPrice,
  formatSignedDelta,
  formatSignedInteger,
  onToggle,
  onNotesChange,
  onConfirmDraftReview,
  onMoveLine,
  onUpdateLine,
  onDuplicateLine,
  onRemoveLine,
}: FormulaCompositionStepProps) {
  return (
    <BuilderStep
      section="formula"
      title="3. Formula editable"
      summary={`${lineCount} lineas - ${totalPercentage.toFixed(1)}%`}
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <FormulaProgressSummary
        totalPercentage={totalPercentage}
        isBalanced={isFormulaBalanced}
        price={price}
        source={priceSource}
      />
      <FormulaLineTable
        lines={formulaLineDetails}
        visibleParameterCodes={visibleParameterCodes}
        showOnlyPositiveParameters={showOnlyPositiveParameters}
        isBusy={isBusy}
        onMoveLine={onMoveLine}
        onUpdateLine={onUpdateLine}
        onDuplicateLine={onDuplicateLine}
        onRemoveLine={onRemoveLine}
      />
      <DraftReviewPanel
        draftReview={draftReview}
        draftComparison={draftComparison}
        isBusy={isBusy}
        canConfirmDraftReview={canConfirmDraftReview}
        formatResultPrice={formatResultPrice}
        formatSignedDelta={formatSignedDelta}
        formatSignedInteger={formatSignedInteger}
        onNotesChange={onNotesChange}
        onConfirmDraftReview={onConfirmDraftReview}
      />
    </BuilderStep>
  );
}
