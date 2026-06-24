import { useMemo } from "react";
import {
  Archive,
  ChevronDown,
  Download,
  FolderOpen,
  History,
  ListChecks,
  RefreshCw,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";
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

export type SavedFormulaComparisonPanelProps = {
  active: boolean;
  variant?: "library" | "comparator";
  formulas: FormulaRead[];
  calculationHistory: FormulaCalculationHistory[];
  formulaCompareSelection: FormulaCompareSelection;
  comparisonConstraintForm: ComparisonConstraintForm;
  comparisonMaterialOptions: ComparisonMaterialOption[];
  canEditTenantData: boolean;
  canExportFormulas: boolean;
  canArchiveEntities: boolean;
  canUseFormulaComparison: boolean;
  canCompareSavedFormulas: boolean;
  isBusy: boolean;
  savedFormulaComparison: SavedFormulaComparison | null;
  comparisonComplianceSummary: SavedFormulaComplianceSummary | null;
  comparisonConstraintEvaluations: SavedFormulaConstraintEvaluation[];
  comparisonConstraintIssueCount: number;
  visibleComparisonConstraintEvaluations: SavedFormulaConstraintEvaluation[];
  showOnlyConstraintIssues: boolean;
  showArchivedFormulas: boolean;
  onSelectFormula: (field: FormulaCompareSelectionField, formulaId: string) => void;
  onRefreshLibrary: () => void | Promise<void>;
  onCompareSavedFormulas: () => void | Promise<void>;
  onExportFormula: (formula: FormulaRead) => void | Promise<void>;
  onArchiveFormula: (formula: FormulaRead) => void | Promise<void>;
  onRestoreFormula: (formula: FormulaRead) => void | Promise<void>;
  onOpenFormula: (formula: FormulaRead) => void | Promise<void>;
  onUpdateConstraint: (field: ComparisonConstraintField, value: string) => void;
  onShowOnlyConstraintIssuesChange: (checked: boolean) => void;
  onShowArchivedFormulasChange: (checked: boolean) => void;
};

export function SavedFormulaComparisonPanel({
  active,
  variant = "library",
  formulas,
  calculationHistory,
  formulaCompareSelection,
  comparisonConstraintForm,
  comparisonMaterialOptions,
  canExportFormulas,
  canArchiveEntities,
  canUseFormulaComparison,
  canCompareSavedFormulas,
  isBusy,
  savedFormulaComparison,
  comparisonComplianceSummary,
  comparisonConstraintEvaluations,
  comparisonConstraintIssueCount,
  visibleComparisonConstraintEvaluations,
  showOnlyConstraintIssues,
  showArchivedFormulas,
  onSelectFormula,
  onRefreshLibrary,
  onCompareSavedFormulas,
  onExportFormula,
  onArchiveFormula,
  onRestoreFormula,
  onOpenFormula,
  onUpdateConstraint,
  onShowOnlyConstraintIssuesChange,
  onShowArchivedFormulasChange,
}: SavedFormulaComparisonPanelProps) {
  const isComparator = variant === "comparator";
  const hasParameterConstraint = Boolean(
    comparisonConstraintForm.parameterCode.trim() &&
      comparisonConstraintForm.minParameterValue.trim(),
  );
  const hasMaterialMinimumConstraint = Boolean(
    comparisonConstraintForm.materialId.trim() &&
      comparisonConstraintForm.minMaterialPercentage.trim(),
  );
  const hasMaterialMaximumConstraint = Boolean(
    comparisonConstraintForm.materialId.trim() &&
      comparisonConstraintForm.maxMaterialPercentage.trim(),
  );
  const activeConstraintCount = [
    comparisonConstraintForm.maxPrice.trim(),
    hasParameterConstraint,
    hasMaterialMinimumConstraint,
    hasMaterialMaximumConstraint,
  ].filter(Boolean).length;
  const formulaNameById = useMemo(
    () => new Map(formulas.map((formula) => [formula.id, formula.name])),
    [formulas],
  );

  return (
    <section
      id={isComparator ? "formula-comparator" : "library"}
      className="panel libraryPanel"
      hidden={!active}
    >
      <div className="panelHeader">
        <h2>{isComparator ? "Comparador de formulas" : "Formula library"}</h2>
        <span>{formulas.length} formulas</span>
      </div>
      <div className={isComparator ? "libraryActions" : "libraryActions libraryActionsCompact"}>
        {isComparator ? (
          <>
            <label>
              <span>Base</span>
              <select
                aria-label="Base formula"
                value={formulaCompareSelection.baselineId}
                onChange={(event) => onSelectFormula("baselineId", event.target.value)}
                disabled={!canUseFormulaComparison || formulas.length < 2}
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
                disabled={!canUseFormulaComparison || formulas.length < 2}
              >
                <option value="">Select formula</option>
                {formulas.map((formula) => (
                  <option key={formula.id} value={formula.id}>
                    {formula.name}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : null}
        <button
          className="secondaryButton"
          type="button"
          onClick={() => void onRefreshLibrary()}
          disabled={isBusy}
        >
          <RefreshCw size={17} />
          Refresh library
        </button>
        {!isComparator && canArchiveEntities ? (
          <label className="inlineCheckbox">
            <input
              type="checkbox"
              checked={showArchivedFormulas}
              onChange={(event) => onShowArchivedFormulasChange(event.target.checked)}
            />
            <span>Show archived</span>
          </label>
        ) : null}
        {isComparator ? (
          <button
            className="secondaryButton"
            type="button"
            onClick={() => void onCompareSavedFormulas()}
            disabled={!canCompareSavedFormulas}
          >
            <ListChecks size={17} />
            Compare formulas
          </button>
        ) : null}
      </div>
      {isComparator ? (
        <details className="comparisonConstraintPanel">
          <summary>
            <span>
              <SlidersHorizontal size={16} />
              Criterios de comparacion
            </span>
            <code>{activeConstraintCount} activos</code>
            <ChevronDown size={16} />
          </summary>
          <div className="comparisonConstraintBar">
            <label>
              <span>Precio maximo EUR/kg</span>
              <input
                inputMode="decimal"
                value={comparisonConstraintForm.maxPrice}
                onChange={(event) => onUpdateConstraint("maxPrice", event.target.value)}
                disabled={!canUseFormulaComparison}
              />
            </label>
            <label>
              <span>Parametro a evaluar</span>
              <input
                value={comparisonConstraintForm.parameterCode}
                onChange={(event) => onUpdateConstraint("parameterCode", event.target.value)}
                disabled={!canUseFormulaComparison}
              />
            </label>
            <label>
              <span>Valor minimo parametro</span>
              <input
                inputMode="decimal"
                value={comparisonConstraintForm.minParameterValue}
                onChange={(event) => onUpdateConstraint("minParameterValue", event.target.value)}
                disabled={!canUseFormulaComparison}
              />
            </label>
            <label>
              <span>Materia prima a limitar</span>
              <select
                aria-label="Constraint material"
                value={comparisonConstraintForm.materialId}
                onChange={(event) => onUpdateConstraint("materialId", event.target.value)}
                disabled={!canUseFormulaComparison || comparisonMaterialOptions.length === 0}
              >
                <option value="">Sin limite de materia</option>
                {comparisonMaterialOptions.map((material) => (
                  <option key={material.id} value={material.id}>
                    {material.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>% minimo materia</span>
              <input
                inputMode="decimal"
                value={comparisonConstraintForm.minMaterialPercentage}
                onChange={(event) =>
                  onUpdateConstraint("minMaterialPercentage", event.target.value)
                }
                disabled={!canUseFormulaComparison || !comparisonConstraintForm.materialId}
              />
            </label>
            <label>
              <span>% maximo materia</span>
              <input
                inputMode="decimal"
                value={comparisonConstraintForm.maxMaterialPercentage}
                onChange={(event) =>
                  onUpdateConstraint("maxMaterialPercentage", event.target.value)
                }
                disabled={!canUseFormulaComparison || !comparisonConstraintForm.materialId}
              />
            </label>
          </div>
        </details>
      ) : null}
      {!isComparator ? (
        <div className="libraryGrid">
        <div className="formulaList">
          <div className="formulaListHead" data-archive={canArchiveEntities}>
            <span>Name</span>
            <span>Price</span>
            <span>Status</span>
            <span>Lines</span>
            <span>Excel</span>
            <span>Open</span>
            {canArchiveEntities ? <span>Action</span> : null}
          </div>
          {formulas.length === 0 ? (
            <div className="empty">No saved formulas yet.</div>
          ) : (
            formulas.map((formula) => {
              const sourceFormulaName = formula.source_formula_id
                ? formulaNameById.get(formula.source_formula_id) ?? "formula origen"
                : null;
              return (
                <div
                  className="formulaListRow"
                  data-archive={canArchiveEntities}
                  key={formula.id}
                >
                  <span className="formulaLibraryName">
                    <strong>{formula.name}</strong>
                    <small>
                      v{formula.version}
                      {sourceFormulaName ? ` - version de ${sourceFormulaName}` : ""}
                    </small>
                    {formula.objective ? <small>{formula.objective}</small> : null}
                  </span>
                  <span>
                    {formula.total_price === null
                      ? "-"
                      : `${formula.total_price.toFixed(2)} ${formula.currency}/kg`}
                  </span>
                  <span>
                    <code className="statusPill">{formula.status}</code>
                  </span>
                  <span>{formula.items.length}</span>
                  <button
                    className="iconButton"
                    type="button"
                    onClick={() => void onExportFormula(formula)}
                    disabled={!canExportFormulas}
                    title="Export Excel I+D"
                    aria-label={`Export ${formula.name} as Excel I+D`}
                  >
                    <Download size={16} />
                  </button>
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
                  {canArchiveEntities && formula.status !== "archived" ? (
                    <button
                      className="iconButton dangerIconButton"
                      type="button"
                      onClick={() => void onArchiveFormula(formula)}
                      disabled={isBusy}
                      title="Archive formula"
                      aria-label={`Archive ${formula.name}`}
                    >
                      <Archive size={16} />
                    </button>
                  ) : null}
                  {canArchiveEntities && formula.status === "archived" ? (
                    <button
                      className="iconButton"
                      type="button"
                      onClick={() => void onRestoreFormula(formula)}
                      disabled={isBusy}
                      title="Restore formula"
                      aria-label={`Restore ${formula.name}`}
                    >
                      <RotateCcw size={16} />
                    </button>
                  ) : null}
                </div>
              );
            })
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
      ) : null}
      {isComparator && savedFormulaComparison ? (
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
