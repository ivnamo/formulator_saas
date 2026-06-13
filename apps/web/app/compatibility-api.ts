import type { CompatibilityRuleRead } from "./compatibility-model";
import { request } from "./workspace-api";

export type CreateCompatibilityRulePayload = {
  material_a_id: string;
  material_b_id: string;
  severity: string;
  message: string;
  recommended_action: string | null;
};

export function createCompatibilityRuleApi(
  headers: HeadersInit,
  payload: CreateCompatibilityRulePayload,
): Promise<CompatibilityRuleRead> {
  return request<CompatibilityRuleRead>("/api/v1/compatibility-rules", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
}
