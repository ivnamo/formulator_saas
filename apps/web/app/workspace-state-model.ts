import type { RawMaterial } from "./raw-material-model";
import type { FormulaBuilderMode } from "./formula-builder-model";
import type { FormulaLine, Parameter, Tenant } from "./workspace-base-model";

export type WorkspaceState = {
  tenant: Tenant | null;
  parameter: Parameter | null;
  parameters: Parameter[];
  rawMaterials: RawMaterial[];
  formulaId: string | null;
  formulaBuilderMode: FormulaBuilderMode;
  formulaName: string;
  formulaJiraProjectId: string;
  formulaJiraIssueType: string;
  formulaJiraProductType: string;
  formulaJiraDescription: string;
  formulaLines: FormulaLine[];
};

export const emptyWorkspace: WorkspaceState = {
  tenant: null,
  parameter: null,
  parameters: [],
  rawMaterials: [],
  formulaId: null,
  formulaBuilderMode: "new",
  formulaName: "",
  formulaJiraProjectId: "",
  formulaJiraIssueType: "Calidad",
  formulaJiraProductType: "Nuevo",
  formulaJiraDescription: "",
  formulaLines: [],
};
