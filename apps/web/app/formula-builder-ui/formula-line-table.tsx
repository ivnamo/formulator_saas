import { ArrowDown, ArrowUp, Copy, Trash2 } from "lucide-react";
import type { FormulaLineDetail } from "../formula-builder-derived";
import { formatParameterValue, materialParametersForView } from "../formula-builder-model";

type FormulaLineTableProps = {
  lines: FormulaLineDetail[];
  visibleParameterCodes: string[];
  showOnlyPositiveParameters: boolean;
  isBusy: boolean;
  onMoveLine: (localId: string, direction: -1 | 1) => void;
  onUpdateLine: (localId: string, percentage: number) => void;
  onDuplicateLine: (localId: string) => void;
  onRemoveLine: (localId: string) => void;
};

export function FormulaLineTable({
  lines,
  visibleParameterCodes,
  showOnlyPositiveParameters,
  isBusy,
  onMoveLine,
  onUpdateLine,
  onDuplicateLine,
  onRemoveLine,
}: FormulaLineTableProps) {
  return (
    <div className="formulaLineTable">
      <div className="formulaLineHead">
        <span>Orden</span>
        <span>Codigo</span>
        <span>Materia prima</span>
        <span>%</span>
        <span>Parametros visibles</span>
        <span>Estado</span>
        <span>Acciones</span>
      </div>
      {lines.length === 0 ? (
        <div className="empty">Busca y anade materias primas para empezar.</div>
      ) : (
        lines.map((line) => {
          const material = line.material;
          const parameterPreview = material
            ? materialParametersForView(
                material,
                visibleParameterCodes,
                showOnlyPositiveParameters,
                4,
              )
            : [];
          const lineWarnings = [
            material?.price === null ? "sin precio" : null,
            material?.isObsolete ? "obsoleta" : null,
            material && !material.isActive ? "inactiva" : null,
          ].filter(Boolean);

          return (
            <div className="formulaLineRow" key={line.localId}>
              <div className="orderControls">
                <strong>{line.index + 1}</strong>
                <button
                  className="iconButton"
                  type="button"
                  onClick={() => onMoveLine(line.localId, -1)}
                  disabled={isBusy || line.index === 0}
                  title="Subir linea"
                  aria-label={`Subir ${material?.name ?? "linea"}`}
                >
                  <ArrowUp size={15} />
                </button>
                <button
                  className="iconButton"
                  type="button"
                  onClick={() => onMoveLine(line.localId, 1)}
                  disabled={isBusy || line.index === lines.length - 1}
                  title="Bajar linea"
                  aria-label={`Bajar ${material?.name ?? "linea"}`}
                >
                  <ArrowDown size={15} />
                </button>
              </div>
              <code>{material?.code ?? "-"}</code>
              <span className="formulaMaterialName">
                <strong>{material?.name ?? "Unknown material"}</strong>
                <small>
                  {material?.externalCode ? `ERP ${material.externalCode}` : "Sin ERP"}
                  {material?.family ? ` - ${material.family}` : ""}
                </small>
                {parameterPreview.length ? (
                  <span className="parameterBadgeList">
                    {parameterPreview.map((parameter) => (
                      <em key={parameter.code}>{formatParameterValue(parameter)}</em>
                    ))}
                  </span>
                ) : null}
              </span>
              <input
                aria-label={`${material?.name ?? "Material"} percentage`}
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={line.percentage}
                onChange={(event) => onUpdateLine(line.localId, Number(event.target.value))}
                disabled={isBusy}
              />
              <span className="lineParameterPreview">
                {parameterPreview.length
                  ? parameterPreview.map((parameter) => (
                      <em key={parameter.code}>{formatParameterValue(parameter)}</em>
                    ))
                  : "-"}
              </span>
              <span className="lineWarnings">
                {lineWarnings.length ? lineWarnings.join(", ") : "OK"}
              </span>
              <div className="lineActions">
                <button
                  className="iconButton"
                  type="button"
                  onClick={() => onDuplicateLine(line.localId)}
                  disabled={isBusy}
                  title="Duplicar linea"
                  aria-label={`Duplicar ${material?.name ?? "linea"}`}
                >
                  <Copy size={15} />
                </button>
                <button
                  className="iconButton danger"
                  type="button"
                  onClick={() => onRemoveLine(line.localId)}
                  disabled={isBusy}
                  title="Eliminar linea"
                  aria-label={`Eliminar ${material?.name ?? "linea"}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
