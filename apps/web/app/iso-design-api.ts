import {
  buildIsoDesignProjectCreatePayload,
  type IsoDesignProject,
  type IsoDesignProjectForm,
  type IsoDesignTrial,
  type IsoLegacyImportApplyResult,
  type IsoLegacyImportFormat,
  type IsoLegacyImportPreview,
  type IsoProductValidation,
  type IsoProductValidationCreatePayload,
  type IsoRecordArtifact,
  type IsoValidationCheck,
  type IsoTenantSettings,
} from "./iso-design-model";
import { apiUrl, request } from "./workspace-api";

export function getIsoTenantSettings(headers: HeadersInit): Promise<IsoTenantSettings> {
  return request<IsoTenantSettings>("/api/v1/iso/settings", {
    method: "GET",
    headers,
  });
}

export function updateIsoTenantSettings(
  headers: HeadersInit,
  payload: { enabled?: boolean; config_patch?: Record<string, unknown> },
): Promise<IsoTenantSettings> {
  return request<IsoTenantSettings>("/api/v1/iso/settings", {
    method: "PATCH",
    headers,
    body: JSON.stringify(payload),
  });
}

export function listIsoDesignProjects(headers: HeadersInit): Promise<IsoDesignProject[]> {
  return request<IsoDesignProject[]>("/api/v1/iso/design-projects", {
    method: "GET",
    headers,
  });
}

export function createIsoDesignProjectApi(
  headers: HeadersInit,
  form: IsoDesignProjectForm,
): Promise<IsoDesignProject> {
  return request<IsoDesignProject>("/api/v1/iso/design-projects", {
    method: "POST",
    headers,
    body: JSON.stringify(buildIsoDesignProjectCreatePayload(form)),
  });
}

export function listIsoDesignTrials(
  headers: HeadersInit,
  projectId: string,
): Promise<IsoDesignTrial[]> {
  return request<IsoDesignTrial[]>(`/api/v1/iso/design-projects/${projectId}/trials`, {
    method: "GET",
    headers,
  });
}

export function createIsoDesignTrialFromJiraReview(
  headers: HeadersInit,
  projectId: string,
  reviewId: string,
): Promise<IsoDesignTrial> {
  return request<IsoDesignTrial>(
    `/api/v1/iso/design-projects/${projectId}/trials/from-jira-review`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ review_id: reviewId }),
    },
  );
}

export function getIsoProductValidation(
  headers: HeadersInit,
  projectId: string,
): Promise<IsoProductValidation | null> {
  return request<IsoProductValidation | null>(
    `/api/v1/iso/design-projects/${projectId}/validation`,
    {
      method: "GET",
      headers,
    },
  );
}

export function createIsoProductValidationApi(
  headers: HeadersInit,
  projectId: string,
  payload: IsoProductValidationCreatePayload,
): Promise<IsoProductValidation> {
  return request<IsoProductValidation>(
    `/api/v1/iso/design-projects/${projectId}/validation`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    },
  );
}

export function updateIsoProductValidationChecksApi(
  headers: HeadersInit,
  validationId: string,
  checks: IsoValidationCheck[],
): Promise<IsoProductValidation> {
  return request<IsoProductValidation>(
    `/api/v1/iso/product-validations/${validationId}/checks`,
    {
      method: "PUT",
      headers,
      body: JSON.stringify({ checks }),
    },
  );
}

export function publishIsoProductValidationApi(
  headers: HeadersInit,
  validationId: string,
): Promise<IsoProductValidation> {
  return request<IsoProductValidation>(
    `/api/v1/iso/product-validations/${validationId}/publish`,
    {
      method: "POST",
      headers,
    },
  );
}

export function createIsoF1001Export(
  headers: HeadersInit,
  year?: number | null,
): Promise<IsoRecordArtifact> {
  const query = year ? `?year=${year}` : "";
  return request<IsoRecordArtifact>(`/api/v1/iso/exports/f10-01${query}`, {
    method: "POST",
    headers,
  });
}

export function createIsoF1002Export(
  headers: HeadersInit,
  projectId: string,
): Promise<IsoRecordArtifact> {
  return request<IsoRecordArtifact>(
    `/api/v1/iso/design-projects/${projectId}/exports/f10-02`,
    {
      method: "POST",
      headers,
    },
  );
}

export function createIsoF1003Export(
  headers: HeadersInit,
  projectId: string,
): Promise<IsoRecordArtifact> {
  return request<IsoRecordArtifact>(
    `/api/v1/iso/design-projects/${projectId}/exports/f10-03`,
    {
      method: "POST",
      headers,
    },
  );
}

export function createIsoDossierExport(
  headers: HeadersInit,
  projectId: string,
): Promise<IsoRecordArtifact> {
  return request<IsoRecordArtifact>(`/api/v1/iso/design-projects/${projectId}/dossier`, {
    method: "POST",
    headers,
  });
}

export function previewIsoLegacyImport(
  uploadHeaders: HeadersInit,
  format: IsoLegacyImportFormat,
  file: File,
  sheetName?: string | null,
): Promise<IsoLegacyImportPreview> {
  const formData = new FormData();
  formData.append("file", file);
  if (sheetName) {
    formData.append("sheet_name", sheetName);
  }
  return request<IsoLegacyImportPreview>(
    `/api/v1/iso/imports/${isoLegacyImportPathSegment(format)}/preview`,
    {
      method: "POST",
      headers: uploadHeaders,
      body: formData,
    },
  );
}

export function applyIsoLegacyImport(
  uploadHeaders: HeadersInit,
  format: IsoLegacyImportFormat,
  file: File,
  sheetName?: string | null,
): Promise<IsoLegacyImportApplyResult> {
  const formData = new FormData();
  formData.append("file", file);
  if (sheetName) {
    formData.append("sheet_name", sheetName);
  }
  return request<IsoLegacyImportApplyResult>(
    `/api/v1/iso/imports/${isoLegacyImportPathSegment(format)}/apply`,
    {
      method: "POST",
      headers: uploadHeaders,
      body: formData,
    },
  );
}

export async function downloadIsoArtifactBlob(
  headers: HeadersInit,
  artifactId: string,
): Promise<Blob> {
  const response = await fetch(`${apiUrl}/api/v1/iso/artifacts/${artifactId}/download`, {
    method: "GET",
    headers,
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`API ${response.status}: ${detail}`);
  }
  return response.blob();
}

function isoLegacyImportPathSegment(format: IsoLegacyImportFormat): string {
  return format.replace("_", "-");
}
