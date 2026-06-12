import { BrainCircuit, ListChecks, RefreshCw } from "lucide-react";
import { AiAgentPlanPanel } from "./ai-agent-plan-panel";
import type {
  AiRun,
  AgentFormulaCandidate,
  AgentPlan,
  RequirementConstraint,
  RequirementParse,
} from "./ai-workflow-model";
import {
  formatDateTime,
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
      <AiAgentPlanPanel
        agentPlan={agentPlan}
        canEditTenantData={canEditTenantData}
        isBusy={isBusy}
        onReuseInfeasibilityAction={onReuseInfeasibilityAction}
        onApplyOptimizerDraft={onApplyOptimizerDraft}
      />
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
