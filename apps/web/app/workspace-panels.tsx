import type { ComponentProps } from "react";
import { AiAssistantPanel } from "./ai-assistant-panel";
import { type WorkspaceView } from "./app-shell";
import { CalculationResultsPanel } from "./calculation-results-panel";
import { CompatibilityPanel } from "./compatibility-panel";
import { ComparatorPanel } from "./comparator-panel";
import { ExcelImportPanel } from "./excel-import-panel";
import { FormulaBuilderWorkspace } from "./formula-builder-workspace";
import { IsoDesignPanel } from "./iso-design-panel";
import { RawMaterialsPanel } from "./raw-materials-panel";
import { SavedFormulaComparisonPanel } from "./saved-formula-comparison-panel";
import { SettingsPanel } from "./settings-panel";

export type WorkspacePanelsProps = {
  activeView: WorkspaceView;
  settings: Omit<ComponentProps<typeof SettingsPanel>, "active">;
  isoDesign: Omit<ComponentProps<typeof IsoDesignPanel>, "active">;
  rawMaterials: Omit<ComponentProps<typeof RawMaterialsPanel>, "active">;
  compatibility: Omit<ComponentProps<typeof CompatibilityPanel>, "active">;
  comparator: Omit<ComponentProps<typeof ComparatorPanel>, "active">;
  library: Omit<ComponentProps<typeof SavedFormulaComparisonPanel>, "active">;
  excelImport: Omit<ComponentProps<typeof ExcelImportPanel>, "active">;
  aiAssistant: Omit<ComponentProps<typeof AiAssistantPanel>, "active">;
  formulaBuilder: Omit<ComponentProps<typeof FormulaBuilderWorkspace>, "active">;
  results: Omit<ComponentProps<typeof CalculationResultsPanel>, "active">;
};

export function WorkspacePanels({
  activeView,
  settings,
  isoDesign,
  rawMaterials,
  compatibility,
  comparator,
  library,
  excelImport,
  aiAssistant,
  formulaBuilder,
  results,
}: WorkspacePanelsProps) {
  return (
    <>
      <SettingsPanel {...settings} active={activeView === "settings"} />
      <IsoDesignPanel {...isoDesign} active={activeView === "iso"} />
      <RawMaterialsPanel {...rawMaterials} active={activeView === "materials"} />
      <CompatibilityPanel {...compatibility} active={activeView === "compatibility"} />
      <ComparatorPanel {...comparator} active={activeView === "comparator"} />
      <SavedFormulaComparisonPanel {...library} active={activeView === "library"} />
      <ExcelImportPanel {...excelImport} active={activeView === "import"} />
      <AiAssistantPanel {...aiAssistant} active={activeView === "ai"} />
      <FormulaBuilderWorkspace {...formulaBuilder} active={activeView === "formula"} />
      <CalculationResultsPanel {...results} active={activeView === "results"} />
    </>
  );
}
