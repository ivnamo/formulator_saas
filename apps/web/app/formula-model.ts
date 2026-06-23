export type FormulaRead = {
  id: string;
  tenant_id: string;
  source_formula_id: string | null;
  name: string;
  version: number;
  status: string;
  objective: string | null;
  jira_project_id: string | null;
  jira_issue_type: string;
  jira_product_type: string;
  total_price: number | null;
  currency: string;
  items: Array<{
    raw_material_id: string;
    percentage: number;
    order_index: number;
  }>;
};

export type CalculationResult = {
  total_percentage: number;
  price_total: number | null;
  currency: string;
  parameters: Array<{ code: string; value: number; unit: string | null }>;
  warnings: Array<{
    code: string;
    message: string;
    raw_material_id?: string | null;
    parameter_code?: string | null;
    severity?: string;
    rule_id?: string;
    recommended_action?: string | null;
  }>;
};

export type FormulaReviewRequest = {
  id: string;
  tenant_id: string;
  formula_id: string;
  formula_version: number;
  jira_connection_id: string;
  review_status: string;
  jira_issue_key: string | null;
  jira_issue_url: string | null;
  jira_status: string | null;
  sent_by_user_id: string | null;
  sent_at: string | null;
  last_sync_at: string | null;
  snapshot: {
    formula?: {
      source_formula_id?: string | null;
      name?: string;
      version?: number;
      jira_project_id?: string | null;
      jira_issue_type?: string;
      jira_product_type?: string;
      total_price?: number | null;
      currency?: string;
    };
    jira?: {
      project_key?: string;
      issue_type?: string;
      issue_summary?: string;
      issue_description?: string | null;
      technical_result_raw?: string;
      technical_result?: string | null;
    };
    iso?: {
      design_project_id?: string;
      trial_number?: number | null;
      reason_comment?: string | null;
      trial_intent?: string;
    };
    items?: Array<{ name?: string; percentage?: number }>;
    notes?: string | null;
  };
  created_at: string;
};

export type FormulaReviewArtifact = {
  id: string;
  tenant_id: string;
  review_request_id: string;
  artifact_type: string;
  file_name: string;
  content_type: string;
  checksum_sha256: string;
  size_bytes: number;
  created_at: string;
};

export type FormulaCalculationHistory = {
  id: string;
  formula_id: string;
  price_total: number | null;
  result_json: CalculationResult;
  calculated_at: string;
};
