import type { WorkspaceHomePanels } from "./workspace-home-view";

type ExcelImportPanelProps = WorkspaceHomePanels["excelImport"];

type BuildWorkspaceExcelImportPanelPropsArgs = {
  importPreview: ExcelImportPanelProps["importPreview"];
  importFileName: ExcelImportPanelProps["importFileName"];
  availableImportSheets: ExcelImportPanelProps["availableImportSheets"];
  selectedImportSheet: ExcelImportPanelProps["selectedImportSheet"];
  rawMaterials: ExcelImportPanelProps["rawMaterials"];
  canEditTenantData: ExcelImportPanelProps["canEditTenantData"];
  canSelectImportSheet: ExcelImportPanelProps["canSelectImportSheet"];
  canSaveImport: ExcelImportPanelProps["canSaveImport"];
  isBusy: ExcelImportPanelProps["isBusy"];
  selectExcelImportFile: ExcelImportPanelProps["onSelectFile"];
  previewSelectedImportSheet: ExcelImportPanelProps["onPreviewSheet"];
  saveExcelImport: ExcelImportPanelProps["onSaveImport"];
  resolveImportRow: ExcelImportPanelProps["onResolveRow"];
  createMaterialFromImportRow: ExcelImportPanelProps["onCreateMaterialFromRow"];
  acceptImportSuggestion: ExcelImportPanelProps["onAcceptSuggestion"];
  createAliasFromImportRow: ExcelImportPanelProps["onCreateAliasFromRow"];
};

export function buildWorkspaceExcelImportPanelProps(
  args: BuildWorkspaceExcelImportPanelPropsArgs,
): ExcelImportPanelProps {
  return {
    importPreview: args.importPreview,
    importFileName: args.importFileName,
    availableImportSheets: args.availableImportSheets,
    selectedImportSheet: args.selectedImportSheet,
    rawMaterials: args.rawMaterials,
    canEditTenantData: args.canEditTenantData,
    canSelectImportSheet: args.canSelectImportSheet,
    canSaveImport: args.canSaveImport,
    isBusy: args.isBusy,
    onSelectFile: args.selectExcelImportFile,
    onPreviewSheet: args.previewSelectedImportSheet,
    onSaveImport: args.saveExcelImport,
    onResolveRow: args.resolveImportRow,
    onCreateMaterialFromRow: args.createMaterialFromImportRow,
    onAcceptSuggestion: args.acceptImportSuggestion,
    onCreateAliasFromRow: args.createAliasFromImportRow,
  };
}
