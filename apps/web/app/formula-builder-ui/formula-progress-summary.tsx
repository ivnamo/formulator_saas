type FormulaProgressSummaryProps = {
  totalPercentage: number;
  isBalanced: boolean;
  price: string;
  source: string;
};

export function FormulaProgressSummary({
  totalPercentage,
  isBalanced,
  price,
  source,
}: FormulaProgressSummaryProps) {
  return (
    <>
      <div className="builderProgressBar" aria-label="Formula percentage">
        <span style={{ width: `${Math.min(100, Math.max(0, totalPercentage))}%` }} />
      </div>
      <div className="builderQuickStats">
        <div>
          <span>Total</span>
          <strong>{totalPercentage.toFixed(1)}%</strong>
        </div>
        <div>
          <span>Status</span>
          <strong>{isBalanced ? "Balanced" : "Draft"}</strong>
        </div>
        <div>
          <span>Price</span>
          <strong>{price}</strong>
        </div>
        <div>
          <span>Calculation source</span>
          <strong>{source}</strong>
        </div>
      </div>
    </>
  );
}
