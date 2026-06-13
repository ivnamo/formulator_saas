import type {
  FormulaReviewArtifact,
  FormulaReviewRequest,
} from "./formula-model";
import { apiUrl, request } from "./workspace-api";

export function createJiraFormulaReview(
  headers: HeadersInit,
  formulaId: string,
): Promise<FormulaReviewRequest> {
  return request<FormulaReviewRequest>(`/api/v1/formulas/${formulaId}/reviews/jira`, {
    method: "POST",
    headers,
    body: JSON.stringify({}),
  });
}

export function sendFormulaReviewToJira(
  headers: HeadersInit,
  reviewId: string,
): Promise<FormulaReviewRequest> {
  return request<FormulaReviewRequest>(`/api/v1/formula-reviews/${reviewId}/jira/send`, {
    method: "POST",
    headers,
  });
}

export function generateJiraReviewExcelArtifact(
  headers: HeadersInit,
  reviewId: string,
): Promise<FormulaReviewArtifact> {
  return request<FormulaReviewArtifact>(
    `/api/v1/formula-reviews/${reviewId}/artifacts/excel`,
    {
      method: "POST",
      headers,
    },
  );
}

export async function downloadFormulaReviewArtifactBlob(
  uploadHeaders: HeadersInit,
  artifactId: string,
): Promise<Blob> {
  const response = await fetch(
    `${apiUrl}/api/v1/formula-review-artifacts/${artifactId}/download`,
    { method: "GET", headers: uploadHeaders },
  );
  if (!response.ok) {
    throw new Error(`API ${response.status}: ${await response.text()}`);
  }
  return response.blob();
}

export function retryJiraReviewExcelAttachment(
  headers: HeadersInit,
  reviewId: string,
): Promise<FormulaReviewRequest> {
  return request<FormulaReviewRequest>(
    `/api/v1/formula-reviews/${reviewId}/jira/retry-attachment`,
    {
      method: "POST",
      headers,
    },
  );
}

export function syncFormulaReviewJiraStatus(
  headers: HeadersInit,
  reviewId: string,
): Promise<FormulaReviewRequest> {
  return request<FormulaReviewRequest>(`/api/v1/formula-reviews/${reviewId}/sync`, {
    method: "POST",
    headers,
  });
}
