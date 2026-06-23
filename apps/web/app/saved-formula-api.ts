import { request } from "./workspace-api";
import type { buildManualFormulaSavePayload } from "./formula-save-model";
import type {
  CalculationResult,
  FormulaCalculationHistory,
  FormulaRead,
  FormulaReviewArtifact,
  FormulaReviewRequest,
} from "./formula-model";

type ManualFormulaSavePayload = ReturnType<typeof buildManualFormulaSavePayload>;

export function listSavedFormulas(headers: HeadersInit): Promise<FormulaRead[]> {
  return request<FormulaRead[]>("/api/v1/formulas", {
    method: "GET",
    headers,
  });
}

export function calculateSavedFormula(
  headers: HeadersInit,
  formulaId: string,
): Promise<CalculationResult> {
  return request<CalculationResult>(`/api/v1/formulas/${formulaId}/calculate`, {
    method: "POST",
    headers,
  });
}

export function fetchFormulaCalculationHistory(
  headers: HeadersInit,
  formulaId: string,
): Promise<FormulaCalculationHistory[]> {
  return request<FormulaCalculationHistory[]>(
    `/api/v1/formulas/${formulaId}/calculations`,
    { method: "GET", headers },
  );
}

export function fetchFormulaReviewRequests(
  headers: HeadersInit,
  formulaId: string,
): Promise<FormulaReviewRequest[]> {
  return request<FormulaReviewRequest[]>(`/api/v1/formulas/${formulaId}/reviews`, {
    method: "GET",
    headers,
  });
}

export function fetchFormulaReviewArtifacts(
  headers: HeadersInit,
  reviewId: string,
): Promise<FormulaReviewArtifact[]> {
  return request<FormulaReviewArtifact[]>(
    `/api/v1/formula-reviews/${reviewId}/artifacts`,
    { method: "GET", headers },
  );
}

export async function fetchFormulaReviewArtifactsByReview(
  headers: HeadersInit,
  reviews: FormulaReviewRequest[],
): Promise<Record<string, FormulaReviewArtifact[]>> {
  const entries = await Promise.all(
    reviews.map(async (review) => {
      const artifacts = await fetchFormulaReviewArtifacts(headers, review.id);
      return [review.id, artifacts] as const;
    }),
  );
  return Object.fromEntries(entries);
}

export function persistSavedFormula(
  headers: HeadersInit,
  formulaId: string | null,
  payload: ManualFormulaSavePayload,
): Promise<FormulaRead> {
  if (formulaId) {
    return request<FormulaRead>(`/api/v1/formulas/${formulaId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(payload),
    });
  }
  return request<FormulaRead>("/api/v1/formulas", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
}

export function archiveSavedFormula(
  headers: HeadersInit,
  formulaId: string,
): Promise<FormulaRead> {
  return request<FormulaRead>(`/api/v1/formulas/${formulaId}/archive`, {
    method: "POST",
    headers,
  });
}
