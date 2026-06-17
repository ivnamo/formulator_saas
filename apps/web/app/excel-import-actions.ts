import { useCallback, type Dispatch, type SetStateAction } from "react";
import {
  createImportRawMaterial,
  createImportRawMaterialAlias,
  fetchExcelImportPreview,
  fetchExcelImportSheets,
  saveExcelImportedFormula,
} from "./excel-import-api";
import { toEditableFormulaState } from "./formula-read-model";
import {
  aliasFromImportRow,
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

type ExcelImportActionsOptions = {
  workspace: WorkspaceState;
  importPreview: ExcelImportPreview | null;
  importFile: File | null;
  importFormulaName: string;
  headers: HeadersInit;
  uploadHeaders: HeadersInit;
  setWorkspace: Dispatch<SetStateAction<WorkspaceState>>;
  setDetailedMaterialIds: Dispatch<SetStateAction<string[]>>;
  setResult: Dispatch<SetStateAction<CalculationResult | null>>;
  setDraftReview: Dispatch<SetStateAction<DraftReviewState | null>>;
  setSavedFormulaComparison: Dispatch<SetStateAction<SavedFormulaComparison | null>>;
  setPendingFile: (file: File, sheets: ExcelImportSheets, selectedSheet: string) => void;
  setImportPreview: (preview: ExcelImportPreview) => void;
  setSelectedImportSheet: (sheetName: string) => void;
  resolveImportRowState: (rowNumber: number, rawMaterialId: string) => boolean;
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
  headers,
  uploadHeaders,
  setWorkspace,
  setDetailedMaterialIds,
  setResult,
  setDraftReview,
  setSavedFormulaComparison,
  setPendingFile,
  setImportPreview,
  setSelectedImportSheet,
  resolveImportRowState,
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

  const saveExcelImport = useCallback(async () => {
    if (!workspace.tenant || !importPreview) {
      setError("Preview an Excel file first");
      return;
    }
    if (importPreview.pending_rows > 0) {
      setError("Resolve import rows before saving");
      return;
    }

    await runAction("Saving imported formula", async () => {
      const formula = await saveExcelImportedFormula(
        headers,
        workspace.tenant?.name,
        workspace,
        importFormulaName || importPreview.formula_name,
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
      setMessage("Imported formula saved");
    });
  }, [
    headers,
    importFormulaName,
    importPreview,
    loadCalculationHistory,
    refreshFormulaLibrary,
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
    saveExcelImport,
    resolveImportRow,
    acceptImportSuggestion,
    createMaterialFromImportRow,
    createAliasFromImportRow,
  };
}
