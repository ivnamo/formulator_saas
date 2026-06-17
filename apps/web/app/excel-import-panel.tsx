import { AlertTriangle, Check, Plus, Save } from "lucide-react";
import {
  ATLANTICA_ID_LAB_PARSER,
  COMPACT_LAB_TRIAL_PARSER,
  aliasFromImportRow,
  type ExcelImportPreview,
  type ExcelImportPreviewRow,
} from "./excel-import-model";
import { FileDropzone } from "./file-dropzone";
import type { RawMaterial } from "./raw-material-model";

type ExcelImportPanelProps = {
  active: boolean;
  importPreview: ExcelImportPreview | null;
  importFileName: string;
  importFormulaName: string;
  availableImportSheets: string[];
  selectedImportSheet: string;
  rawMaterials: RawMaterial[];
  canEditTenantData: boolean;
  canSelectImportSheet: boolean;
  canSaveImport: boolean;
  isBusy: boolean;
  onFormulaNameChange: (value: string) => void;
  onSelectFile: (file: File | null) => void | Promise<void>;
  onPreviewSheet: (sheetName: string) => void | Promise<void>;
  onSaveImport: () => void | Promise<void>;
  onResolveRow: (rowNumber: number, rawMaterialId: string) => void;
  onCreateMaterialFromRow: (row: ExcelImportPreviewRow) => void | Promise<void>;
  onAcceptSuggestion: (row: ExcelImportPreviewRow) => void;
  onCreateAliasFromRow: (row: ExcelImportPreviewRow) => void | Promise<void>;
};

export function ExcelImportPanel({
  active,
  importPreview,
  importFileName,
  importFormulaName,
  availableImportSheets,
  selectedImportSheet,
  rawMaterials,
  canEditTenantData,
  canSelectImportSheet,
  canSaveImport,
  isBusy,
  onFormulaNameChange,
  onSelectFile,
  onPreviewSheet,
  onSaveImport,
  onResolveRow,
  onCreateMaterialFromRow,
  onAcceptSuggestion,
  onCreateAliasFromRow,
}: ExcelImportPanelProps) {
  const isAtlanticaTemplate = importPreview?.parser === ATLANTICA_ID_LAB_PARSER;
  const parserLabel = importPreview ? importParserLabel(importPreview.parser) : "Generic";
  const heading = importPreview ? importPreviewHeading(importPreview) : "No file";

  return (
    <section id="import" className="panel importPanel" hidden={!active}>
      <div className="panelHeader">
        <h2>Excel import</h2>
        <span>{heading}</span>
      </div>
      <div className="importActions">
        <FileDropzone
          accept=".xlsx"
          disabled={!canEditTenantData}
          fileName={importFileName}
          helper="Solo .xlsx"
          label="Excel"
          onFile={onSelectFile}
        />
        <label className="sheetSelector">
          <span>Sheet</span>
          <select
            aria-label="Excel sheet"
            value={selectedImportSheet}
            onChange={(event) => void onPreviewSheet(event.target.value)}
            disabled={!canSelectImportSheet}
          >
            {availableImportSheets.length === 0 ? (
              <option value="">No sheets</option>
            ) : (
              <>
                {availableImportSheets.length > 1 ? (
                  <option value="" disabled>
                    Select sheet
                  </option>
                ) : null}
                {availableImportSheets.map((sheet) => (
                  <option key={sheet} value={sheet}>
                    {sheet}
                  </option>
                ))}
              </>
            )}
          </select>
        </label>
        <label>
          <span>Formula name</span>
          <input
            aria-label="Imported formula name"
            value={importFormulaName}
            onChange={(event) => onFormulaNameChange(event.target.value)}
            disabled={!importPreview || isBusy}
          />
        </label>
        <button
          className="secondaryButton"
          type="button"
          onClick={() => void onSaveImport()}
          disabled={!canSaveImport}
        >
          <Save size={17} />
          Save formula
        </button>
      </div>
      <div className="importSummary">
        <div>
          <span>File</span>
          <strong>{importFileName || "-"}</strong>
        </div>
        <div>
          <span>Total</span>
          <strong>{importPreview ? `${importPreview.total_percentage.toFixed(1)}%` : "-"}</strong>
        </div>
        <div>
          <span>Resolved</span>
          <strong>{importPreview ? importPreview.resolved_rows : "-"}</strong>
        </div>
        <div>
          <span>Pending</span>
          <strong>{importPreview ? importPreview.pending_rows : "-"}</strong>
        </div>
        {importPreview ? (
          <div>
            <span>Parser</span>
            <strong>{parserLabel}</strong>
          </div>
        ) : null}
        {importPreview ? (
          <div>
            <span>Parameters</span>
            <strong>{importPreview.parameter_headers.length}</strong>
          </div>
        ) : null}
      </div>
      {isAtlanticaTemplate && importPreview ? (
        <ImportTemplateNotice importPreview={importPreview} />
      ) : null}
      <div className="importTable">
        <div className="importHead">
          <span>Row</span>
          <span>Material</span>
          <span>Share</span>
          <span>Status</span>
          <span>Resolve</span>
        </div>
        {importPreview ? (
          importPreview.rows.map((row) => (
            <div className="importRow" key={row.row_number}>
              <code>{row.row_number}</code>
              <ImportMaterialCell rawMaterials={rawMaterials} row={row} />
              <span>{row.percentage === null ? "-" : `${row.percentage.toFixed(2)}%`}</span>
              <ImportStatusCell row={row} />
              {row.status === "needs_review" ? (
                <div className="resolveControls">
                  <select
                    aria-label={`Resolve row ${row.row_number}`}
                    defaultValue=""
                    onChange={(event) => onResolveRow(row.row_number, event.target.value)}
                    disabled={isBusy}
                  >
                    <option value="" disabled>
                      Select material
                    </option>
                    {rawMaterials.map((material) => (
                      <option key={material.id} value={material.id}>
                        {material.code ? `${material.code} - ${material.name}` : material.name}
                      </option>
                    ))}
                  </select>
                  <button
                    aria-label={`Create material for row ${row.row_number}`}
                    className="iconButton"
                    disabled={isBusy}
                    onClick={() => void onCreateMaterialFromRow(row)}
                    title="Create material"
                    type="button"
                  >
                    <Plus size={16} />
                  </button>
                  {row.suggested_raw_material_id ? (
                    <button
                      aria-label={`Use suggestion for row ${row.row_number}`}
                      className="suggestionButton"
                      disabled={isBusy}
                      onClick={() => onAcceptSuggestion(row)}
                      title="Use suggestion"
                      type="button"
                    >
                      <Check size={15} />
                      <span>
                        {row.suggested_material_name}
                        {row.suggested_match_score === null
                          ? ""
                          : ` (${Math.round(row.suggested_match_score * 100)}%)`}
                      </span>
                    </button>
                  ) : null}
                </div>
              ) : row.matched_by === "manual" && row.raw_material_id ? (
                <div className="aliasResolveControls">
                  <span>manual</span>
                  <button
                    aria-label={`Save alias for row ${row.row_number}`}
                    className="iconButton"
                    disabled={isBusy || !aliasFromImportRow(row)}
                    onClick={() => void onCreateAliasFromRow(row)}
                    title="Save alias"
                    type="button"
                  >
                    <Save size={16} />
                  </button>
                </div>
              ) : (
                <span>{importMatchLabel(row)}</span>
              )}
            </div>
          ))
        ) : (
          <div className="empty">No import preview.</div>
        )}
      </div>
    </section>
  );
}

