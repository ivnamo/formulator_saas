import { AlertTriangle, Check, ClipboardPaste, FolderOpen, Plus, Save, Search } from "lucide-react";
import { useEffect, useMemo, useState, type FocusEvent, type KeyboardEvent } from "react";
import {
  ATLANTICA_ID_LAB_PARSER,
  COMPACT_LAB_TRIAL_PARSER,
  PASTED_ROWS_PARSER,
  aliasFromImportRow,
  type ExcelImportPreview,
  type ExcelImportPreviewRow,
} from "./excel-import-model";
import { FileDropzone } from "./file-dropzone";
import type { RawMaterial } from "./raw-material-model";

const MATERIAL_SEARCH_RESULT_LIMIT = 80;

type ExcelImportPanelProps = {
  active: boolean;
  importPreview: ExcelImportPreview | null;
  importFileName: string;
  importFormulaName: string;
  importFormulaDescription: string;
  availableImportSheets: string[];
  selectedImportSheet: string;
  rawMaterials: RawMaterial[];
  canEditTenantData: boolean;
  canSelectImportSheet: boolean;
  canSaveImport: boolean;
  isBusy: boolean;
  onFormulaNameChange: (value: string) => void;
  onFormulaDescriptionChange: (value: string) => void;
  onSelectFile: (file: File | null) => void | Promise<void>;
  onPreviewSheet: (sheetName: string) => void | Promise<void>;
  onParsePastedRows: (text: string) => void;
  onSaveImport: () => void | Promise<void>;
  onOpenInFormulaBuilder: () => void;
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
  importFormulaDescription,
  availableImportSheets,
  selectedImportSheet,
  rawMaterials,
  canEditTenantData,
  canSelectImportSheet,
  canSaveImport,
  isBusy,
  onFormulaNameChange,
  onFormulaDescriptionChange,
  onSelectFile,
  onPreviewSheet,
  onParsePastedRows,
  onSaveImport,
  onOpenInFormulaBuilder,
  onResolveRow,
  onCreateMaterialFromRow,
  onAcceptSuggestion,
  onCreateAliasFromRow,
}: ExcelImportPanelProps) {
  const isAtlanticaTemplate = importPreview?.parser === ATLANTICA_ID_LAB_PARSER;
  const parserLabel = importPreview ? importParserLabel(importPreview.parser) : "Generic";
  const heading = importPreview ? importPreviewHeading(importPreview) : "No file";
  const [pastedRowsText, setPastedRowsText] = useState("");

  useEffect(() => {
    if (!importPreview && !importFileName) {
      setPastedRowsText("");
    }
  }, [importFileName, importPreview]);

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
          <span>
            Formula name <span className="requiredMark">*</span>
          </span>
          <input
            aria-label="Imported formula name"
            value={importFormulaName}
            onChange={(event) => onFormulaNameChange(event.target.value)}
            disabled={!importPreview || isBusy}
          />
        </label>
        <label>
          <span>
            Formula description <span className="requiredMark">*</span>
          </span>
          <textarea
            aria-label="Imported formula description"
            rows={2}
            value={importFormulaDescription}
            onChange={(event) => onFormulaDescriptionChange(event.target.value)}
            disabled={!importPreview || isBusy}
          />
        </label>
        <button
          className="secondaryButton"
          type="button"
          onClick={onOpenInFormulaBuilder}
          disabled={!importPreview || importPreview.pending_rows > 0 || isBusy}
        >
          <FolderOpen size={17} />
          Open in Builder
        </button>
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
      <div className="pasteImportBox">
        <label>
          <span>Paste rows</span>
          <textarea
            aria-label="Paste material rows"
            disabled={!canEditTenantData || isBusy}
            placeholder={"AGUA\t41,1\nEDTA TETRASODICO\t0,2"}
            rows={4}
            value={pastedRowsText}
            onChange={(event) => setPastedRowsText(event.target.value)}
          />
        </label>
        <button
          className="secondaryButton"
          disabled={!canEditTenantData || isBusy || !pastedRowsText.trim()}
          type="button"
          onClick={() => onParsePastedRows(pastedRowsText)}
        >
          <ClipboardPaste size={17} />
          Parse pasted rows
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
              {row.status === "needs_review" || row.matched_by === "manual" ? (
                <ImportResolveControls
                  isBusy={isBusy}
                  rawMaterials={rawMaterials}
                  row={row}
                  onAcceptSuggestion={onAcceptSuggestion}
                  onCreateAliasFromRow={onCreateAliasFromRow}
                  onCreateMaterialFromRow={onCreateMaterialFromRow}
                  onResolveRow={onResolveRow}
                />
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

function ImportResolveControls({
  isBusy,
  rawMaterials,
  row,
  onAcceptSuggestion,
  onCreateAliasFromRow,
  onCreateMaterialFromRow,
  onResolveRow,
}: {
  isBusy: boolean;
  rawMaterials: RawMaterial[];
  row: ExcelImportPreviewRow;
  onAcceptSuggestion: (row: ExcelImportPreviewRow) => void;
  onCreateAliasFromRow: (row: ExcelImportPreviewRow) => void | Promise<void>;
  onCreateMaterialFromRow: (row: ExcelImportPreviewRow) => void | Promise<void>;
  onResolveRow: (rowNumber: number, rawMaterialId: string) => void;
}) {
  const isManual = row.matched_by === "manual";

  return (
    <div className="resolveControls" data-mode={isManual ? "manual" : "review"}>
      <MaterialSearchSelect
        disabled={isBusy}
        label={`Resolve row ${row.row_number}`}
        rawMaterials={rawMaterials}
        selectedRawMaterialId={row.raw_material_id}
        onSelect={(rawMaterialId) => onResolveRow(row.row_number, rawMaterialId)}
      />
      {isManual ? (
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
      ) : (
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
      )}
      {!isManual && row.suggested_raw_material_id ? (
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
  );
}

function MaterialSearchSelect({
  disabled,
  label,
  rawMaterials,
  selectedRawMaterialId,
  onSelect,
}: {
  disabled: boolean;
  label: string;
  rawMaterials: RawMaterial[];
  selectedRawMaterialId: string | null;
  onSelect: (rawMaterialId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const selectedMaterial = useMemo(
    () => rawMaterials.find((material) => material.id === selectedRawMaterialId) ?? null,
    [rawMaterials, selectedRawMaterialId],
  );
  const filteredMaterials = useMemo(() => {
    const normalizedQuery = normalizeMaterialSearch(query);
    const matches = normalizedQuery
      ? rawMaterials.filter((material) => materialMatchesSearch(material, normalizedQuery))
      : rawMaterials;
    const ordered =
      selectedMaterial && !matches.some((material) => material.id === selectedMaterial.id)
        ? [selectedMaterial, ...matches]
        : matches;
    return ordered.slice(0, MATERIAL_SEARCH_RESULT_LIMIT);
  }, [query, rawMaterials, selectedMaterial]);
  const inputValue = isOpen ? query : selectedMaterial ? materialOptionLabel(selectedMaterial) : "";

  function closeSearch() {
    setIsOpen(false);
    setQuery("");
  }

  function selectMaterial(material: RawMaterial) {
    onSelect(material.id);
    closeSearch();
  }

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    const nextTarget = event.relatedTarget;
    if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
      closeSearch();
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeSearch();
      return;
    }
    if (event.key === "Enter" && filteredMaterials.length === 1) {
      event.preventDefault();
      selectMaterial(filteredMaterials[0]);
    }
  }

  return (
    <div className="materialSearchSelect" onBlur={handleBlur}>
      <div className="materialSearchInput">
        <Search size={14} />
        <input
          aria-label={label}
          autoComplete="off"
          disabled={disabled}
          inputMode="search"
          placeholder={selectedMaterial ? "Cambiar material" : "Buscar material"}
          type="search"
          value={inputValue}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            setQuery("");
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
        />
      </div>
      {isOpen && !disabled ? (
        <div className="materialSearchMenu" role="listbox">
          {filteredMaterials.length ? (
            filteredMaterials.map((material) => (
              <button
                aria-selected={material.id === selectedRawMaterialId}
                key={material.id}
                onClick={() => selectMaterial(material)}
                onMouseDown={(event) => event.preventDefault()}
                role="option"
                type="button"
              >
                <strong>{material.name}</strong>
                <small>{materialOptionMeta(material)}</small>
              </button>
            ))
          ) : (
            <span>No materials found</span>
          )}
        </div>
      ) : null}
    </div>
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

function materialOptionLabel(material: RawMaterial): string {
  return material.code ? `${material.code} - ${material.name}` : material.name;
}

function materialOptionMeta(material: RawMaterial): string {
  const parts = [material.code, material.externalCode, material.family]
    .filter((value): value is string => Boolean(value));
  return parts.length ? parts.join(" - ") : "Sin codigo";
}

function materialMatchesSearch(material: RawMaterial, normalizedQuery: string): boolean {
  return normalizeMaterialSearch(
    [
      material.code,
      material.externalCode,
      material.name,
      material.family,
      material.subfamily,
      ...material.aliases,
    ]
      .filter((value): value is string => Boolean(value))
      .join(" "),
  ).includes(normalizedQuery);
}

function normalizeMaterialSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
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
  if (importPreview.parser === PASTED_ROWS_PARSER) {
    return "Pegado";
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
  if (parser === PASTED_ROWS_PARSER) {
    return "Pegado";
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
