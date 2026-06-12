import { Check } from "lucide-react";
import type { DraftComparison, DraftReviewState } from "../workspace-comparison";
import type { CalculationResult } from "../workspace-model";

type DraftReviewPanelProps = {
  draftReview: DraftReviewState | null;
  draftComparison: DraftComparison | null;
  isBusy: boolean;
  canConfirmDraftReview: boolean;
  formatResultPrice: (result: CalculationResult | null) => string;
  formatSignedDelta: (value: number | null, suffix?: string) => string;
  formatSignedInteger: (value: number) => string;
  onNotesChange: (notes: string) => void;
  onConfirmDraftReview: () => void | Promise<void>;
};

export function DraftReviewPanel({
  draftReview,
  draftComparison,
  isBusy,
  canConfirmDraftReview,
  formatResultPrice,
  formatSignedDelta,
  formatSignedInteger,
  onNotesChange,
  onConfirmDraftReview,
}: DraftReviewPanelProps) {
  if (!draftReview) {
    return null;
  }

  return (
    <div className="draftReview" data-state={draftReview.status}>
      <div className="draftReviewHeader">
        <div>
          <span>Draft review</span>
          <strong>{draftReview.candidateName}</strong>
        </div>
        <code>{draftReview.status}</code>
      </div>
      <label className="fullWidthLabel">
        <span>Decision notes</span>
        <textarea
          value={draftReview.notes}
          onChange={(event) => onNotesChange(event.target.value)}
          disabled={isBusy}
        />
      </label>
      <div className="draftReviewActions">
        <span>{draftReview.status === "confirmed" ? "Ready to save" : "Pending confirmation"}</span>
        <button
          className="secondaryButton"
          type="button"
          onClick={() => void onConfirmDraftReview()}
          disabled={!canConfirmDraftReview}
        >
          <Check size={16} />
          Confirm review
        </button>
      </div>
      {draftComparison && draftReview.reviewedResult ? (
        <div className="draftComparison">
          <div className="draftComparisonStats">
            <div>
              <span>Price</span>
              <strong>
                {formatResultPrice(draftReview.baselineResult)} /{" "}
                {formatResultPrice(draftReview.reviewedResult)}
              </strong>
              <code>
                {formatSignedDelta(
                  draftComparison.priceDelta,
                  ` ${draftReview.reviewedResult.currency}/kg`,
                )}
              </code>
            </div>
            <div>
              <span>Total</span>
              <strong>
                {draftReview.baselineResult.total_percentage.toFixed(1)}% /{" "}
                {draftReview.reviewedResult.total_percentage.toFixed(1)}%
              </strong>
              <code>{formatSignedDelta(draftComparison.totalDelta, "%")}</code>
            </div>
            <div>
              <span>Lines</span>
              <strong>
                {draftComparison.proposedLineCount} / {draftComparison.reviewedLineCount}
              </strong>
              <code>
                {formatSignedInteger(
                  draftComparison.reviewedLineCount - draftComparison.proposedLineCount,
                )}
              </code>
            </div>
          </div>
          {draftComparison.lineChanges.length ? (
            <div className="draftLineChanges">
              {draftComparison.lineChanges.map((line) => (
                <div key={line.rawMaterialId}>
                  <span>{line.name}</span>
                  <strong>
                    {line.proposed.toFixed(1)}% / {line.reviewed.toFixed(1)}%
                  </strong>
                  <code>{formatSignedDelta(line.delta, "%")}</code>
                </div>
              ))}
            </div>
          ) : (
            <div className="draftLineChanges">
              <div>
                <span>Formula lines</span>
                <strong>No percentage changes</strong>
                <code>0.00%</code>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
