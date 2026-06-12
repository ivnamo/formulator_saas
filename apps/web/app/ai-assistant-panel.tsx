import { BrainCircuit, Check, ListChecks, Plus, RefreshCw } from "lucide-react";
import {
  formatDateTime,
  type AiRun,
  type AgentCandidate,
  type AgentFormulaCandidate,
  type AgentPlan,
  type RequirementConstraint,
  type RequirementParse,
} from "./workspace-model";

type AiAssistantPanelProps = {
  active: boolean;
  requirementText: string;
  requirementParse: RequirementParse | null;
  agentPlan: AgentPlan | null;
  aiRuns: AiRun[];
  canParseRequirements: boolean;
  canPlanRequirements: boolean;
  canEditTenantData: boolean;
  isBusy: boolean;
  onRequirementTextChange: (text: string) => void;
  onParseRequirements: () => void | Promise<void>;
  onPlanRequirements: () => void | Promise<void>;
  onRefreshAiRuns: () => void | Promise<void>;
  onReuseInfeasibilityAction: (action: string) => void;
  onApplyOptimizerDraft: (candidate: AgentFormulaCandidate) => void | Promise<void>;
};

function formatConstraint(constraint: RequirementConstraint): string {
  const value =
    constraint.value === null
      ? ""
      : ` ${constraint.operator} ${constraint.value}${constraint.unit ? ` ${constraint.unit}` : ""}`;
  return `${constraint.target}${value}`;
}

function formatRunCost(run: AiRun): string {
  if (run.cost_estimate_usd === null) {
    return "-";
  }
  return `$${run.cost_estimate_usd.toFixed(6)}`;
}

function formatCandidatePrice(candidate: AgentCandidate): string {
  return candidate.price_eur_per_kg === null
    ? "-"
    : `${candidate.price_eur_per_kg.toFixed(2)} EUR/kg`;
}

function formatCandidateParameters(candidate: AgentCandidate): string {
  const values = Object.entries(candidate.parameters);
  if (!values.length) {
    return "-";
  }
  return values
    .map(([code, parameter]) => {
      const unit = parameter.unit ? ` ${parameter.unit}` : "";
      return `${code}: ${parameter.value.toFixed(2)}${unit}`;
    })
    .join(", ");
}

function formatAgentFormulaPrice(candidate: AgentFormulaCandidate): string {
  return candidate.price_total === null
    ? "-"
    : `${candidate.price_total.toFixed(2)} ${candidate.currency}/kg`;
}

