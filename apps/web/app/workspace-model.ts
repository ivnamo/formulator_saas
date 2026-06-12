import type { RawMaterial } from "./raw-material-model";

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

export {
  mergeRawMaterials,
  toWorkspaceRawMaterial,
  toWorkspaceRawMaterialCatalogItem,
  withRawMaterialAlias,
} from "./raw-material-model";
export type {
  MaterialForm,
  RawMaterial,
  RawMaterialAliasRead,
  RawMaterialCatalogItemRead,
  RawMaterialCatalogRead,
  RawMaterialParameterValue,
  RawMaterialRead,
} from "./raw-material-model";

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
