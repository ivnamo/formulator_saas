"use client";

import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Beaker,
  Calculator,
  Check,
  Database,
  Download,
  FlaskConical,
  FolderOpen,
  History,
  ListChecks,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Settings2,
  Trash2,
  Upload,
} from "lucide-react";
import { useMemo, useState } from "react";
import { apiUrl, request, userId } from "./workspace-api";
import {
  aliasFromImportRow,
  emptyWorkspace,
  emptyExcelColumnMapping,
  formatDateTime,
  makeLocalId,
  normalizeCode,
  parseOptionalNumber,
  slugify,
  toWorkspaceRawMaterial,
  withRawMaterialAlias,
  withRawMaterialPrice,
  withResolvedImportRow,
  type CalculationResult,
  type ExcelColumnMapping,
  type ExcelImportColumns,
  type ExcelImportPreview,
  type ExcelImportPreviewRow,
  type ExcelImportSheets,
  type FormulaCalculationHistory,
  type FormulaComparison,
  type FormulaRead,
  type MaterialForm,
  type OptimizerCandidateConfig,
  type OptimizationRun,
  type OptimizationRunHistory,
  type RawMaterialAliasRead,
  type RawMaterialPriceRead,
  type ParameterRead,
  type RawMaterialRead,
  type Status,
  type TenantRead,
  type WorkspaceState,
} from "./workspace-model";

type OptimizerPayload = {
  candidate_raw_material_ids: string[];
  raw_material_bounds: Array<{
    raw_material_id: string;
    min_percentage?: number;
    max_percentage?: number;
  }>;
};

type OptimizerPayloadResult = { payload: OptimizerPayload } | { error: string };

type OptimizerParameterBounds = Array<{
  code: string;
  min_value?: number;
  max_value?: number;
}>;

type OptimizerParameterBoundsResult =
  | { bounds: OptimizerParameterBounds }
  | { error: string };