export function AiAssistantPanel({
  active,
  requirementText,
  requirementParse,
  agentPlan,
  aiRuns,
  canParseRequirements,
  canPlanRequirements,
  canEditTenantData,
  isBusy,
  onRequirementTextChange,
  onParseRequirements,
  onPlanRequirements,
  onRefreshAiRuns,
  onReuseInfeasibilityAction,
  onApplyOptimizerDraft,
}: AiAssistantPanelProps) {
  return (
    <section id="ai" className="panel aiPanel" hidden={!active}>
      <div className="panelHeader">
        <h2>AI requirement parser</h2>
        <span>{requirementParse ? requirementParse.source : "Pending"}</span>
      </div>
      <div className="aiControls">
        <label className="fullWidthLabel">
          <span>Requirement</span>
          <textarea
            value={requirementText}
            onChange={(event) => onRequirementTextChange(event.target.value)}
            disabled={!canEditTenantData}
          />
        </label>
        <div className="aiActions">
          <button
            className="secondaryButton"
            type="button"
            onClick={() => void onParseRequirements()}
            disabled={!canParseRequirements}
          >
            <BrainCircuit size={17} />
            Parse
          </button>
          <button
            className="secondaryButton"
            type="button"
            onClick={() => void onPlanRequirements()}
            disabled={!canPlanRequirements}
          >
            <ListChecks size={17} />
            Plan
          </button>
          <button
            className="secondaryButton"
            type="button"
            onClick={() => void onRefreshAiRuns()}
            disabled={!canEditTenantData}
          >
            <RefreshCw size={17} />
            Runs
          </button>
        </div>
      </div>
      {requirementParse ? (
        <div className="aiResultGrid">
          <div>
            <span>Product</span>
            <strong>{requirementParse.product_type ?? "-"}</strong>
          </div>
          <div>
            <span>Alternatives</span>
            <strong>{requirementParse.alternatives ?? "-"}</strong>
          </div>
          <div>
            <span>Model</span>
            <strong>{requirementParse.model ?? "deterministic"}</strong>
          </div>
          <div>
            <span>Objectives</span>
            <strong>{requirementParse.objectives.join(", ") || "-"}</strong>
          </div>
          <div>
            <span>Technical constraints</span>
            <strong>
              {requirementParse.technical_constraints.map(formatConstraint).join(", ") || "-"}
            </strong>
          </div>
          <div>
            <span>Economic constraints</span>
            <strong>
              {requirementParse.economic_constraints.map(formatConstraint).join(", ") || "-"}
            </strong>
          </div>
          <div>
            <span>Required materials</span>
            <strong>{requirementParse.mandatory_raw_materials.join(", ") || "-"}</strong>
          </div>
          <div>
            <span>Excluded materials</span>
            <strong>{requirementParse.excluded_raw_materials.join(", ") || "-"}</strong>
          </div>
          <div className="wide">
            <span>Uncertainties</span>
            <strong>{requirementParse.uncertainties.join(", ") || "-"}</strong>
          </div>
        </div>
      ) : (
        <div className="empty">No parsed requirements.</div>
      )}
      <div className="agentPlan">
        <div className="agentPlanHeader">
          <strong>Supervisor plan</strong>
          <span>{agentPlan ? agentPlan.orchestrator : "Pending"}</span>
        </div>
        {agentPlan ? (
          <>
            <div className="agentPlanSteps">
              {agentPlan.steps.map((step) => (
                <div className="agentPlanStep" key={`${step.tool}-${step.status}`}>
                  <code>{step.status}</code>
                  <strong>{step.tool}</strong>
                  <span>{step.summary}</span>
                </div>
              ))}
            </div>
            {agentPlan.candidate_research ? (
              <div className="agentToolSummary">
                <div>
                  <span>Candidates</span>
                  <strong>
                    {agentPlan.candidate_research.candidate_count} /{" "}
                    {agentPlan.candidate_research.total_available}
                  </strong>
                </div>
                <div>
                  <span>Optimization</span>
                  <strong>{agentPlan.optimization_plan?.status ?? "-"}</strong>
                </div>
                <div>
                  <span>Objective</span>
                  <strong>
                    {agentPlan.optimization_plan
                      ? `${agentPlan.optimization_plan.objective.type} ${agentPlan.optimization_plan.objective.target}`
                      : "-"}
                  </strong>
                </div>
                <div className="wide">
                  <span>Blocks</span>
                  <strong>
                    {agentPlan.optimization_plan?.blocking_reasons.join(", ") || "-"}
                  </strong>
                </div>
              </div>
            ) : null}
            {agentPlan.optimization_plan &&
            (agentPlan.optimization_plan.infeasibility_explanations?.length ?? 0) > 0 &&
            agentPlan.optimization_plan.formula_candidates.length === 0 ? (
              <div className="agentInfeasibilityList">
                <strong>Infeasibility explanations</strong>
                {(agentPlan.optimization_plan.infeasibility_explanations ?? []).map(
                  (explanation) => (
                    <article key={`${explanation.code}-${explanation.message}`}>
                      <code data-severity={explanation.severity}>
                        {explanation.severity}
                      </code>
                      <span className="agentInfeasibilityText">
                        <strong>{explanation.message}</strong>
                        {explanation.action}
                      </span>
                      <button
                        className="iconButton"
                        type="button"
                        onClick={() => onReuseInfeasibilityAction(explanation.action)}
                        title="Add action to requirement"
                        aria-label="Add action to requirement"
                        disabled={!canEditTenantData}
                      >
                        <Plus size={15} />
                      </button>
                    </article>
                  ),
                )}
              </div>
            ) : null}
            {agentPlan.candidate_research?.candidates.length ? (
              <div className="agentCandidateList">
                <div className="agentCandidateHead">
                  <span>Score</span>
                  <span>Material</span>
                  <span>Price</span>
                  <span>Parameters</span>
                </div>
                {agentPlan.candidate_research.candidates.map((candidate) => (
                  <div className="agentCandidateRow" key={candidate.raw_material_id}>
                    <code>{Math.round(candidate.score * 100)}%</code>
                    <strong>{candidate.name}</strong>
                    <span>{formatCandidatePrice(candidate)}</span>
                    <span>{formatCandidateParameters(candidate)}</span>
                  </div>
                ))}
              </div>
            ) : null}
            {agentPlan.optimization_plan?.formula_candidates.length ? (
              <div className="agentFormulaList">
                {agentPlan.optimization_plan.formula_candidates.map((candidate) => (
                  <div className="agentFormulaCard" key={candidate.name}>
                    <div className="agentFormulaHeader">
                      <strong>{candidate.name}</strong>
                      <div>
                        <code>{candidate.status}</code>
                        <button
                          className="secondaryButton agentFormulaApply"
                          type="button"
                          onClick={() => void onApplyOptimizerDraft(candidate)}
                          disabled={isBusy}
                        >
                          <Check size={16} />
                          Apply draft
                        </button>
                      </div>
                    </div>
                    <div className="agentFormulaStats">
                      <div>
                        <span>Price</span>
                        <strong>{formatAgentFormulaPrice(candidate)}</strong>
                      </div>
                      <div>
                        <span>Total</span>
                        <strong>{candidate.total_percentage.toFixed(1)}%</strong>
                      </div>
                      <div>
                        <span>Parameters</span>
                        <strong>
                          {candidate.parameters
                            .map(
                              (parameter) =>
                                `${parameter.code}: ${parameter.value.toFixed(2)}${parameter.unit ? ` ${parameter.unit}` : ""}`,
                            )
                            .join(", ") || "-"}
                        </strong>
                      </div>
                    </div>
                    <div className="agentFormulaItems">
                      {candidate.items.map((item) => (
                        <div key={item.raw_material_id}>
                          <span>{item.name}</span>
                          <code>{item.percentage.toFixed(1)}%</code>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </>
        ) : (
          <div className="empty">No supervisor plan.</div>
        )}
      </div>
      <div className="aiRunList">
        <div className="aiRunHead">
          <span>Time</span>
          <span>Provider</span>
          <span>Status</span>
          <span>Tokens</span>
          <span>Cost</span>
        </div>
        {aiRuns.length === 0 ? (
          <div className="empty">No AI runs yet.</div>
        ) : (
          aiRuns.map((run) => (
            <div className="aiRunRow" key={run.id}>
              <span>{formatDateTime(run.created_at)}</span>
              <span>{run.model ?? run.provider}</span>
              <span data-state={run.status}>{run.status}</span>
              <span>
                {run.prompt_tokens === null && run.completion_tokens === null
                  ? "-"
                  : `${run.prompt_tokens ?? 0}/${run.completion_tokens ?? 0}`}
              </span>
              <span>{formatRunCost(run)}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
