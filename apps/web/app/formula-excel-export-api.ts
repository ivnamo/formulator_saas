import { apiUrl } from "./workspace-api";
import type { WorkspaceState } from "./workspace-state-model";

export type FormulaExcelDownload = {
  blob: Blob;
  fileName: string;
};

type FormulaExcelMetadata = {
  sample_code?: string | null;
  lab_date?: string | null;
  experiment_date?: string | null;
  density?: number | null;
  ph?: number | null;
  notes?: string | null;
};

export async function downloadSavedFormulaIdLabExcel(
  headers: HeadersInit,
  formulaId: string,
): Promise<FormulaExcelDownload> {
  return requestFormulaExcelBlob(
    `/api/v1/formulas/${formulaId}/exports/atlantica-id-lab.xlsx`,
    {
      method: "GET",
      headers,
    },
  );
}

export async function downloadDraftFormulaIdLabExcel(
  headers: HeadersInit,
  workspace: WorkspaceState,
  metadata: FormulaExcelMetadata = {},
): Promise<FormulaExcelDownload> {
  return requestFormulaExcelBlob("/api/v1/formulas/exports/atlantica-id-lab.xlsx", {
    method: "POST",
    headers,
    body: JSON.stringify(formulaExcelExportPayload(workspace, metadata)),
  });
}

export function downloadBlob(download: FormulaExcelDownload): void {
  const blobUrl = URL.createObjectURL(download.blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = download.fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(blobUrl);
}

async function requestFormulaExcelBlob(
  path: string,
  init: RequestInit,
): Promise<FormulaExcelDownload> {
  let response: Response;
  try {
    response = await fetch(`${apiUrl}${path}`, init);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "network error";
    throw new Error(`Could not reach API ${path}: ${detail}`);
  }
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`API ${response.status}: ${detail}`);
  }
  return {
    blob: await response.blob(),
    fileName: fileNameFromContentDisposition(response.headers.get("content-disposition")),
  };
}

function fileNameFromContentDisposition(value: string | null): string {
  const fallback = "formulia_id_lab_export.xlsx";
  if (!value) {
    return fallback;
  }
  const encodedMatch = /filename\*=UTF-8''([^;]+)/i.exec(value);
  if (encodedMatch?.[1]) {
    return decodeURIComponent(encodedMatch[1]);
  }
  const match = /filename="?([^";]+)"?/i.exec(value);
  return match?.[1] ?? fallback;
}

function formulaExcelExportPayload(
  workspace: WorkspaceState,
  metadata: FormulaExcelMetadata,
) {
  return {
    name: workspace.formulaName,
    jira_project_id: workspace.formulaJiraProjectId.trim() || null,
    jira_issue_type: workspace.formulaJiraIssueType,
    jira_product_type: workspace.formulaJiraProductType,
    metadata,
    items: workspace.formulaLines.map((line, index) => ({
      raw_material_id: line.rawMaterialId,
      percentage: line.percentage,
      order_index: index,
    })),
  };
}
