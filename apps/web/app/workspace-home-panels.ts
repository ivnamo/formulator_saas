import { buildFormulaBuilderPanelProps } from "./formula-builder-panel-props";
import { buildWorkspaceAiAssistantPanelProps } from "./workspace-ai-assistant-panel-props";
import { buildWorkspaceCompatibilityPanelProps } from "./workspace-compatibility-panel-props";
import { buildWorkspaceExcelImportPanelProps } from "./workspace-excel-import-panel-props";
import { buildWorkspaceIsoDesignPanelProps } from "./workspace-iso-design-panel-props";
import type { WorkspaceHomePanels } from "./workspace-home-view";
import { buildWorkspaceLibraryPanelProps } from "./workspace-library-panel-props";
import { buildWorkspaceRawMaterialsPanelProps } from "./workspace-raw-materials-panel-props";
import { buildWorkspaceSettingsPanelProps } from "./workspace-settings-panel-props";

type BuildWorkspaceHomePanelsArgs = {
  settings: Parameters<typeof buildWorkspaceSettingsPanelProps>[0];
  isoDesign: Parameters<typeof buildWorkspaceIsoDesignPanelProps>[0];
  rawMaterials: Parameters<typeof buildWorkspaceRawMaterialsPanelProps>[0];
  compatibility: Parameters<typeof buildWorkspaceCompatibilityPanelProps>[0];
  library: Parameters<typeof buildWorkspaceLibraryPanelProps>[0];
  excelImport: Parameters<typeof buildWorkspaceExcelImportPanelProps>[0];
  aiAssistant: Parameters<typeof buildWorkspaceAiAssistantPanelProps>[0];
  formulaBuilder: Parameters<typeof buildFormulaBuilderPanelProps>[0];
  results: WorkspaceHomePanels["results"];
};

export function buildWorkspaceHomePanels(
  args: BuildWorkspaceHomePanelsArgs,
): WorkspaceHomePanels {
  return {
    settings: buildWorkspaceSettingsPanelProps(args.settings),
    isoDesign: buildWorkspaceIsoDesignPanelProps(args.isoDesign),
    rawMaterials: buildWorkspaceRawMaterialsPanelProps(args.rawMaterials),
    compatibility: buildWorkspaceCompatibilityPanelProps(args.compatibility),
    library: buildWorkspaceLibraryPanelProps(args.library),
    excelImport: buildWorkspaceExcelImportPanelProps(args.excelImport),
    aiAssistant: buildWorkspaceAiAssistantPanelProps(args.aiAssistant),
    formulaBuilder: buildFormulaBuilderPanelProps(args.formulaBuilder),
    results: args.results,
  };
}
