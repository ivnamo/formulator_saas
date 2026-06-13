import { FolderOpen, History, ListChecks, RefreshCw } from "lucide-react";
import type {
  ComparisonConstraintField,
  ComparisonConstraintForm,
  FormulaCompareSelection,
  FormulaCompareSelectionField,
} from "./saved-formula-comparison-state";
import { SavedFormulaComparisonResult } from "./saved-formula-comparison-result";
import type { FormulaCalculationHistory, FormulaRead } from "./formula-model";
import type {
  SavedFormulaComparison,
  SavedFormulaComplianceSummary,
  SavedFormulaConstraintEvaluation,
} from "./workspace-comparison";
import { formatDateTime } from "./workspace-utils";

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
        <SavedFormulaComparisonResult
          comparison={savedFormulaComparison}
          complianceSummary={comparisonComplianceSummary}
          constraintEvaluations={comparisonConstraintEvaluations}
          constraintIssueCount={comparisonConstraintIssueCount}
          visibleConstraintEvaluations={visibleComparisonConstraintEvaluations}
          showOnlyConstraintIssues={showOnlyConstraintIssues}
          onShowOnlyConstraintIssuesChange={onShowOnlyConstraintIssuesChange}
        />
      ) : null}
    </section>
  );
}
