export type IsoTenantSettings = {
  id: string;
  tenant_id: string;
  enabled: boolean;
  config: IsoTenantConfig;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type IsoLegacyImportFormat = "f10_01" | "f10_02" | "f10_03";

export type IsoLegacyImportRow = {
  format_key: IsoLegacyImportFormat;
  sheet_name: string;
  row_number: number;
  record_key: string | null;
  action: string;
  status: "ready" | "ambiguous" | "applied" | string;
  message: string | null;
  payload: Record<string, unknown>;
};

export type IsoLegacyImportPreview = {
  format_key: IsoLegacyImportFormat;
  available_sheets: string[];
  total_rows: number;
  ready_rows: number;
  ambiguous_rows: number;
  rows: IsoLegacyImportRow[];
};

export type IsoLegacyImportApplyResult = IsoLegacyImportPreview & {
  created_projects: number;
  updated_projects: number;
  created_trials: number;
  updated_trials: number;
  created_validations: number;
  updated_validations: number;
  skipped_rows: number;
};

export type IsoTenantConfig = {
  module_version?: number;
  formats?: Record<string, { enabled?: boolean; label?: string }>;
  jira?: {
    enabled?: boolean;
    project_key?: string;
    issue_types?: Record<string, string>;
    technical_result_mapping?: Record<string, string>;
    allow_poc_without_project?: boolean;
    allow_sample_for_validation?: boolean;
  };
  technical_results?: string[];
  f10_03?: {
    allow_ok_not_released_draft?: boolean;
    validation_matrix?: Array<{
      area?: string;
      aspect?: string;
      required?: boolean;
    }>;
  };
};

export type IsoDesignProject = {
  id: string;
  tenant_id: string;
  iso_request_number: string;
  year: number;
  project_code: string | null;
  requester: string | null;
  responsible_user_id: string | null;
  product_name: string;
  commercial_name: string | null;
  need: string | null;
  product_type: string | null;
  destination_country: string | null;
  packaging: string | null;
  accepted_status: string;
  lifecycle_status: string;
  rejection_reason: string | null;
  estimated_days: number | null;
  planned_finish_at: string | null;
  finished_at: string | null;
  rd_hours: number | null;
  quality_hours: number | null;
  problems: string | null;
  comments: string | null;
  source_type: string;
  source_ref: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  trial_count: number;
};

export type IsoDesignTrial = {
  id: string;
  tenant_id: string;
  design_project_id: string;
  formula_id: string | null;
  formula_version: number | null;
  review_request_id: string | null;
  jira_issue_key: string | null;
  jira_issue_url: string | null;
  trial_code: string | null;
  trial_name: string | null;
  trial_number: number | null;
  trial_at: string | null;
  technical_result: string;
  raw_result_label: string | null;
  raw_status_label: string | null;
  result_source: string;
  reason_comment: string | null;
  snapshot: Record<string, unknown>;
  snapshot_checksum: string | null;
  created_at: string;
  updated_at: string;
};

export type IsoValidationCheck = {
  area: string;
  aspect: string;
  required: boolean;
  result: "pending" | "ok" | "nok" | "not_applicable" | string;
  comments: string | null;
};

export type IsoProductValidation = {
  id: string;
  tenant_id: string;
  design_project_id: string;
  released_trial_id: string;
  formula_id: string | null;
  formula_version: number | null;
  product_name: string;
  formula_ok: string | null;
  specification: Record<string, unknown>;
  validation_checks: IsoValidationCheck[];
  status: string;
  validation_at: string | null;
  published_at: string | null;
  comments: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type IsoProductValidationCreatePayload = {
  released_trial_id: string;
  product_name?: string | null;
  formula_ok?: string | null;
  specification?: Record<string, unknown>;
  comments?: string | null;
};

export type IsoRecordArtifact = {
  id: string;
  tenant_id: string;
  design_project_id: string | null;
  artifact_type: string;
  file_name: string;
  content_type: string;
  checksum_sha256: string;
  size_bytes: number;
  created_by: string | null;
  created_at: string;
};

export type IsoDesignProjectForm = {
  isoRequestNumber: string;
  year: string;
  projectCode: string;
  requester: string;
  productName: string;
  commercialName: string;
  need: string;
  productType: string;
  destinationCountry: string;
  packaging: string;
  acceptedStatus: string;
  lifecycleStatus: string;
  rejectionReason: string;
  estimatedDays: string;
  plannedFinishAt: string;
  comments: string;
};

export type IsoDesignProjectCreatePayload = {
  iso_request_number: string;
  year?: number | null;
  project_code?: string | null;
  requester?: string | null;
  product_name: string;
  commercial_name?: string | null;
  need?: string | null;
  product_type?: string | null;
  destination_country?: string | null;
  packaging?: string | null;
  accepted_status: string;
  lifecycle_status: string;
  rejection_reason?: string | null;
  estimated_days?: number | null;
  planned_finish_at?: string | null;
  comments?: string | null;
  source_type: string;
};

export const initialIsoDesignProjectForm: IsoDesignProjectForm = {
  isoRequestNumber: "",
  year: "",
  projectCode: "",
  requester: "",
  productName: "",
  commercialName: "",
  need: "",
  productType: "",
  destinationCountry: "",
  packaging: "",
  acceptedStatus: "pending",
  lifecycleStatus: "intake",
  rejectionReason: "",
  estimatedDays: "",
  plannedFinishAt: "",
  comments: "",
};

export const isoLegacyImportFormatLabels: Record<IsoLegacyImportFormat, string> = {
  f10_01: "F10-01",
  f10_02: "F10-02",
  f10_03: "F10-03",
};

export function buildIsoDesignProjectCreatePayload(
  form: IsoDesignProjectForm,
): IsoDesignProjectCreatePayload {
  const year = parseOptionalInteger(form.year);
  const estimatedDays = parseOptionalInteger(form.estimatedDays);

  return {
    iso_request_number: form.isoRequestNumber.trim(),
    year,
    project_code: cleanOptional(form.projectCode),
    requester: cleanOptional(form.requester),
    product_name: form.productName.trim(),
    commercial_name: cleanOptional(form.commercialName),
    need: cleanOptional(form.need),
    product_type: cleanOptional(form.productType),
    destination_country: cleanOptional(form.destinationCountry),
    packaging: cleanOptional(form.packaging),
    accepted_status: form.acceptedStatus,
    lifecycle_status: form.lifecycleStatus,
    rejection_reason: cleanOptional(form.rejectionReason),
    estimated_days: estimatedDays,
    planned_finish_at: cleanOptional(form.plannedFinishAt),
    comments: cleanOptional(form.comments),
    source_type: "manual",
  };
}

export function isoJiraIssueTypeLabels(settings: IsoTenantSettings | null): string[] {
  const issueTypes = settings?.config.jira?.issue_types;
  return issueTypes ? Object.values(issueTypes).filter(Boolean) : [];
}

export function isoTechnicalResults(settings: IsoTenantSettings | null): string[] {
  return settings?.config.technical_results ?? [];
}

export function isoFormatLabel(
  settings: IsoTenantSettings | null,
  formatKey: string,
  fallback: string,
): string {
  return settings?.config.formats?.[formatKey]?.label ?? fallback;
}

function cleanOptional(value: string): string | null {
  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : null;
}

function parseOptionalInteger(value: string): number | null {
  const cleaned = value.trim();
  if (!cleaned) {
    return null;
  }
  const parsed = Number.parseInt(cleaned, 10);
  return Number.isFinite(parsed) ? parsed : null;
}
