import { Check, Plus, Save } from "lucide-react";
import {
  aliasFromImportRow,
  type ExcelImportPreview,
  type ExcelImportPreviewRow,
} from "./excel-import-model";
import type { RawMaterial } from "./raw-material-model";

type ExcelImportPanelProps = {
  active: boolean;
  importPreview: ExcelImportPreview | null;
  importFileName: string;
  availableImportSheets: string[];
  selectedImportSheet: string;
  rawMaterials: RawMaterial[];
  canEditTenantData: boolean;
  canSelectImportSheet: boolean;
  canSaveImport: boolean;
  isBusy: boolean;
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
  availableImportSheets,
  selectedImportSheet,
  rawMaterials,
  canEditTenantData,
  canSelectImportSheet,
  canSaveImport,
  isBusy,
  onSelectFile,
  onPreviewSheet,
  onSaveImport,
  onResolveRow,
  onCreateMaterialFromRow,
  onAcceptSuggestion,
  onCreateAliasFromRow,
}: ExcelImportPanelProps) {
  return (
    <section id="import" className="panel importPanel" hidden={!active}>
      <div className="panelHeader">
        <h2>Excel import</h2>
        <span>{importPreview ? importPreview.sheet_name : "No file"}</span>
      </div>
      <div className="importActions">
        <label>
          <span>Upload .xlsx</span>
          <input
            type="file"
            accept=".xlsx"
            onChange={(event) => void onSelectFile(event.target.files?.[0] ?? null)}
            disabled={!canEditTenantData}
          />
        </label>
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
      </div>
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
              <span>{row.material_code || row.material_name || "-"}</span>
              <span>{row.percentage === null ? "-" : `${row.percentage.toFixed(2)}%`}</span>
              <span data-state={row.status}>{row.status}</span>
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
                <span>{row.matched_by ?? "-"}</span>
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
