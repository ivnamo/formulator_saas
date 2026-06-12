import { useState } from "react";
import {
  withResolvedImportRow,
  type ExcelImportPreview,
  type ExcelImportSheets,
} from "./workspace-model";

export function useExcelImportState() {
  const [importPreview, setImportPreview] = useState<ExcelImportPreview | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importFileName, setImportFileName] = useState("");
  const [availableImportSheets, setAvailableImportSheets] = useState<string[]>([]);
  const [selectedImportSheet, setSelectedImportSheet] = useState("");

  function resetImportState() {
    setImportPreview(null);
    setImportFile(null);
    setImportFileName("");
    setAvailableImportSheets([]);
    setSelectedImportSheet("");
  }

  function setPendingFile(file: File, sheets: ExcelImportSheets, selectedSheet: string) {
    setImportFile(file);
    setImportFileName(file.name);
    setAvailableImportSheets(sheets.sheets);
    setSelectedImportSheet(selectedSheet);
    setImportPreview(null);
  }

  function setPreview(preview: ExcelImportPreview) {
    setImportPreview(preview);
    setAvailableImportSheets(preview.available_sheets);
    setSelectedImportSheet(preview.sheet_name);
  }

  function resolveImportRow(rowNumber: number, rawMaterialId: string) {
    if (!rawMaterialId) {
      return false;
    }
    setImportPreview((current) =>
      current ? withResolvedImportRow(current, rowNumber, rawMaterialId) : current,
    );
    return true;
  }

  return {
    importPreview,
    importFile,
    importFileName,
    availableImportSheets,
    selectedImportSheet,
    resetImportState,
    setPendingFile,
    setPreview,
    setSelectedImportSheet,
    resolveImportRow,
  };
}
