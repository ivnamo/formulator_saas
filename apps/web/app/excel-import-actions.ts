import { useCallback, type Dispatch, type SetStateAction } from "react";
import type { WorkspaceView } from "./app-shell";
import {
  createImportRawMaterial,
  createImportRawMaterialAlias,
  fetchExcelImportPreview,
  fetchExcelImportSheets,
  saveExcelImportedFormula,
} from "./excel-import-api";
import {
  DEFAULT_BUILDER_SECTIONS,
  type BuilderSectionKey,
} from "./formula-builder-model";
import { toEditableFormulaState } from "./formula-read-model";
import {
  aliasFromImportRow,
  buildPastedRowsImportPreview,
  type ExcelImportPreview,
  type ExcelImportPreviewRow,
  type ExcelImportSheets,
} from "./excel-import-model";
import type { CalculationResult } from "./formula-model";
import {
  mergeRawMaterials,
  toWorkspaceRawMaterial,
  withRawMaterialAlias,
} from "./raw-material-model";
import type { DraftReviewState, SavedFormulaComparison } from "./workspace-comparison";
import type { WorkspaceState } from "./workspace-state-model";
import { makeLocalId } from "./workspace-utils";

type ExcelImportActionsOptions = {
  workspace: WorkspaceState;
  importPreview: ExcelImportPreview | null;
  importFile: File | null;
  importFormulaName: string;
  importFormulaDescription: string;
  headers: HeadersInit;
  uploadHeaders: HeadersInit;
  setWorkspace: Dispatch<SetStateAction<WorkspaceState>>;
  setDetailedMaterialIds: Dispatch<SetStateAction<string[]>>;
  setResult: Dispatch<SetStateAction<CalculationResult | null>>;
  setDraftReview: Dispatch<SetStateAction<DraftReviewState | null>>;
  setSavedFormulaComparison: Dispatch<SetStateAction<SavedFormulaComparison | null>>;
  setPendingFile: (file: File, sheets: ExcelImportSheets, selectedSheet: string) => void;
  setImportPreview: (preview: ExcelImportPreview) => void;
  setPastedImportPreview: (preview: ExcelImportPreview) => void;
  setSelectedImportSheet: (sheetName: string) => void;
  resolveImportRowState: (rowNumber: number, rawMaterialId: string) => boolean;
  resetImportState: () => void;
  setBuilderSections: Dispatch<SetStateAction<Record<BuilderSectionKey, boolean>>>;
  setActiveView: (view: WorkspaceView) => void;
  refreshCatalog: () => void;
  refreshFormulaLibrary: (options?: { silent?: boolean }) => Promise<void>;
  loadCalculationHistory: (formulaId: string) => Promise<void>;
  runAction: (label: string, action: () => Promise<void>) => Promise<void>;
  setError: (message: string) => void;
  setMessage: (message: string) => void;
};

