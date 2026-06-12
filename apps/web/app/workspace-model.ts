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

export type {
  CalculationResult,
  FormulaCalculationHistory,
  FormulaRead,
  FormulaReviewArtifact,
  FormulaReviewRequest,
} from "./formula-model";

export type { CompatibilityRuleRead } from "./compatibility-model";

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
