import {
  buildRawMaterialCreatePayload,
  buildRawMaterialParameterValuePayload,
  buildRawMaterialPricePayload,
  type MaterialForm,
  type RawMaterialAliasRead,
  type RawMaterialRead,
} from "./raw-material-model";
import type { Parameter } from "./workspace-base-model";
import { request } from "./workspace-api";

export function fetchRawMaterialDetail(
  headers: HeadersInit,
  rawMaterialId: string,
): Promise<RawMaterialRead> {
  return request<RawMaterialRead>(`/api/v1/raw-materials/${rawMaterialId}`, {
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