export function useExcelImportActions({
  workspace,
  importPreview,
  importFile,
  importFormulaName,
  importFormulaDescription,
  headers,
  uploadHeaders,
  setWorkspace,
  setDetailedMaterialIds,
  setResult,
  setDraftReview,
  setSavedFormulaComparison,
  setPendingFile,
  setImportPreview,
  setPastedImportPreview,
  setSelectedImportSheet,
  resolveImportRowState,
  resetImportState,
  setBuilderSections,
  setActiveView,
  refreshCatalog,
  refreshFormulaLibrary,
  loadCalculationHistory,
  runAction,
  setError,
  setMessage,
}: ExcelImportActionsOptions) {
  const listExcelImportSheets = useCallback(
    async (file: File): Promise<ExcelImportSheets> =>
      fetchExcelImportSheets(uploadHeaders, file),
    [uploadHeaders],
  );

  const requestExcelImportPreview = useCallback(
    async (file: File, sheetName: string): Promise<ExcelImportPreview> =>
      fetchExcelImportPreview(uploadHeaders, file, sheetName),
    [uploadHeaders],
  );

  const selectExcelImportFile = useCallback(
    async (file: File | null) => {
      if (!workspace.tenant) {
        setError("Create a workspace first");
        return;
      }
      if (!file) {
        return;
      }
      await runAction("Reading Excel file", async () => {
        const sheets = await listExcelImportSheets(file);
        const selectedSheet = sheets.sheets.length === 1 ? sheets.default_sheet : "";
        setPendingFile(file, sheets, selectedSheet);
        if (!selectedSheet) {
          setMessage("Select Excel sheet");
          return;
        }
        const preview = await requestExcelImportPreview(file, selectedSheet);
        setImportPreview(preview);
        setMessage("Import preview ready");
      });
    },
    [
      listExcelImportSheets,
      requestExcelImportPreview,
      runAction,
      setError,
      setImportPreview,
      setMessage,
      setPendingFile,
      workspace.tenant,
    ],
  );

  const previewSelectedImportSheet = useCallback(
    async (sheetName: string) => {
      if (!importFile) {
        setError("Upload an Excel file first");
        return;
      }
      setSelectedImportSheet(sheetName);
      await runAction("Reading Excel sheet", async () => {
        const preview = await requestExcelImportPreview(importFile, sheetName);
        setImportPreview(preview);
        setMessage("Import preview ready");
      });
    },
    [
      importFile,
      requestExcelImportPreview,
      runAction,
      setError,
      setImportPreview,
      setMessage,
      setSelectedImportSheet,
    ],
  );

  const parsePastedImportRows = useCallback(
    (text: string) => {
      if (!workspace.tenant) {
        setError("Create a workspace first");
        return;
      }
      const preview = buildPastedRowsImportPreview(text, workspace.rawMaterials);
      if (preview.rows.length === 0) {
        setError("Paste material and percentage rows first");
        return;
      }
      setPastedImportPreview(preview);
      setResult(null);
      setMessage(
        `Pasted rows parsed: ${preview.resolved_rows} resolved, ${preview.pending_rows} pending`,
      );
    },
    [
      setError,
      setMessage,
      setPastedImportPreview,
      setResult,
      workspace.rawMaterials,
      workspace.tenant,
    ],
  );

  const saveExcelImport = useCallback(async () => {
    if (!workspace.tenant || !importPreview) {
      setError("Preview an Excel file first");
      return;
    }
    if (importPreview.pending_rows > 0) {
      setError("Resolve import rows before saving");
      return;
    }
    if (!importFormulaName.trim()) {
      setError("Indica un nombre de formula antes de guardar la importacion.");
      return;
    }
    if (!importFormulaDescription.trim()) {
      setError("Indica una descripcion de formula antes de guardar la importacion.");
      return;
    }

    await runAction("Saving imported formula", async () => {
      const formula = await saveExcelImportedFormula(
        headers,
        workspace.tenant?.name,
        workspace,
        importFormulaName,
        importFormulaDescription,
        importPreview.rows,
      );
      setWorkspace((current) => ({
        ...current,
        ...toEditableFormulaState(formula),
      }));
      await refreshFormulaLibrary({ silent: true });
      await loadCalculationHistory(formula.id);
      setResult(null);
      setDraftReview(null);
      setSavedFormulaComparison(null);
      resetImportState();
      setMessage("Imported formula saved");
    });
  }, [
    headers,
    importFormulaDescription,
    importFormulaName,
    importPreview,
    loadCalculationHistory,
    refreshFormulaLibrary,
    resetImportState,
    runAction,
    setDraftReview,
    setError,
    setMessage,
    setResult,
    setSavedFormulaComparison,
    setWorkspace,
    workspace.formulaJiraIssueType,
    workspace.formulaJiraProductType,
    workspace.formulaJiraProjectId,
    workspace.tenant,
  ]);

  const openImportInFormulaBuilder = useCallback(() => {
    if (!importPreview) {
      setError("Preview an Excel file first");
      return;
    }
    if (importPreview.pending_rows > 0) {
      setError("Resolve import rows before opening in Formula Builder");
      return;
    }
    const formulaLines = importPreview.rows.flatMap((row) =>
      row.raw_material_id
        ? [
            {
              localId: makeLocalId(),
              rawMaterialId: row.raw_material_id,
              percentage: row.percentage ?? 0,
            },
          ]
        : [],
    );
    if (formulaLines.length === 0) {
      setError("Import preview has no resolved formula lines");
      return;
    }

    setWorkspace((current) => ({
      ...current,
      formulaId: null,
      formulaBaseName: null,
      formulaBuilderMode: "new",
      formulaName: importFormulaName || importPreview.formula_name || "",
      formulaJiraDescription: importFormulaDescription,
      formulaLines,
    }));
    setBuilderSections({
      ...DEFAULT_BUILDER_SECTIONS,
      basics: true,
      formula: true,
      calculation: true,
      review: true,
    });
    setResult(null);
    setDraftReview(null);
    setSavedFormulaComparison(null);
    resetImportState();
    setActiveView("formula");
    setMessage("Importacion abierta en Formula Builder");
  }, [
    importFormulaDescription,
    importFormulaName,
    importPreview,
    resetImportState,
    setActiveView,
    setBuilderSections,
    setDraftReview,
    setError,
    setMessage,
    setResult,
    setSavedFormulaComparison,
    setWorkspace,
  ]);

  const resolveImportRow = useCallback(
    (rowNumber: number, rawMaterialId: string) => {
      if (resolveImportRowState(rowNumber, rawMaterialId)) {
        setMessage("Import row resolved");
      }
    },
    [resolveImportRowState, setMessage],
  );

  const acceptImportSuggestion = useCallback(
    (row: ExcelImportPreviewRow) => {
      if (!row.suggested_raw_material_id) {
        setError("Import row has no suggestion");
        return;
      }
      resolveImportRow(row.row_number, row.suggested_raw_material_id);
    },
    [resolveImportRow, setError],
  );

  const createMaterialFromImportRow = useCallback(
    async (row: ExcelImportPreviewRow) => {
      if (!workspace.tenant) {
        setError("Create a workspace first");
        return;
      }
      const materialCode = row.material_code?.trim() ?? "";
      const materialName = row.material_name?.trim() ?? "";
      const name = materialName || materialCode;

      if (!name) {
        setError("Import row needs a material name or code");
        return;
      }

      await runAction("Creating material from import row", async () => {
        const material = await createImportRawMaterial(headers, materialCode, name);
        setWorkspace((current) => ({
          ...current,
          rawMaterials: mergeRawMaterials(current.rawMaterials, [
            toWorkspaceRawMaterial(material, {}, current.parameters),
          ]),
        }));
        setDetailedMaterialIds((current) =>
          current.includes(material.id) ? current : [...current, material.id],
        );
        refreshCatalog();
        resolveImportRowState(row.row_number, material.id);
        setResult(null);
        setMessage("Import material created");
      });
    },
    [
      headers,
      refreshCatalog,
      resolveImportRowState,
      runAction,
      setDetailedMaterialIds,
      setError,
      setMessage,
      setResult,
      setWorkspace,
      workspace.tenant,
    ],
  );

  const createAliasFromImportRow = useCallback(
    async (row: ExcelImportPreviewRow) => {
      if (!row.raw_material_id) {
        setError("Resolve import row before saving alias");
        return;
      }
      const rawMaterialId = row.raw_material_id;
      const alias = aliasFromImportRow(row);
      if (!alias) {
        setError("Import row needs a material name or code");
        return;
      }

      await runAction("Creating import alias", async () => {
        const created = await createImportRawMaterialAlias(headers, rawMaterialId, alias);
        setWorkspace((current) => ({
          ...current,
          rawMaterials: withRawMaterialAlias(
            current.rawMaterials,
            rawMaterialId,
            created.alias,
          ),
        }));
        setMessage("Import alias ready");
      });
    },
    [headers, runAction, setError, setMessage, setWorkspace],
  );

  return {
    selectExcelImportFile,
    previewSelectedImportSheet,
    parsePastedImportRows,
    saveExcelImport,
    openImportInFormulaBuilder,
    resolveImportRow,
    acceptImportSuggestion,
    createMaterialFromImportRow,
    createAliasFromImportRow,
  };
}
