export type Tenant = {
  id: string;
  name: string;
  slug: string;
  role?: string | null;
};

export type Parameter = {
  id: string;
  code: string;
  name: string;
  unit: string;
};

export type RawMaterial = {
  id: string;
  code: string | null;
  externalCode: string | null;
  name: string;
  family: string | null;
  isActive: boolean;
  isObsolete: boolean;
  price: number | null;
  parameterValue: number | null;
  parameterCount: number;
  positiveParameterCount: number;
  parameters: Record<string, RawMaterialParameterValue>;
  aliases: string[];
};

export type RawMaterialParameterValue = {
  parameterId: string;
  code: string;
  name: string;
  value: number;
  unit: string | null;
  source: string | null;
  confidence: number | null;
};

export type FormulaLine = {
  localId: string;
  rawMaterialId: string;
  percentage: number;
};

export type WorkspaceState = {
  tenant: Tenant | null;
  parameter: Parameter | null;
  parameters: Parameter[];
  rawMaterials: RawMaterial[];
  formulaId: string | null;
  formulaName: string;
  formulaJiraProjectId: string;
  formulaJiraIssueType: string;
  formulaJiraProductType: string;
  formulaLines: FormulaLine[];
};

export type TenantRead = Tenant & {
  status: string;
};

export type TenantInvitationRead = {
  id: string;
  tenant_id: string;
  email: string;
  role: string;
  status: string;
  invited_by: string | null;
  accepted_by: string | null;
  expires_at: string | null;
  created_at: string;
  accepted_at: string | null;
  email_delivery_status?: string | null;
};

export type ParameterRead = Parameter & {
  tenant_id: string;
  is_active: boolean;
};

export type RawMaterialRead = {
  id: string;
  tenant_id: string;
  code: string | null;
  external_code: string | null;
  name: string;
  normalized_name: string;
  family: string | null;
  subfamily: string | null;
  is_active: boolean;
  is_obsolete: boolean;
  current_price: {
    price: number;
    currency: string;
    unit: string;
    supplier: string | null;
    source: string;
    valid_from: string;
  } | null;
  parameters: Array<{
    parameter_id: string;
    code: string;
    name: string;
    value: number;
    unit: string | null;
    source: string | null;
    confidence: number | null;
  }>;
  aliases: string[];
};

export type RawMaterialCatalogItemRead = {
  id: string;
  tenant_id: string;
  code: string | null;
  external_code: string | null;
  name: string;
  family: string | null;
  subfamily: string | null;
  physical_state: string | null;
  is_active: boolean;
  is_obsolete: boolean;
  current_price: {
    price: number;
    currency: string;
    unit: string;
    supplier: string | null;
    source: string;
    valid_from: string;
  } | null;
  parameter_count: number;
  positive_parameter_count: number;
  aliases: string[];
};

export type RawMaterialCatalogRead = {
  items: RawMaterialCatalogItemRead[];
  total: number;
  limit: number;
  offset: number;
  families: string[];
};

export {
  mergeRawMaterials,
  toWorkspaceRawMaterial,
  toWorkspaceRawMaterialCatalogItem,
  withRawMaterialAlias,
} from "./raw-material-model";

export type RawMaterialAliasRead = {
  id: string;
  tenant_id: string;
  raw_material_id: string;
  alias: string;
  normalized_alias: string;
  source: string;
};

export type FormulaRead = {
  id: string;
  tenant_id: string;
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

export type CompatibilityRuleRead = {
  id: string;
  tenant_id: string;
  rule_type: string;
  severity: "blocker" | "warning" | "info" | string;
  condition_json: {
    raw_material_ids?: string[];
    recommended_action?: string | null;
  };
  message: string;
  source_type: string;
  active: boolean;
  created_at: string;
};

export { emptyJiraConnectionForm } from "./jira-connection-model";
export type {
  JiraConnection,
  JiraConnectionForm,
  JiraConnectionTest,
  JiraFieldMetadata,
  JiraIssueTypeMetadata,
  JiraMetadataState,
  JiraOAuthAuthorize,
  JiraOAuthCallbackResult,
  JiraProjectMetadata,
} from "./jira-connection-model";

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

export {
  aliasFromImportRow,
  withResolvedImportRow,
} from "./excel-import-model";
export type {
  ExcelImportPreview,
  ExcelImportPreviewRow,
  ExcelImportSheets,
} from "./excel-import-model";

export type {
  AgentCandidate,
  AgentCandidateResearch,
  AgentFormulaCandidate,
  AgentInfeasibilityExplanation,
  AgentOptimizationPlan,
  AgentPlan,
  AgentPlanStep,
  AiRun,
  RequirementConstraint,
  RequirementParse,
} from "./ai-workflow-model";

export type Status = "idle" | "working" | "error";

export type MaterialForm = {
  code: string;
  name: string;
  price: string;
  parameterValue: string;
};

export const emptyWorkspace: WorkspaceState = {
  tenant: null,
  parameter: null,
  parameters: [],
  rawMaterials: [],
  formulaId: null,
  formulaName: "Manual Formula",
  formulaJiraProjectId: "",
  formulaJiraIssueType: "Calidad",
  formulaJiraProductType: "Nuevo",
  formulaLines: [],
};

export {
  formatDateTime,
  makeLocalId,
  normalizeCode,
  parseOptionalNumber,
  slugify,
} from "./workspace-utils";
