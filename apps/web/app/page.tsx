"use client";

import {
  AlertTriangle,
  Beaker,
  BrainCircuit,
  ChevronDown,
  Database,
  FlaskConical,
  FolderOpen,
  KeyRound,
  Loader2,
  LogOut,
  RefreshCw,
  Settings2,
  Upload,
  UserCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { apiUrl, request } from "./workspace-api";
import { getSupabaseBrowserClient } from "./supabase-client";
import {
  aliasFromImportRow,
  emptyJiraConnectionForm,
  emptyWorkspace,
  formatDateTime,
  makeLocalId,
  mergeRawMaterials,
  normalizeCode,
  parseOptionalNumber,
  slugify,
  toWorkspaceRawMaterial,
  withRawMaterialAlias,
  type CalculationResult,
  type CompatibilityRuleRead,
  type AiRun,
  type AgentFormulaCandidate,
  type AgentPlan,
  type FormulaLine,
  type ExcelImportPreview,
  type ExcelImportPreviewRow,
  type ExcelImportSheets,
  type FormulaCalculationHistory,
  type FormulaReviewArtifact,
  type FormulaRead,
  type FormulaReviewRequest,
  type JiraConnection,
  type JiraConnectionForm,
  type JiraFieldMetadata,
  type JiraMetadataState,
  type JiraOAuthAuthorize,
  type JiraConnectionTest,
  type MaterialForm,
  type RawMaterial,
  type RawMaterialAliasRead,
  type ParameterRead,
  type RawMaterialRead,
  type RequirementParse,
  type Status,
  type TenantInvitationRead,
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
} from "./workspace-comparison";
import {
  PARAMETER_VIEW_PRESETS,
  formatFormulaNumber,
} from "./formula-builder-model";
import {
  buildCalculationParameterRows,
  buildComparisonMaterials,
  buildFormulaLineDetails,
  buildLocalFormulaPreview,
  buildMaterialSearchResults,
  buildParameterCatalog,
  buildRawMaterialsById,
  calculateFormulaTotalPercentage,
  formatVisibleParameterSummary,
  getSelectedMaterial,
  getSelectedMaterialParameters,
  isFormulaPercentageBalanced,
  selectVisibleParameterCodes,
} from "./formula-builder-derived";
import { useRawMaterialCatalog } from "./formula-builder-catalog";
import { useFormulaBuilderUiState } from "./formula-builder-ui-state";
import { ExcelImportPanel } from "./excel-import-panel";
import { useExcelImportState } from "./excel-import-state";
import { AiAssistantPanel } from "./ai-assistant-panel";
import { SettingsPanel } from "./settings-panel";
import { RawMaterialsPanel } from "./raw-materials-panel";
import { CompatibilityPanel } from "./compatibility-panel";
import {
  formatResultPrice,
  formatSignedDelta,
  formatSignedInteger,
} from "./formula-formatters";
import { BuilderStep } from "./formula-builder-ui/builder-step";
import { DraftReviewPanel } from "./formula-builder-ui/draft-review-panel";
import { FormulaCalculationPanel } from "./formula-builder-ui/formula-calculation-panel";
import { FormulaLineTable } from "./formula-builder-ui/formula-line-table";
import { FormulaProgressSummary } from "./formula-builder-ui/formula-progress-summary";
import { JiraReviewPanel } from "./formula-builder-ui/jira-review-panel";
import { MaterialCatalogControls } from "./formula-builder-ui/material-catalog-controls";
import { MaterialCatalogWorkspace } from "./formula-builder-ui/material-catalog-workspace";
import { ParameterPresetPicker } from "./formula-builder-ui/parameter-preset-picker";
import { SavedFormulaComparisonPanel } from "./saved-formula-comparison-panel";
import { useSavedFormulaComparisonState } from "./saved-formula-comparison-state";

type WorkspaceView =
  | "formula"
  | "materials"
  | "import"
  | "results"
  | "settings"
  | "library"
  | "compatibility"
  | "ai";

const VIEW_TITLES: Record<WorkspaceView, string> = {
  formula: "Formula Builder",
  materials: "Materias primas",
  import: "Importar Excel",
  results: "Resultados",
  settings: "Configuracion",
  library: "Biblioteca",
  compatibility: "Compatibilidad",
  ai: "Asistente IA",
};

const VIEW_DESCRIPTIONS: Record<WorkspaceView, string> = {
  formula: "Mesa unica para formular, calcular, guardar y enviar a revision.",
  materials: "Consulta y crea materias primas para formular.",
  import: "Sube formulas historicas y resuelve coincidencias.",
  results: "Vista legacy de resultados calculados.",
  settings: "Configura workspace, parametros e integraciones.",
  library: "Abre formulas guardadas y compara escenarios.",
  compatibility: "Gestiona reglas manuales de compatibilidad.",
  ai: "Convierte requisitos en restricciones y borradores revisables.",
};

function isTenantAdminRole(role?: string | null) {
  return role === "owner" || role === "admin";
}

function mergeParameters(
  parameters: WorkspaceState["parameters"],
  parameter: ParameterRead,
): WorkspaceState["parameters"] {
  const next = new Map<string, WorkspaceState["parameters"][number]>(
    parameters.map((item) => [item.id, item]),
  );
  next.set(parameter.id, parameter);
  return Array.from(next.values()).sort((left, right) => left.code.localeCompare(right.code));
}

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
  const {
    formulaMaterialQuery,
    parameterViewPreset,
    customParameterCodes,
    showOnlyPositiveParameters,
    catalogFamilyFilter,
    catalogPriceFilter,
    catalogPriceMin,
    catalogPriceMax,
    catalogParameterToAdd,
    catalogParameterConditions,
    materialResultLimit,
    selectedMaterialId,
    comparisonMaterialIds,
    expandedMaterialIds,
    builderSections,
    setFormulaMaterialQuery,
    setShowOnlyPositiveParameters,
    setCatalogFamilyFilter,
    setCatalogPriceFilter,
    setCatalogPriceMin,
    setCatalogPriceMax,
    setCatalogParameterToAdd,
    setMaterialResultLimit,
    setSelectedMaterialId,
    setComparisonMaterialIds,
    setExpandedMaterialIds,
    setBuilderSections,
    selectParameterView,
    toggleCustomParameterCode,
    addCatalogParameterCondition,
    updateCatalogParameterCondition,
    removeCatalogParameterCondition,
    resetCatalogFilters,
    toggleBuilderSection,
  } = useFormulaBuilderUiState();
  const [detailedMaterialIds, setDetailedMaterialIds] = useState<string[]>([]);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [aliasInputs, setAliasInputs] = useState<Record<string, string>>({});
  const [formulas, setFormulas] = useState<FormulaRead[]>([]);
  const [calculationHistory, setCalculationHistory] = useState<FormulaCalculationHistory[]>([]);
  const [formulaReviewRequests, setFormulaReviewRequests] = useState<FormulaReviewRequest[]>([]);
  const [formulaReviewArtifacts, setFormulaReviewArtifacts] = useState<
    Record<string, FormulaReviewArtifact[]>
  >({});
  const [compatibilityRules, setCompatibilityRules] = useState<CompatibilityRuleRead[]>([]);
  const [compatibilityRuleForm, setCompatibilityRuleForm] = useState({
    materialAId: "",
    materialBId: "",
    severity: "warning",
    message: "",
    recommendedAction: "",
  });
  const [jiraConnections, setJiraConnections] = useState<JiraConnection[]>([]);
  const [jiraConnectionForm, setJiraConnectionForm] = useState(emptyJiraConnectionForm);
  const [jiraMetadata, setJiraMetadata] = useState<JiraMetadataState | null>(null);
  const [jiraMappingKey, setJiraMappingKey] = useState("jira_project_id");
  const [requirementText, setRequirementText] = useState(
    "Liquido barato con contenido activo minimo 12% y precio maximo 2 EUR/kg. Dame 2 alternativas.",
  );
  const [requirementParse, setRequirementParse] = useState<RequirementParse | null>(null);
  const [agentPlan, setAgentPlan] = useState<AgentPlan | null>(null);
  const [draftReview, setDraftReview] = useState<DraftReviewState | null>(null);
  const [aiRuns, setAiRuns] = useState<AiRun[]>([]);
  const {
    formulaCompareSelection,
    comparisonConstraintForm,
    showOnlyConstraintIssues,
    savedFormulaComparison,
    selectFormulaForComparison,
    updateComparisonConstraint,
    resetSavedFormulaComparisonState,
    setShowOnlyConstraintIssues,
    setSavedFormulaComparison,
  } = useSavedFormulaComparisonState();
  const {
    importPreview,
    importFile,
    importFileName,
    availableImportSheets,
    selectedImportSheet,
    resetImportState,
    setPendingFile,
    setPreview: setImportPreview,
    setSelectedImportSheet,
    resolveImportRow: resolveImportRowState,
  } = useExcelImportState();
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("Ready");
  const [activeView, setActiveView] = useState<WorkspaceView>("formula");
  const [session, setSession] = useState<Session | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [tenantInvitations, setTenantInvitations] = useState<TenantInvitationRead[]>([]);
  const [invitationForm, setInvitationForm] = useState({
    email: "",
    role: "formulator",
  });

  const authHeaders = useMemo(
    () => ({
      "Content-Type": "application/json",
      ...(session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {}),
    }),
    [session?.access_token],
  );
  const headers = useMemo(
    () => ({
      ...authHeaders,
      ...(workspace.tenant ? { "X-Tenant-Id": workspace.tenant.id } : {}),
    }),
    [authHeaders, workspace.tenant],
  );
  const uploadHeaders = useMemo(
    () => ({
      ...(session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {}),
      ...(workspace.tenant ? { "X-Tenant-Id": workspace.tenant.id } : {}),
    }),
    [session?.access_token, workspace.tenant],
  );
  const catalogParameterConditionKey = useMemo(
    () =>
      catalogParameterConditions
        .map((condition) => `${condition.code}|${condition.min}|${condition.max}`)
        .join("||"),
    [catalogParameterConditions],
  );
  const mergeCatalogMaterials = useCallback((materials: RawMaterial[]) => {
    setWorkspace((current) => ({
      ...current,
      rawMaterials: mergeRawMaterials(current.rawMaterials, materials),
    }));
  }, []);
  const handleCatalogError = useCallback((errorMessage: string) => {
    setError(errorMessage);
  }, []);
  const {
    catalogMaterialIds,
    catalogTotal,
    catalogFamilies,
    catalogLoading,
    refreshCatalog,
  } = useRawMaterialCatalog({
    enabled: Boolean(workspace.tenant && session?.access_token),
    headers,
    query: formulaMaterialQuery,
    familyFilter: catalogFamilyFilter,
    priceFilter: catalogPriceFilter,
    priceMin: catalogPriceMin,
    priceMax: catalogPriceMax,
    parameterConditions: catalogParameterConditions,
    materialResultLimit,
    showOnlyPositiveParameters,
    onMaterialsLoaded: mergeCatalogMaterials,
    onError: handleCatalogError,
  });

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) {
        return;
      }
      if (!data.session) {
        window.location.href = "/login";
        return;
      }
      setSession(data.session);
      setAuthChecked(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!nextSession) {
        window.location.href = "/login";
        return;
      }
      setSession(nextSession);
      setAuthChecked(true);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.access_token || workspace.tenant) {
      return;
    }
    void loadAuthenticatedWorkspace(session.access_token);
  }, [session?.access_token, workspace.tenant]);

  useEffect(() => {
    setMaterialResultLimit(60);
  }, [
    catalogFamilyFilter,
    catalogParameterConditionKey,
    catalogPriceMax,
    catalogPriceMin,
    catalogPriceFilter,
    formulaMaterialQuery,
    parameterViewPreset,
    showOnlyPositiveParameters,
  ]);

  const rawMaterialsById = useMemo(
    () => buildRawMaterialsById(workspace.rawMaterials),
    [workspace.rawMaterials],
  );
  const formulaLineDetails = useMemo(
    () => buildFormulaLineDetails(workspace.formulaLines, rawMaterialsById),
    [rawMaterialsById, workspace.formulaLines],
  );
  const parameterCatalog = useMemo(
    () => buildParameterCatalog(workspace.parameters, workspace.rawMaterials),
    [workspace.parameters, workspace.rawMaterials],
  );
  const visibleParameterCodes = useMemo(
    () =>
      selectVisibleParameterCodes(
        parameterCatalog,
        parameterViewPreset,
        customParameterCodes,
      ),
    [customParameterCodes, parameterCatalog, parameterViewPreset],
  );
  const visibleParameterCodeSet = useMemo(
    () => new Set(visibleParameterCodes),
    [visibleParameterCodes],
  );
  const selectedParameterPreset =
    PARAMETER_VIEW_PRESETS.find((option) => option.key === parameterViewPreset) ??
    PARAMETER_VIEW_PRESETS[0];
  const visibleParameterSummary = formatVisibleParameterSummary(visibleParameterCodes);
  const localPreview = useMemo(
    () => buildLocalFormulaPreview(formulaLineDetails, visibleParameterCodeSet),
    [formulaLineDetails, visibleParameterCodeSet],
  );
  const materialSearchResults = useMemo(
    () => buildMaterialSearchResults(catalogMaterialIds, rawMaterialsById, workspace.formulaLines),
    [catalogMaterialIds, rawMaterialsById, workspace.formulaLines],
  );
  const selectedMaterial = useMemo(
    () => getSelectedMaterial(selectedMaterialId, rawMaterialsById),
    [rawMaterialsById, selectedMaterialId],
  );
  const selectedMaterialParameters = useMemo(
    () =>
      getSelectedMaterialParameters(
        selectedMaterial,
        visibleParameterCodes,
        showOnlyPositiveParameters,
      ),
    [selectedMaterial, showOnlyPositiveParameters, visibleParameterCodes],
  );
  const comparisonMaterials = useMemo(
    () => buildComparisonMaterials(comparisonMaterialIds, rawMaterialsById),
    [comparisonMaterialIds, rawMaterialsById],
  );
  const parameterRows = useMemo(
    () =>
      buildCalculationParameterRows(
        result,
        localPreview,
        visibleParameterCodeSet,
        showOnlyPositiveParameters,
      ),
    [localPreview, result, showOnlyPositiveParameters, visibleParameterCodeSet],
  );
  const catalogMaterialFamilies = useMemo(
    () => catalogFamilies,
    [catalogFamilies],
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
  const totalPercentage = useMemo(
    () => calculateFormulaTotalPercentage(workspace.formulaLines),
    [workspace.formulaLines],
  );
  const isFormulaBalanced = isFormulaPercentageBalanced(totalPercentage);
  const visibleWarnings = result?.warnings ?? localPreview.warnings;
  const isBusy = status === "working";
  const canEditTenantData = Boolean(workspace.tenant) && !isBusy;
  const canManageTenantUsers = isTenantAdminRole(workspace.tenant?.role) && !isBusy;
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
  const canSaveFormula = canCalculate && isFormulaBalanced;
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
  const activeJiraConnection = useMemo(
    () => jiraConnections.find((connection) => connection.is_active) ?? jiraConnections[0] ?? null,
    [jiraConnections],
  );
  const canSaveJiraConnection =
    Boolean(workspace.tenant) &&
    jiraConnectionForm.baseUrl.trim().length > 0 &&
    jiraConnectionForm.defaultProjectKey.trim().length > 0 &&
    jiraConnectionForm.defaultIssueType.trim().length > 0 &&
    !isBusy;
  const canTestJiraConnection = Boolean(activeJiraConnection) && !isBusy;
  const canLoadJiraMetadata = Boolean(activeJiraConnection) && canEditTenantData;
  const canAuthorizeJiraOAuth =
    Boolean(workspace.tenant) && jiraConnectionForm.authType === "oauth" && !isBusy;
  const canPrepareJiraReview =
    Boolean(workspace.tenant) &&
    Boolean(workspace.formulaId) &&
    workspace.formulaJiraProjectId.trim().length > 0 &&
    Boolean(activeJiraConnection) &&
    result !== null &&
    !isBusy;

  async function ensureRawMaterialDetail(rawMaterialId: string): Promise<RawMaterial | null> {
    const existing = rawMaterialsById.get(rawMaterialId);
    if (existing && detailedMaterialIds.includes(rawMaterialId)) {
      return existing;
    }
    if (!workspace.tenant) {
      return existing ?? null;
    }

    try {
      const material = await request<RawMaterialRead>(`/api/v1/raw-materials/${rawMaterialId}`, {
        method: "GET",
        headers,
      });
      const detailed = toWorkspaceRawMaterial(material, {
        parameterValue: workspace.parameter
          ? (material.parameters.find((parameter) => parameter.code === workspace.parameter?.code)
              ?.value ?? null)
          : null,
      }, workspace.parameters);
      setWorkspace((current) => ({
        ...current,
        rawMaterials: mergeRawMaterials(current.rawMaterials, [detailed]),
      }));
      setDetailedMaterialIds((current) =>
        current.includes(rawMaterialId) ? current : [...current, rawMaterialId],
      );
      return detailed;
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not load raw material detail");
      return existing ?? null;
    }
  }

  async function inspectMaterial(rawMaterialId: string) {
    setSelectedMaterialId(rawMaterialId);
    await ensureRawMaterialDetail(rawMaterialId);
  }

  async function toggleCompareMaterial(rawMaterialId: string) {
    setComparisonMaterialIds((current) =>
      current.includes(rawMaterialId)
        ? current.filter((id) => id !== rawMaterialId)
        : [...current.slice(-2), rawMaterialId],
    );
    await ensureRawMaterialDetail(rawMaterialId);
  }

  async function toggleExpandedMaterial(rawMaterialId: string) {
    setExpandedMaterialIds((current) =>
      current.includes(rawMaterialId)
        ? current.filter((candidate) => candidate !== rawMaterialId)
        : [...current, rawMaterialId],
    );
    await ensureRawMaterialDetail(rawMaterialId);
  }

  async function createWorkspace() {
    await runAction("Creating workspace", async () => {
      const name = workspaceName.trim() || "Workspace Lab";
      const tenant = await request<TenantRead>("/api/v1/tenants", {
        method: "POST",
        headers: authHeaders,
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
      setFormulaReviewRequests([]);
      setFormulaReviewArtifacts({});
      setCompatibilityRules([]);
      setCompatibilityRuleForm({
        materialAId: "",
        materialBId: "",
        severity: "warning",
        message: "",
        recommendedAction: "",
      });
      setJiraConnections([]);
      setTenantInvitations([]);
      setJiraConnectionForm(emptyJiraConnectionForm);
      setJiraMetadata(null);
      setRequirementParse(null);
      setAgentPlan(null);
      setDraftReview(null);
      resetSavedFormulaComparisonState();
      setAiRuns([]);
      resetImportState();
      setMessage("Workspace ready");
    });
  }

  async function loadAuthenticatedWorkspace(accessToken: string) {
    setStatus("working");
    setMessage("Loading tenant");
    const baseHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    };
    try {
      const tenants = await request<TenantRead[]>("/api/v1/tenants", {
        method: "GET",
        headers: baseHeaders,
      });
      const tenant =
        tenants.find((candidate) => candidate.slug === "atlantica-agricola") ?? tenants[0];
      if (!tenant) {
        setStatus("error");
        setMessage("No tenant invitation is active for this user.");
        return;
      }
      const tenantHeaders = { ...baseHeaders, "X-Tenant-Id": tenant.id };
      const [parameters, invitations] = await Promise.all([
        request<ParameterRead[]>("/api/v1/parameters", {
          method: "GET",
          headers: tenantHeaders,
        }),
        isTenantAdminRole(tenant.role)
          ? request<TenantInvitationRead[]>("/api/v1/tenant-invitations", {
              method: "GET",
              headers: tenantHeaders,
            })
          : Promise.resolve([]),
      ]);

      const activeParameter = parameters[0] ?? null;
      setWorkspace({
        ...emptyWorkspace,
        tenant,
        parameter: activeParameter,
        parameters,
        rawMaterials: [],
        formulaName: `${tenant.name} Formula`,
      });
      setSelectedMaterialId(null);
      setComparisonMaterialIds([]);
      setDetailedMaterialIds([]);
      setWorkspaceName(tenant.name);
      setResult(null);
      setFormulas([]);
      setCalculationHistory([]);
      setFormulaReviewRequests([]);
      setFormulaReviewArtifacts({});
      setCompatibilityRules([]);
      setJiraConnections([]);
      setTenantInvitations(invitations);
      setJiraMetadata(null);
      setRequirementParse(null);
      setAgentPlan(null);
      setDraftReview(null);
      setAiRuns([]);
      resetImportState();
      setStatus("idle");
      setMessage(`${tenant.name} loaded`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not load tenant");
    }
  }

  async function signOut() {
    await getSupabaseBrowserClient().auth.signOut();
    window.location.href = "/login";
  }

  async function createTenantInvitation() {
    if (!workspace.tenant) {
      setError("Create a workspace first");
      return;
    }
    if (!isTenantAdminRole(workspace.tenant.role)) {
      setError("Only tenant admins can send invitation links");
      return;
    }
    const email = invitationForm.email.trim().toLowerCase();
    if (!email.includes("@")) {
      setError("Invitation email is invalid");
      return;
    }

    await runAction("Sending invitation link", async () => {
      const invitation = await request<TenantInvitationRead>("/api/v1/tenant-invitations", {
        method: "POST",
        headers,
        body: JSON.stringify({
          email,
          role: invitationForm.role,
          send_link: true,
        }),
      });
      setTenantInvitations((current) => {
        const rest = current.filter((item) => item.id !== invitation.id);
        return [invitation, ...rest];
      });
      setInvitationForm((current) => ({ ...current, email: "" }));
      setMessage(`Invitation link sent to ${invitation.email}`);
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
        parameters: mergeParameters(current.parameters, parameter),
      }));
      updateComparisonConstraint("parameterCode", parameter.code);
      refreshCatalog();
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

      setWorkspace((current) => {
        const fullMaterial = toWorkspaceRawMaterial(
          material,
          {
            price,
            parameterValue: current.parameter ? parameterValue : null,
          },
          current.parameters,
        );
        if (current.parameter && parameterValue !== null) {
          fullMaterial.parameters[current.parameter.code] = {
            parameterId: current.parameter.id,
            code: current.parameter.code,
            name: current.parameter.name,
            value: parameterValue,
            unit: current.parameter.unit,
            source: "manual",
            confidence: null,
          };
          fullMaterial.positiveParameterCount = Object.values(fullMaterial.parameters).filter(
            (parameter) => Math.abs(parameter.value) > 0.0001,
          ).length;
        }
        return {
          ...current,
          rawMaterials: mergeRawMaterials(current.rawMaterials, [fullMaterial]),
        };
      });
      setDetailedMaterialIds((current) =>
        current.includes(material.id) ? current : [...current, material.id],
      );
      refreshCatalog();
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
      refreshCatalog();
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

  async function refreshJiraConnections(options: { silent?: boolean } = {}) {
    if (!workspace.tenant) {
      setError("Create a workspace first");
      return;
    }
    const loadConnections = async () => {
      const connections = await request<JiraConnection[]>("/api/v1/integrations/jira", {
        method: "GET",
        headers,
      });
      setJiraConnections(connections);
      const preferredConnection =
        connections.find((connection) => connection.is_active) ?? connections[0] ?? null;
      if (preferredConnection) {
        setJiraConnectionForm(jiraConnectionFormFromRead(preferredConnection));
      } else {
        setJiraMetadata(null);
      }
      return connections;
    };
    if (options.silent) {
      await loadConnections();
      return;
    }
    await runAction("Refreshing integrations", async () => {
      await loadConnections();
      setMessage("Integrations refreshed");
    });
  }

  async function saveJiraConnection() {
    if (!workspace.tenant) {
      setError("Create a workspace first");
      return;
    }
    if (!canSaveJiraConnection) {
      setError("Jira URL, project key and issue type are required");
      return;
    }

    await runAction("Saving Jira connection", async () => {
      const payload = buildJiraConnectionPayload(jiraConnectionForm);
      const connection = activeJiraConnection
        ? await request<JiraConnection>(`/api/v1/integrations/jira/${activeJiraConnection.id}`, {
            method: "PATCH",
            headers,
            body: JSON.stringify(payload),
          })
        : await request<JiraConnection>("/api/v1/integrations/jira", {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
          });
      setJiraConnections((current) => [
        connection,
        ...current.filter((item) => item.id !== connection.id),
      ]);
      setJiraConnectionForm(jiraConnectionFormFromRead(connection));
      setJiraMetadata(null);
      setMessage("Jira connection saved");
    });
  }

  async function testJiraConnection() {
    if (!activeJiraConnection) {
      setError("Save Jira connection first");
      return;
    }

    await runAction("Testing Jira configuration", async () => {
      const result = await request<JiraConnectionTest>(
        `/api/v1/integrations/jira/${activeJiraConnection.id}/test`,
        {
          method: "POST",
          headers,
        },
      );
      await refreshJiraConnections({ silent: true });
      setMessage(`${result.status}: ${result.message}`);
    });
  }

  async function loadJiraMetadata() {
    if (!activeJiraConnection) {
      setError("Save Jira connection first");
      return;
    }
    const projectKey =
      jiraConnectionForm.defaultProjectKey.trim() || activeJiraConnection.default_project_key;
    const issueType =
      jiraConnectionForm.defaultIssueType.trim() || activeJiraConnection.default_issue_type;
    const query = new URLSearchParams({
      project_key: projectKey,
      issue_type: issueType,
    });

    await runAction("Loading Jira metadata", async () => {
      const [projects, issueTypes, fields] = await Promise.all([
        request<JiraMetadataState["projects"]>(
          `/api/v1/integrations/jira/${activeJiraConnection.id}/projects`,
          { method: "GET", headers },
        ),
        request<JiraMetadataState["issueTypes"]>(
          `/api/v1/integrations/jira/${activeJiraConnection.id}/issue-types?${query.toString()}`,
          { method: "GET", headers },
        ),
        request<JiraMetadataState["fields"]>(
          `/api/v1/integrations/jira/${activeJiraConnection.id}/fields?${query.toString()}`,
          { method: "GET", headers },
        ),
      ]);
      setJiraMetadata({ projectKey, issueType, projects, issueTypes, fields });
      setMessage(`Jira metadata loaded: ${fields.length} fields`);
    });
  }

  function mapJiraField(field: JiraFieldMetadata) {
    try {
      const currentMapping = parseJsonObject(
        jiraConnectionForm.fieldMappingJson,
        "Jira field mapping",
      );
      const nextMapping = { ...currentMapping, [jiraMappingKey]: field.field_id };
      setJiraConnectionForm((current) => ({
        ...current,
        fieldMappingJson: JSON.stringify(nextMapping, null, 2),
      }));
      setStatus("idle");
      setMessage(`Mapped ${jiraMappingKey} to ${field.field_id}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Invalid Jira field mapping JSON");
    }
  }

  async function authorizeJiraOAuth() {
    if (!workspace.tenant) {
      setError("Create a workspace first");
      return;
    }
    if (jiraConnectionForm.authType !== "oauth") {
      setError("Switch Jira authentication to OAuth first");
      return;
    }

    await runAction("Opening Jira authorization", async () => {
      const authorization = await request<JiraOAuthAuthorize>(
        "/api/v1/integrations/jira/oauth/authorize-url",
        {
          method: "GET",
          headers,
        },
      );
      window.location.href = authorization.authorization_url;
    });
  }

  async function prepareJiraReview() {
    if (!workspace.tenant || !workspace.formulaId) {
      setError("Save the formula before preparing Jira review");
      return;
    }
    if (!activeJiraConnection) {
      setError("Configure Jira before preparing review");
      return;
    }
    if (result === null) {
      setError("Save and calculate before preparing Jira review");
      return;
    }

    await runAction("Preparing Jira review", async () => {
      const review = await request<FormulaReviewRequest>(
        `/api/v1/formulas/${workspace.formulaId}/reviews/jira`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({}),
        },
      );
      setFormulaReviewRequests((current) => [
        review,
        ...current.filter((item) => item.id !== review.id),
      ]);
      setFormulaReviewArtifacts((current) => ({ ...current, [review.id]: [] }));
      setMessage("Jira review prepared");
    });
  }

  async function sendCurrentFormulaToJira() {
    if (!workspace.tenant || !workspace.formulaId) {
      setError("Save and calculate the formula before sending to Jira");
      return;
    }
    if (!activeJiraConnection) {
      setError("Configure Jira before sending");
      return;
    }
    if (result === null) {
      setError("Calculate before sending to Jira");
      return;
    }
    if (!workspace.formulaJiraProjectId.trim()) {
      setError("ProyectoID is required before sending to Jira");
      return;
    }

    await runAction("Sending formula to Jira", async () => {
      const existingDraftReview = formulaReviewRequests.find((review) => !review.jira_issue_key);
      const review =
        existingDraftReview ??
        (await request<FormulaReviewRequest>(
          `/api/v1/formulas/${workspace.formulaId}/reviews/jira`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({}),
          },
        ));
      const sentReview = await request<FormulaReviewRequest>(
        `/api/v1/formula-reviews/${review.id}/jira/send`,
        {
          method: "POST",
          headers,
        },
      );
      setFormulaReviewRequests((current) => [
        sentReview,
        ...current.filter((item) => item.id !== sentReview.id),
      ]);
      await loadFormulaReviewRequests(sentReview.formula_id);
      setMessage(
        sentReview.review_status === "partial_failure"
          ? "Jira issue created; Excel attachment failed"
          : "Jira issue created",
      );
    });
  }

  async function generateJiraReviewExcel(reviewId: string) {
    await runAction("Generating Jira Excel", async () => {
      const artifact = await request<FormulaReviewArtifact>(
        `/api/v1/formula-reviews/${reviewId}/artifacts/excel`,
        {
          method: "POST",
          headers,
        },
      );
      setFormulaReviewArtifacts((current) => ({
        ...current,
        [reviewId]: [
          artifact,
          ...(current[reviewId] ?? []).filter((item) => item.id !== artifact.id),
        ],
      }));
      setMessage("Jira Excel ready");
    });
  }

  async function downloadJiraReviewArtifact(artifact: FormulaReviewArtifact) {
    await runAction("Downloading Jira Excel", async () => {
      const response = await fetch(
        `${apiUrl}/api/v1/formula-review-artifacts/${artifact.id}/download`,
        { method: "GET", headers: uploadHeaders },
      );
      if (!response.ok) {
        throw new Error(`API ${response.status}: ${await response.text()}`);
      }
      const blobUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = artifact.file_name;
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
      setMessage("Jira Excel downloaded");
    });
  }

  async function sendJiraReviewToJira(reviewId: string) {
    await runAction("Sending Jira review", async () => {
      const review = await request<FormulaReviewRequest>(
        `/api/v1/formula-reviews/${reviewId}/jira/send`,
        {
          method: "POST",
          headers,
        },
      );
      setFormulaReviewRequests((current) =>
        current.map((item) => (item.id === review.id ? review : item)),
      );
      await loadFormulaReviewRequests(review.formula_id);
      setMessage(
        review.review_status === "partial_failure"
          ? "Jira issue created; Excel attachment failed"
          : "Jira issue created",
      );
    });
  }

  async function retryJiraReviewAttachment(reviewId: string) {
    await runAction("Retrying Jira Excel attachment", async () => {
      const review = await request<FormulaReviewRequest>(
        `/api/v1/formula-reviews/${reviewId}/jira/retry-attachment`,
        {
          method: "POST",
          headers,
        },
      );
      setFormulaReviewRequests((current) =>
        current.map((item) => (item.id === review.id ? review : item)),
      );
      await loadFormulaReviewRequests(review.formula_id);
      setMessage("Jira Excel attachment retried");
    });
  }

  async function syncJiraReviewStatus(reviewId: string) {
    await runAction("Syncing Jira review", async () => {
      const review = await request<FormulaReviewRequest>(
        `/api/v1/formula-reviews/${reviewId}/sync`,
        {
          method: "POST",
          headers,
        },
      );
      setFormulaReviewRequests((current) =>
        current.map((item) => (item.id === review.id ? review : item)),
      );
      setMessage("Jira status synced");
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

  async function addFormulaLine(rawMaterialId: string) {
    await ensureRawMaterialDetail(rawMaterialId);
    setWorkspace((current) => ({
      ...current,
      formulaLines: [
        ...current.formulaLines,
        { localId: makeLocalId(), rawMaterialId, percentage: 0 },
      ],
    }));
    setBuilderSections((current) => ({
      ...current,
      formula: true,
      calculation: true,
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

  function moveFormulaLine(localId: string, direction: -1 | 1) {
    setWorkspace((current) => {
      const index = current.formulaLines.findIndex((line) => line.localId === localId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.formulaLines.length) {
        return current;
      }
      const nextLines = [...current.formulaLines];
      const [line] = nextLines.splice(index, 1);
      nextLines.splice(nextIndex, 0, line);
      return {
        ...current,
        formulaLines: nextLines,
      };
    });
    markDraftReviewPending();
    setResult(null);
  }

  function duplicateFormulaLine(localId: string) {
    setWorkspace((current) => {
      const index = current.formulaLines.findIndex((line) => line.localId === localId);
      if (index < 0) {
        return current;
      }
      const line = current.formulaLines[index];
      const nextLines = [...current.formulaLines];
      nextLines.splice(index + 1, 0, { ...line, localId: makeLocalId() });
      return {
        ...current,
        formulaLines: nextLines,
      };
    });
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
            const activeParameterMap =
              current.parameter && activeParameter
                ? {
                    [current.parameter.code]: {
                      parameterId: current.parameter.id,
                      code: current.parameter.code,
                      name: current.parameter.name,
                      value: activeParameter.value,
                      unit: activeParameter.unit,
                      source: null,
                      confidence: null,
                    },
                  }
                : {};
            return {
              id: item.raw_material_id,
              code: material?.code ?? null,
              externalCode: null,
              name: item.name,
              family: null,
              isActive: true,
              isObsolete: false,
              price: material?.price_eur_per_kg ?? null,
              parameterValue: activeParameter?.value ?? null,
              parameterCount: Object.keys(activeParameterMap).length,
              positiveParameterCount: Object.values(activeParameterMap).filter(
                (parameter) => Math.abs(parameter.value) > 0.0001,
              ).length,
              parameters: activeParameterMap,
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
      setBuilderSections((current) => ({
        ...current,
        formula: true,
        calculation: true,
      }));
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

  async function saveFormula() {
    if (!workspace.tenant) {
      setError("Create a workspace first");
      return;
    }
    if (!workspace.formulaLines.length) {
      setError("Add at least one formula line");
      return;
    }
    if (!isFormulaBalanced) {
      setError("La formula debe sumar exactamente 100% para poder guardarse.");
      setBuilderSections((current) => ({
        ...current,
        formula: true,
        calculation: true,
      }));
      return;
    }
    if (hasPendingDraftReview) {
      setError("Confirm draft review before saving");
      return;
    }

    await runAction("Saving formula", async () => {
      const items = workspace.formulaLines.map((line, index) => ({
        raw_material_id: line.rawMaterialId,
        percentage: line.percentage,
        order_index: index,
      }));
      const payload = {
        name: workspace.formulaName.trim() || "Manual Formula",
        jira_project_id: workspace.formulaJiraProjectId.trim() || null,
        jira_issue_type: workspace.formulaJiraIssueType,
        jira_product_type: workspace.formulaJiraProductType,
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
        formulaJiraProjectId: formula.jira_project_id ?? "",
        formulaJiraIssueType: textOrDefault(formula.jira_issue_type, "Calidad"),
        formulaJiraProductType: textOrDefault(formula.jira_product_type, "Nuevo"),
      }));
      setResult(calculation);
      setDraftReview(null);
      setSavedFormulaComparison(null);
      setBuilderSections((current) => ({
        ...current,
        calculation: true,
      }));
      await refreshFormulaLibrary({ silent: true });
      await loadCalculationHistory(formula.id);
      await loadFormulaReviewRequests(formula.id);
      setMessage("Formula saved");
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
        formulaJiraProjectId: formula.jira_project_id ?? "",
        formulaJiraIssueType: textOrDefault(formula.jira_issue_type, "Calidad"),
        formulaJiraProductType: textOrDefault(formula.jira_product_type, "Nuevo"),
        formulaLines: formula.items.map((item) => ({
          localId: makeLocalId(),
          rawMaterialId: item.raw_material_id,
          percentage: item.percentage,
        })),
      }));
      setResult(null);
      setDraftReview(null);
      setFormulaReviewArtifacts({});
      setBuilderSections((current) => ({
        ...current,
        formula: true,
        calculation: true,
      }));
      resetImportState();
      await Promise.all(
        formula.items.map((item) => ensureRawMaterialDetail(item.raw_material_id)),
      );
      await loadCalculationHistory(formula.id);
      await loadFormulaReviewRequests(formula.id);
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

  async function loadFormulaReviewRequests(formulaId: string) {
    const reviews = await request<FormulaReviewRequest[]>(
      `/api/v1/formulas/${formulaId}/reviews`,
      { method: "GET", headers },
    );
    setFormulaReviewRequests(reviews);
    await loadFormulaReviewArtifacts(reviews);
  }

  async function loadFormulaReviewArtifacts(reviews: FormulaReviewRequest[]) {
    const entries = await Promise.all(
      reviews.map(async (review) => {
        const artifacts = await request<FormulaReviewArtifact[]>(
          `/api/v1/formula-reviews/${review.id}/artifacts`,
          { method: "GET", headers },
        );
        return [review.id, artifacts] as const;
      }),
    );
    setFormulaReviewArtifacts(Object.fromEntries(entries));
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
      setPendingFile(file, sheets, selectedSheet);
      if (!selectedSheet) {
        setMessage("Select Excel sheet");
        return;
      }
      const preview = await requestExcelImportPreview(file, selectedSheet);
      setImportPreview(preview);
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
          jira_project_id: workspace.formulaJiraProjectId.trim() || null,
          jira_issue_type: workspace.formulaJiraIssueType,
          jira_product_type: workspace.formulaJiraProductType,
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
        formulaJiraProjectId: formula.jira_project_id ?? "",
        formulaJiraIssueType: textOrDefault(formula.jira_issue_type, "Calidad"),
        formulaJiraProductType: textOrDefault(formula.jira_product_type, "Nuevo"),
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
    if (resolveImportRowState(rowNumber, rawMaterialId)) {
      setMessage("Import row resolved");
    }
  }

  function acceptImportSuggestion(row: ExcelImportPreviewRow) {
    if (!row.suggested_raw_material_id) {
      setError("Import row has no suggestion");
      return;
    }
    resolveImportRow(row.row_number, row.suggested_raw_material_id);
  }

  function normalizeWarningSeverity(
    warning: CalculationResult["warnings"][number],
  ): "blocker" | "warning" | "info" {
    if (
      warning.severity === "blocker" ||
      warning.severity === "warning" ||
      warning.severity === "info"
    ) {
      return warning.severity;
    }
    if (warning.code.endsWith("_blocker")) {
      return "blocker";
    }
    if (warning.code.endsWith("_info")) {
      return "info";
    }
    return "warning";
  }

  function jiraConnectionFormFromRead(connection: JiraConnection): JiraConnectionForm {
    return {
      authType: connection.auth_type === "oauth" ? "oauth" : "api_token",
      baseUrl: connection.base_url,
      authEmail: connection.auth_email ?? "",
      apiToken: "",
      defaultProjectKey: connection.default_project_key,
      defaultIssueType: connection.default_issue_type,
      defaultAssignee: connection.default_assignee ?? "",
      fieldMappingJson: JSON.stringify(connection.field_mapping, null, 2),
    };
  }

  function buildJiraConnectionPayload(form: typeof jiraConnectionForm) {
    const fieldMapping = parseJsonObject(form.fieldMappingJson, "Jira field mapping");
    const payload: Record<string, unknown> = {
      base_url: form.baseUrl.trim(),
      auth_type: form.authType,
      auth_email: form.authEmail.trim() || null,
      default_project_key: form.defaultProjectKey.trim(),
      default_issue_type: form.defaultIssueType.trim(),
      default_assignee: form.defaultAssignee.trim() || null,
      field_mapping: fieldMapping,
      is_active: true,
    };
    if (form.authType === "api_token" && form.apiToken.trim()) {
      payload.api_token = form.apiToken.trim();
    }
    return payload;
  }

  function parseJsonObject(value: string, label: string): Record<string, string> {
    const trimmed = value.trim();
    if (!trimmed) {
      return {};
    }
    const parsed = JSON.parse(trimmed) as unknown;
    if (
      parsed === null ||
      Array.isArray(parsed) ||
      typeof parsed !== "object" ||
      Object.values(parsed).some((item) => typeof item !== "string")
    ) {
      throw new Error(`${label} must be a JSON object with string values`);
    }
    return parsed as Record<string, string>;
  }

  function textOrDefault(value: string | null | undefined, fallback: string): string {
    return value?.trim() || fallback;
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

  if (!authChecked || !session) {
    return (
      <main className="loginShell">
        <section className="loginPanel">
          <div className="brand">
            <div className="brandMark">F</div>
            <div>
              <strong>FormulIA Cloud</strong>
              <span>Acceso seguro</span>
            </div>
          </div>
          <div className="statusLine">
            <Loader2 className="spin" size={16} />
            <span>Validando sesion</span>
          </div>
        </section>
      </main>
    );
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
          <button
            className={`navItem ${activeView === "formula" ? "active" : ""}`}
            type="button"
            onClick={() => setActiveView("formula")}
          >
            <FlaskConical size={18} /> Formula actual
          </button>
          <button
            className={`navItem ${activeView === "materials" ? "active" : ""}`}
            type="button"
            onClick={() => setActiveView("materials")}
          >
            <Database size={18} /> Materias primas
          </button>
          <button
            className={`navItem ${activeView === "import" ? "active" : ""}`}
            type="button"
            onClick={() => setActiveView("import")}
          >
            <Upload size={18} /> Importar Excel
          </button>
          <button
            className={`navItem ${activeView === "settings" ? "active" : ""}`}
            type="button"
            onClick={() => setActiveView("settings")}
          >
            <Settings2 size={18} /> Configuracion
          </button>
          <details className="navDisclosure">
            <summary>Herramientas avanzadas</summary>
            <button
              className={`navItem ${activeView === "library" ? "active" : ""}`}
              type="button"
              onClick={() => setActiveView("library")}
            >
              <FolderOpen size={18} /> Biblioteca
            </button>
            <button
              className={`navItem ${activeView === "compatibility" ? "active" : ""}`}
              type="button"
              onClick={() => setActiveView("compatibility")}
            >
              <AlertTriangle size={18} /> Compatibilidad
            </button>
            <button
              className={`navItem ${activeView === "ai" ? "active" : ""}`}
              type="button"
              onClick={() => setActiveView("ai")}
            >
              <BrainCircuit size={18} /> Asistente IA
            </button>
          </details>
        </nav>
      </aside>

      <section className="workspace" id="workspace">
        <header className="topbar">
          <div>
            <h1>{VIEW_TITLES[activeView]}</h1>
            <p>
              {workspace.tenant
                ? `${workspace.formulaName} - ${VIEW_DESCRIPTIONS[activeView]} - ${workspace.tenant.name}`
                : VIEW_DESCRIPTIONS[activeView]}
            </p>
          </div>
          <details className="accountMenu">
            <summary>
              <span className="accountAvatar">
                <UserCircle size={20} />
              </span>
              <span className="accountIdentity">
                <strong>{session?.user.email ?? "Sesion activa"}</strong>
                <small>{workspace.tenant?.role ?? "sin rol"}</small>
              </span>
              <ChevronDown size={15} />
            </summary>
            <div className="accountMenuPanel">
              <button
                className="accountMenuItem"
                type="button"
                onClick={() => setActiveView("settings")}
              >
                <Settings2 size={16} />
                Cuenta y workspace
              </button>
              <a className="accountMenuItem" href="/update-password">
                <KeyRound size={16} />
                Cambiar contrasena
              </a>
              <button
                className="accountMenuItem danger"
                type="button"
                onClick={signOut}
                disabled={isBusy}
              >
                <LogOut size={16} />
                Cerrar sesion
              </button>
            </div>
          </details>
        </header>

        <div className="statusLine" data-state={status}>
          {status === "error" ? <AlertTriangle size={16} /> : <RefreshCw size={16} />}
          <span>{message}</span>
        </div>

        <div className="grid">
          <SettingsPanel
            active={activeView === "settings"}
            workspace={workspace}
            workspaceName={workspaceName}
            sessionEmail={session.user.email}
            invitationForm={invitationForm}
            tenantInvitations={tenantInvitations}
            parameterForm={parameterForm}
            activeJiraConnection={activeJiraConnection}
            jiraConnectionForm={jiraConnectionForm}
            jiraMetadata={jiraMetadata}
            jiraMappingKey={jiraMappingKey}
            isBusy={isBusy}
            canEditTenantData={canEditTenantData}
            canManageTenantUsers={canManageTenantUsers}
            canSaveJiraConnection={canSaveJiraConnection}
            canTestJiraConnection={canTestJiraConnection}
            canLoadJiraMetadata={canLoadJiraMetadata}
            canAuthorizeJiraOAuth={canAuthorizeJiraOAuth}
            showInvitationAdminPanel={isTenantAdminRole(workspace.tenant?.role)}
            onWorkspaceNameChange={setWorkspaceName}
            onCreateWorkspace={createWorkspace}
            onInvitationFormChange={setInvitationForm}
            onCreateTenantInvitation={createTenantInvitation}
            onParameterFormChange={setParameterForm}
            onCreateParameter={createParameter}
            onJiraConnectionFormChange={setJiraConnectionForm}
            onSaveJiraConnection={saveJiraConnection}
            onRefreshJiraConnections={refreshJiraConnections}
            onTestJiraConnection={testJiraConnection}
            onLoadJiraMetadata={loadJiraMetadata}
            onAuthorizeJiraOAuth={authorizeJiraOAuth}
            onJiraMappingKeyChange={setJiraMappingKey}
            onMapJiraField={mapJiraField}
          />

          <RawMaterialsPanel
            active={activeView === "materials"}
            rawMaterials={workspace.rawMaterials}
            parameter={workspace.parameter}
            materialForm={materialForm}
            aliasInputs={aliasInputs}
            canEditTenantData={canEditTenantData}
            isBusy={isBusy}
            onMaterialFormChange={setMaterialForm}
            onAliasInputsChange={setAliasInputs}
            onCreateMaterial={createMaterial}
            onAddFormulaLine={addFormulaLine}
            onCreateAlias={createAlias}
          />

          <CompatibilityPanel
            active={activeView === "compatibility"}
            rules={compatibilityRules}
            rawMaterials={workspace.rawMaterials}
            rawMaterialsById={rawMaterialsById}
            form={compatibilityRuleForm}
            canEditTenantData={canEditTenantData}
            canCreateRule={canCreateCompatibilityRule}
            onFormChange={setCompatibilityRuleForm}
            onCreateRule={createCompatibilityRule}
          />

          <SavedFormulaComparisonPanel
            active={activeView === "library"}
            formulas={formulas}
            calculationHistory={calculationHistory}
            formulaCompareSelection={formulaCompareSelection}
            comparisonConstraintForm={comparisonConstraintForm}
            comparisonMaterialOptions={comparisonMaterialOptions}
            canEditTenantData={canEditTenantData}
            canCompareSavedFormulas={canCompareSavedFormulas}
            isBusy={isBusy}
            savedFormulaComparison={savedFormulaComparison}
            comparisonComplianceSummary={comparisonComplianceSummary}
            comparisonConstraintEvaluations={comparisonConstraintEvaluations}
            comparisonConstraintIssueCount={comparisonConstraintIssueCount}
            visibleComparisonConstraintEvaluations={visibleComparisonConstraintEvaluations}
            showOnlyConstraintIssues={showOnlyConstraintIssues}
            onSelectFormula={selectFormulaForComparison}
            onRefreshLibrary={refreshFormulaLibrary}
            onCompareSavedFormulas={compareSavedFormulas}
            onOpenFormula={openFormula}
            onUpdateConstraint={updateComparisonConstraint}
            onShowOnlyConstraintIssuesChange={setShowOnlyConstraintIssues}
          />

          <ExcelImportPanel
            active={activeView === "import"}
            importPreview={importPreview}
            importFileName={importFileName}
            availableImportSheets={availableImportSheets}
            selectedImportSheet={selectedImportSheet}
            rawMaterials={workspace.rawMaterials}
            canEditTenantData={canEditTenantData}
            canSelectImportSheet={canSelectImportSheet}
            canSaveImport={canSaveImport}
            isBusy={isBusy}
            onSelectFile={selectExcelImportFile}
            onPreviewSheet={previewSelectedImportSheet}
            onSaveImport={saveExcelImport}
            onResolveRow={resolveImportRow}
            onCreateMaterialFromRow={createMaterialFromImportRow}
            onAcceptSuggestion={acceptImportSuggestion}
            onCreateAliasFromRow={createAliasFromImportRow}
          />

          <AiAssistantPanel
            active={activeView === "ai"}
            requirementText={requirementText}
            requirementParse={requirementParse}
            agentPlan={agentPlan}
            aiRuns={aiRuns}
            canParseRequirements={canParseRequirements}
            canPlanRequirements={canPlanRequirements}
            canEditTenantData={canEditTenantData}
            isBusy={isBusy}
            onRequirementTextChange={setRequirementText}
            onParseRequirements={parseRequirements}
            onPlanRequirements={planRequirements}
            onRefreshAiRuns={refreshAiRuns}
            onReuseInfeasibilityAction={reuseInfeasibilityAction}
            onApplyOptimizerDraft={applyOptimizerDraft}
          />

          <section
            id="formula"
            className="panel formulaPanel formulaBuilder"
            hidden={activeView !== "formula"}
          >
            <div className="panelHeader">
              <h2>Formula Builder</h2>
              <span>{isFormulaBalanced ? "Balanced" : `${totalPercentage.toFixed(1)}%`}</span>
            </div>
            <BuilderStep
              section="basics"
              title="1. Datos basicos"
              summary="Nombre de formula y, solo si procede, datos de revision."
              isOpen={builderSections.basics}
              onToggle={toggleBuilderSection}
            >
                  <label className="fullWidthLabel">
                    <span>Name</span>
                    <input
                      value={workspace.formulaName}
                      onChange={(event) => {
                        setWorkspace((current) => ({
                          ...current,
                          formulaName: event.target.value,
                        }));
                        markDraftReviewPending();
                      }}
                      disabled={isBusy}
                    />
                  </label>
                  {activeJiraConnection ? (
                    <div className="formulaMetaGrid">
                      <label>
                        <span>ProyectoID Jira opcional</span>
                        <input
                          placeholder="FLOWER"
                          value={workspace.formulaJiraProjectId}
                          onChange={(event) => {
                            setWorkspace((current) => ({
                              ...current,
                              formulaJiraProjectId: event.target.value,
                            }));
                            markDraftReviewPending();
                          }}
                          disabled={isBusy}
                        />
                      </label>
                      <label>
                        <span>Jira activity</span>
                        <input
                          list="jira-activity-options"
                          value={workspace.formulaJiraIssueType}
                          onChange={(event) => {
                            setWorkspace((current) => ({
                              ...current,
                              formulaJiraIssueType: event.target.value,
                            }));
                            markDraftReviewPending();
                          }}
                          disabled={isBusy}
                        />
                      </label>
                      <label>
                        <span>Tipo producto</span>
                        <input
                          list="jira-product-type-options"
                          value={workspace.formulaJiraProductType}
                          onChange={(event) => {
                            setWorkspace((current) => ({
                              ...current,
                              formulaJiraProductType: event.target.value,
                            }));
                            markDraftReviewPending();
                          }}
                          disabled={isBusy}
                        />
                      </label>
                      <datalist id="jira-activity-options">
                        <option value="Calidad" />
                        <option value="Prototipo" />
                        <option value="PoC" />
                      </datalist>
                      <datalist id="jira-product-type-options">
                        <option value="Nuevo" />
                        <option value="Mod A" />
                        <option value="Mod B" />
                        <option value="Mod C" />
                      </datalist>
                    </div>
                  ) : null}
            </BuilderStep>
            <BuilderStep
              section="materials"
              title="2. Materias primas"
              summary={
                <>
                  {catalogLoading ? "Cargando catalogo" : `${catalogTotal} disponibles`} -{" "}
                  {visibleParameterSummary}
                </>
              }
              isOpen={builderSections.materials}
              bodyClassName="builderSearch"
              onToggle={toggleBuilderSection}
            >
                  <div className="parameterViewPanel">
                    <div className="parameterViewHeader">
                      <span>
                        <strong>Que parametros quieres ver</strong>
                        <small>{selectedParameterPreset.helper}</small>
                      </span>
                      <label className="switchControl">
                        <input
                          type="checkbox"
                          checked={showOnlyPositiveParameters}
                          onChange={(event) => setShowOnlyPositiveParameters(event.target.checked)}
                        />
                        <span>Solo &gt; 0</span>
                      </label>
                    </div>
                    <ParameterPresetPicker
                      value={parameterViewPreset}
                      onChange={(key) => selectParameterView(key, visibleParameterCodes)}
                    />
                    {parameterViewPreset === "custom" ? (
                      <div className="parameterPicker">
                        {parameterCatalog.map((parameter) => (
                          <label key={parameter.code}>
                            <input
                              type="checkbox"
                              checked={customParameterCodes.includes(parameter.code)}
                              onChange={() => toggleCustomParameterCode(parameter.code)}
                            />
                            <span>
                              {parameter.code}
                              <small>
                                {parameter.family} - {parameter.positiveMaterialCount}/
                                {parameter.materialCount} con valor
                              </small>
                            </span>
                          </label>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <MaterialCatalogControls
                    query={formulaMaterialQuery}
                    canSearch={Boolean(workspace.tenant) && !isBusy}
                    catalogParameterConditions={catalogParameterConditions}
                    catalogFamilyFilter={catalogFamilyFilter}
                    catalogMaterialFamilies={catalogMaterialFamilies}
                    catalogPriceFilter={catalogPriceFilter}
                    catalogPriceMin={catalogPriceMin}
                    catalogPriceMax={catalogPriceMax}
                    catalogParameterToAdd={catalogParameterToAdd}
                    parameterCatalog={parameterCatalog}
                    visibleParameterCodeSet={visibleParameterCodeSet}
                    resultCount={materialSearchResults.length}
                    catalogTotal={catalogTotal}
                    catalogLoading={catalogLoading}
                    materialResultLimit={materialResultLimit}
                    onQueryChange={setFormulaMaterialQuery}
                    onFamilyFilterChange={setCatalogFamilyFilter}
                    onPriceFilterChange={setCatalogPriceFilter}
                    onPriceMinChange={setCatalogPriceMin}
                    onPriceMaxChange={setCatalogPriceMax}
                    onParameterToAddChange={setCatalogParameterToAdd}
                    onAddCondition={addCatalogParameterCondition}
                    onUpdateCondition={updateCatalogParameterCondition}
                    onRemoveCondition={removeCatalogParameterCondition}
                    onLoadMore={() =>
                      setMaterialResultLimit((current) => Math.min(current + 60, catalogTotal))
                    }
                    onResetFilters={resetCatalogFilters}
                  />
                  <MaterialCatalogWorkspace
                    catalogLoading={catalogLoading}
                    catalogTotal={catalogTotal}
                    materials={materialSearchResults}
                    workspaceMaterialCount={workspace.rawMaterials.length}
                    formulaLines={workspace.formulaLines}
                    selectedMaterialId={selectedMaterialId}
                    selectedMaterial={selectedMaterial}
                    selectedMaterialParameters={selectedMaterialParameters}
                    comparisonMaterials={comparisonMaterials}
                    detailedMaterialIds={detailedMaterialIds}
                    expandedMaterialIds={expandedMaterialIds}
                    comparisonMaterialIds={comparisonMaterialIds}
                    visibleParameterCodes={visibleParameterCodes}
                    showOnlyPositiveParameters={showOnlyPositiveParameters}
                    isBusy={isBusy}
                    onInspectMaterial={inspectMaterial}
                    onToggleCompareMaterial={toggleCompareMaterial}
                    onAddFormulaLine={addFormulaLine}
                    onToggleExpandedMaterial={toggleExpandedMaterial}
                    onClearComparison={() => setComparisonMaterialIds([])}
                  />
            </BuilderStep>
            <BuilderStep
              section="formula"
              title="3. Formula editable"
              summary={`${workspace.formulaLines.length} lineas - ${totalPercentage.toFixed(1)}%`}
              isOpen={builderSections.formula}
              onToggle={toggleBuilderSection}
            >
                  <FormulaProgressSummary
                    totalPercentage={totalPercentage}
                    isBalanced={isFormulaBalanced}
                    price={
                      result
                        ? formatResultPrice(result)
                        : formatFormulaNumber(localPreview.priceTotal, " EUR/kg")
                    }
                    source={result ? "Backend official" : "Local preview"}
                  />
            <DraftReviewPanel
              draftReview={draftReview}
              draftComparison={draftComparison}
              isBusy={isBusy}
              canConfirmDraftReview={canConfirmDraftReview}
              formatResultPrice={formatResultPrice}
              formatSignedDelta={formatSignedDelta}
              formatSignedInteger={formatSignedInteger}
              onNotesChange={updateDraftReviewNotes}
              onConfirmDraftReview={confirmDraftReview}
            />
            <JiraReviewPanel
              activeJiraConnection={activeJiraConnection}
              formulaReviewRequests={formulaReviewRequests}
              formulaReviewArtifacts={formulaReviewArtifacts}
              canPrepareJiraReview={canPrepareJiraReview}
              isBusy={isBusy}
              onSendCurrentFormulaToJira={sendCurrentFormulaToJira}
              onGenerateReviewExcel={generateJiraReviewExcel}
              onDownloadArtifact={downloadJiraReviewArtifact}
              onSendReviewToJira={sendJiraReviewToJira}
              onSyncReviewStatus={syncJiraReviewStatus}
              onRetryReviewAttachment={retryJiraReviewAttachment}
            />
            <FormulaLineTable
              lines={formulaLineDetails}
              visibleParameterCodes={visibleParameterCodes}
              showOnlyPositiveParameters={showOnlyPositiveParameters}
              isBusy={isBusy}
              onMoveLine={moveFormulaLine}
              onUpdateLine={updateFormulaLine}
              onDuplicateLine={duplicateFormulaLine}
              onRemoveLine={removeFormulaLine}
            />
            </BuilderStep>
            <BuilderStep
              section="calculation"
              title="4. Calculo vivo"
              summary={
                <>
                  {result ? "Backend oficial" : "Preview local"} - {parameterRows.length} parametros
                </>
              }
              isOpen={builderSections.calculation}
              bodyClassName="builderCalculationPanel"
              onToggle={toggleBuilderSection}
            >
                  <FormulaCalculationPanel
                    isBackendResult={Boolean(result)}
                    parameterRows={parameterRows}
                    visibleWarnings={visibleWarnings}
                    selectedPresetLabel={selectedParameterPreset.label}
                    visibleParameterSummary={visibleParameterSummary}
                    showOnlyPositiveParameters={showOnlyPositiveParameters}
                    parameterViewPreset={parameterViewPreset}
                    isFormulaBalanced={isFormulaBalanced}
                    totalPercentage={totalPercentage}
                    isBusy={isBusy}
                    canSaveFormula={canSaveFormula}
                    onShowOnlyPositiveChange={setShowOnlyPositiveParameters}
                    onSelectParameterView={(key) => selectParameterView(key, visibleParameterCodes)}
                    normalizeWarningSeverity={normalizeWarningSeverity}
                    onSaveFormula={saveFormula}
                  />
            </BuilderStep>
          </section>

          <section id="results" className="panel resultPanel" hidden={activeView !== "results"}>
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
                result.warnings.map((warning, index) => {
                  const severity = normalizeWarningSeverity(warning);
                  return (
                    <div
                      data-severity={severity}
                      key={`${warning.code}-${warning.rule_id ?? ""}-${warning.raw_material_id ?? ""}-${warning.parameter_code ?? ""}-${index}`}
                    >
                      <AlertTriangle size={16} />
                      <span>
                        <strong>{severity}</strong>
                        {warning.message}
                        {warning.recommended_action ? (
                          <small>{warning.recommended_action}</small>
                        ) : null}
                      </span>
                    </div>
                  );
                })
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