export default function Home() {
  const [workspace, setWorkspace] = useState<WorkspaceState>(emptyWorkspace);
  const [workspaceName, setWorkspaceName] = useState("Workspace Lab");
  const [parameterForm, setParameterForm] = useState({
    code: "active_content",
    name: "Active content",
    unit: "% p/p",
  });
  const [materialForm, setMaterialForm] = useState<MaterialForm>({
    code: "",
    name: "",
    price: "",
    parameterValue: "",
  });
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [optimizerParameterMinValue, setOptimizerParameterMinValue] = useState("20");
  const [optimizerParameterMaxValue, setOptimizerParameterMaxValue] = useState("");
  const [optimizerCandidates, setOptimizerCandidates] = useState<
    Record<string, OptimizerCandidateConfig>
  >({});
  const [optimizationRun, setOptimizationRun] = useState<OptimizationRun | null>(null);
  const [optimizationHistory, setOptimizationHistory] = useState<OptimizationRunHistory[]>([]);
  const [selectedOptimizationRunId, setSelectedOptimizationRunId] = useState<string | null>(null);
  const [aliasInputs, setAliasInputs] = useState<Record<string, string>>({});
  const [priceInputs, setPriceInputs] = useState<Record<string, string>>({});
  const [formulas, setFormulas] = useState<FormulaRead[]>([]);
  const [comparisonLeftId, setComparisonLeftId] = useState("");
  const [comparisonRightId, setComparisonRightId] = useState("");
  const [formulaComparison, setFormulaComparison] = useState<FormulaComparison | null>(null);
  const [calculationHistory, setCalculationHistory] = useState<FormulaCalculationHistory[]>([]);
  const [importPreview, setImportPreview] = useState<ExcelImportPreview | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importFileName, setImportFileName] = useState("");
  const [availableImportSheets, setAvailableImportSheets] = useState<string[]>([]);
  const [selectedImportSheet, setSelectedImportSheet] = useState("");
  const [availableImportColumns, setAvailableImportColumns] = useState<string[]>([]);
  const [importColumnMapping, setImportColumnMapping] =
    useState<ExcelColumnMapping>(emptyExcelColumnMapping);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("Ready");

  const headers = useMemo(
    () => ({
      "Content-Type": "application/json",
      "X-User-Id": userId,
      ...(workspace.tenant ? { "X-Tenant-Id": workspace.tenant.id } : {}),
    }),
    [workspace.tenant],
  );
  const uploadHeaders = useMemo(
    () => ({
      "X-User-Id": userId,
      ...(workspace.tenant ? { "X-Tenant-Id": workspace.tenant.id } : {}),
    }),
    [workspace.tenant],
  );

  const rawMaterialsById = useMemo(
    () => new Map(workspace.rawMaterials.map((material) => [material.id, material])),
    [workspace.rawMaterials],
  );
  const formulasById = useMemo(
    () => new Map(formulas.map((formula) => [formula.id, formula])),
    [formulas],
  );
  const selectedOptimizationRun = useMemo(
    () => optimizationHistory.find((run) => run.id === selectedOptimizationRunId) ?? null,
    [optimizationHistory, selectedOptimizationRunId],
  );
  const selectedOptimizationMessages = useMemo(
    () => (selectedOptimizationRun ? optimizationDetailMessages(selectedOptimizationRun) : []),
    [selectedOptimizationRun],
  );
  const selectedOptimizerMaterials = workspace.rawMaterials.filter(
    (material) => optimizerCandidateConfig(material.id).enabled,
  );
  const totalPercentage = workspace.formulaLines.reduce(
    (sum, line) => sum + line.percentage,
    0,
  );
  const isBusy = status === "working";
  const canEditTenantData = Boolean(workspace.tenant) && !isBusy;
  const canCalculate = Boolean(workspace.tenant) && workspace.formulaLines.length > 0 && !isBusy;
  const canRunOptimizer =
    Boolean(workspace.tenant) && selectedOptimizerMaterials.length > 0 && !isBusy;
  const canSaveOptimizedFormula =
    Boolean(workspace.tenant) &&
    optimizationRun?.status === "success" &&
    workspace.formulaLines.length > 0 &&
    !isBusy;
  const canCompareFormulas =
    Boolean(workspace.tenant) &&
    Boolean(comparisonLeftId) &&
    Boolean(comparisonRightId) &&
    comparisonLeftId !== comparisonRightId &&
    !isBusy;
  const canSelectImportSheet = availableImportSheets.length > 1 && Boolean(importFile) && !isBusy;
  const canApplyImportColumnMapping =
    Boolean(importFile) &&
    Boolean(selectedImportSheet) &&
    Boolean(importColumnMapping.percentageColumn) &&
    Boolean(importColumnMapping.materialNameColumn || importColumnMapping.materialCodeColumn) &&
    !isBusy;
  const canSaveImport =
    Boolean(importPreview) &&
    importPreview?.rows.length !== 0 &&
    importPreview?.pending_rows === 0 &&
    !isBusy;
  const optimizerFeedbackMessages = optimizationRun ? optimizationFeedback(optimizationRun) : [];

  async function createWorkspace() {
    await runAction("Creating workspace", async () => {
      const name = workspaceName.trim() || "Workspace Lab";
      const tenant = await request<TenantRead>("/api/v1/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-User-Id": userId },
        body: JSON.stringify({
          name,
          slug: `${slugify(name)}-${Date.now()}`,
        }),
      });
      setWorkspace({
        ...emptyWorkspace,
        tenant,
        formulaName: `${name} Formula`,
      });
      setResult(null);
      setFormulas([]);
      setCalculationHistory([]);
      setOptimizationHistory([]);
      setSelectedOptimizationRunId(null);
      setOptimizerCandidates({});
      setOptimizationRun(null);
      resetImportState();
      setMessage("Workspace ready");
    });
  }

  async function createParameter() {
    if (!workspace.tenant) {
      setError("Create a workspace first");
      return;
    }
    if (!parameterForm.code.trim() || !parameterForm.name.trim() || !parameterForm.unit.trim()) {
      setError("Parameter code, name and unit are required");
      return;
    }

    await runAction("Creating parameter", async () => {
      const parameter = await request<ParameterRead>("/api/v1/parameters", {
        method: "POST",
        headers,
        body: JSON.stringify({
          code: normalizeCode(parameterForm.code),
          name: parameterForm.name.trim(),
          unit: parameterForm.unit.trim(),
        }),
      });
      setWorkspace((current) => ({
        ...current,
        parameter,
      }));
      setResult(null);
      setOptimizationRun(null);
      setMessage("Parameter ready");
    });
  }

  async function createMaterial() {
    if (!workspace.tenant) {
      setError("Create a workspace first");
      return;
    }
    if (!materialForm.name.trim()) {
      setError("Raw material name is required");
      return;
    }

    await runAction("Creating raw material", async () => {
      const material = await request<RawMaterialRead>("/api/v1/raw-materials", {
        method: "POST",
        headers,
        body: JSON.stringify({
          code: materialForm.code.trim() || null,
          name: materialForm.name.trim(),
        }),
      });
      const price = parseOptionalNumber(materialForm.price);
      const parameterValue = parseOptionalNumber(materialForm.parameterValue);
      let createdPrice: RawMaterialPriceRead | null = null;

      if (price !== null) {
        createdPrice = await request<RawMaterialPriceRead>(`/api/v1/raw-materials/${material.id}/prices`, {
          method: "POST",
          headers,
          body: JSON.stringify({ price, currency: "EUR", unit: "kg" }),
        });
      }
      if (workspace.parameter && parameterValue !== null) {
        await request<Record<string, unknown>>(
          `/api/v1/raw-materials/${material.id}/parameter-values`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              parameter_id: workspace.parameter.id,
              value: parameterValue,
            }),
          },
        );
      }

      setWorkspace((current) => ({
        ...current,
        rawMaterials: [
          ...current.rawMaterials,
          toWorkspaceRawMaterial(material, {
            price: createdPrice?.price ?? price,
            priceHistory: createdPrice ? [createdPrice] : [],
            parameterValue: workspace.parameter ? parameterValue : null,
          }),
        ],
      }));
      setOptimizerCandidates((current) => ({
        ...current,
        [material.id]: defaultOptimizerCandidateConfig(),
      }));
      setMaterialForm({ code: "", name: "", price: "", parameterValue: "" });
      setResult(null);
      setOptimizationRun(null);
      resetImportState();
      setMessage("Raw material ready");
    });
  }

  async function createPrice(rawMaterialId: string) {
    const price = parseOptionalNumber(priceInputs[rawMaterialId] ?? "");
    if (price === null) {
      setError("Price is required");
      return;
    }

    await runAction("Adding raw material price", async () => {
      const created = await request<RawMaterialPriceRead>(
        `/api/v1/raw-materials/${rawMaterialId}/prices`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ price, currency: "EUR", unit: "kg" }),
        },
      );
      setWorkspace((current) => ({
        ...current,
        rawMaterials: withRawMaterialPrice(current.rawMaterials, rawMaterialId, created),
      }));
      setPriceInputs((current) => ({ ...current, [rawMaterialId]: "" }));
      setResult(null);
      setOptimizationRun(null);
      setMessage("Price ready");
    });
  }

  async function createMaterialFromImportRow(row: ExcelImportPreviewRow) {
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
      const material = await request<RawMaterialRead>("/api/v1/raw-materials", {
        method: "POST",
        headers,
        body: JSON.stringify({
          code: materialCode || null,
          name,
        }),
      });
      setWorkspace((current) => ({
        ...current,
        rawMaterials: [...current.rawMaterials, toWorkspaceRawMaterial(material)],
      }));
      setOptimizerCandidates((current) => ({
        ...current,
        [material.id]: defaultOptimizerCandidateConfig(),
      }));
      setImportPreview((current) =>
        current ? withResolvedImportRow(current, row.row_number, material.id) : current,
      );
      setResult(null);
      setOptimizationRun(null);
      setMessage("Import material created");
    });
  }

  async function createAlias(rawMaterialId: string) {
    const alias = aliasInputs[rawMaterialId]?.trim();
    if (!alias) {
      setError("Alias is required");
      return;
    }

    await runAction("Creating alias", async () => {
      const created = await request<RawMaterialAliasRead>(
        `/api/v1/raw-materials/${rawMaterialId}/aliases`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ alias }),
        },
      );
      setWorkspace((current) => ({
        ...current,
        rawMaterials: withRawMaterialAlias(current.rawMaterials, rawMaterialId, created.alias),
      }));
      setAliasInputs((current) => ({ ...current, [rawMaterialId]: "" }));
      resetImportState();
      setMessage("Alias ready");
    });
  }

  async function createAliasFromImportRow(row: ExcelImportPreviewRow) {
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
      const created = await request<RawMaterialAliasRead>(
        `/api/v1/raw-materials/${rawMaterialId}/aliases`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ alias, source: "excel_import" }),
        },
      );
      setWorkspace((current) => ({
        ...current,
        rawMaterials: withRawMaterialAlias(current.rawMaterials, rawMaterialId, created.alias),
      }));
      setMessage("Import alias ready");
    });
  }

  function addFormulaLine(rawMaterialId: string) {
    setWorkspace((current) => ({
      ...current,
      formulaLines: [
        ...current.formulaLines,
        { localId: makeLocalId(), rawMaterialId, percentage: 0 },
      ],
    }));
    setResult(null);
    setOptimizationRun(null);
  }

  function removeFormulaLine(localId: string) {
    setWorkspace((current) => ({
      ...current,
      formulaLines: current.formulaLines.filter((line) => line.localId !== localId),
    }));
    setResult(null);
    setOptimizationRun(null);
  }

  function updateFormulaLine(localId: string, percentage: number) {
    setWorkspace((current) => ({
      ...current,
      formulaLines: current.formulaLines.map((line) =>
        line.localId === localId ? { ...line, percentage } : line,
      ),
    }));
    setResult(null);
    setOptimizationRun(null);
  }

  function moveFormulaLine(localId: string, offset: -1 | 1) {
    setWorkspace((current) => {
      const index = current.formulaLines.findIndex((line) => line.localId === localId);
      const nextIndex = index + offset;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.formulaLines.length) {
        return current;
      }
      const formulaLines = [...current.formulaLines];
      [formulaLines[index], formulaLines[nextIndex]] = [
        formulaLines[nextIndex],
        formulaLines[index],
      ];
      return { ...current, formulaLines };
    });
    setResult(null);
    setOptimizationRun(null);
  }

  async function calculateFormula() {
    if (!workspace.tenant) {
      setError("Create a workspace first");
      return;
    }
    if (!workspace.formulaLines.length) {
      setError("Add at least one formula line");
      return;
    }

    await saveFormulaAndCalculate("Calculating formula", "Calculation complete");
  }

  async function saveOptimizedFormula() {
    if (!canSaveOptimizedFormula) {
      setError("Run a successful optimization first");
      return;
    }
    const historyRun = optimizationHistory.find((run) => run.id === optimizationRun?.id);
    await saveFormulaAndCalculate(
      "Saving optimized formula",
      "Optimized formula saved",
      "minimize_price",
      historyRun?.formula_id ? undefined : optimizationRun?.id,
    );
  }

  async function saveFormulaAndCalculate(
    label: string,
    successMessage: string,
    objective?: string,
    optimizationRunId?: string,
  ) {
    await runAction(label, async () => {
      const formula = await persistCurrentFormula(objective, optimizationRunId);
      const calculation = await request<CalculationResult>(
        `/api/v1/formulas/${formula.id}/calculate`,
        { method: "POST", headers },
      );
      setWorkspace((current) => ({
        ...current,
        formulaId: formula.id,
        formulaName: formula.name,
      }));
      setResult(calculation);
      await refreshFormulaLibrary({ silent: true });
      await loadCalculationHistory(formula.id);
      setMessage(successMessage);
    });
  }

  async function persistCurrentFormula(
    objective?: string,
    optimizationRunId?: string,
  ): Promise<FormulaRead> {
    const items = workspace.formulaLines.map((line, index) => ({
      raw_material_id: line.rawMaterialId,
      percentage: line.percentage,
      order_index: index,
    }));
    const payload = {
      name: workspace.formulaName.trim() || "Manual Formula",
      ...(objective === undefined ? {} : { objective }),
      ...(optimizationRunId ? { optimization_run_id: optimizationRunId } : {}),
      items,
    };
    return workspace.formulaId
      ? request<FormulaRead>(`/api/v1/formulas/${workspace.formulaId}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify(payload),
        })
      : request<FormulaRead>("/api/v1/formulas", {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });
  }

  async function runOptimizer() {
    if (!workspace.tenant) {
      setError("Create a workspace first");
      return;
    }
    if (!workspace.rawMaterials.length) {
      setError("Create at least one raw material");
      return;
    }
    const parameterBounds = buildOptimizerParameterBounds();
    if ("error" in parameterBounds) {
      setError(parameterBounds.error);
      return;
    }
    const optimizerPayload = buildOptimizerPayload();
    if ("error" in optimizerPayload) {
      setError(optimizerPayload.error);
      return;
    }

    await runAction("Running optimizer", async () => {
      const optimization = await request<OptimizationRun>("/api/v1/optimizations/run", {
        method: "POST",
        headers,
        body: JSON.stringify({
          objective: "minimize_price",
          ...optimizerPayload.payload,
          parameter_bounds: parameterBounds.bounds,
        }),
      });
      setOptimizationRun(optimization);
      setSelectedOptimizationRunId(optimization.id);
      await loadOptimizationHistory();
      if (optimization.status === "success" && optimization.calculation) {
        setWorkspace((current) => ({
          ...current,
          formulaId: null,
          formulaName: "Optimized Low Cost Formula",
          formulaLines: optimization.items.map((item) => ({
            localId: makeLocalId(),
            rawMaterialId: item.raw_material_id,
            percentage: item.percentage,
          })),
        }));
        setResult(optimization.calculation);
        setMessage("Optimization ready");
        return;
      }
      setMessage(
        optimization.status === "infeasible" ? "Optimization infeasible" : "Optimization invalid",
      );
    });
  }

  async function refreshFormulaLibrary(options: { silent?: boolean } = {}) {
    if (!workspace.tenant) {
      setError("Create a workspace first");
      return;
    }
    if (options.silent) {
      const library = await fetchLibraryData();
      setFormulas(library.formulas);
      setOptimizationHistory(library.optimizationHistory);
      syncComparisonSelection(library.formulas);
      return;
    }
    await runAction("Refreshing formula library", async () => {
      const library = await fetchLibraryData();
      setFormulas(library.formulas);
      setOptimizationHistory(library.optimizationHistory);
      syncComparisonSelection(library.formulas);
      setMessage("Formula library refreshed");
    });
  }

  async function fetchLibraryData(): Promise<{
    formulas: FormulaRead[];
    optimizationHistory: OptimizationRunHistory[];
  }> {
    const [nextFormulas, nextOptimizationHistory] = await Promise.all([
      request<FormulaRead[]>("/api/v1/formulas", {
        method: "GET",
        headers,
      }),
      request<OptimizationRunHistory[]>("/api/v1/optimizations/runs", {
        method: "GET",
        headers,
      }),
    ]);
    return {
      formulas: nextFormulas,
      optimizationHistory: nextOptimizationHistory,
    };
  }

  async function loadOptimizationHistory() {
    const history = await request<OptimizationRunHistory[]>("/api/v1/optimizations/runs", {
      method: "GET",
      headers,
    });
    setOptimizationHistory(history);
  }

  async function compareSelectedFormulas() {
    if (!canCompareFormulas) {
      setError("Select two different formulas");
      return;
    }
    await runAction("Comparing formulas", async () => {
      const comparison = await request<FormulaComparison>("/api/v1/formulas/compare", {
        method: "POST",
        headers,
        body: JSON.stringify({
          left_formula_id: comparisonLeftId,
          right_formula_id: comparisonRightId,
        }),
      });
      setFormulaComparison(comparison);
      setMessage("Formula comparison ready");
    });
  }

  async function openFormula(formula: FormulaRead) {
    await runAction("Opening formula", async () => {
      setWorkspace((current) => ({
        ...current,
        formulaId: formula.id,
        formulaName: formula.name,
        formulaLines: formula.items.map((item) => ({
          localId: makeLocalId(),
          rawMaterialId: item.raw_material_id,
          percentage: item.percentage,
        })),
      }));
      setResult(null);
      resetImportState();
      await loadCalculationHistory(formula.id);
      setMessage("Formula opened");
    });
  }

  async function loadCalculationHistory(formulaId: string) {
    const history = await request<FormulaCalculationHistory[]>(
      `/api/v1/formulas/${formulaId}/calculations`,
      { method: "GET", headers },
    );
    setCalculationHistory(history);
  }

  function loadOptimizationRun(run: OptimizationRunHistory) {
    if (run.status !== "success" || !run.result_json.calculation) {
      setError("Only successful optimization runs can be loaded");
      return;
    }
    setWorkspace((current) => ({
      ...current,
      formulaId: null,
      formulaName: "Optimized Low Cost Formula",
      formulaLines: run.result_json.items.map((item) => ({
        localId: makeLocalId(),
        rawMaterialId: item.raw_material_id,
        percentage: item.percentage,
      })),
    }));
    setOptimizationRun({
      id: run.id,
      created_at: run.created_at,
      ...run.result_json,
    });
    setResult(run.result_json.calculation);
    setSelectedOptimizationRunId(run.id);
    setCalculationHistory([]);
    resetImportState();
    setStatus("idle");
    setMessage("Optimization run loaded");
  }

  async function selectExcelImportFile(file: File | null) {
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
      setImportFile(file);
      setImportFileName(file.name);
      setAvailableImportSheets(sheets.sheets);
      setSelectedImportSheet(selectedSheet);
      setAvailableImportColumns([]);
      setImportColumnMapping(emptyExcelColumnMapping);
      setImportPreview(null);
      if (!selectedSheet) {
        setMessage("Select Excel sheet");
        return;
      }
      const detectedMapping = await loadExcelImportColumns(file, selectedSheet);
      if (!isCompleteExcelColumnMapping(detectedMapping)) {
        setMessage("Map Excel columns");
        return;
      }
      await loadExcelImportPreview(file, selectedSheet, detectedMapping);
    });
  }

  async function previewSelectedImportSheet(sheetName: string) {
    if (!importFile) {
      setError("Upload an Excel file first");
      return;
    }
    setSelectedImportSheet(sheetName);
    await runAction("Reading Excel sheet", async () => {
      const detectedMapping = await loadExcelImportColumns(importFile, sheetName);
      if (!isCompleteExcelColumnMapping(detectedMapping)) {
        setMessage("Map Excel columns");
        return;
      }
      await loadExcelImportPreview(importFile, sheetName, detectedMapping);
    });
  }

  async function downloadFormulaExcel(formula: FormulaRead) {
    if (!workspace.tenant) {
      setError("Create a workspace first");
      return;
    }
    await runAction("Downloading formula Excel", async () => {
      const response = await fetch(
        `${apiUrl}/api/v1/formulas/${formula.id}/export/excel`,
        { method: "GET", headers },
      );
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`API ${response.status}: ${detail}`);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download =
        filenameFromContentDisposition(response.headers.get("content-disposition")) ??
        `${slugify(formula.name) || "formula"}.xlsx`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setMessage("Formula Excel downloaded");
    });
  }

  async function applyImportColumnMapping() {
    if (!importFile || !selectedImportSheet) {
      setError("Upload an Excel file and select a sheet first");
      return;
    }
    if (!importColumnMapping.percentageColumn) {
      setError("Percentage column is required");
      return;
    }
    if (!isCompleteExcelColumnMapping(importColumnMapping)) {
      setError("Map a material name or code column");
      return;
    }

    await runAction("Applying column mapping", async () => {
      await loadExcelImportPreview(importFile, selectedImportSheet, importColumnMapping);
    });
  }

  async function loadExcelImportColumns(
    file: File,
    sheetName: string,
  ): Promise<ExcelColumnMapping> {
    const columns = await listExcelImportColumns(file, sheetName);
    const detectedMapping = mappingFromExcelColumns(columns);
    setAvailableImportColumns(columns.columns);
    setImportColumnMapping(detectedMapping);
    setImportPreview(null);
    return detectedMapping;
  }

  async function loadExcelImportPreview(
    file: File,
    sheetName: string,
    columnMapping: ExcelColumnMapping,
  ) {
    const preview = await requestExcelImportPreview(file, sheetName, columnMapping);
    setImportPreview(preview);
    setAvailableImportSheets(preview.available_sheets);
    setSelectedImportSheet(preview.sheet_name);
    setMessage("Import preview ready");
  }

  async function listExcelImportSheets(file: File): Promise<ExcelImportSheets> {
    const formData = new FormData();
    formData.append("file", file);
    return request<ExcelImportSheets>("/api/v1/imports/formulas/excel/sheets", {
      method: "POST",
      headers: uploadHeaders,
      body: formData,
    });
  }

  async function listExcelImportColumns(
    file: File,
    sheetName: string,
  ): Promise<ExcelImportColumns> {
    const formData = new FormData();
    formData.append("file", file);
    if (sheetName) {
      formData.append("sheet_name", sheetName);
    }
    return request<ExcelImportColumns>("/api/v1/imports/formulas/excel/columns", {
      method: "POST",
      headers: uploadHeaders,
      body: formData,
    });
  }

  async function requestExcelImportPreview(
    file: File,
    sheetName: string,
    columnMapping: ExcelColumnMapping,
  ): Promise<ExcelImportPreview> {
    const formData = new FormData();
    formData.append("file", file);
    if (sheetName) {
      formData.append("sheet_name", sheetName);
    }
    if (columnMapping.materialNameColumn) {
      formData.append("material_name_column", columnMapping.materialNameColumn);
    }
    if (columnMapping.materialCodeColumn) {
      formData.append("material_code_column", columnMapping.materialCodeColumn);
    }
    if (columnMapping.percentageColumn) {
      formData.append("percentage_column", columnMapping.percentageColumn);
    }
    return request<ExcelImportPreview>("/api/v1/imports/formulas/excel/preview", {
      method: "POST",
      headers: uploadHeaders,
      body: formData,
    });
  }

  async function saveExcelImport() {
    if (!workspace.tenant || !importPreview) {
      setError("Preview an Excel file first");
      return;
    }
    if (importPreview.pending_rows > 0) {
      setError("Resolve import rows before saving");
      return;
    }

    await runAction("Saving imported formula", async () => {
      const formula = await request<FormulaRead>("/api/v1/imports/formulas/excel/save", {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: `${workspace.tenant?.name ?? "Imported"} Excel Formula`,
          rows: importPreview.rows.map((row) => ({
            raw_material_id: row.raw_material_id,
            percentage: row.percentage,
          })),
        }),
      });
      setWorkspace((current) => ({
        ...current,
        formulaId: formula.id,
        formulaName: formula.name,
        formulaLines: formula.items.map((item) => ({
          localId: makeLocalId(),
          rawMaterialId: item.raw_material_id,
          percentage: item.percentage,
        })),
      }));
      await refreshFormulaLibrary({ silent: true });
      await loadCalculationHistory(formula.id);
      setResult(null);
      setMessage("Imported formula saved");
    });
  }

  function resolveImportRow(rowNumber: number, rawMaterialId: string) {
    if (!rawMaterialId) {
      return;
    }
    setImportPreview((current) =>
      current ? withResolvedImportRow(current, rowNumber, rawMaterialId) : current,
    );
    setMessage("Import row resolved");
  }

  function acceptImportSuggestion(row: ExcelImportPreviewRow) {
    if (!row.suggested_raw_material_id) {
      setError("Import row has no suggestion");
      return;
    }
    resolveImportRow(row.row_number, row.suggested_raw_material_id);
  }

  function resetImportState() {
    setImportPreview(null);
    setImportFile(null);
    setImportFileName("");
    setAvailableImportSheets([]);
    setSelectedImportSheet("");
    setAvailableImportColumns([]);
    setImportColumnMapping(emptyExcelColumnMapping);
  }

  function mappingFromExcelColumns(columns: ExcelImportColumns): ExcelColumnMapping {
    return {
      materialNameColumn: columns.detected_material_name ?? "",
      materialCodeColumn: columns.detected_material_code ?? "",
      percentageColumn: columns.detected_percentage ?? "",
    };
  }

  function isCompleteExcelColumnMapping(mapping: ExcelColumnMapping): boolean {
    return Boolean(
      mapping.percentageColumn && (mapping.materialNameColumn || mapping.materialCodeColumn),
    );
  }

  function filenameFromContentDisposition(value: string | null): string | null {
    return value?.match(/filename="?([^"]+)"?/i)?.[1] ?? null;
  }

  function formatPriceEntry(price: RawMaterialPriceRead): string {
    return `${price.price.toFixed(2)} ${price.currency}/${price.unit} - ${price.valid_from}`;
  }

  function syncComparisonSelection(nextFormulas: FormulaRead[]) {
    const formulaIds = new Set(nextFormulas.map((formula) => formula.id));
    const nextLeftId = formulaIds.has(comparisonLeftId)
      ? comparisonLeftId
      : nextFormulas[0]?.id ?? "";
    const nextRightId =
      formulaIds.has(comparisonRightId) && comparisonRightId !== nextLeftId
        ? comparisonRightId
        : nextFormulas.find((formula) => formula.id !== nextLeftId)?.id ?? "";

    setComparisonLeftId(nextLeftId);
    setComparisonRightId(nextRightId);
    setFormulaComparison(null);
  }

  function buildOptimizerPayload(): OptimizerPayloadResult {
    const candidateIds: string[] = [];
    const rawMaterialBounds: OptimizerPayload["raw_material_bounds"] = [];

    for (const material of workspace.rawMaterials) {
      const config = optimizerCandidateConfig(material.id);
      if (!config.enabled) {
        continue;
      }
      candidateIds.push(material.id);
      const minPercentage = parseOptionalNumber(config.minPercentage);
      const maxPercentage = parseOptionalNumber(config.maxPercentage);
      const boundError = optimizerBoundError(
        material.name,
        config.minPercentage,
        minPercentage,
        config.maxPercentage,
        maxPercentage,
      );
      if (boundError) {
        return { error: boundError };
      }
      if (minPercentage !== null || maxPercentage !== null) {
        rawMaterialBounds.push({
          raw_material_id: material.id,
          ...(minPercentage !== null ? { min_percentage: minPercentage } : {}),
          ...(maxPercentage !== null ? { max_percentage: maxPercentage } : {}),
        });
      }
    }

    if (!candidateIds.length) {
      return { error: "Select at least one optimizer candidate" };
    }

    return {
      payload: {
        candidate_raw_material_ids: candidateIds,
        raw_material_bounds: rawMaterialBounds,
      },
    };
  }

  function buildOptimizerParameterBounds(): OptimizerParameterBoundsResult {
    if (!workspace.parameter) {
      return { bounds: [] };
    }
    const minValue = parseOptionalNumber(optimizerParameterMinValue);
    const maxValue = parseOptionalNumber(optimizerParameterMaxValue);
    if (optimizerParameterMinValue.trim() && minValue === null) {
      return { error: "Enter a valid parameter minimum" };
    }
    if (optimizerParameterMaxValue.trim() && maxValue === null) {
      return { error: "Enter a valid parameter maximum" };
    }
    if (minValue !== null && maxValue !== null && minValue > maxValue) {
      return { error: "Parameter minimum cannot exceed maximum" };
    }
    if (minValue === null && maxValue === null) {
      return { bounds: [] };
    }
    return {
      bounds: [
        {
          code: workspace.parameter.code,
          ...(minValue !== null ? { min_value: minValue } : {}),
          ...(maxValue !== null ? { max_value: maxValue } : {}),
        },
      ],
    };
  }

  function optimizerBoundError(
    materialName: string,
    minInput: string,
    minPercentage: number | null,
    maxInput: string,
    maxPercentage: number | null,
  ): string | null {
    if (minInput.trim() && minPercentage === null) {
      return `Enter a valid minimum for ${materialName}`;
    }
    if (maxInput.trim() && maxPercentage === null) {
      return `Enter a valid maximum for ${materialName}`;
    }
    if (
      (minPercentage !== null && (minPercentage < 0 || minPercentage > 100)) ||
      (maxPercentage !== null && (maxPercentage < 0 || maxPercentage > 100))
    ) {
      return `Bounds for ${materialName} must be between 0 and 100`;
    }
    if (minPercentage !== null && maxPercentage !== null && minPercentage > maxPercentage) {
      return `Minimum cannot exceed maximum for ${materialName}`;
    }
    return null;
  }

  function optimizerCandidateConfig(rawMaterialId: string): OptimizerCandidateConfig {
    return optimizerCandidates[rawMaterialId] ?? defaultOptimizerCandidateConfig();
  }

  function defaultOptimizerCandidateConfig(): OptimizerCandidateConfig {
    return { enabled: true, minPercentage: "", maxPercentage: "" };
  }

  function updateOptimizerCandidate(
    rawMaterialId: string,
    patch: Partial<OptimizerCandidateConfig>,
  ) {
    setOptimizerCandidates((current) => ({
      ...current,
      [rawMaterialId]: {
        ...defaultOptimizerCandidateConfig(),
        ...(current[rawMaterialId] ?? {}),
        ...patch,
      },
    }));
    setOptimizationRun(null);
  }

  function formatSignedNumber(value: number | null, digits = 2): string {
    if (value === null) {
      return "-";
    }
    const sign = value > 0 ? "+" : "";
    return `${sign}${value.toFixed(digits)}`;
  }

  function optimizationFeedback(run: OptimizationRun): string[] {
    return [
      ...run.issues.map((issue) => issue.message),
      ...run.messages,
    ];
  }

  function optimizationStatusLabel(statusValue: OptimizationRun["status"]): string {
    if (statusValue === "success") {
      return "Ready";
    }
    if (statusValue === "infeasible") {
      return "No solution";
    }
    return "Review needed";
  }

  function formulaObjectiveLabel(objective: string | null): string {
    if (objective === "minimize_price") {
      return "Low cost";
    }
    return objective ?? "-";
  }

  function optimizationHistoryPrice(run: OptimizationRunHistory): string {
    const calculation = run.result_json.calculation;
    if (calculation?.price_total == null) {
      return "-";
    }
    return `${calculation.price_total.toFixed(2)} ${calculation.currency}/kg`;
  }

  function optimizationHistoryFormulaLabel(run: OptimizationRunHistory): string {
    if (!run.formula_id) {
      return "Draft only";
    }
    return formulasById.get(run.formula_id)?.name ?? "Formula linked";
  }

  function rawMaterialLabel(rawMaterialId: string): string {
    return rawMaterialsById.get(rawMaterialId)?.name ?? rawMaterialId.slice(0, 8);
  }

  function formatBoundRange(
    minimum: number | null,
    maximum: number | null,
    unit: string,
  ): string {
    const suffix = unit ? ` ${unit}` : "";
    if (minimum === null && maximum === null) {
      return "Any";
    }
    if (minimum !== null && maximum !== null) {
      return `${formatBoundValue(minimum)}-${formatBoundValue(maximum)}${suffix}`;
    }
    if (minimum !== null) {
      return `>= ${formatBoundValue(minimum)}${suffix}`;
    }
    return `<= ${formatBoundValue(maximum)}${suffix}`;
  }

  function formatBoundValue(value: number | null): string {
    if (value === null) {
      return "-";
    }
    return Number.isInteger(value) ? value.toFixed(0) : value.toFixed(2);
  }

  function optimizationDetailMessages(run: OptimizationRunHistory): string[] {
    return [
      ...run.result_json.issues.map((issue) => `${issue.code}: ${issue.message}`),
      ...run.result_json.messages,
    ];
  }

  async function runAction(label: string, action: () => Promise<void>) {
    setStatus("working");
    setMessage(label);
    try {
      await action();
      setStatus("idle");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Action failed");
    }
  }

  function setError(nextMessage: string) {
    setStatus("error");
    setMessage(nextMessage);
  }

  return (
    <main className="shell">
      <aside className="sidebar" aria-label="Workspace navigation">
        <div className="brand">
          <div className="brandMark">F</div>
          <div>
            <strong>FormulIA Cloud</strong>
            <span>Platform</span>
          </div>
        </div>
        <nav className="nav">
          <a className="navItem active" href="#workspace">
            <FlaskConical size={18} /> Workspace
          </a>
          <a className="navItem" href="#materials">
            <Database size={18} /> Materials
          </a>
          <a className="navItem" href="#library">
            <FolderOpen size={18} /> Library
          </a>
          <a className="navItem" href="#parameters">
            <Settings2 size={18} /> Parameters
          </a>
          <a className="navItem" href="#import">
            <Upload size={18} /> Import
          </a>
          <a className="navItem" href="#results">
            <ListChecks size={18} /> Results
          </a>
        </nav>
      </aside>

      <section className="workspace" id="workspace">
        <header className="topbar">
          <div>
            <h1>{workspace.formulaName}</h1>
            <p>
              {workspace.tenant
                ? `${workspace.tenant.name} - ${workspace.tenant.id}`
                : "No workspace active"}
            </p>
          </div>
          <div className="actions">
            <button className="primaryButton" type="button" onClick={calculateFormula} disabled={!canCalculate}>
              {isBusy ? <Loader2 className="spin" size={17} /> : <Calculator size={17} />}
              Calculate
            </button>
          </div>
        </header>

        <div className="statusLine" data-state={status}>
          {status === "error" ? <AlertTriangle size={16} /> : <RefreshCw size={16} />}
          <span>{message}</span>
          <code>{apiUrl}</code>
        </div>

        <div className="grid">
          <section className="panel setupPanel">
            <div className="panelHeader">
              <h2>Workspace</h2>
              <span>{workspace.tenant ? "Active" : "New"}</span>
            </div>
            <div className="formGrid">
              <label>
                <span>Name</span>
                <input
                  value={workspaceName}
                  onChange={(event) => setWorkspaceName(event.target.value)}
                  disabled={isBusy}
                />
              </label>
              <button className="secondaryButton" type="button" onClick={createWorkspace} disabled={isBusy}>
                <Plus size={17} />
                Create workspace
              </button>
            </div>
          </section>

          <section id="parameters" className="panel setupPanel">
            <div className="panelHeader">
              <h2>Parameter</h2>
              <span>{workspace.parameter ? workspace.parameter.code : "None"}</span>
            </div>
            <div className="formGrid threeColumns">
              <label>
                <span>Code</span>
                <input
                  value={parameterForm.code}
                  onChange={(event) =>
                    setParameterForm((current) => ({ ...current, code: event.target.value }))
                  }
                  disabled={!canEditTenantData}
                />
              </label>
              <label>
                <span>Name</span>
                <input
                  value={parameterForm.name}
                  onChange={(event) =>
                    setParameterForm((current) => ({ ...current, name: event.target.value }))
                  }
                  disabled={!canEditTenantData}
                />
              </label>
              <label>
                <span>Unit</span>
                <input
                  value={parameterForm.unit}
                  onChange={(event) =>
                    setParameterForm((current) => ({ ...current, unit: event.target.value }))
                  }
                  disabled={!canEditTenantData}
                />
              </label>
              <button className="secondaryButton" type="button" onClick={createParameter} disabled={!canEditTenantData}>
                <Save size={17} />
                Save parameter
              </button>
            </div>
          </section>

          <section id="materials" className="panel materialPanel">
            <div className="panelHeader">
              <h2>Raw materials</h2>
              <span>{workspace.rawMaterials.length} rows</span>
            </div>
            <div className="materialForm">
              <label>
                <span>Code</span>
                <input
                  value={materialForm.code}
                  onChange={(event) =>
                    setMaterialForm((current) => ({ ...current, code: event.target.value }))
                  }
                  disabled={!canEditTenantData}
                />
              </label>
              <label>
                <span>Name</span>
                <input
                  value={materialForm.name}
                  onChange={(event) =>
                    setMaterialForm((current) => ({ ...current, name: event.target.value }))
                  }
                  disabled={!canEditTenantData}
                />
              </label>
              <label>
                <span>Price EUR/kg</span>
                <input
                  inputMode="decimal"
                  value={materialForm.price}
                  onChange={(event) =>
                    setMaterialForm((current) => ({ ...current, price: event.target.value }))
                  }
                  disabled={!canEditTenantData}
                />
              </label>
              <label>
                <span>{workspace.parameter ? workspace.parameter.name : "Value"}</span>
                <input
                  inputMode="decimal"
                  value={materialForm.parameterValue}
                  onChange={(event) =>
                    setMaterialForm((current) => ({
                      ...current,
                      parameterValue: event.target.value,
                    }))
                  }
                  disabled={!canEditTenantData || !workspace.parameter}
                />
              </label>
              <button className="secondaryButton" type="button" onClick={createMaterial} disabled={!canEditTenantData}>
                <Plus size={17} />
                Add material
              </button>
            </div>
            <div className="materialTable">
              <div className="materialHead">
                <span>Code</span>
                <span>Name</span>
                <span>Price</span>
                <span>{workspace.parameter?.code ?? "Parameter"}</span>
                <span>Formula</span>
              </div>
              {workspace.rawMaterials.length === 0 ? (
                <div className="empty">No raw materials yet.</div>
              ) : (
                workspace.rawMaterials.map((material) => (
                  <div className="materialRowWrap" key={material.id}>
                    <div className="materialRow">
                      <code>{material.code || "-"}</code>
                      <span>{material.name}</span>
                      <span>{material.price === null ? "-" : material.price.toFixed(2)}</span>
                      <span>{material.parameterValue === null ? "-" : material.parameterValue.toFixed(2)}</span>
                      <button
                        className="iconButton"
                        type="button"
                        onClick={() => addFormulaLine(material.id)}
                        disabled={isBusy}
                        title="Add to formula"
                        aria-label={`Add ${material.name} to formula`}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <div className="aliasEditor">
                      <span>Aliases</span>
                      <div className="aliasTags">
                        {material.aliases.length ? (
                          material.aliases.map((alias) => <code key={alias}>{alias}</code>)
                        ) : (
                          <em>None</em>
                        )}
                      </div>
                      <input
                        aria-label={`${material.name} alias`}
                        value={aliasInputs[material.id] ?? ""}
                        onChange={(event) =>
                          setAliasInputs((current) => ({
                            ...current,
                            [material.id]: event.target.value,
                          }))
                        }
                        disabled={isBusy}
                      />
                      <button
                        className="iconButton"
                        type="button"
                        onClick={() => createAlias(material.id)}
                        disabled={isBusy}
                        title="Add alias"
                        aria-label={`Add alias for ${material.name}`}
                      >
                        <Save size={16} />
                      </button>
                    </div>
                    <div className="priceEditor">
                      <span>Prices</span>
                      <div className="priceTags">
                        {material.priceHistory.length ? (
                          material.priceHistory.slice(0, 3).map((price) => (
                            <code key={price.id}>{formatPriceEntry(price)}</code>
                          ))
                        ) : (
                          <em>None</em>
                        )}
                      </div>
                      <input
                        aria-label={`${material.name} price`}
                        inputMode="decimal"
                        value={priceInputs[material.id] ?? ""}
                        onChange={(event) =>
                          setPriceInputs((current) => ({
                            ...current,
                            [material.id]: event.target.value,
                          }))
                        }
                        disabled={isBusy}
                      />
                      <button
                        className="iconButton"
                        type="button"
                        onClick={() => createPrice(material.id)}
                        disabled={isBusy}
                        title="Add price"
                        aria-label={`Add price for ${material.name}`}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section id="library" className="panel libraryPanel">
            <div className="panelHeader">
              <h2>Formula library</h2>
              <span>{formulas.length} formulas</span>
            </div>
            <div className="libraryActions">
              <button
                className="secondaryButton"
                type="button"
                onClick={() => refreshFormulaLibrary()}
                disabled={!canEditTenantData}
              >
                <RefreshCw size={17} />
                Refresh library
              </button>
            </div>
            <div className="comparisonPanel">
              <div className="comparisonControls">
                <label>
                  <span>Baseline</span>
                  <select
                    aria-label="Comparison baseline"
                    value={comparisonLeftId}
                    onChange={(event) => {
                      setComparisonLeftId(event.target.value);
                      setFormulaComparison(null);
                    }}
                    disabled={!canEditTenantData || formulas.length < 2}
                  >
                    <option value="">Select formula</option>
                    {formulas.map((formula) => (
                      <option key={formula.id} value={formula.id}>
                        {formula.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Candidate</span>
                  <select
                    aria-label="Comparison candidate"
                    value={comparisonRightId}
                    onChange={(event) => {
                      setComparisonRightId(event.target.value);
                      setFormulaComparison(null);
                    }}
                    disabled={!canEditTenantData || formulas.length < 2}
                  >
                    <option value="">Select formula</option>
                    {formulas.map((formula) => (
                      <option key={formula.id} value={formula.id}>
                        {formula.name}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  className="secondaryButton"
                  type="button"
                  onClick={compareSelectedFormulas}
                  disabled={!canCompareFormulas}
                >
                  <ListChecks size={17} />
                  Compare
                </button>
              </div>
              {formulaComparison ? (
                <>
                  <div className="comparisonStats">
                    <div>
                      <span>Price delta</span>
                      <strong>
                        {formulaComparison.delta.price_total === null
                          ? "-"
                          : `${formatSignedNumber(formulaComparison.delta.price_total)} ${
                              formulaComparison.right.currency
                            }/kg`}
                      </strong>
                    </div>
                    <div>
                      <span>Total delta</span>
                      <strong>
                        {formatSignedNumber(formulaComparison.delta.total_percentage, 1)}%
                      </strong>
                    </div>
                    <div>
                      <span>Lines</span>
                      <strong>
                        {formulaComparison.left.line_count} {"->"} {formulaComparison.right.line_count}
                      </strong>
                    </div>
                  </div>
                  <div className="comparisonParameters">
                    {formulaComparison.delta.parameters.length ? (
                      formulaComparison.delta.parameters.map((parameter) => (
                        <div key={parameter.code}>
                          <span>{parameter.code}</span>
                          <strong>
                            {formatSignedNumber(parameter.delta)}
                            {parameter.unit ? ` ${parameter.unit}` : ""}
                          </strong>
                        </div>
                      ))
                    ) : (
                      <span>No calculated parameter differences</span>
                    )}
                  </div>
                </>
              ) : null}
            </div>
            <div className="libraryGrid">
              <div className="formulaList">
                <div className="formulaListHead">
                  <span>Name</span>
                  <span>Objective</span>
                  <span>Price</span>
                  <span>Lines</span>
                  <span>Open</span>
                  <span>Export</span>
                </div>
                {formulas.length === 0 ? (
                  <div className="empty">No saved formulas yet.</div>
                ) : (
                  formulas.map((formula) => (
                    <div className="formulaListRow" key={formula.id}>
                      <span>{formula.name}</span>
                      <span>{formulaObjectiveLabel(formula.objective)}</span>
                      <span>
                        {formula.total_price === null
                          ? "-"
                          : `${formula.total_price.toFixed(2)} ${formula.currency}/kg`}
                      </span>
                      <span>{formula.items.length}</span>
                      <button
                        className="iconButton"
                        type="button"
                        onClick={() => openFormula(formula)}
                        disabled={isBusy}
                        title="Open formula"
                        aria-label={`Open ${formula.name}`}
                      >
                        <FolderOpen size={16} />
                      </button>
                      <button
                        className="iconButton"
                        type="button"
                        onClick={() => downloadFormulaExcel(formula)}
                        disabled={!canEditTenantData}
                        title="Download Excel"
                        aria-label={`Download ${formula.name} Excel`}
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
              <div className="sideHistoryStack">
                <div className="historyList">
                  <div className="historyTitle">
                    <History size={17} />
                    <strong>Calculation history</strong>
                  </div>
                  {calculationHistory.length === 0 ? (
                    <div className="empty">No calculations yet.</div>
                  ) : (
                    calculationHistory.map((entry) => (
                      <div className="historyRow" key={entry.id}>
                        <span>{formatDateTime(entry.calculated_at)}</span>
                        <strong>
                          {entry.price_total === null
                            ? "-"
                            : `${entry.price_total.toFixed(2)} ${entry.result_json.currency}/kg`}
                        </strong>
                        <span>
                          {entry.result_json.total_percentage.toFixed(1)}% -{" "}
                          {entry.result_json.warnings.length} warnings
                        </span>
                      </div>
                    ))
                  )}
                </div>
                <div className="historyList">
                  <div className="historyTitle">
                    <Settings2 size={17} />
                    <strong>Optimization history</strong>
                  </div>
                  {optimizationHistory.length === 0 ? (
                    <div className="empty">No optimization runs yet.</div>
                  ) : (
                    optimizationHistory.map((run) => (
                      <div
                        className="historyRow optimizationHistoryRow"
                        data-selected={run.id === selectedOptimizationRunId ? "true" : undefined}
                        data-state={run.status}
                        key={run.id}
                      >
                        <div className="historyRowTop">
                          <span>{formatDateTime(run.created_at)}</span>
                          <strong className="historyStatus">
                            {optimizationStatusLabel(run.status)}
                          </strong>
                        </div>
                        <strong>{optimizationHistoryPrice(run)}</strong>
                        <span>
                          {run.result_json.items.length} lines -{" "}
                          {optimizationHistoryFormulaLabel(run)}
                        </span>
                        <div className="historyActions">
                          <span>{formulaObjectiveLabel(run.objective)}</span>
                          <div className="historyActionButtons">
                            <button
                              className="secondaryButton compactButton"
                              type="button"
                              onClick={() => setSelectedOptimizationRunId(run.id)}
                              disabled={isBusy}
                            >
                              <ListChecks size={16} />
                              Details
                            </button>
                            <button
                              className="secondaryButton compactButton"
                              type="button"
                              onClick={() => loadOptimizationRun(run)}
                              disabled={
                                isBusy ||
                                run.status !== "success" ||
                                run.result_json.calculation === null
                              }
                            >
                              <FolderOpen size={16} />
                              Load
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="optimizationDetail">
                  <div className="historyTitle">
                    <ListChecks size={17} />
                    <strong>Run details</strong>
                  </div>
                  {selectedOptimizationRun ? (
                    <>
                      <div className="detailStats">
                        <div>
                          <span>Status</span>
                          <strong>{optimizationStatusLabel(selectedOptimizationRun.status)}</strong>
                        </div>
                        <div>
                          <span>Objective</span>
                          <strong>{formulaObjectiveLabel(selectedOptimizationRun.objective)}</strong>
                        </div>
                        <div>
                          <span>Candidates</span>
                          <strong>
                            {selectedOptimizationRun.request_json.candidate_raw_material_ids.length}
                          </strong>
                        </div>
                        <div>
                          <span>Result</span>
                          <strong>{optimizationHistoryPrice(selectedOptimizationRun)}</strong>
                        </div>
                      </div>
                      <div className="detailGroup">
                        <span>Candidates</span>
                        <div className="detailPills">
                          {selectedOptimizationRun.request_json.candidate_raw_material_ids.map(
                            (rawMaterialId) => (
                              <strong key={rawMaterialId}>{rawMaterialLabel(rawMaterialId)}</strong>
                            ),
                          )}
                        </div>
                      </div>
                      <div className="detailGroup">
                        <span>Raw material bounds</span>
                        {selectedOptimizationRun.request_json.raw_material_bounds.length ? (
                          selectedOptimizationRun.request_json.raw_material_bounds.map((bound) => (
                            <div className="detailLine" key={bound.raw_material_id}>
                              <strong>{rawMaterialLabel(bound.raw_material_id)}</strong>
                              <span>
                                {formatBoundRange(
                                  bound.min_percentage,
                                  bound.max_percentage,
                                  "%",
                                )}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="detailMuted">No raw material bounds</div>
                        )}
                      </div>
                      <div className="detailGroup">
                        <span>Parameter bounds</span>
                        {selectedOptimizationRun.request_json.parameter_bounds.length ? (
                          selectedOptimizationRun.request_json.parameter_bounds.map((bound) => (
                            <div className="detailLine" key={bound.code}>
                              <strong>{bound.code}</strong>
                              <span>{formatBoundRange(bound.min_value, bound.max_value, "")}</span>
                            </div>
                          ))
                        ) : (
                          <div className="detailMuted">No parameter bounds</div>
                        )}
                      </div>
                      <div className="detailGroup">
                        <span>Messages</span>
                        {selectedOptimizationMessages.length ? (
                          selectedOptimizationMessages.map((item, index) => (
                            <div className="detailMessage" key={`${item}-${index}`}>
                              <AlertTriangle size={15} />
                              <span>{item}</span>
                            </div>
                          ))
                        ) : (
                          <div className="detailMuted">No messages</div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="empty">Select an optimization run.</div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section id="import" className="panel importPanel">
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
                  onChange={(event) => selectExcelImportFile(event.target.files?.[0] ?? null)}
                  disabled={!canEditTenantData}
                />
              </label>
              <label className="sheetSelector">
                <span>Sheet</span>
                <select
                  aria-label="Excel sheet"
                  value={selectedImportSheet}
                  onChange={(event) => previewSelectedImportSheet(event.target.value)}
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
              <button className="secondaryButton" type="button" onClick={saveExcelImport} disabled={!canSaveImport}>
                <Save size={17} />
                Save formula
              </button>
            </div>
            {availableImportColumns.length ? (
              <div className="columnMapping">
                <label>
                  <span>Material name</span>
                  <select
                    aria-label="Material name column"
                    value={importColumnMapping.materialNameColumn}
                    onChange={(event) =>
                      setImportColumnMapping((current) => ({
                        ...current,
                        materialNameColumn: event.target.value,
                      }))
                    }
                    disabled={isBusy}
                  >
                    <option value="">No name column</option>
                    {availableImportColumns.map((column, index) => (
                      <option key={`${column}-${index}`} value={column}>
                        {column}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Material code</span>
                  <select
                    aria-label="Material code column"
                    value={importColumnMapping.materialCodeColumn}
                    onChange={(event) =>
                      setImportColumnMapping((current) => ({
                        ...current,
                        materialCodeColumn: event.target.value,
                      }))
                    }
                    disabled={isBusy}
                  >
                    <option value="">No code column</option>
                    {availableImportColumns.map((column, index) => (
                      <option key={`${column}-${index}`} value={column}>
                        {column}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Percentage</span>
                  <select
                    aria-label="Percentage column"
                    value={importColumnMapping.percentageColumn}
                    onChange={(event) =>
                      setImportColumnMapping((current) => ({
                        ...current,
                        percentageColumn: event.target.value,
                      }))
                    }
                    disabled={isBusy}
                  >
                    <option value="">Select share column</option>
                    {availableImportColumns.map((column, index) => (
                      <option key={`${column}-${index}`} value={column}>
                        {column}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  className="secondaryButton"
                  type="button"
                  onClick={applyImportColumnMapping}
                  disabled={!canApplyImportColumnMapping}
                >
                  <RefreshCw size={17} />
                  Apply mapping
                </button>
              </div>
            ) : null}
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
                          onChange={(event) => resolveImportRow(row.row_number, event.target.value)}
                          disabled={isBusy}
                        >
                          <option value="" disabled>
                            Select material
                          </option>
                          {workspace.rawMaterials.map((material) => (
                            <option key={material.id} value={material.id}>
                              {material.code ? `${material.code} - ${material.name}` : material.name}
                            </option>
                          ))}
                        </select>
                        <button
                          aria-label={`Create material for row ${row.row_number}`}
                          className="iconButton"
                          disabled={isBusy}
                          onClick={() => createMaterialFromImportRow(row)}
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
                            onClick={() => acceptImportSuggestion(row)}
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
                          onClick={() => createAliasFromImportRow(row)}
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

          <section id="formula" className="panel formulaPanel">
            <div className="panelHeader">
              <h2>Formula</h2>
              <span>{totalPercentage.toFixed(1)}%</span>
            </div>
            <label className="fullWidthLabel">
              <span>Name</span>
              <input
                value={workspace.formulaName}
                onChange={(event) =>
                  setWorkspace((current) => ({ ...current, formulaName: event.target.value }))
                }
                disabled={isBusy}
              />
            </label>
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
                <strong>{totalPercentage === 100 ? "Balanced" : "Draft"}</strong>
              </div>
              <div>
                <span>Calculation source</span>
                <strong>Backend</strong>
              </div>
            </div>
            <div className="optimizerPanel">
              <div className="optimizerControls">
                <label>
                  <span>
                    {workspace.parameter
                      ? `Minimum ${workspace.parameter.code}`
                      : "Parameter minimum"}
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={optimizerParameterMinValue}
                    onChange={(event) => {
                      setOptimizerParameterMinValue(event.target.value);
                      setOptimizationRun(null);
                    }}
                    disabled={!canEditTenantData || !workspace.parameter}
                    placeholder="Optional"
                  />
                </label>
                <label>
                  <span>
                    {workspace.parameter
                      ? `Maximum ${workspace.parameter.code}`
                      : "Parameter maximum"}
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={optimizerParameterMaxValue}
                    onChange={(event) => {
                      setOptimizerParameterMaxValue(event.target.value);
                      setOptimizationRun(null);
                    }}
                    disabled={!canEditTenantData || !workspace.parameter}
                    placeholder="Optional"
                  />
                </label>
                <button
                  className="secondaryButton"
                  type="button"
                  onClick={runOptimizer}
                  disabled={!canRunOptimizer}
                >
                  <Settings2 size={17} />
                  Optimize
                </button>
              </div>
              <div className="optimizerCandidates">
                {workspace.rawMaterials.length ? (
                  workspace.rawMaterials.map((material) => {
                    const config = optimizerCandidateConfig(material.id);
                    return (
                      <div className="optimizerCandidate" key={material.id}>
                        <label className="candidateToggle">
                          <input
                            aria-label={`${material.name} optimizer candidate`}
                            type="checkbox"
                            checked={config.enabled}
                            onChange={(event) =>
                              updateOptimizerCandidate(material.id, {
                                enabled: event.target.checked,
                              })
                            }
                            disabled={isBusy}
                          />
                          <span>{material.name}</span>
                        </label>
                        <input
                          aria-label={`${material.name} optimizer minimum`}
                          inputMode="decimal"
                          value={config.minPercentage}
                          onChange={(event) =>
                            updateOptimizerCandidate(material.id, {
                              minPercentage: event.target.value,
                            })
                          }
                          disabled={isBusy || !config.enabled}
                          placeholder="Min %"
                        />
                        <input
                          aria-label={`${material.name} optimizer maximum`}
                          inputMode="decimal"
                          value={config.maxPercentage}
                          onChange={(event) =>
                            updateOptimizerCandidate(material.id, {
                              maxPercentage: event.target.value,
                            })
                          }
                          disabled={isBusy || !config.enabled}
                          placeholder="Max %"
                        />
                      </div>
                    );
                  })
                ) : (
                  <div className="empty">Create raw materials to optimize.</div>
                )}
              </div>
              {optimizationRun ? (
                <>
                  <div className="optimizerStats" data-state={optimizationRun.status}>
                    <div>
                      <span>Status</span>
                      <strong>{optimizationStatusLabel(optimizationRun.status)}</strong>
                    </div>
                    <div>
                      <span>Price</span>
                      <strong>
                        {optimizationRun.calculation?.price_total == null
                          ? "-"
                          : `${optimizationRun.calculation.price_total.toFixed(2)} ${
                              optimizationRun.calculation.currency
                            }/kg`}
                      </strong>
                    </div>
                    <div>
                      <span>Lines</span>
                      <strong>{optimizationRun.items.length}</strong>
                    </div>
                  </div>
                  {optimizerFeedbackMessages.length ? (
                    <div className="optimizerMessages">
                      {optimizerFeedbackMessages.map((item, index) => (
                        <div key={`${item}-${index}`}>
                          <AlertTriangle size={15} />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {optimizationRun.status === "success" ? (
                    <button
                      className="secondaryButton"
                      type="button"
                      onClick={saveOptimizedFormula}
                      disabled={!canSaveOptimizedFormula}
                    >
                      <Save size={17} />
                      Save optimized
                    </button>
                  ) : null}
                </>
              ) : null}
            </div>
            <div className="formulaLines">
              {workspace.formulaLines.length === 0 ? (
                <div className="empty">Add materials to build a formula.</div>
              ) : (
                workspace.formulaLines.map((line, index) => {
                  const material = rawMaterialsById.get(line.rawMaterialId);
                  const materialName = material?.name ?? "material";
                  return (
                    <div className="formulaLine" key={line.localId}>
                      <span>{material?.name ?? "Unknown material"}</span>
                      <input
                        aria-label={`${material?.name ?? "Material"} percentage`}
                        type="number"
                        min={0}
                        max={100}
                        step={0.1}
                        value={line.percentage}
                        onChange={(event) =>
                          updateFormulaLine(line.localId, Number(event.target.value))
                        }
                        disabled={isBusy}
                      />
                      <div className="lineMoveButtons">
                        <button
                          className="iconButton"
                          type="button"
                          onClick={() => moveFormulaLine(line.localId, -1)}
                          disabled={isBusy || index === 0}
                          title="Move up"
                          aria-label={`Move ${materialName} up`}
                        >
                          <ArrowUp size={16} />
                        </button>
                        <button
                          className="iconButton"
                          type="button"
                          onClick={() => moveFormulaLine(line.localId, 1)}
                          disabled={isBusy || index === workspace.formulaLines.length - 1}
                          title="Move down"
                          aria-label={`Move ${materialName} down`}
                        >
                          <ArrowDown size={16} />
                        </button>
                      </div>
                      <button
                        className="iconButton danger"
                        type="button"
                        onClick={() => removeFormulaLine(line.localId)}
                        disabled={isBusy}
                        title="Remove line"
                        aria-label={`Remove ${material?.name ?? "material"} from formula`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <section id="results" className="panel resultPanel">
            <div className="panelHeader">
              <h2>Calculation results</h2>
              <span>{result ? result.currency : "Pending"}</span>
            </div>
            <div className="resultStats">
              <div>
                <span>Total price</span>
                <strong>
                  {result?.price_total == null
                    ? "-"
                    : `${result.price_total.toFixed(2)} ${result.currency}/kg`}
                </strong>
              </div>
              <div>
                <span>Total percentage</span>
                <strong>{result ? `${result.total_percentage.toFixed(1)}%` : "-"}</strong>
              </div>
              <div>
                <span>Warnings</span>
                <strong>{result?.warnings.length ?? 0}</strong>
              </div>
            </div>
            <div className="parameterList">
              {result?.parameters.length ? (
                result.parameters.map((parameter) => (
                  <div key={parameter.code}>
                    <Beaker size={18} />
                    <span>{parameter.code}</span>
                    <code>
                      {parameter.value.toFixed(2)} {parameter.unit ?? ""}
                    </code>
                  </div>
                ))
              ) : (
                <div>
                  <Beaker size={18} />
                  <span>No calculated parameters</span>
                  <code>-</code>
                </div>
              )}
            </div>
            <div className="warningList">
              {result?.warnings.length ? (
                result.warnings.map((warning) => (
                  <div key={`${warning.code}-${warning.raw_material_id ?? ""}-${warning.parameter_code ?? ""}`}>
                    <AlertTriangle size={16} />
                    <span>{warning.message}</span>
                  </div>
                ))
              ) : (
                <div>No warnings</div>
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
