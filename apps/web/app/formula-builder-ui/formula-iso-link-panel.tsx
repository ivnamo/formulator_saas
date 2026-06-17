import { ClipboardCheck } from "lucide-react";
import type { IsoDesignProject } from "../iso-design-model";

type FormulaIsoLinkPanelProps = {
  formulaJiraProjectId: string;
  formulaJiraIssueType: string;
  isoDesignProjects: IsoDesignProject[];
  selectedIsoDesignProjectId: string;
  isBusy: boolean;
  onSelectedIsoDesignProjectChange: (projectId: string) => void;
  onPrepareIsoProject: () => void | Promise<void>;
};

export function FormulaIsoLinkPanel({
  formulaJiraProjectId,
  formulaJiraIssueType,
  isoDesignProjects,
  selectedIsoDesignProjectId,
  isBusy,
  onSelectedIsoDesignProjectChange,
  onPrepareIsoProject,
}: FormulaIsoLinkPanelProps) {
  const isQualityFormula = isQualityIssueType(formulaJiraIssueType);
  if (!isQualityFormula) {
    return null;
  }

  const normalizedFormulaProjectId = formulaJiraProjectId.trim();
  const selectedIsoProject =
    isoDesignProjects.find((project) => project.id === selectedIsoDesignProjectId) ?? null;

  return (
    <div className="formulaIsoLinkPanel" data-state={selectedIsoProject ? "linked" : "missing"}>
      <div className="formulaIsoLinkControls">
        <label className="formulaIsoSelector">
          <span>Expediente ISO</span>
          <select
            value={selectedIsoDesignProjectId}
            onChange={(event) => onSelectedIsoDesignProjectChange(event.target.value)}
            disabled={isBusy || normalizedFormulaProjectId.length === 0}
          >
            <option value="">Sin expediente ISO</option>
            {isoDesignProjects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.project_code ? `${project.project_code} - ` : ""}
                {project.iso_request_number} - {project.product_name}
              </option>
            ))}
          </select>
        </label>
        <button
          className="secondaryButton"
          type="button"
          onClick={() => void onPrepareIsoProject()}
          disabled={isBusy}
        >
          <ClipboardCheck size={16} />
          Crear F10-01
        </button>
      </div>
      <div className="formulaIsoLinkStatus">
        {selectedIsoProject ? (
          <>
            <strong>ISO enlazada por ProyectoID {selectedIsoProject.project_code}</strong>
            <span>
              {selectedIsoProject.iso_request_number} - {selectedIsoProject.product_name}
            </span>
          </>
        ) : (
          <>
            <strong>
              {normalizedFormulaProjectId
                ? `Sin expediente ISO para ProyectoID ${normalizedFormulaProjectId}`
                : "Sin ProyectoID ISO"}
            </strong>
            <span>
              {normalizedFormulaProjectId
                ? "La formula de Calidad necesita un F10-01 para registrar despues F10-02."
                : "Crea el F10-01 desde aqui o selecciona un ProyectoID existente."}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

export function isQualityIssueType(issueType: string) {
  return issueType.trim().toLowerCase() === "calidad";
}
