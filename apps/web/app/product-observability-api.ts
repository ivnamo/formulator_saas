import { request } from "./workspace-api";

export type ProductEventPayload = {
  event_type: string;
  surface: string;
  element?: string | null;
  metadata?: Record<string, unknown>;
};

export type ProductEventRead = {
  id: string;
  tenant_id: string;
  user_id: string;
  user_role: string;
  event_type: string;
  surface: string;
  element: string | null;
  metadata_json: Record<string, unknown>;
  created_at: string;
};

export type ProductEventSummary = {
  total: number;
  by_event_type: Array<{ key: string; count: number }>;
  by_surface: Array<{ key: string; count: number }>;
  recent: ProductEventRead[];
};

export function recordProductEvent(
  headers: HeadersInit,
  payload: ProductEventPayload,
): Promise<ProductEventRead> {
  return request<ProductEventRead>("/api/v1/product-events", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
}

export function fetchProductEventSummary(
  headers: HeadersInit,
): Promise<ProductEventSummary> {
  return request<ProductEventSummary>("/api/v1/product-events/summary", {
    method: "GET",
    headers,
  });
}
