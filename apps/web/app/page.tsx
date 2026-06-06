"use client";

import {
  AlertTriangle,
  Beaker,
  BrainCircuit,
  Calculator,
  Check,
  Database,
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
  formatDateTime,
  makeLocalId,
  normalizeCode,
  parseOptionalNumber,
  slugify,
  toWorkspaceRawMaterial,
  withRawMaterialAlias,
  withResolvedImportRow,
  type CalculationResult,
  type CompatibilityRuleRead,
  type AiRun,
  type AgentCandidate,
  type AgentFormulaCandidate,
  type AgentPlan,
  type FormulaLine,
  type ExcelImportPreview,
  type ExcelImportPreviewRow,
  type ExcelImportSheets,
  type FormulaCalculationHistory,
  type FormulaRead,
  type MaterialForm,
  type RawMaterialAliasRead,
  type ParameterRead,
  type RawMaterialRead,
  type RequirementConstraint,
  type RequirementParse,
  type Status,
  type TenantRead,
  type WorkspaceState,
} from "./workspace-model";
import {
  buildConstraintEvaluations,
  buildConstraintComplianceSummary,
  buildDraftComparison,
  buildSavedFormulaComparison,
  hasConstraintIssue,
  type DraftReviewState,
  type SavedFormulaComparison,
} from "./workspace-comparison";

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
  const [aliasInputs, setAliasInputs] = useState<Record<string, string>>({});
  const [formulas, setFormulas] = useState<FormulaRead[]>([]);
  const [calculationHistory, setCalculationHistory] = useState<FormulaCalculationHistory[]>([]);
  const [compatibilityRules, setCompatibilityRules] = useState<CompatibilityRuleRead[]>([]);
  const [compatibilityRuleForm, setCompatibilityRuleForm] = useState({
    materialAId: "",
    materialBId: "",
    severity: "warning",
    message: "",
    recommendedAction: "",
  });
  const [requirementText, setRequirementText] = useState(
    "Liquido barato con contenido activo minimo 12% y precio maximo 2 EUR/kg. Dame 2 alternativas.",
  );
  const [requirementParse, setRequirementParse] = useState<RequirementParse | null>(null);
  const [agentPlan, setAgentPlan] = useState<AgentPlan | null>(null);
  const [draftReview, setDraftReview] = useState<DraftReviewState | null>(null);
  const [aiRuns, setAiRuns] = useState<AiRun[]>([]);
  const [formulaCompareSelection, setFormulaCompareSelection] = useState({
    baselineId: "",
    candidateId: "",
  });
  const [comparisonConstraintForm, setComparisonConstraintForm] = useState({
    maxPrice: "",
    parameterCode: "active_content",
    minParameterValue: "",
    materialId: "",
    minMaterialPercentage: "",
    maxMaterialPercentage: "",
  });
  const [showOnlyConstraintIssues, setShowOnlyConstraintIssues] = useState(false);
  const [savedFormulaComparison, setSavedFormulaComparison] =
    useState<SavedFormulaComparison | null>(null);
  const [importPreview, setImportPreview] = useState<ExcelImportPreview | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importFileName, setImportFileName] = useState("");
  const [availableImportSheets, setAvailableImportSheets] = useState<string[]>([]);
  const [selectedImportSheet, setSelectedImportSheet] = useState("");
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
  const draftComparison = useMemo(
    () => buildDraftComparison(draftReview, workspace.formulaLines, rawMaterialsById),
    [draftReview, rawMaterialsById, workspace.formulaLines],
  );
  const comparisonMaterialOptions = useMemo(() => {
    const options = new Map<string, string>();
    workspace.rawMaterials.forEach((material) => options.set(material.id, material.name));
    const selectedFormulaIds = new Set([
      formulaCompareSelection.baselineId,
      formulaCompareSelection.candidateId,
    ]);
    formulas
      .filter((formula) => selectedFormulaIds.has(formula.id))
      .flatMap((formula) => formula.items)
      .forEach((item) => {
        if (!options.has(item.raw_material_id)) {
          options.set(item.raw_material_id, `Material ${item.raw_material_id.slice(0, 8)}`);
        }
      });
    return Array.from(options, ([id, name]) => ({ id, name })).sort((left, right) =>
      left.name.localeCompare(right.name),
    );
  }, [formulaCompareSelection, formulas, workspace.rawMaterials]);
  const comparisonConstraints = useMemo(
    () => ({
      maxPrice: parseOptionalNumber(comparisonConstraintForm.maxPrice),
      parameterCode: normalizeCode(comparisonConstraintForm.parameterCode),
      minParameterValue: parseOptionalNumber(comparisonConstraintForm.minParameterValue),
      materialId: comparisonConstraintForm.materialId,
      materialName:
        comparisonMaterialOptions.find(
          (material) => material.id === comparisonConstraintForm.materialId,
        )?.name ?? "Selected material",
      minMaterialPercentage: parseOptionalNumber(comparisonConstraintForm.minMaterialPercentage),
      maxMaterialPercentage: parseOptionalNumber(comparisonConstraintForm.maxMaterialPercentage),
    }),
    [comparisonConstraintForm, comparisonMaterialOptions],
  );
  const comparisonConstraintEvaluations = useMemo(
    () => buildConstraintEvaluations(savedFormulaComparison, comparisonConstraints),
    [comparisonConstraints, savedFormulaComparison],
  );
  const comparisonComplianceSummary = useMemo(
    () => buildConstraintComplianceSummary(comparisonConstraintEvaluations),
    [comparisonConstraintEvaluations],
  );
  const comparisonConstraintIssueCount = useMemo(
    () => comparisonConstraintEvaluations.filter(hasConstraintIssue).length,
    [comparisonConstraintEvaluations],
  );
  const visibleComparisonConstraintEvaluations = useMemo(
    () =>
      showOnlyConstraintIssues
        ? comparisonConstraintEvaluations.filter(hasConstraintIssue)
        : comparisonConstraintEvaluations,
    [comparisonConstraintEvaluations, showOnlyConstraintIssues],
  );
  const totalPercentage = workspace.formulaLines.reduce(
    (sum, line) => sum + line.percentage,
    0,
  );
  const isBusy = status === "working";
  const canEditTenantData = Boolean(workspace.tenant) && !isBusy;
  const hasPendingDraftReview = draftReview !== null && draftReview.status !== "confirmed";
  const canConfirmDraftReview =
    draftReview !== null &&
    draftReview.status !== "confirmed" &&
    draftReview.notes.trim().length >= 3 &&
    !isBusy;
  const canCalculate =
    Boolean(workspace.tenant) &&
    workspace.formulaLines.length > 0 &&
    !hasPendingDraftReview &&
    !isBusy;
  const canCompareSavedFormulas =
    Boolean(workspace.tenant) &&
    Boolean(formulaCompareSelection.baselineId) &&
    Boolean(formulaCompareSelection.candidateId) &&
    formulaCompareSelection.baselineId !== formulaCompareSelection.candidateId &&
    !isBusy;
  const canSelectImportSheet = availableImportSheets.length > 1 && Boolean(importFile) && !isBusy;
  const canSaveImport =
    Boolean(importPreview) &&
    importPreview?.rows.length !== 0 &&
    importPreview?.pending_rows === 0 &&
    !isBusy;
  const canParseRequirements =
    Boolean(workspace.tenant) && requirementText.trim().length >= 3 && !isBusy;
  const canPlanRequirements = canParseRequirements;
  const canCreateCompatibilityRule =
    Boolean(workspace.tenant) &&
    Boolean(compatibilityRuleForm.materialAId) &&
    Boolean(compatibilityRuleForm.materialBId) &&
    compatibilityRuleForm.materialAId !== compatibilityRuleForm.materialBId &&
    compatibilityRuleForm.message.trim().length > 0 &&
    !isBusy;

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
      setCompatibilityRules([]);
      setCompatibilityRuleForm({
        materialAId: "",
        materialBId: "",
        severity: "warning",
        message: "",
        recommendedAction: "",
      });
      setRequirementParse(null);
      setAgentPlan(null);
      setDraftReview(null);
      setFormulaCompareSelection({ baselineId: "", candidateId: "" });
      setComparisonConstraintForm({
        maxPrice: "",
        parameterCode: "active_content",
        minParameterValue: "",
        materialId: "",
        minMaterialPercentage: "",
        maxMaterialPercentage: "",
      });
      setShowOnlyConstraintIssues(false);
      setSavedFormulaComparison(null);
      setAiRuns([]);
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
      setComparisonConstraintForm((current) => ({
        ...current,
        parameterCode: parameter.code,
      }));
      setResult(null);
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

      if (price !== null) {
        await request<Record<string, unknown>>(`/api/v1/raw-materials/${material.id}/prices`, {
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
            price,
            parameterValue: workspace.parameter ? parameterValue : null,
          }),
        ],
      }));
      setMaterialForm({ code: "", name: "", price: "", parameterValue: "" });
      setResult(null);
      resetImportState();
      setMessage("Raw material ready");
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
      setImportPreview((current) =>
        current ? withResolvedImportRow(current, row.row_number, material.id) : current,
      );
      setResult(null);
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

  async function createCompatibilityRule() {
    if (!workspace.tenant) {
      setError("Create a workspace first");
      return;
    }
    if (!compatibilityRuleForm.materialAId || !compatibilityRuleForm.materialBId) {
      setError("Select two raw materials");
      return;
    }
    if (compatibilityRuleForm.materialAId === compatibilityRuleForm.materialBId) {
      setError("Select two different raw materials");
      return;
    }
    const message = compatibilityRuleForm.message.trim();
    if (!message) {
      setError("Compatibility message is required");
      return;
    }

    await runAction("Creating compatibility rule", async () => {
      const rule = await request<CompatibilityRuleRead>("/api/v1/compatibility-rules", {
        method: "POST",
        headers,
        body: JSON.stringify({
          material_a_id: compatibilityRuleForm.materialAId,
          material_b_id: compatibilityRuleForm.materialBId,
          severity: compatibilityRuleForm.severity,
          message,
          recommended_action: compatibilityRuleForm.recommendedAction.trim() || null,
        }),
      });
      setCompatibilityRules((current) => [rule, ...current]);
      setCompatibilityRuleForm((current) => ({
        ...current,
        message: "",
        recommendedAction: "",
      }));
      setResult(null);
      setMessage("Compatibility rule ready");
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

  function markDraftReviewPending() {
    setDraftReview((current) =>
      current && current.status === "confirmed"
        ? { ...current, reviewedResult: null, status: "pending" }
        : current,
    );
  }

  function updateDraftReviewNotes(notes: string) {
    setDraftReview((current) =>
      current
        ? {
            ...current,
            notes,
            reviewedResult: current.status === "confirmed" ? null : current.reviewedResult,
            status: current.status === "confirmed" ? "pending" : current.status,
          }
        : current,
    );
  }

  async function confirmDraftReview() {
    if (!draftReview) {
      return;
    }
    const notes = draftReview.notes.trim();
    if (notes.length < 3) {
      setError("Decision notes are required before saving a draft");
      return;
    }

    await runAction("Confirming draft review", async () => {
      const reviewedResult = await calculateAdHocFormula(
        workspace.formulaLines,
        draftReview.requiredParameterCodes,
      );
      setDraftReview((current) =>
        current
          ? {
              ...current,
              notes,
              reviewedResult,
              status: "confirmed",
            }
          : current,
      );
      setResult(reviewedResult);
      setMessage("Draft review confirmed");
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
    markDraftReviewPending();
    setResult(null);
  }

  function removeFormulaLine(localId: string) {
    setWorkspace((current) => ({
      ...current,
      formulaLines: current.formulaLines.filter((line) => line.localId !== localId),
    }));
    markDraftReviewPending();
    setResult(null);
  }

  function updateFormulaLine(localId: string, percentage: number) {
    setWorkspace((current) => ({
      ...current,
      formulaLines: current.formulaLines.map((line) =>
        line.localId === localId ? { ...line, percentage } : line,
      ),
    }));
    markDraftReviewPending();
    setResult(null);
  }

  async function calculateAdHocFormula(
    lines: FormulaLine[],
    requiredParameterCodes: string[] = [],
  ): Promise<CalculationResult> {
    return request<CalculationResult>("/api/v1/formulas/calculate", {
      method: "POST",
      headers,
      body: JSON.stringify({
        items: lines.map((line, index) => ({
          raw_material_id: line.rawMaterialId,
          percentage: line.percentage,
          order_index: index,
        })),
        required_parameter_codes: requiredParameterCodes,
      }),
    });
  }

  async function calculatePersistedFormula(formulaId: string): Promise<CalculationResult> {
    return request<CalculationResult>(`/api/v1/formulas/${formulaId}/calculate`, {
      method: "POST",
      headers,
    });
  }

  function selectFormulaForComparison(field: "baselineId" | "candidateId", formulaId: string) {
    setFormulaCompareSelection((current) => ({
      ...current,
      [field]: formulaId,
    }));
    setSavedFormulaComparison(null);
  }

  async function compareSavedFormulas() {
    if (!workspace.tenant) {
      setError("Create a workspace first");
      return;
    }
    if (
      !formulaCompareSelection.baselineId ||
      !formulaCompareSelection.candidateId ||
      formulaCompareSelection.baselineId === formulaCompareSelection.candidateId
    ) {
      setError("Select two different saved formulas");
      return;
    }

    const baseline = formulas.find(
      (formula) => formula.id === formulaCompareSelection.baselineId,
    );
    const candidate = formulas.find(
      (formula) => formula.id === formulaCompareSelection.candidateId,
    );
    if (!baseline || !candidate) {
      setError("Refresh the formula library before comparing");
      return;
    }

    await runAction("Comparing saved formulas", async () => {
      const [baselineResult, candidateResult] = await Promise.all([
        calculatePersistedFormula(baseline.id),
        calculatePersistedFormula(candidate.id),
      ]);
      setSavedFormulaComparison(
        buildSavedFormulaComparison(
          baseline,
          candidate,
          baselineResult,
          candidateResult,
          rawMaterialsById,
        ),
      );
      await refreshFormulaLibrary({ silent: true });
      setMessage("Formula comparison ready");
    });
  }

  async function applyOptimizerDraft(candidate: AgentFormulaCandidate) {
    if (!workspace.tenant) {
      setError("Create a workspace first");
      return;
    }
    if (!candidate.items.length) {
      setError("Draft candidate has no formula lines");
      return;
    }

    const candidateMaterials = new Map(
      agentPlan?.candidate_research?.candidates.map((material) => [
        material.raw_material_id,
        material,
      ]) ?? [],
    );
    const formulaLines = candidate.items.map((item) => ({
      localId: makeLocalId(),
      rawMaterialId: item.raw_material_id,
      percentage: item.percentage,
    }));
    const requiredParameterCodes = candidate.parameters.map((parameter) => parameter.code);

    await runAction("Applying optimizer draft", async () => {
      const calculation = await calculateAdHocFormula(formulaLines, requiredParameterCodes);
      setWorkspace((current) => {
        const existingMaterialIds = new Set(
          current.rawMaterials.map((material) => material.id),
        );
        const addedMaterials = candidate.items
          .filter((item) => !existingMaterialIds.has(item.raw_material_id))
          .map((item) => {
            const material = candidateMaterials.get(item.raw_material_id);
            const activeParameter = current.parameter
              ? material?.parameters[current.parameter.code]
              : undefined;
            return {
              id: item.raw_material_id,
              code: material?.code ?? null,
              name: item.name,
              price: material?.price_eur_per_kg ?? null,
              parameterValue: activeParameter?.value ?? null,
              aliases: [],
            };
          });
        return {
          ...current,
          rawMaterials: [...current.rawMaterials, ...addedMaterials],
          formulaId: null,
          formulaName: `${candidate.name} Review Draft`,
          formulaLines,
        };
      });
      setCalculationHistory([]);
      setResult(calculation);
      setDraftReview({
        candidateName: candidate.name,
        baselineLines: candidate.items.map((item) => ({
          rawMaterialId: item.raw_material_id,
          name: item.name,
          percentage: item.percentage,
        })),
        baselineResult: calculation,
        reviewedResult: null,
        requiredParameterCodes,
        status: "pending",
        notes: "",
      });
      setMessage("Optimizer draft applied and recalculated");
    });
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
    if (hasPendingDraftReview) {
      setError("Confirm draft review before saving");
      return;
    }

    await runAction("Calculating formula", async () => {
      const items = workspace.formulaLines.map((line, index) => ({
        raw_material_id: line.rawMaterialId,
        percentage: line.percentage,
        order_index: index,
      }));
      const payload = {
        name: workspace.formulaName.trim() || "Manual Formula",
        items,
      };
      const formula = workspace.formulaId
        ? await request<FormulaRead>(`/api/v1/formulas/${workspace.formulaId}`, {
            method: "PATCH",
            headers,
            body: JSON.stringify(payload),
          })
        : await request<FormulaRead>("/api/v1/formulas", {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
          });
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
      setDraftReview(null);
      setSavedFormulaComparison(null);
      await refreshFormulaLibrary({ silent: true });
      await loadCalculationHistory(formula.id);
      setMessage("Calculation complete");
    });
  }

  async function refreshFormulaLibrary(options: { silent?: boolean } = {}) {
    if (!workspace.tenant) {
      setError("Create a workspace first");
      return;
    }
    if (options.silent) {
      const nextFormulas = await request<FormulaRead[]>("/api/v1/formulas", {
        method: "GET",
        headers,
      });
      setFormulas(nextFormulas);
      return;
    }
    await runAction("Refreshing formula library", async () => {
      const nextFormulas = await request<FormulaRead[]>("/api/v1/formulas", {
        method: "GET",
        headers,
      });
      setFormulas(nextFormulas);
      setMessage("Formula library refreshed");
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
      setDraftReview(null);
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

  async function parseRequirements() {
    if (!workspace.tenant) {
      setError("Create a workspace first");
      return;
    }
    if (requirementText.trim().length < 3) {
      setError("Requirement text is required");
      return;
    }

    await runAction("Parsing requirements", async () => {
      const parsed = await request<RequirementParse>("/api/v1/ai/requirements/parse", {
        method: "POST",
        headers,
        body: JSON.stringify({ text: requirementText.trim() }),
      });
      setRequirementParse(parsed);
      await refreshAiRuns({ silent: true });
      setMessage("Requirements parsed");
    });
  }

  async function planRequirements() {
    if (!workspace.tenant) {
      setError("Create a workspace first");
      return;
    }
    if (requirementText.trim().length < 3) {
      setError("Requirement text is required");
      return;
    }

    await runAction("Planning with supervisor", async () => {
      const plan = await request<AgentPlan>("/api/v1/ai/supervisor/plan", {
        method: "POST",
        headers,
        body: JSON.stringify({ text: requirementText.trim() }),
      });
      setAgentPlan(plan);
      await refreshAiRuns({ silent: true });
      setMessage("Supervisor plan ready");
    });
  }

  function reuseInfeasibilityAction(action: string) {
    const suggestedAction = action.trim();
    if (!suggestedAction) {
      return;
    }

    setRequirementText((current) => {
      const currentText = current.trim();
      if (!currentText) {
        return suggestedAction;
      }
      if (currentText.includes(suggestedAction)) {
        return current;
      }
      return `${currentText}\n${suggestedAction}`;
    });
    setMessage("Action added to requirement");
  }

  async function refreshAiRuns(options: { silent?: boolean } = {}) {
    if (!workspace.tenant) {
      setError("Create a workspace first");
      return;
    }
    if (options.silent) {
      const runs = await request<AiRun[]>("/api/v1/ai/runs", { method: "GET", headers });
      setAiRuns(runs);
      return;
    }
    await runAction("Refreshing AI runs", async () => {
      const runs = await request<AiRun[]>("/api/v1/ai/runs", { method: "GET", headers });
      setAiRuns(runs);
      setMessage("AI runs refreshed");
    });
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
      setImportPreview(null);
      if (!selectedSheet) {
        setMessage("Select Excel sheet");
        return;
      }
      const preview = await requestExcelImportPreview(file, selectedSheet);
      setImportPreview(preview);
      setAvailableImportSheets(preview.available_sheets);
      setSelectedImportSheet(preview.sheet_name);
      setMessage("Import preview ready");
    });
  }

  async function previewSelectedImportSheet(sheetName: string) {
    if (!importFile) {
      setError("Upload an Excel file first");
      return;
    }
    setSelectedImportSheet(sheetName);
    await runAction("Reading Excel sheet", async () => {
      const preview = await requestExcelImportPreview(importFile, sheetName);
      setImportPreview(preview);
      setAvailableImportSheets(preview.available_sheets);
      setSelectedImportSheet(preview.sheet_name);
      setMessage("Import preview ready");
    });
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

  async function requestExcelImportPreview(
    file: File,
    sheetName: string,
  ): Promise<ExcelImportPreview> {
    const formData = new FormData();
    formData.append("file", file);
    if (sheetName) {
      formData.append("sheet_name", sheetName);
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
      setDraftReview(null);
      setSavedFormulaComparison(null);
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

  function formatConstraint(constraint: RequirementConstraint): string {
    const value =
      constraint.value === null
        ? ""
        : ` ${constraint.operator} ${constraint.value}${constraint.unit ? ` ${constraint.unit}` : ""}`;
    return `${constraint.target}${value}`;
  }

  function formatRunCost(run: AiRun): string {
    if (run.cost_estimate_usd === null) {
      return "-";
    }
    return `$${run.cost_estimate_usd.toFixed(6)}`;
  }

  function formatCandidatePrice(candidate: AgentCandidate): string {
    return candidate.price_eur_per_kg === null
      ? "-"
      : `${candidate.price_eur_per_kg.toFixed(2)} EUR/kg`;
  }

  function formatCandidateParameters(candidate: AgentCandidate): string {
    const values = Object.entries(candidate.parameters);
    if (!values.length) {
      return "-";
    }
    return values
      .map(([code, parameter]) => {
        const unit = parameter.unit ? ` ${parameter.unit}` : "";
        return `${code}: ${parameter.value.toFixed(2)}${unit}`;
      })
      .join(", ");
  }

  function formatAgentFormulaPrice(candidate: AgentFormulaCandidate): string {
    return candidate.price_total === null
      ? "-"
      : `${candidate.price_total.toFixed(2)} ${candidate.currency}/kg`;
  }

  function formatResultPrice(resultValue: CalculationResult | null): string {
    return resultValue?.price_total == null
      ? "-"
      : `${resultValue.price_total.toFixed(2)} ${resultValue.currency}/kg`;
  }

  function formatOptionalValue(value: number | null, unit: string | null = null): string {
    if (value === null) {
      return "-";
    }
    if (unit === "%") {
      return `${value.toFixed(2)}%`;
    }
    return `${value.toFixed(2)}${unit ? ` ${unit}` : ""}`;
  }

  function formatSignedDelta(value: number | null, suffix = ""): string {
    if (value === null) {
      return "-";
    }
    const normalized = Math.abs(value) < 0.005 ? 0 : value;
    const sign = normalized > 0 ? "+" : "";
    return `${sign}${normalized.toFixed(2)}${suffix}`;
  }

  function formatSignedInteger(value: number): string {
    return `${value > 0 ? "+" : ""}${value}`;
  }

  function formatComplianceLeader(
    leader: "baseline" | "candidate" | "tie",
  ): string {
    if (leader === "tie") {
      return "Tie";
    }
    return leader === "baseline" ? "Base leads" : "Candidate leads";
  }

  function formatComplianceLeaderBadge(
    leader: "baseline" | "candidate" | "tie",
  ): string {
    return leader === "baseline" ? "base" : leader;
  }

  function resetImportState() {
    setImportPreview(null);
    setImportFile(null);
    setImportFileName("");
    setAvailableImportSheets([]);
    setSelectedImportSheet("");
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
          <a className="navItem" href="#compatibility">
            <AlertTriangle size={18} /> Compatibility
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
          <a className="navItem" href="#ai">
            <BrainCircuit size={18} /> AI parser
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
              Save & calculate
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
                  </div>
                ))
              )}
            </div>
          </section>

          <section id="compatibility" className="panel compatibilityPanel">
            <div className="panelHeader">
              <h2>Compatibility</h2>
              <span>{compatibilityRules.length} rules</span>
            </div>
            <div className="compatibilityForm">
              <label>
                <span>Material A</span>
                <select
                  aria-label="Compatibility material A"
                  value={compatibilityRuleForm.materialAId}
                  onChange={(event) =>
                    setCompatibilityRuleForm((current) => ({
                      ...current,
                      materialAId: event.target.value,
                    }))
                  }
                  disabled={!canEditTenantData || workspace.rawMaterials.length < 2}
                >
                  <option value="">Select material</option>
                  {workspace.rawMaterials.map((material) => (
                    <option key={material.id} value={material.id}>
                      {material.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Material B</span>
                <select
                  aria-label="Compatibility material B"
                  value={compatibilityRuleForm.materialBId}
                  onChange={(event) =>
                    setCompatibilityRuleForm((current) => ({
                      ...current,
                      materialBId: event.target.value,
                    }))
                  }
                  disabled={!canEditTenantData || workspace.rawMaterials.length < 2}
                >
                  <option value="">Select material</option>
                  {workspace.rawMaterials.map((material) => (
                    <option key={material.id} value={material.id}>
                      {material.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Severity</span>
                <select
                  aria-label="Compatibility severity"
                  value={compatibilityRuleForm.severity}
                  onChange={(event) =>
                    setCompatibilityRuleForm((current) => ({
                      ...current,
                      severity: event.target.value,
                    }))
                  }
                  disabled={!canEditTenantData}
                >
                  <option value="warning">warning</option>
                  <option value="blocker">blocker</option>
                  <option value="info">info</option>
                </select>
              </label>
              <label>
                <span>Message</span>
                <input
                  value={compatibilityRuleForm.message}
                  onChange={(event) =>
                    setCompatibilityRuleForm((current) => ({
                      ...current,
                      message: event.target.value,
                    }))
                  }
                  disabled={!canEditTenantData}
                />
              </label>
              <label>
                <span>Recommended action</span>
                <input
                  value={compatibilityRuleForm.recommendedAction}
                  onChange={(event) =>
                    setCompatibilityRuleForm((current) => ({
                      ...current,
                      recommendedAction: event.target.value,
                    }))
                  }
                  disabled={!canEditTenantData}
                />
              </label>
              <button
                className="secondaryButton"
                type="button"
                onClick={createCompatibilityRule}
                disabled={!canCreateCompatibilityRule}
              >
                <Save size={17} />
                Save rule
              </button>
            </div>
            <div className="compatibilityList">
              {compatibilityRules.length === 0 ? (
                <div className="empty">No compatibility rules yet.</div>
              ) : (
                compatibilityRules.map((rule) => {
                  const materialNames =
                    rule.condition_json.raw_material_ids
                      ?.map((id) => rawMaterialsById.get(id)?.name ?? `Material ${id.slice(0, 8)}`)
                      .join(" + ") ?? "Material pair";
                  return (
                    <div className="compatibilityRow" key={rule.id}>
                      <code data-severity={rule.severity}>{rule.severity}</code>
                      <span>{materialNames}</span>
                      <strong>{rule.message}</strong>
                      <span>{rule.condition_json.recommended_action ?? "-"}</span>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <section id="library" className="panel libraryPanel">
            <div className="panelHeader">
              <h2>Formula library</h2>
              <span>{formulas.length} formulas</span>
            </div>
            <div className="libraryActions">
              <label>
                <span>Base</span>
                <select
                  aria-label="Base formula"
                  value={formulaCompareSelection.baselineId}
                  onChange={(event) =>
                    selectFormulaForComparison("baselineId", event.target.value)
                  }
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
                  aria-label="Candidate formula"
                  value={formulaCompareSelection.candidateId}
                  onChange={(event) =>
                    selectFormulaForComparison("candidateId", event.target.value)
                  }
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
                onClick={() => refreshFormulaLibrary()}
                disabled={!canEditTenantData}
              >
                <RefreshCw size={17} />
                Refresh library
              </button>
              <button
                className="secondaryButton"
                type="button"
                onClick={compareSavedFormulas}
                disabled={!canCompareSavedFormulas}
              >
                <ListChecks size={17} />
                Compare formulas
              </button>
            </div>
            <div className="comparisonConstraintBar">
              <label>
                <span>Max price EUR/kg</span>
                <input
                  inputMode="decimal"
                  value={comparisonConstraintForm.maxPrice}
                  onChange={(event) =>
                    setComparisonConstraintForm((current) => ({
                      ...current,
                      maxPrice: event.target.value,
                    }))
                  }
                  disabled={!canEditTenantData}
                />
              </label>
              <label>
                <span>Parameter code</span>
                <input
                  value={comparisonConstraintForm.parameterCode}
                  onChange={(event) =>
                    setComparisonConstraintForm((current) => ({
                      ...current,
                      parameterCode: event.target.value,
                    }))
                  }
                  disabled={!canEditTenantData}
                />
              </label>
              <label>
                <span>Parameter min</span>
                <input
                  inputMode="decimal"
                  value={comparisonConstraintForm.minParameterValue}
                  onChange={(event) =>
                    setComparisonConstraintForm((current) => ({
                      ...current,
                      minParameterValue: event.target.value,
                    }))
                  }
                  disabled={!canEditTenantData}
                />
              </label>
              <label>
                <span>Material</span>
                <select
                  aria-label="Constraint material"
                  value={comparisonConstraintForm.materialId}
                  onChange={(event) =>
                    setComparisonConstraintForm((current) => ({
                      ...current,
                      materialId: event.target.value,
                    }))
                  }
                  disabled={!canEditTenantData || comparisonMaterialOptions.length === 0}
                >
                  <option value="">No material limit</option>
                  {comparisonMaterialOptions.map((material) => (
                    <option key={material.id} value={material.id}>
                      {material.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Material min %</span>
                <input
                  inputMode="decimal"
                  value={comparisonConstraintForm.minMaterialPercentage}
                  onChange={(event) =>
                    setComparisonConstraintForm((current) => ({
                      ...current,
                      minMaterialPercentage: event.target.value,
                    }))
                  }
                  disabled={!canEditTenantData || !comparisonConstraintForm.materialId}
                />
              </label>
              <label>
                <span>Material max %</span>
                <input
                  inputMode="decimal"
                  value={comparisonConstraintForm.maxMaterialPercentage}
                  onChange={(event) =>
                    setComparisonConstraintForm((current) => ({
                      ...current,
                      maxMaterialPercentage: event.target.value,
                    }))
                  }
                  disabled={!canEditTenantData || !comparisonConstraintForm.materialId}
                />
              </label>
            </div>
            <div className="libraryGrid">
              <div className="formulaList">
                <div className="formulaListHead">
                  <span>Name</span>
                  <span>Price</span>
                  <span>Lines</span>
                  <span>Open</span>
                </div>
                {formulas.length === 0 ? (
                  <div className="empty">No saved formulas yet.</div>
                ) : (
                  formulas.map((formula) => (
                    <div className="formulaListRow" key={formula.id}>
                      <span>{formula.name}</span>
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
                    </div>
                  ))
                )}
              </div>
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
                        {entry.result_json.total_percentage.toFixed(1)}% ·{" "}
                        {entry.result_json.warnings.length} warnings
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
            {savedFormulaComparison ? (
              <div className="savedFormulaComparison">
                <div className="comparisonHeader">
                  <div>
                    <span>Base</span>
                    <strong>{savedFormulaComparison.baseline.name}</strong>
                  </div>
                  <div>
                    <span>Candidate</span>
                    <strong>{savedFormulaComparison.candidate.name}</strong>
                  </div>
                </div>
                <div className="comparisonStats">
                  <div>
                    <span>Price</span>
                    <strong>
                      {formatResultPrice(savedFormulaComparison.baselineResult)} /{" "}
                      {formatResultPrice(savedFormulaComparison.candidateResult)}
                    </strong>
                    <code>
                      {formatSignedDelta(
                        savedFormulaComparison.priceDelta,
                        ` ${savedFormulaComparison.candidateResult.currency}/kg`,
                      )}
                    </code>
                  </div>
                  <div>
                    <span>Total</span>
                    <strong>
                      {savedFormulaComparison.baselineResult.total_percentage.toFixed(1)}% /{" "}
                      {savedFormulaComparison.candidateResult.total_percentage.toFixed(1)}%
                    </strong>
                    <code>{formatSignedDelta(savedFormulaComparison.totalDelta, "%")}</code>
                  </div>
                  <div>
                    <span>Lines</span>
                    <strong>
                      {savedFormulaComparison.baseline.items.length} /{" "}
                      {savedFormulaComparison.candidate.items.length}
                    </strong>
                    <code>
                      {formatSignedInteger(
                        savedFormulaComparison.candidate.items.length -
                          savedFormulaComparison.baseline.items.length,
                      )}
                    </code>
                  </div>
                </div>
                {comparisonComplianceSummary ? (
                  <div className="complianceSummary">
                    <div>
                      <span>Compliance</span>
                      <strong>
                        {formatComplianceLeader(comparisonComplianceSummary.leader)}
                      </strong>
                      <code data-state={comparisonComplianceSummary.leader}>
                        {formatComplianceLeaderBadge(comparisonComplianceSummary.leader)}
                      </code>
                    </div>
                    <div>
                      <span>Base score</span>
                      <strong>
                        {comparisonComplianceSummary.baseline.passed}/
                        {comparisonComplianceSummary.baseline.total} passed
                      </strong>
                      <code data-state={comparisonComplianceSummary.baseline.status}>
                        {comparisonComplianceSummary.baseline.failed} failed,{" "}
                        {comparisonComplianceSummary.baseline.missing} missing
                      </code>
                    </div>
                    <div>
                      <span>Candidate score</span>
                      <strong>
                        {comparisonComplianceSummary.candidate.passed}/
                        {comparisonComplianceSummary.candidate.total} passed
                      </strong>
                      <code data-state={comparisonComplianceSummary.candidate.status}>
                        {comparisonComplianceSummary.candidate.failed} failed,{" "}
                        {comparisonComplianceSummary.candidate.missing} missing
                      </code>
                    </div>
                  </div>
                ) : null}
                {comparisonConstraintEvaluations.length ? (
                  <div className="constraintEvaluationList">
                    <div className="constraintEvaluationHeader">
                      <strong className="comparisonTitle">Constraints</strong>
                      <label className="constraintFilter">
                        <input
                          checked={showOnlyConstraintIssues}
                          onChange={(event) =>
                            setShowOnlyConstraintIssues(event.target.checked)
                          }
                          type="checkbox"
                        />
                        <span>Needs attention</span>
                        <code>{comparisonConstraintIssueCount}</code>
                      </label>
                    </div>
                    {visibleComparisonConstraintEvaluations.length ? (
                      visibleComparisonConstraintEvaluations.map((evaluation) => (
                        <div key={evaluation.key}>
                          <span>{evaluation.label}</span>
                          <strong>{evaluation.rule}</strong>
                          <span>
                            {formatOptionalValue(evaluation.baselineValue, evaluation.unit)}
                            <code data-state={evaluation.baselineStatus}>
                              {evaluation.baselineStatus}
                            </code>
                            {evaluation.baselineExplanation ? (
                              <small>{evaluation.baselineExplanation}</small>
                            ) : null}
                          </span>
                          <span>
                            {formatOptionalValue(evaluation.candidateValue, evaluation.unit)}
                            <code data-state={evaluation.candidateStatus}>
                              {evaluation.candidateStatus}
                            </code>
                            {evaluation.candidateExplanation ? (
                              <small>{evaluation.candidateExplanation}</small>
                            ) : null}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="constraintEvaluationEmpty">
                        No constraints need attention.
                      </div>
                    )}
                  </div>
                ) : null}
                <div className="comparisonColumns">
                  <div className="comparisonList">
                    <div className="comparisonTitle">Parameters</div>
                    {savedFormulaComparison.parameterChanges.length ? (
                      savedFormulaComparison.parameterChanges.map((parameter) => (
                        <div key={parameter.code}>
                          <span>{parameter.code}</span>
                          <strong>
                            {formatOptionalValue(parameter.baseline, parameter.unit)} /{" "}
                            {formatOptionalValue(parameter.candidate, parameter.unit)}
                          </strong>
                          <code>
                            {formatSignedDelta(
                              parameter.delta,
                              parameter.unit ? ` ${parameter.unit}` : "",
                            )}
                          </code>
                        </div>
                      ))
                    ) : (
                      <div>
                        <span>Parameters</span>
                        <strong>No calculated parameters</strong>
                        <code>-</code>
                      </div>
                    )}
                  </div>
                  <div className="comparisonList">
                    <div className="comparisonTitle">Materials</div>
                    {savedFormulaComparison.lineChanges.length ? (
                      savedFormulaComparison.lineChanges.map((line) => (
                        <div key={line.rawMaterialId}>
                          <span>{line.name}</span>
                          <strong>
                            {line.proposed.toFixed(1)}% / {line.reviewed.toFixed(1)}%
                          </strong>
                          <code>{formatSignedDelta(line.delta, "%")}</code>
                        </div>
                      ))
                    ) : (
                      <div>
                        <span>Formula lines</span>
                        <strong>No percentage changes</strong>
                        <code>0.00%</code>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
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

          <section id="ai" className="panel aiPanel">
            <div className="panelHeader">
              <h2>AI requirement parser</h2>
              <span>{requirementParse ? requirementParse.source : "Pending"}</span>
            </div>
            <div className="aiControls">
              <label className="fullWidthLabel">
                <span>Requirement</span>
                <textarea
                  value={requirementText}
                  onChange={(event) => setRequirementText(event.target.value)}
                  disabled={!workspace.tenant || isBusy}
                />
              </label>
              <div className="aiActions">
                <button
                  className="secondaryButton"
                  type="button"
                  onClick={parseRequirements}
                  disabled={!canParseRequirements}
                >
                  <BrainCircuit size={17} />
                  Parse
                </button>
                <button
                  className="secondaryButton"
                  type="button"
                  onClick={planRequirements}
                  disabled={!canPlanRequirements}
                >
                  <ListChecks size={17} />
                  Plan
                </button>
                <button
                  className="secondaryButton"
                  type="button"
                  onClick={() => refreshAiRuns()}
                  disabled={!canEditTenantData}
                >
                  <RefreshCw size={17} />
                  Runs
                </button>
              </div>
            </div>
            {requirementParse ? (
              <div className="aiResultGrid">
                <div>
                  <span>Product</span>
                  <strong>{requirementParse.product_type ?? "-"}</strong>
                </div>
                <div>
                  <span>Alternatives</span>
                  <strong>{requirementParse.alternatives ?? "-"}</strong>
                </div>
                <div>
                  <span>Model</span>
                  <strong>{requirementParse.model ?? "deterministic"}</strong>
                </div>
                <div>
                  <span>Objectives</span>
                  <strong>{requirementParse.objectives.join(", ") || "-"}</strong>
                </div>
                <div>
                  <span>Technical constraints</span>
                  <strong>
                    {requirementParse.technical_constraints.map(formatConstraint).join(", ") ||
                      "-"}
                  </strong>
                </div>
                <div>
                  <span>Economic constraints</span>
                  <strong>
                    {requirementParse.economic_constraints.map(formatConstraint).join(", ") ||
                      "-"}
                  </strong>
                </div>
                <div>
                  <span>Required materials</span>
                  <strong>{requirementParse.mandatory_raw_materials.join(", ") || "-"}</strong>
                </div>
                <div>
                  <span>Excluded materials</span>
                  <strong>{requirementParse.excluded_raw_materials.join(", ") || "-"}</strong>
                </div>
                <div className="wide">
                  <span>Uncertainties</span>
                  <strong>{requirementParse.uncertainties.join(", ") || "-"}</strong>
                </div>
              </div>
            ) : (
              <div className="empty">No parsed requirements.</div>
            )}
            <div className="agentPlan">
              <div className="agentPlanHeader">
                <strong>Supervisor plan</strong>
                <span>{agentPlan ? agentPlan.orchestrator : "Pending"}</span>
              </div>
              {agentPlan ? (
                <>
                  <div className="agentPlanSteps">
                    {agentPlan.steps.map((step) => (
                      <div className="agentPlanStep" key={`${step.tool}-${step.status}`}>
                        <code>{step.status}</code>
                        <strong>{step.tool}</strong>
                        <span>{step.summary}</span>
                      </div>
                    ))}
                  </div>
                  {agentPlan.candidate_research ? (
                    <div className="agentToolSummary">
                      <div>
                        <span>Candidates</span>
                        <strong>
                          {agentPlan.candidate_research.candidate_count} /{" "}
                          {agentPlan.candidate_research.total_available}
                        </strong>
                      </div>
                      <div>
                        <span>Optimization</span>
                        <strong>{agentPlan.optimization_plan?.status ?? "-"}</strong>
                      </div>
                      <div>
                        <span>Objective</span>
                        <strong>
                          {agentPlan.optimization_plan
                            ? `${agentPlan.optimization_plan.objective.type} ${agentPlan.optimization_plan.objective.target}`
                            : "-"}
                        </strong>
                      </div>
                      <div className="wide">
                        <span>Blocks</span>
                        <strong>
                          {agentPlan.optimization_plan?.blocking_reasons.join(", ") || "-"}
                        </strong>
                      </div>
                    </div>
                  ) : null}
                  {agentPlan.optimization_plan &&
                  (agentPlan.optimization_plan.infeasibility_explanations?.length ?? 0) > 0 &&
                  agentPlan.optimization_plan.formula_candidates.length === 0 ? (
                    <div className="agentInfeasibilityList">
                      <strong>Infeasibility explanations</strong>
                      {(agentPlan.optimization_plan.infeasibility_explanations ?? []).map(
                        (explanation) => (
                          <article key={`${explanation.code}-${explanation.message}`}>
                            <code data-severity={explanation.severity}>
                              {explanation.severity}
                            </code>
                            <span className="agentInfeasibilityText">
                              <strong>{explanation.message}</strong>
                              {explanation.action}
                            </span>
                            <button
                              className="iconButton"
                              type="button"
                              onClick={() => reuseInfeasibilityAction(explanation.action)}
                              title="Add action to requirement"
                              aria-label="Add action to requirement"
                              disabled={!workspace.tenant || isBusy}
                            >
                              <Plus size={15} />
                            </button>
                          </article>
                        ),
                      )}
                    </div>
                  ) : null}
                  {agentPlan.candidate_research?.candidates.length ? (
                    <div className="agentCandidateList">
                      <div className="agentCandidateHead">
                        <span>Score</span>
                        <span>Material</span>
                        <span>Price</span>
                        <span>Parameters</span>
                      </div>
                      {agentPlan.candidate_research.candidates.map((candidate) => (
                        <div className="agentCandidateRow" key={candidate.raw_material_id}>
                          <code>{Math.round(candidate.score * 100)}%</code>
                          <strong>{candidate.name}</strong>
                          <span>{formatCandidatePrice(candidate)}</span>
                          <span>{formatCandidateParameters(candidate)}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {agentPlan.optimization_plan?.formula_candidates.length ? (
                    <div className="agentFormulaList">
                      {agentPlan.optimization_plan.formula_candidates.map((candidate) => (
                        <div className="agentFormulaCard" key={candidate.name}>
                          <div className="agentFormulaHeader">
                            <strong>{candidate.name}</strong>
                            <div>
                              <code>{candidate.status}</code>
                              <button
                                className="secondaryButton agentFormulaApply"
                                type="button"
                                onClick={() => applyOptimizerDraft(candidate)}
                                disabled={isBusy}
                              >
                                <Check size={16} />
                                Apply draft
                              </button>
                            </div>
                          </div>
                          <div className="agentFormulaStats">
                            <div>
                              <span>Price</span>
                              <strong>{formatAgentFormulaPrice(candidate)}</strong>
                            </div>
                            <div>
                              <span>Total</span>
                              <strong>{candidate.total_percentage.toFixed(1)}%</strong>
                            </div>
                            <div>
                              <span>Parameters</span>
                              <strong>
                                {candidate.parameters
                                  .map(
                                    (parameter) =>
                                      `${parameter.code}: ${parameter.value.toFixed(2)}${parameter.unit ? ` ${parameter.unit}` : ""}`,
                                  )
                                  .join(", ") || "-"}
                              </strong>
                            </div>
                          </div>
                          <div className="agentFormulaItems">
                            {candidate.items.map((item) => (
                              <div key={item.raw_material_id}>
                                <span>{item.name}</span>
                                <code>{item.percentage.toFixed(1)}%</code>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="empty">No supervisor plan.</div>
              )}
            </div>
            <div className="aiRunList">
              <div className="aiRunHead">
                <span>Time</span>
                <span>Provider</span>
                <span>Status</span>
                <span>Tokens</span>
                <span>Cost</span>
              </div>
              {aiRuns.length === 0 ? (
                <div className="empty">No AI runs yet.</div>
              ) : (
                aiRuns.map((run) => (
                  <div className="aiRunRow" key={run.id}>
                    <span>{formatDateTime(run.created_at)}</span>
                    <span>{run.model ?? run.provider}</span>
                    <span data-state={run.status}>{run.status}</span>
                    <span>
                      {run.prompt_tokens === null && run.completion_tokens === null
                        ? "-"
                        : `${run.prompt_tokens ?? 0}/${run.completion_tokens ?? 0}`}
                    </span>
                    <span>{formatRunCost(run)}</span>
                  </div>
                ))
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
                onChange={(event) => {
                  setWorkspace((current) => ({ ...current, formulaName: event.target.value }));
                  markDraftReviewPending();
                }}
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
            {draftReview ? (
              <div className="draftReview" data-state={draftReview.status}>
                <div className="draftReviewHeader">
                  <div>
                    <span>Draft review</span>
                    <strong>{draftReview.candidateName}</strong>
                  </div>
                  <code>{draftReview.status}</code>
                </div>
                <label className="fullWidthLabel">
                  <span>Decision notes</span>
                  <textarea
                    value={draftReview.notes}
                    onChange={(event) => updateDraftReviewNotes(event.target.value)}
                    disabled={isBusy}
                  />
                </label>
                <div className="draftReviewActions">
                  <span>
                    {draftReview.status === "confirmed" ? "Ready to save" : "Pending confirmation"}
                  </span>
                  <button
                    className="secondaryButton"
                    type="button"
                    onClick={confirmDraftReview}
                    disabled={!canConfirmDraftReview}
                  >
                    <Check size={16} />
                    Confirm review
                  </button>
                </div>
                {draftComparison && draftReview.reviewedResult ? (
                  <div className="draftComparison">
                    <div className="draftComparisonStats">
                      <div>
                        <span>Price</span>
                        <strong>
                          {formatResultPrice(draftReview.baselineResult)} /{" "}
                          {formatResultPrice(draftReview.reviewedResult)}
                        </strong>
                        <code>
                          {formatSignedDelta(
                            draftComparison.priceDelta,
                            ` ${draftReview.reviewedResult.currency}/kg`,
                          )}
                        </code>
                      </div>
                      <div>
                        <span>Total</span>
                        <strong>
                          {draftReview.baselineResult.total_percentage.toFixed(1)}% /{" "}
                          {draftReview.reviewedResult.total_percentage.toFixed(1)}%
                        </strong>
                        <code>{formatSignedDelta(draftComparison.totalDelta, "%")}</code>
                      </div>
                      <div>
                        <span>Lines</span>
                        <strong>
                          {draftComparison.proposedLineCount} /{" "}
                          {draftComparison.reviewedLineCount}
                        </strong>
                        <code>
                          {formatSignedInteger(
                            draftComparison.reviewedLineCount -
                              draftComparison.proposedLineCount,
                          )}
                        </code>
                      </div>
                    </div>
                    {draftComparison.lineChanges.length ? (
                      <div className="draftLineChanges">
                        {draftComparison.lineChanges.map((line) => (
                          <div key={line.rawMaterialId}>
                            <span>{line.name}</span>
                            <strong>
                              {line.proposed.toFixed(1)}% / {line.reviewed.toFixed(1)}%
                            </strong>
                            <code>{formatSignedDelta(line.delta, "%")}</code>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="draftLineChanges">
                        <div>
                          <span>Formula lines</span>
                          <strong>No percentage changes</strong>
                          <code>0.00%</code>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            ) : null}
            <div className="formulaLines">
              {workspace.formulaLines.length === 0 ? (
                <div className="empty">Add materials to build a formula.</div>
              ) : (
                workspace.formulaLines.map((line) => {
                  const material = rawMaterialsById.get(line.rawMaterialId);
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
                  <div
                    key={`${warning.code}-${warning.rule_id ?? ""}-${warning.raw_material_id ?? ""}-${warning.parameter_code ?? ""}`}
                  >
                    <AlertTriangle size={16} />
                    <span>
                      <strong>{warning.severity ?? warning.code}</strong>
                      {warning.message}
                      {warning.recommended_action ? (
                        <small>{warning.recommended_action}</small>
                      ) : null}
                    </span>
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
