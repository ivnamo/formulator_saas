import type { WorkspaceHomePanels } from "./workspace-home-view";

type IsoDesignPanelProps = WorkspaceHomePanels["isoDesign"];

type BuildWorkspaceIsoDesignPanelPropsArgs = {
  settings: IsoDesignPanelProps["settings"];
  projects: IsoDesignPanelProps["projects"];
  trialsByProjectId: IsoDesignPanelProps["trialsByProjectId"];
  validationsByProjectId: IsoDesignPanelProps["validationsByProjectId"];
  selectedProjectId: IsoDesignPanelProps["selectedProjectId"];
  projectForm: IsoDesignPanelProps["projectForm"];
  legacyImportFormat: IsoDesignPanelProps["legacyImportFormat"];
  legacyImportPreview: IsoDesignPanelProps["legacyImportPreview"];
  legacyImportFileName: IsoDesignPanelProps["legacyImportFileName"];
  selectedLegacyImportSheet: IsoDesignPanelProps["selectedLegacyImportSheet"];
  isBusy: IsoDesignPanelProps["isBusy"];
  canEditTenantData: IsoDesignPanelProps["canEditTenantData"];
  canManageIsoSettings: IsoDesignPanelProps["canManageIsoSettings"];
  setSelectedProjectId: IsoDesignPanelProps["onSelectedProjectChange"];
  setIsoProjectForm: IsoDesignPanelProps["onProjectFormChange"];
  loadIsoModule: IsoDesignPanelProps["onLoadIsoModule"];
  enableIsoModule: IsoDesignPanelProps["onEnableIsoModule"];
  createIsoDesignProject: IsoDesignPanelProps["onCreateIsoDesignProject"];
  selectIsoLegacyImportFormat: IsoDesignPanelProps["onLegacyImportFormatChange"];
  selectIsoLegacyImportFile: IsoDesignPanelProps["onSelectLegacyImportFile"];
  previewSelectedIsoLegacyImportSheet: IsoDesignPanelProps["onPreviewLegacyImportSheet"];
  applySelectedIsoLegacyImport: IsoDesignPanelProps["onApplyLegacyImport"];
  createIsoProductValidation: IsoDesignPanelProps["onCreateIsoProductValidation"];
  updateIsoProductValidationChecks: IsoDesignPanelProps["onUpdateIsoProductValidationChecks"];
  publishIsoProductValidation: IsoDesignPanelProps["onPublishIsoProductValidation"];
  exportIsoF1001: IsoDesignPanelProps["onExportIsoF1001"];
  exportIsoF1002: IsoDesignPanelProps["onExportIsoF1002"];
  exportIsoF1003: IsoDesignPanelProps["onExportIsoF1003"];
  exportIsoDossier: IsoDesignPanelProps["onExportIsoDossier"];
};

export function buildWorkspaceIsoDesignPanelProps(
  args: BuildWorkspaceIsoDesignPanelPropsArgs,
): IsoDesignPanelProps {
  return {
    settings: args.settings,
    projects: args.projects,
    trialsByProjectId: args.trialsByProjectId,
    validationsByProjectId: args.validationsByProjectId,
    selectedProjectId: args.selectedProjectId,
    projectForm: args.projectForm,
    legacyImportFormat: args.legacyImportFormat,
    legacyImportPreview: args.legacyImportPreview,
    legacyImportFileName: args.legacyImportFileName,
    selectedLegacyImportSheet: args.selectedLegacyImportSheet,
    isBusy: args.isBusy,
    canEditTenantData: args.canEditTenantData,
    canManageIsoSettings: args.canManageIsoSettings,
    onSelectedProjectChange: args.setSelectedProjectId,
    onProjectFormChange: args.setIsoProjectForm,
    onLoadIsoModule: args.loadIsoModule,
    onEnableIsoModule: args.enableIsoModule,
    onCreateIsoDesignProject: args.createIsoDesignProject,
    onLegacyImportFormatChange: args.selectIsoLegacyImportFormat,
    onSelectLegacyImportFile: args.selectIsoLegacyImportFile,
    onPreviewLegacyImportSheet: args.previewSelectedIsoLegacyImportSheet,
    onApplyLegacyImport: args.applySelectedIsoLegacyImport,
    onCreateIsoProductValidation: args.createIsoProductValidation,
    onUpdateIsoProductValidationChecks: args.updateIsoProductValidationChecks,
    onPublishIsoProductValidation: args.publishIsoProductValidation,
    onExportIsoF1001: args.exportIsoF1001,
    onExportIsoF1002: args.exportIsoF1002,
    onExportIsoF1003: args.exportIsoF1003,
    onExportIsoDossier: args.exportIsoDossier,
  };
}
