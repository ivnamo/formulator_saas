import { ArrowDown, ArrowUp, ChevronDown, Copy, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import {
  PARAMETER_VIEW_PRESETS,
  formatParameterValue,
  materialParametersForView,
  type BuilderSectionKey,
  type ParameterViewPresetKey,
} from "./formula-builder-model";
import type { RawMaterial } from "./workspace-model";

type BuilderStepProps = {
  section: BuilderSectionKey;
  title: string;
  summary: ReactNode;
  isOpen: boolean;
  bodyClassName?: string;
  onToggle: (section: BuilderSectionKey) => void;
  children: ReactNode;
};

export function BuilderStep({
  section,
  title,
  summary,
  isOpen,
  bodyClassName = "",
  onToggle,
  children,
}: BuilderStepProps) {
  return (
    <section className="builderStep" data-open={isOpen}>
      <button className="builderStepHeader" type="button" onClick={() => onToggle(section)}>
        <span>
          <strong>{title}</strong>
          <small>{summary}</small>
        </span>
        <ChevronDown size={18} />
      </button>
      {isOpen ? <div className={`builderStepBody ${bodyClassName}`.trim()}>{children}</div> : null}
    </section>
  );
}

type ParameterPresetPickerProps = {
  value: ParameterViewPresetKey;
  onChange: (value: ParameterViewPresetKey) => void;
  compact?: boolean;
};

export function ParameterPresetPicker({
  value,
  onChange,
  compact = false,
}: ParameterPresetPickerProps) {
  return (
    <div
      className={compact ? "parameterPresetList compactPresetList" : "parameterPresetList"}
      role="list"
      aria-label="Vistas de parametros"
    >
      {PARAMETER_VIEW_PRESETS.map((preset) => (
        <button
          key={preset.key}
          className="segmentedChip"
          data-selected={value === preset.key}
          type="button"
          onClick={() => onChange(preset.key)}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}

type FormulaProgressSummaryProps = {
  totalPercentage: number;
  isBalanced: boolean;
  price: string;
  source: string;
};

export function FormulaProgressSummary({
  totalPercentage,
  isBalanced,
  price,
  source,
}: FormulaProgressSummaryProps) {
  return (
    <>
      <div className="formulaMeter" aria-label="Formula percentage total">
        <div style={{ width: `${Math.min(Math.max(totalPercentage, 0), 100)}%` }} />
      </div>
      <div className="formulaSummary">
        <div>
          <span>Total percentage</span>
          <strong>{totalPercentage.toFixed(1)}%</strong>
        </div>
        <div>
          <span>Status</span>
          <strong>{isBalanced ? "Balanced" : "Draft"}</strong>
        </div>
        <div>
          <span>Price</span>
          <strong>{price}</strong>
        </div>
        <div>
          <span>Calculation source</span>
          <strong>{source}</strong>
        </div>
      </div>
    </>
  );
}

type FormulaLineDetail = {
  localId: string;
  rawMaterialId: string;
  percentage: number;
  index: number;
  material?: RawMaterial;
};

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
