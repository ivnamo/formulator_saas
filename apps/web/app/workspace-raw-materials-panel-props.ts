import type { WorkspaceHomePanels } from "./workspace-home-view";

type RawMaterialsPanelProps = WorkspaceHomePanels["rawMaterials"];

type BuildWorkspaceRawMaterialsPanelPropsArgs = {
  rawMaterials: RawMaterialsPanelProps["rawMaterials"];
  parameter: RawMaterialsPanelProps["parameter"];
  materialForm: RawMaterialsPanelProps["materialForm"];
  aliasInputs: RawMaterialsPanelProps["aliasInputs"];
  canEditTenantData: RawMaterialsPanelProps["canEditTenantData"];
  isBusy: RawMaterialsPanelProps["isBusy"];
  setMaterialForm: RawMaterialsPanelProps["onMaterialFormChange"];
  setAliasInputs: RawMaterialsPanelProps["onAliasInputsChange"];
  createMaterial: RawMaterialsPanelProps["onCreateMaterial"];
  addFormulaLine: RawMaterialsPanelProps["onAddFormulaLine"];
  createAlias: RawMaterialsPanelProps["onCreateAlias"];
};

export function buildWorkspaceRawMaterialsPanelProps(
  args: BuildWorkspaceRawMaterialsPanelPropsArgs,
): RawMaterialsPanelProps {
  return {
    rawMaterials: args.rawMaterials,
    parameter: args.parameter,
    materialForm: args.materialForm,
    aliasInputs: args.aliasInputs,
    canEditTenantData: args.canEditTenantData,
    isBusy: args.isBusy,
    onMaterialFormChange: args.setMaterialForm,
    onAliasInputsChange: args.setAliasInputs,
    onCreateMaterial: args.createMaterial,
    onAddFormulaLine: args.addFormulaLine,
    onCreateAlias: args.createAlias,
  };
}
