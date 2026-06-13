import type { RawMaterial } from "./raw-material-model";
import type { FormulaLine, Parameter, Tenant } from "./workspace-base-model";

export type WorkspaceState = {
  tenant: Tenant | null;
  parameter: Parameter | null;
  parameters: Parameter[];
  rawMaterials: RawMaterial[];
  formulaId: string | null;
  formulaName: string;
  formulaJiraProjectId: string;
  formulaJiraIssueType: string;
  formulaJiraProductType: string;
  formulaLines: FormulaLine[];
};

export const emptyWorkspace: WorkspaceState = {
  tenant: null,
  parameter: null,
  parameters: [],
  rawMaterials: [],
  formulaId: null,
  formulaName: "Manual Formula",
  formulaJiraProjectId: "",
  formulaJiraIssueType: "Calidad",
  formulaJiraProductType: "Nuevo",
  formulaLines: [],
};