function ImportTemplateNotice({
  importPreview,
}: {
  importPreview: ExcelImportPreview;
}) {
  return (
    <div className="importTemplateNotice">
      <div>
        <strong>{importPreview.formula_name || "Formula I+D detectada"}</strong>
        <span>
          {importPreview.parameter_headers.length} parametros desde Calculadora
        </span>
      </div>
      {importPreview.warnings.length ? (
        <div className="importTemplateWarnings">
          <AlertTriangle size={16} />
          <span>{importPreview.warnings.map(importWarningText).join(" ")}</span>
        </div>
      ) : null}
    </div>
  );
}

function ImportMaterialCell({
  rawMaterials,
  row,
}: {
  rawMaterials: RawMaterial[];
  row: ExcelImportPreviewRow;
}) {
  const resolvedMaterial =
    row.raw_material_id === null
      ? null
      : rawMaterials.find((material) => material.id === row.raw_material_id) ?? null;
  const resolvedName = row.resolved_material_name ?? resolvedMaterial?.name ?? null;
  const resolvedCode = row.resolved_material_code ?? resolvedMaterial?.code ?? null;

  return (
    <span>
      {resolvedName ?? row.material_name ?? row.material_code ?? "-"}
      {resolvedCode ? <small>{resolvedCode}</small> : null}
      {row.imported_price === null ? null : (
        <small>{row.imported_price.toFixed(4)} EUR/kg</small>
      )}
      {row.lab_observation ? <small>{row.lab_observation}</small> : null}
    </span>
  );
}

function importMatchLabel(row: ExcelImportPreviewRow): string {
  if (row.matched_by === "alias") {
    return "mapped";
  }
  return row.matched_by ?? "-";
}

function ImportStatusCell({ row }: { row: ExcelImportPreviewRow }) {
  const count = importParameterCount(row);

  return (
    <span data-state={row.status}>
      {row.status}
      {count ? <small>{count} params</small> : null}
    </span>
  );
}

function importPreviewHeading(importPreview: ExcelImportPreview): string {
  if (importPreview.parser === ATLANTICA_ID_LAB_PARSER) {
    return "Plantilla I+D";
  }
  if (importPreview.parser === COMPACT_LAB_TRIAL_PARSER) {
    return "Ensayo compacto";
  }
  return importPreview.sheet_name;
}

function importParserLabel(parser: string): string {
  if (parser === ATLANTICA_ID_LAB_PARSER) {
    return "Atlántica I+D";
  }
  if (parser === COMPACT_LAB_TRIAL_PARSER) {
    return "Ensayo compacto";
  }
  return "Generic";
}

function importParameterCount(row: ExcelImportPreviewRow): number {
  return Object.keys(row.imported_parameters).length;
}

function importWarningText(warning: ExcelImportPreview["warnings"][number]): string {
  if (typeof warning === "string") {
    return warning;
  }
  return warning.message ?? warning.code ?? "Import warning";
}
