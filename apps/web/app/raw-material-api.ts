import {
  buildRawMaterialCreatePayload,
  buildRawMaterialParameterValuePayload,
  buildRawMaterialPricePayload,
  buildRawMaterialUpdatePayload,
  type MaterialForm,
  type RawMaterialAliasRead,
  type RawMaterialCatalogRead,
  type RawMaterialImportRead,
  type RawMaterialPriceForm,
  type RawMaterialPriceRead,
  type RawMaterialRead,
  type RawMaterialUpdateForm,
  type SapRawMaterialImportForm,
} from "./raw-material-model";
import type { Parameter } from "./workspace-base-model";
import { request } from "./workspace-api";

export type RawMaterialCatalogParameterRange = {
  code: string;
  min: string;
  max: string;
};

export type RawMaterialCatalogQuery = {
  limit: number;
  offset?: number;
  query: string;
  family: string;
  priceFilter: string;
  priceMin: string;
  priceMax: string;
  parameterRanges: RawMaterialCatalogParameterRange[];
  onlyPositive: boolean;
};

export function fetchRawMaterialDetail(
  headers: HeadersInit,
  rawMaterialId: string,
): Promise<RawMaterialRead> {
  return request<RawMaterialRead>(`/api/v1/raw-materials/${rawMaterialId}`, {
    method: "GET",
    headers,
  });
}

export function listRawMaterials(headers: HeadersInit): Promise<RawMaterialRead[]> {
  return request<RawMaterialRead[]>("/api/v1/raw-materials", {
    method: "GET",
    headers,
  });
}

export function fetchRawMaterialCatalog(
  headers: HeadersInit,
  query: RawMaterialCatalogQuery,
): Promise<RawMaterialCatalogRead> {
  const searchParams = new URLSearchParams({
    limit: String(query.limit),
    offset: String(query.offset ?? 0),
    price_filter: query.priceFilter,
    only_positive: String(query.onlyPositive),
  });
  const trimmedQuery = query.query.trim();
  if (trimmedQuery) {
    searchParams.set("q", trimmedQuery);
  }
  if (query.family !== "all") {
    searchParams.set("family", query.family);
  }
  if (query.priceMin.trim()) {
    searchParams.set("price_min", query.priceMin.trim());
  }
  if (query.priceMax.trim()) {
    searchParams.set("price_max", query.priceMax.trim());
  }
  for (const range of query.parameterRanges) {
    if (!range.code) {
      continue;
    }
    searchParams.append(
      "parameter_range",
      `${range.code}|${range.min.trim()}|${range.max.trim()}`,
    );
  }

  return request<RawMaterialCatalogRead>(`/api/v1/raw-materials/catalog?${searchParams}`, {
    method: "GET",
    headers,
  });
}

export function createRawMaterial(
  headers: HeadersInit,
  materialForm: MaterialForm,
): Promise<RawMaterialRead> {
  return request<RawMaterialRead>("/api/v1/raw-materials", {
    method: "POST",
    headers,
    body: JSON.stringify(buildRawMaterialCreatePayload(materialForm)),
  });
}

export function updateRawMaterial(
  headers: HeadersInit,
  rawMaterialId: string,
  materialForm: RawMaterialUpdateForm,
): Promise<RawMaterialRead> {
  return request<RawMaterialRead>(`/api/v1/raw-materials/${rawMaterialId}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(buildRawMaterialUpdatePayload(materialForm)),
  });
}

export function archiveRawMaterial(
  headers: HeadersInit,
  rawMaterialId: string,
): Promise<RawMaterialRead> {
  return request<RawMaterialRead>(`/api/v1/raw-materials/${rawMaterialId}/archive`, {
    method: "POST",
    headers,
  });
}

export function fetchRawMaterialPrices(
  headers: HeadersInit,
  rawMaterialId: string,
): Promise<RawMaterialPriceRead[]> {
  return request<RawMaterialPriceRead[]>(`/api/v1/raw-materials/${rawMaterialId}/prices`, {
    method: "GET",
    headers,
  });
}

export function createRawMaterialPrice(
  headers: HeadersInit,
  rawMaterialId: string,
  priceForm: RawMaterialPriceForm,
): Promise<RawMaterialPriceRead> {
  return request<RawMaterialPriceRead>(`/api/v1/raw-materials/${rawMaterialId}/prices`, {
    method: "POST",
    headers,
    body: JSON.stringify(buildRawMaterialPricePayload(priceForm)),
  });
}

export function createRawMaterialParameterValue(
  headers: HeadersInit,
  rawMaterialId: string,
  parameter: Parameter,
  value: number,
): Promise<Record<string, unknown>> {
  return request<Record<string, unknown>>(
    `/api/v1/raw-materials/${rawMaterialId}/parameter-values`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(buildRawMaterialParameterValuePayload(parameter, value)),
    },
  );
}

export function createRawMaterialAlias(
  headers: HeadersInit,
  rawMaterialId: string,
  alias: string,
): Promise<RawMaterialAliasRead> {
  return request<RawMaterialAliasRead>(
    `/api/v1/raw-materials/${rawMaterialId}/aliases`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ alias }),
    },
  );
}

export function previewSapRawMaterialImport(
  uploadHeaders: HeadersInit,
  file: File,
  form: SapRawMaterialImportForm,
): Promise<RawMaterialImportRead> {
  const body = new FormData();
  body.append("file", file);
  if (form.sheetName.trim()) {
    body.append("sheet_name", form.sheetName.trim());
  }
  if (form.source.trim()) {
    body.append("source", form.source.trim());
  }
  if (form.validFrom) {
    body.append("valid_from", form.validFrom);
  }

  return request<RawMaterialImportRead>("/api/v1/raw-material-imports/sap/preview", {
    method: "POST",
    headers: uploadHeaders,
    body,
  });
}

export function applySapRawMaterialImport(
  headers: HeadersInit,
  importId: string,
): Promise<RawMaterialImportRead> {
  return request<RawMaterialImportRead>(`/api/v1/raw-material-imports/${importId}/apply`, {
    method: "POST",
    headers,
  });
}
