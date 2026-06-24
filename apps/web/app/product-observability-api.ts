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
  by_element: Array<{ key: string; count: number }>;
  by_user: Array<{
    user_id: string;
    user_email: string | null;
    user_role: string;
    count: number;
  }>;
  recent: ProductEventRead[];
};

export type ProductEventSummaryFilters = {
  dateFrom?: string;
  dateTo?: string;
  eventType?: string;
  surface?: string;
  userId?: string;
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
  filters: ProductEventSummaryFilters = {},
): Promise<ProductEventSummary> {
  const query = new URLSearchParams();
  if (filters.dateFrom) {
    query.set("date_from", toApiDateTime(filters.dateFrom, "start"));
  }
  if (filters.dateTo) {
    query.set("date_to", toApiDateTime(filters.dateTo, "end"));
  }
  if (filters.eventType) {
    query.set("event_type", filters.eventType);
  }
  if (filters.surface) {
    query.set("surface", filters.surface);
  }
  if (filters.userId) {
    query.set("user_id", filters.userId);
  }
  const suffix = query.toString() ? `?${query}` : "";
  return request<ProductEventSummary>(`/api/v1/product-events/summary${suffix}`, {
    method: "GET",
    headers,
  });
}

function toApiDateTime(date: string, boundary: "start" | "end") {
  return `${date}T${boundary === "start" ? "00:00:00" : "23:59:59"}`;
}
