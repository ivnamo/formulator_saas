import type { WorkspaceHomePanels } from "./workspace-home-view";

type RawMaterialsPanelProps = WorkspaceHomePanels["rawMaterials"];

type BuildWorkspaceRawMaterialsPanelPropsArgs = {
  rawMaterials: RawMaterialsPanelProps["rawMaterials"];
  parameters: RawMaterialsPanelProps["parameters"];
  materialForm: RawMaterialsPanelProps["materialForm"];
  aliasInputs: RawMaterialsPanelProps["aliasInputs"];
  canEditTenantData: RawMaterialsPanelProps["canEditTenantData"];
  canArchiveEntities: RawMaterialsPanelProps["canArchiveEntities"];
  isBusy: RawMaterialsPanelProps["isBusy"];
  setMaterialForm: RawMaterialsPanelProps["onMaterialFormChange"];
  setAliasInputs: RawMaterialsPanelProps["onAliasInputsChange"];
  createMaterial: RawMaterialsPanelProps["onCreateMaterial"];
  inspectMaterial: RawMaterialsPanelProps["onInspectMaterial"];
  addFormulaLine: RawMaterialsPanelProps["onAddFormulaLine"];
  createAlias: RawMaterialsPanelProps["onCreateAlias"];
  updateMaterial: RawMaterialsPanelProps["onUpdateMaterial"];
  archiveMaterial: RawMaterialsPanelProps["onArchiveMaterial"];
  restoreMaterial: RawMaterialsPanelProps["onRestoreMaterial"];
  updateMaterialParameterValue: RawMaterialsPanelProps["onUpdateMaterialParameterValue"];
  loadMaterialPriceHistory: RawMaterialsPanelProps["onLoadMaterialPriceHistory"];
  addMaterialPrice: RawMaterialsPanelProps["onAddMaterialPrice"];
  previewSapImport: RawMaterialsPanelProps["onPreviewSapImport"];
  applySapImport: RawMaterialsPanelProps["onApplySapImport"];
};

export function buildWorkspaceRawMaterialsPanelProps(
  args: BuildWorkspaceRawMaterialsPanelPropsArgs,
): RawMaterialsPanelProps {
  return {
    rawMaterials: args.rawMaterials,
    parameters: args.parameters,
    materialForm: args.materialForm,
    aliasInputs: args.aliasInputs,
    canEditTenantData: args.canEditTenantData,
    canArchiveEntities: args.canArchiveEntities,
    isBusy: args.isBusy,
    onMaterialFormChange: args.setMaterialForm,
    onAliasInputsChange: args.setAliasInputs,
    onCreateMaterial: args.createMaterial,
    onInspectMaterial: args.inspectMaterial,
    onAddFormulaLine: args.addFormulaLine,
    onCreateAlias: args.createAlias,
    onUpdateMaterial: args.updateMaterial,
    onArchiveMaterial: args.archiveMaterial,
    onRestoreMaterial: args.restoreMaterial,
    onUpdateMaterialParameterValue: args.updateMaterialParameterValue,
    onLoadMaterialPriceHistory: args.loadMaterialPriceHistory,
    onAddMaterialPrice: args.addMaterialPrice,
    onPreviewSapImport: args.previewSapImport,
    onApplySapImport: args.applySapImport,
  };
}
