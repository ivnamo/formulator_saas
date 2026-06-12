import {
  formatOptionalValue,
  formatResultPrice,
  formatSignedDelta,
  formatSignedInteger,
} from "./formula-formatters";
import type {
  SavedFormulaComparison,
  SavedFormulaComplianceSummary,
  SavedFormulaConstraintEvaluation,
} from "./workspace-comparison";

type SavedFormulaComparisonResultProps = {
  comparison: SavedFormulaComparison;
  complianceSummary: SavedFormulaComplianceSummary | null;
  constraintEvaluations: SavedFormulaConstraintEvaluation[];
  constraintIssueCount: number;
  visibleConstraintEvaluations: SavedFormulaConstraintEvaluation[];
  showOnlyConstraintIssues: boolean;
  onShowOnlyConstraintIssuesChange: (checked: boolean) => void;
};

function formatComplianceLeader(leader: "baseline" | "candidate" | "tie"): string {
  if (leader === "tie") {
    return "Tie";
  }
  return leader === "baseline" ? "Base leads" : "Candidate leads";
}

function formatComplianceLeaderBadge(leader: "baseline" | "candidate" | "tie"): string {
  return leader === "baseline" ? "base" : leader;
}

export function SavedFormulaComparisonResult({
  comparison,
  complianceSummary,
  constraintEvaluations,
  constraintIssueCount,
  visibleConstraintEvaluations,
  showOnlyConstraintIssues,
  onShowOnlyConstraintIssuesChange,
}: SavedFormulaComparisonResultProps) {
  return (
    <div className="savedFormulaComparison">
      <div className="comparisonHeader">
        <div>
          <span>Base</span>
          <strong>{comparison.baseline.name}</strong>
        </div>
        <div>
          <span>Candidate</span>
          <strong>{comparison.candidate.name}</strong>
        </div>
      </div>
      <div className="comparisonStats">
        <div>
          <span>Price</span>
          <strong>
            {formatResultPrice(comparison.baselineResult)} /{" "}
            {formatResultPrice(comparison.candidateResult)}
          </strong>
          <code>
            {formatSignedDelta(
              comparison.priceDelta,
              ` ${comparison.candidateResult.currency}/kg`,
            )}
          </code>
        </div>
        <div>
          <span>Total</span>
          <strong>
            {comparison.baselineResult.total_percentage.toFixed(1)}% /{" "}
            {comparison.candidateResult.total_percentage.toFixed(1)}%
          </strong>
          <code>{formatSignedDelta(comparison.totalDelta, "%")}</code>
        </div>
        <div>
          <span>Lines</span>
          <strong>
            {comparison.baseline.items.length} / {comparison.candidate.items.length}
          </strong>
          <code>
            {formatSignedInteger(
              comparison.candidate.items.length - comparison.baseline.items.length,
            )}
          </code>
        </div>
      </div>
      {complianceSummary ? (
        <div className="complianceSummary">
          <div>
            <span>Compliance</span>
            <strong>{formatComplianceLeader(complianceSummary.leader)}</strong>
            <code data-state={complianceSummary.leader}>
              {formatComplianceLeaderBadge(complianceSummary.leader)}
            </code>
          </div>
          <div>
            <span>Base score</span>
            <strong>
              {complianceSummary.baseline.passed}/{complianceSummary.baseline.total} passed
            </strong>
            <code data-state={complianceSummary.baseline.status}>
              {complianceSummary.baseline.failed} failed,{" "}
              {complianceSummary.baseline.missing} missing
            </code>
          </div>
          <div>
            <span>Candidate score</span>
            <strong>
              {complianceSummary.candidate.passed}/{complianceSummary.candidate.total}{" "}
              passed
            </strong>
            <code data-state={complianceSummary.candidate.status}>
              {complianceSummary.candidate.failed} failed,{" "}
              {complianceSummary.candidate.missing} missing
            </code>
          </div>
        </div>
      ) : null}
      {constraintEvaluations.length ? (
        <div className="constraintEvaluationList">
          <div className="constraintEvaluationHeader">
            <strong className="comparisonTitle">Constraints</strong>
            <label className="constraintFilter">
              <input
                checked={showOnlyConstraintIssues}
                onChange={(event) =>
                  onShowOnlyConstraintIssuesChange(event.target.checked)
                }
                type="checkbox"
              />
              <span>Needs attention</span>
              <code>{constraintIssueCount}</code>
            </label>
          </div>
          {visibleConstraintEvaluations.length ? (
            visibleConstraintEvaluations.map((evaluation) => (
              <div key={evaluation.key}>
                <span>{evaluation.label}</span>
                <strong>{evaluation.rule}</strong>
                <span>
                  {formatOptionalValue(evaluation.baselineValue, evaluation.unit)}
                  <code data-state={evaluation.baselineStatus}>
                    {evaluation.baselineStatus}
                  </code>
                  {evaluation.baselineExplanation ? (
                    <small>{evaluation.baselineExplanation}</small>
                  ) : null}
                </span>
                <span>
                  {formatOptionalValue(evaluation.candidateValue, evaluation.unit)}
                  <code data-state={evaluation.candidateStatus}>
                    {evaluation.candidateStatus}
                  </code>
                  {evaluation.candidateExplanation ? (
                    <small>{evaluation.candidateExplanation}</small>
                  ) : null}
                </span>
              </div>
            ))
          ) : (
            <div className="constraintEvaluationEmpty">
              No constraints need attention.
            </div>
          )}
        </div>
      ) : null}
      <div className="comparisonColumns">
        <div className="comparisonList">
          <div className="comparisonTitle">Parameters</div>
          {comparison.parameterChanges.length ? (
            comparison.parameterChanges.map((parameter) => (
              <div key={parameter.code}>
                <span>{parameter.code}</span>
                <strong>
                  {formatOptionalValue(parameter.baseline, parameter.unit)} /{" "}
                  {formatOptionalValue(parameter.candidate, parameter.unit)}
                </strong>
                <code>
                  {formatSignedDelta(
                    parameter.delta,
                    parameter.unit ? ` ${parameter.unit}` : "",
                  )}
                </code>
              </div>
            ))
          ) : (
            <div>
              <span>Parameters</span>
              <strong>No calculated parameters</strong>
              <code>-</code>
            </div>
          )}
        </div>
        <div className="comparisonList">
          <div className="comparisonTitle">Materials</div>
          {comparison.lineChanges.length ? (
            comparison.lineChanges.map((line) => (
              <div key={line.rawMaterialId}>
                <span>{line.name}</span>
                <strong>
                  {line.proposed.toFixed(1)}% / {line.reviewed.toFixed(1)}%
                </strong>
                <code>{formatSignedDelta(line.delta, "%")}</code>
              </div>
            ))
          ) : (
            <div>
              <span>Formula lines</span>
              <strong>No percentage changes</strong>
              <code>0.00%</code>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
