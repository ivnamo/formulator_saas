export type RequirementConstraint = {
  kind: string;
  target: string;
  operator: string;
  value: number | null;
  unit: string | null;
  raw_text: string | null;
};

export type RequirementParse = {
  run_id: string;
  source: "deterministic" | "llm";
  model: string | null;
  product_type: string | null;
  objectives: string[];
  technical_constraints: RequirementConstraint[];
  economic_constraints: RequirementConstraint[];
  mandatory_raw_materials: string[];
  excluded_raw_materials: string[];
  preferences: {
    only_active_materials: boolean | null;
    avoid_incompatibilities: boolean | null;
    notes: string[];
  };
  alternatives: number | null;
  uncertainties: string[];
};

export type AiRun = {
  id: string;
  tenant_id: string;
  user_id: string;
  run_type: string;
  provider: string;
  model: string | null;
  status: string;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  cost_estimate_usd: number | null;
  created_at: string;
  completed_at: string | null;
  error: string | null;
};

export type AgentPlanStep = {
  tool: string;
  status: string;
  summary: string;
};

export type AgentCandidate = {
  raw_material_id: string;
  code: string | null;
  name: string;
  price_eur_per_kg: number | null;
  parameters: Record<string, { name: string; value: number; unit: string | null }>;
  matched_constraints: string[];
  warnings: string[];
  score: number;
};

export type AgentCandidateResearch = {
  candidate_count: number;
  total_available: number;
  filters: Record<string, unknown>;
  candidates: AgentCandidate[];
  warnings: string[];
};

export type AgentOptimizationPlan = {
  status: string;
  objective: { type: string; target: string };
  candidate_raw_material_ids: string[];
  constraints: Array<Record<string, unknown>>;
  blocking_reasons: string[];
  infeasibility_explanations?: AgentInfeasibilityExplanation[];
  warnings: string[];
  solver: string;
  formula_candidates: AgentFormulaCandidate[];
};

export type AgentInfeasibilityExplanation = {
  code: string;
  severity: string;
  message: string;
  action: string;
};

export type AgentFormulaCandidate = {
  name: string;
  status: string;
  total_percentage: number;
  price_total: number | null;
  currency: string;
  items: Array<{
    raw_material_id: string;
    name: string;
    percentage: number;
  }>;
  parameters: Array<{ code: string; value: number; unit: string | null }>;
  warnings: Array<Record<string, unknown>>;
  constraints_status: Array<Record<string, unknown>>;
};

export type AgentPlan = {
  run_id: string;
  orchestrator: "deterministic" | "deepagents";
  model: string | null;
  parsed_requirements: Record<string, unknown> | null;
  candidate_research: AgentCandidateResearch | null;
  optimization_plan: AgentOptimizationPlan | null;
  steps: AgentPlanStep[];
  human_review_required: boolean;
  notes: string[];
};
