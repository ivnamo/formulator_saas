import { useCallback, useState } from "react";
import {
  withResolvedImportRow,
  type ExcelImportPreview,
  type ExcelImportSheets,
} from "./excel-import-model";

export function useExcelImportState() {
  const [importPreview, setImportPreview] = useState<ExcelImportPreview | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importFileName, setImportFileName] = useState("");
  const [importFormulaName, setImportFormulaName] = useState("");
  const [importFormulaDescription, setImportFormulaDescription] = useState("");
  const [availableImportSheets, setAvailableImportSheets] = useState<string[]>([]);
  const [selectedImportSheet, setSelectedImportSheet] = useState("");

  const resetImportState = useCallback(() => {
    setImportPreview(null);
    setImportFile(null);
    setImportFileName("");
    setImportFormulaName("");
    setImportFormulaDescription("");
    setAvailableImportSheets([]);
    setSelectedImportSheet("");
  }, []);

  const setPendingFile = useCallback(
    (file: File, sheets: ExcelImportSheets, selectedSheet: string) => {
      setImportFile(file);
      setImportFileName(file.name);
      setImportFormulaName(defaultImportFormulaName(file.name));
      setAvailableImportSheets(sheets.sheets);
      setSelectedImportSheet(selectedSheet);
      setImportPreview(null);
    },
    [],
  );

  const setPreview = useCallback((preview: ExcelImportPreview) => {
    setImportPreview(preview);
    setImportFormulaName((current) => preview.formula_name?.trim() || current);
    setAvailableImportSheets(preview.available_sheets);
    setSelectedImportSheet(preview.sheet_name);
  }, []);

  const setPastedPreview = useCallback((preview: ExcelImportPreview) => {
    setImportPreview(preview);
    setImportFile(null);
    setImportFileName("Pasted rows");
    setImportFormulaName((current) => current || "Pasted Formula");
    setAvailableImportSheets([]);
    setSelectedImportSheet("");
  }, []);

  const resolveImportRow = useCallback((rowNumber: number, rawMaterialId: string) => {
    if (!rawMaterialId) {
      return false;
    }
    setImportPreview((current) =>
      current ? withResolvedImportRow(current, rowNumber, rawMaterialId) : current,
    );
    return true;
  }, []);

  return {
    importPreview,
    importFile,
    importFileName,
    importFormulaName,
    importFormulaDescription,
    availableImportSheets,
    selectedImportSheet,
    resetImportState,
    setPendingFile,
    setPreview,
    setPastedPreview,
    setImportFormulaName,
    setImportFormulaDescription,
    setSelectedImportSheet,
    resolveImportRow,
  };
}

function defaultImportFormulaName(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "").trim();
}
