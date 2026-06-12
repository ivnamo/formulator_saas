export type CompatibilityRuleRead = {
  id: string;
  tenant_id: string;
  rule_type: string;
  severity: "blocker" | "warning" | "info" | string;
  condition_json: {
    raw_material_ids?: string[];
    recommended_action?: string | null;
  };
  message: string;
  source_type: string;
  active: boolean;
  created_at: string;
};
