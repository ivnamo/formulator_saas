import {
  buildRawMaterialCreatePayload,
  buildRawMaterialParameterValuePayload,
  buildRawMaterialPricePayload,
  type MaterialForm,
  type RawMaterialAliasRead,
  type RawMaterialCatalogRead,
  type RawMaterialRead,
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

export function createRawMaterialPrice(
  headers: HeadersInit,
  rawMaterialId: string,
  price: number,
): Promise<Record<string, unknown>> {
  return request<Record<string, unknown>>(`/api/v1/raw-materials/${rawMaterialId}/prices`, {
    method: "POST",
    headers,
    body: JSON.stringify(buildRawMaterialPricePayload(price)),
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
