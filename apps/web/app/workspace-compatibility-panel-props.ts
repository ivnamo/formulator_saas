import type { WorkspaceHomePanels } from "./workspace-home-view";

type CompatibilityPanelProps = WorkspaceHomePanels["compatibility"];

type BuildWorkspaceCompatibilityPanelPropsArgs = {
  rules: CompatibilityPanelProps["rules"];
  rawMaterials: CompatibilityPanelProps["rawMaterials"];
  rawMaterialsById: CompatibilityPanelProps["rawMaterialsById"];
  form: CompatibilityPanelProps["form"];
  canEditTenantData: CompatibilityPanelProps["canEditTenantData"];
  canCreateRule: CompatibilityPanelProps["canCreateRule"];
  setCompatibilityRuleForm: CompatibilityPanelProps["onFormChange"];
  createCompatibilityRule: CompatibilityPanelProps["onCreateRule"];
};

export function buildWorkspaceCompatibilityPanelProps(
  args: BuildWorkspaceCompatibilityPanelPropsArgs,
): CompatibilityPanelProps {
  return {
    rules: args.rules,
    rawMaterials: args.rawMaterials,
    rawMaterialsById: args.rawMaterialsById,
    form: args.form,
    canEditTenantData: args.canEditTenantData,
    canCreateRule: args.canCreateRule,
    onFormChange: args.setCompatibilityRuleForm,
    onCreateRule: args.createCompatibilityRule,
  };
}
