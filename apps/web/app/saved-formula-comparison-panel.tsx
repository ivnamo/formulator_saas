import { FolderOpen, History, ListChecks, RefreshCw } from "lucide-react";
import {
  formatOptionalValue,
  formatResultPrice,
  formatSignedDelta,
  formatSignedInteger,
} from "./formula-formatters";
import type {
  ComparisonConstraintField,
  ComparisonConstraintForm,
  FormulaCompareSelection,
  FormulaCompareSelectionField,
} from "./saved-formula-comparison-state";
import {
  formatDateTime,
  type FormulaCalculationHistory,
  type FormulaRead,
} from "./workspace-model";
import type {
  SavedFormulaComparison,
  SavedFormulaComplianceSummary,
  SavedFormulaConstraintEvaluation,
} from "./workspace-comparison";

type ComparisonMaterialOption = {
  id: string;
  name: string;
};

type SavedFormulaComparisonPanelProps = {
  active: boolean;
  formulas: FormulaRead[];
  calculationHistory: FormulaCalculationHistory[];
  formulaCompareSelection: FormulaCompareSelection;
  comparisonConstraintForm: ComparisonConstraintForm;
  comparisonMaterialOptions: ComparisonMaterialOption[];
  canEditTenantData: boolean;
  canCompareSavedFormulas: boolean;
  isBusy: boolean;
  savedFormulaComparison: SavedFormulaComparison | null;
  comparisonComplianceSummary: SavedFormulaComplianceSummary | null;
  comparisonConstraintEvaluations: SavedFormulaConstraintEvaluation[];
  comparisonConstraintIssueCount: number;
  visibleComparisonConstraintEvaluations: SavedFormulaConstraintEvaluation[];
  showOnlyConstraintIssues: boolean;
  onSelectFormula: (field: FormulaCompareSelectionField, formulaId: string) => void;
  onRefreshLibrary: () => void | Promise<void>;
  onCompareSavedFormulas: () => void | Promise<void>;
  onOpenFormula: (formula: FormulaRead) => void | Promise<void>;
  onUpdateConstraint: (field: ComparisonConstraintField, value: string) => void;
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

export function SavedFormulaComparisonPanel({
  active,
  formulas,
  calculationHistory,
  formulaCompareSelection,
  comparisonConstraintForm,
  comparisonMaterialOptions,
  canEditTenantData,
  canCompareSavedFormulas,
  isBusy,
  savedFormulaComparison,
  comparisonComplianceSummary,
  comparisonConstraintEvaluations,
  comparisonConstraintIssueCount,
  visibleComparisonConstraintEvaluations,
  showOnlyConstraintIssues,
  onSelectFormula,
  onRefreshLibrary,
  onCompareSavedFormulas,
  onOpenFormula,
  onUpdateConstraint,
  onShowOnlyConstraintIssuesChange,
}: SavedFormulaComparisonPanelProps) {
  return (
    <section id="library" className="panel libraryPanel" hidden={!active}>
      <div className="panelHeader">
        <h2>Formula library</h2>
        <span>{formulas.length} formulas</span>
      </div>
      <div className="libraryActions">
        <label>
          <span>Base</span>
          <select
            aria-label="Base formula"
            value={formulaCompareSelection.baselineId}
            onChange={(event) => onSelectFormula("baselineId", event.target.value)}
            disabled={!canEditTenantData || formulas.length < 2}
          >
            <option value="">Select formula</option>
            {formulas.map((formula) => (
              <option key={formula.id} value={formula.id}>
                {formula.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Candidate</span>
          <select
            aria-label="Candidate formula"
            value={formulaCompareSelection.candidateId}
            onChange={(event) => onSelectFormula("candidateId", event.target.value)}
            disabled={!canEditTenantData || formulas.length < 2}
          >
            <option value="">Select formula</option>
            {formulas.map((formula) => (
              <option key={formula.id} value={formula.id}>
                {formula.name}
              </option>
            ))}
          </select>
        </label>
        <button
          className="secondaryButton"
          type="button"
          onClick={() => void onRefreshLibrary()}
          disabled={!canEditTenantData}
        >
          <RefreshCw size={17} />
          Refresh library
        </button>
        <button
          className="secondaryButton"
          type="button"
          onClick={() => void onCompareSavedFormulas()}
          disabled={!canCompareSavedFormulas}
        >
          <ListChecks size={17} />
          Compare formulas
        </button>
      </div>
      <div className="comparisonConstraintBar">
        <label>
          <span>Max price EUR/kg</span>
          <input
            inputMode="decimal"
            value={comparisonConstraintForm.maxPrice}
            onChange={(event) => onUpdateConstraint("maxPrice", event.target.value)}
            disabled={!canEditTenantData}
          />
        </label>
        <label>
          <span>Parameter code</span>
          <input
            value={comparisonConstraintForm.parameterCode}
            onChange={(event) => onUpdateConstraint("parameterCode", event.target.value)}
            disabled={!canEditTenantData}
          />
        </label>
        <label>
          <span>Parameter min</span>
          <input
            inputMode="decimal"
            value={comparisonConstraintForm.minParameterValue}
            onChange={(event) => onUpdateConstraint("minParameterValue", event.target.value)}
            disabled={!canEditTenantData}
          />
        </label>
        <label>
          <span>Material</span>
          <select
            aria-label="Constraint material"
            value={comparisonConstraintForm.materialId}
            onChange={(event) => onUpdateConstraint("materialId", event.target.value)}
            disabled={!canEditTenantData || comparisonMaterialOptions.length === 0}
          >
            <option value="">No material limit</option>
            {comparisonMaterialOptions.map((material) => (
              <option key={material.id} value={material.id}>
                {material.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Material min %</span>
          <input
            inputMode="decimal"
            value={comparisonConstraintForm.minMaterialPercentage}
            onChange={(event) =>
              onUpdateConstraint("minMaterialPercentage", event.target.value)
            }
            disabled={!canEditTenantData || !comparisonConstraintForm.materialId}
          />
        </label>
        <label>
          <span>Material max %</span>
          <input
            inputMode="decimal"
            value={comparisonConstraintForm.maxMaterialPercentage}
            onChange={(event) =>
              onUpdateConstraint("maxMaterialPercentage", event.target.value)
            }
            disabled={!canEditTenantData || !comparisonConstraintForm.materialId}
          />
        </label>
      </div>
      <div className="libraryGrid">
        <div className="formulaList">
          <div className="formulaListHead">
            <span>Name</span>
            <span>Price</span>
            <span>Lines</span>
            <span>Open</span>
          </div>
          {formulas.length === 0 ? (
            <div className="empty">No saved formulas yet.</div>
          ) : (
            formulas.map((formula) => (
              <div className="formulaListRow" key={formula.id}>
                <span>{formula.name}</span>
                <span>
                  {formula.total_price === null
                    ? "-"
                    : `${formula.total_price.toFixed(2)} ${formula.currency}/kg`}
                </span>
                <span>{formula.items.length}</span>
                <button
                  className="iconButton"
                  type="button"
                  onClick={() => void onOpenFormula(formula)}
                  disabled={isBusy}
                  title="Open formula"
                  aria-label={`Open ${formula.name}`}
                >
                  <FolderOpen size={16} />
                </button>
              </div>
            ))
          )}
        </div>
        <div className="historyList">
          <div className="historyTitle">
            <History size={17} />
            <strong>Calculation history</strong>
          </div>
          {calculationHistory.length === 0 ? (
            <div className="empty">No calculations yet.</div>
          ) : (
            calculationHistory.map((entry) => (
              <div className="historyRow" key={entry.id}>
                <span>{formatDateTime(entry.calculated_at)}</span>
                <strong>
                  {entry.price_total === null
                    ? "-"
                    : `${entry.price_total.toFixed(2)} ${entry.result_json.currency}/kg`}
                </strong>
                <span>
                  {entry.result_json.total_percentage.toFixed(1)}%{" "}
                  {"\u00b7"} {entry.result_json.warnings.length} warnings
                </span>
              </div>
            ))
          )}
        </div>
      </div>
      {savedFormulaComparison ? (
        <div className="savedFormulaComparison">
          <div className="comparisonHeader">
            <div>
              <span>Base</span>
              <strong>{savedFormulaComparison.baseline.name}</strong>
            </div>
            <div>
              <span>Candidate</span>
              <strong>{savedFormulaComparison.candidate.name}</strong>
            </div>
          </div>
          <div className="comparisonStats">
            <div>
              <span>Price</span>
              <strong>
                {formatResultPrice(savedFormulaComparison.baselineResult)} /{" "}
                {formatResultPrice(savedFormulaComparison.candidateResult)}
              </strong>
              <code>
                {formatSignedDelta(
                  savedFormulaComparison.priceDelta,
                  ` ${savedFormulaComparison.candidateResult.currency}/kg`,
                )}
              </code>
            </div>
            <div>
              <span>Total</span>
              <strong>
                {savedFormulaComparison.baselineResult.total_percentage.toFixed(1)}% /{" "}
                {savedFormulaComparison.candidateResult.total_percentage.toFixed(1)}%
              </strong>
              <code>{formatSignedDelta(savedFormulaComparison.totalDelta, "%")}</code>
            </div>
            <div>
              <span>Lines</span>
              <strong>
                {savedFormulaComparison.baseline.items.length} /{" "}
                {savedFormulaComparison.candidate.items.length}
              </strong>
              <code>
                {formatSignedInteger(
                  savedFormulaComparison.candidate.items.length -
                    savedFormulaComparison.baseline.items.length,
                )}
              </code>
            </div>
          </div>
          {comparisonComplianceSummary ? (
            <div className="complianceSummary">
              <div>
                <span>Compliance</span>
                <strong>{formatComplianceLeader(comparisonComplianceSummary.leader)}</strong>
                <code data-state={comparisonComplianceSummary.leader}>
                  {formatComplianceLeaderBadge(comparisonComplianceSummary.leader)}
                </code>
              </div>
              <div>
                <span>Base score</span>
                <strong>
                  {comparisonComplianceSummary.baseline.passed}/
                  {comparisonComplianceSummary.baseline.total} passed
                </strong>
                <code data-state={comparisonComplianceSummary.baseline.status}>
                  {comparisonComplianceSummary.baseline.failed} failed,{" "}
                  {comparisonComplianceSummary.baseline.missing} missing
                </code>
              </div>
              <div>
                <span>Candidate score</span>
                <strong>
                  {comparisonComplianceSummary.candidate.passed}/
                  {comparisonComplianceSummary.candidate.total} passed
                </strong>
                <code data-state={comparisonComplianceSummary.candidate.status}>
                  {comparisonComplianceSummary.candidate.failed} failed,{" "}
                  {comparisonComplianceSummary.candidate.missing} missing
                </code>
              </div>
            </div>
          ) : null}
          {comparisonConstraintEvaluations.length ? (
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
                  <code>{comparisonConstraintIssueCount}</code>
                </label>
              </div>
              {visibleComparisonConstraintEvaluations.length ? (
                visibleComparisonConstraintEvaluations.map((evaluation) => (
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
              {savedFormulaComparison.parameterChanges.length ? (
                savedFormulaComparison.parameterChanges.map((parameter) => (
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
              {savedFormulaComparison.lineChanges.length ? (
                savedFormulaComparison.lineChanges.map((line) => (
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
      ) : null}
    </section>
  );
}
