"use client";

import {
  AlertTriangle,
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
import { request } from "./workspace-api";
import { getSupabaseBrowserClient } from "./supabase-client";
import {
  emptyJiraConnectionForm,
  emptyWorkspace,
  formatDateTime,
  mergeRawMaterials,
  normalizeCode,
  parseOptionalNumber,
  type CalculationResult,
  type CompatibilityRuleRead,
  type AiRun,
  type AgentPlan,
  type FormulaCalculationHistory,
  type FormulaReviewArtifact,
  type FormulaRead,
  type FormulaReviewRequest,
  type JiraConnection,
  type JiraConnectionForm,
  type JiraMetadataState,
  type MaterialForm,
  type RawMaterial,
  type RequirementParse,
  type Status,
  type TenantInvitationRead,
  type WorkspaceState,
} from "./workspace-model";
import {
  buildConstraintEvaluations,
  buildConstraintComplianceSummary,
  buildDraftComparison,
  hasConstraintIssue,
  type DraftReviewState,
} from "./workspace-comparison";
import {
  PARAMETER_VIEW_PRESETS,
  formatFormulaNumber,
  type ParameterViewPresetKey,
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
import { useFormulaLineActions } from "./formula-builder-line-actions";
import { useFormulaBuilderUiState } from "./formula-builder-ui-state";
import { ExcelImportPanel } from "./excel-import-panel";
import { useExcelImportState } from "./excel-import-state";
import { AiAssistantPanel } from "./ai-assistant-panel";
import { SettingsPanel } from "./settings-panel";
import { RawMaterialsPanel } from "./raw-materials-panel";
import { CompatibilityPanel } from "./compatibility-panel";
import { CalculationResultsPanel } from "./calculation-results-panel";
import {
  formatResultPrice,
  formatSignedDelta,
  formatSignedInteger,
} from "./formula-formatters";
import { FormulaCalculationStep } from "./formula-builder-ui/formula-calculation-step";
import { FormulaCompositionStep } from "./formula-builder-ui/formula-composition-step";
import {
  FormulaBasicsStep,
  type FormulaBasicsValue,
} from "./formula-builder-ui/formula-basics-step";
import { FormulaMaterialsStep } from "./formula-builder-ui/formula-materials-step";
import { SavedFormulaComparisonPanel } from "./saved-formula-comparison-panel";
import { useSavedFormulaComparisonState } from "./saved-formula-comparison-state";
import { useSavedFormulaActions } from "./saved-formula-actions";
import { useJiraReviewActions } from "./jira-review-actions";
import { useExcelImportActions } from "./excel-import-actions";
import { useJiraConnectionActions } from "./jira-connection-actions";
import { useAiAssistantActions } from "./ai-assistant-actions";
import { useCompatibilityActions } from "./compatibility-actions";
import { useRawMaterialActions } from "./raw-material-actions";
import { isTenantAdminRole } from "./tenant-roles";
import { useWorkspaceSettingsActions } from "./workspace-settings-actions";
import { useDraftReviewActions } from "./draft-review-actions";

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
  const setError = useCallback((nextMessage: string) => {
    setStatus("error");
    setMessage(nextMessage);
  }, []);
  const runAction = useCallback(
    async (label: string, action: () => Promise<void>) => {
      setStatus("working");
      setMessage(label);
      try {
        await action();
        setStatus("idle");
      } catch (error) {
        setError(error instanceof Error ? error.message : "Action failed");
      }
    },
    [setError],
  );
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
  const {
    createWorkspace,
    loadAuthenticatedWorkspace,
    signOut,
    createTenantInvitation,
    createParameter,
  } = useWorkspaceSettingsActions({
    workspace,
    workspaceName,
    invitationForm,
    parameterForm,
    authHeaders,
    headers,
    setWorkspace,
    setWorkspaceName,
    setSelectedMaterialId,
    setComparisonMaterialIds,
    setDetailedMaterialIds,
    setResult,
    setFormulas,
    setCalculationHistory,
    setFormulaReviewRequests,
    setFormulaReviewArtifacts,
    setCompatibilityRules,
    setCompatibilityRuleForm,
    setJiraConnections,
    setTenantInvitations,
    setJiraConnectionForm,
    setJiraMetadata,
    setRequirementParse,
    setAgentPlan,
    setDraftReview,
    setAiRuns,
    setStatus,
    setInvitationForm,
    resetSavedFormulaComparisonState,
    resetImportState,
    updateComparisonConstraint,
    refreshCatalog,
    runAction,
    setError,
    setMessage,
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
  }, [loadAuthenticatedWorkspace, session?.access_token, workspace.tenant]);

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
  const formulaBasicsValue = useMemo<FormulaBasicsValue>(
    () => ({
      formulaName: workspace.formulaName,
      formulaJiraProjectId: workspace.formulaJiraProjectId,
      formulaJiraIssueType: workspace.formulaJiraIssueType,
      formulaJiraProductType: workspace.formulaJiraProductType,
    }),
    [
      workspace.formulaJiraIssueType,
      workspace.formulaJiraProductType,
      workspace.formulaJiraProjectId,
      workspace.formulaName,
    ],
  );
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
  const formulaCompositionPrice = result
    ? formatResultPrice(result)
    : formatFormulaNumber(localPreview.priceTotal, " EUR/kg");
  const formulaCompositionPriceSource = result ? "Backend official" : "Local preview";
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
  const {
    ensureRawMaterialDetail,
    inspectMaterial,
    toggleCompareMaterial,
    toggleExpandedMaterial,
    createMaterial,
    createAlias,
  } = useRawMaterialActions({
    workspace,
    rawMaterialsById,
    detailedMaterialIds,
    materialForm,
    aliasInputs,
    headers,
    setWorkspace,
    setDetailedMaterialIds,
    setSelectedMaterialId,
    setComparisonMaterialIds,
    setExpandedMaterialIds,
    setMaterialForm,
    setAliasInputs,
    setResult,
    refreshCatalog,
    resetImportState,
    runAction,
    setError,
    setMessage,
  });
  const {
    markDraftReviewPending,
    updateDraftReviewNotes,
    confirmDraftReview,
    applyOptimizerDraft,
  } = useDraftReviewActions({
    workspace,
    draftReview,
    agentPlan,
    headers,
    setWorkspace,
    setCalculationHistory,
    setResult,
    setBuilderSections,
    setDraftReview,
    runAction,
    setError,
    setMessage,
  });
  const {
    addFormulaLine,
    removeFormulaLine,
    updateFormulaLine,
    moveFormulaLine,
    duplicateFormulaLine,
  } = useFormulaLineActions({
    setWorkspace,
    setBuilderSections,
    setResult,
    ensureRawMaterialDetail,
    markDraftReviewPending,
  });
  const {
    refreshJiraConnections,
    saveJiraConnection,
    testJiraConnection,
    loadJiraMetadata,
    mapJiraField,
    authorizeJiraOAuth,
  } = useJiraConnectionActions({
    workspace,
    activeJiraConnection,
    jiraConnectionForm,
    jiraMappingKey,
    headers,
    canSaveJiraConnection,
    setJiraConnections,
    setJiraConnectionForm,
    setJiraMetadata,
    setStatus,
    runAction,
    setError,
    setMessage,
  });
  const {
    parseRequirements,
    planRequirements,
    refreshAiRuns,
    reuseInfeasibilityAction,
  } = useAiAssistantActions({
    workspace,
    requirementText,
    headers,
    setRequirementParse,
    setAgentPlan,
    setAiRuns,
    setRequirementText,
    runAction,
    setError,
    setMessage,
  });
  const { createCompatibilityRule } = useCompatibilityActions({
    workspace,
    compatibilityRuleForm,
    headers,
    setCompatibilityRules,
    setCompatibilityRuleForm,
    setResult,
    runAction,
    setError,
    setMessage,
  });
  const {
    compareSavedFormulas,
    saveFormula,
    refreshFormulaLibrary,
    openFormula,
    loadCalculationHistory,
    loadFormulaReviewRequests,
  } = useSavedFormulaActions({
    workspace,
    formulas,
    formulaCompareSelection,
    rawMaterialsById,
    headers,
    isFormulaBalanced,
    hasPendingDraftReview,
    setWorkspace,
    setFormulas,
    setCalculationHistory,
    setFormulaReviewRequests,
    setFormulaReviewArtifacts,
    setResult,
    setDraftReview,
    setSavedFormulaComparison,
    setBuilderSections,
    ensureRawMaterialDetail,
    resetImportState,
    runAction,
    setError,
    setMessage,
  });
  const {
    prepareJiraReview,
    sendCurrentFormulaToJira,
    generateJiraReviewExcel,
    downloadJiraReviewArtifact,
    sendJiraReviewToJira,
    retryJiraReviewAttachment,
    syncJiraReviewStatus,
  } = useJiraReviewActions({
    workspace,
    activeJiraConnection,
    result,
    formulaReviewRequests,
    headers,
    uploadHeaders,
    setFormulaReviewRequests,
    setFormulaReviewArtifacts,
    loadFormulaReviewRequests,
    runAction,
    setError,
    setMessage,
  });
  const {
    selectExcelImportFile,
    previewSelectedImportSheet,
    saveExcelImport,
    resolveImportRow,
    acceptImportSuggestion,
    createMaterialFromImportRow,
    createAliasFromImportRow,
  } = useExcelImportActions({
    workspace,
    importPreview,
    importFile,
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
  });

  function updateFormulaBasics(patch: Partial<FormulaBasicsValue>) {
    setWorkspace((current) => ({
      ...current,
      ...patch,
    }));
    markDraftReviewPending();
  }

  function loadMoreCatalogMaterials() {
    setMaterialResultLimit((current) => Math.min(current + 60, catalogTotal));
  }

  function selectCurrentParameterView(key: ParameterViewPresetKey) {
    selectParameterView(key, visibleParameterCodes);
  }

  function clearComparisonMaterials() {
    setComparisonMaterialIds([]);
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
            <FormulaBasicsStep
              isOpen={builderSections.basics}
              isBusy={isBusy}
              hasActiveJiraConnection={Boolean(activeJiraConnection)}
              values={formulaBasicsValue}
              onToggle={toggleBuilderSection}
              onChange={updateFormulaBasics}
            />
            <FormulaMaterialsStep
              isOpen={builderSections.materials}
              catalogLoading={catalogLoading}
              catalogTotal={catalogTotal}
              visibleParameterSummary={visibleParameterSummary}
              selectedPresetHelper={selectedParameterPreset.helper}
              showOnlyPositiveParameters={showOnlyPositiveParameters}
              parameterViewPreset={parameterViewPreset}
              parameterCatalog={parameterCatalog}
              customParameterCodes={customParameterCodes}
              formulaMaterialQuery={formulaMaterialQuery}
              canSearch={Boolean(workspace.tenant) && !isBusy}
              catalogParameterConditions={catalogParameterConditions}
              catalogFamilyFilter={catalogFamilyFilter}
              catalogMaterialFamilies={catalogMaterialFamilies}
              catalogPriceFilter={catalogPriceFilter}
              catalogPriceMin={catalogPriceMin}
              catalogPriceMax={catalogPriceMax}
              catalogParameterToAdd={catalogParameterToAdd}
              visibleParameterCodeSet={visibleParameterCodeSet}
              materialResultLimit={materialResultLimit}
              materialSearchResults={materialSearchResults}
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
              isBusy={isBusy}
              onToggle={toggleBuilderSection}
              onShowOnlyPositiveChange={setShowOnlyPositiveParameters}
              onSelectParameterView={selectCurrentParameterView}
              onToggleCustomParameterCode={toggleCustomParameterCode}
              onQueryChange={setFormulaMaterialQuery}
              onFamilyFilterChange={setCatalogFamilyFilter}
              onPriceFilterChange={setCatalogPriceFilter}
              onPriceMinChange={setCatalogPriceMin}
              onPriceMaxChange={setCatalogPriceMax}
              onParameterToAddChange={setCatalogParameterToAdd}
              onAddCondition={addCatalogParameterCondition}
              onUpdateCondition={updateCatalogParameterCondition}
              onRemoveCondition={removeCatalogParameterCondition}
              onLoadMoreMaterials={loadMoreCatalogMaterials}
              onResetFilters={resetCatalogFilters}
              onInspectMaterial={inspectMaterial}
              onToggleCompareMaterial={toggleCompareMaterial}
              onAddFormulaLine={addFormulaLine}
              onToggleExpandedMaterial={toggleExpandedMaterial}
              onClearComparison={clearComparisonMaterials}
            />
            <FormulaCompositionStep
              isOpen={builderSections.formula}
              lineCount={workspace.formulaLines.length}
              totalPercentage={totalPercentage}
              isFormulaBalanced={isFormulaBalanced}
              price={formulaCompositionPrice}
              priceSource={formulaCompositionPriceSource}
              draftReview={draftReview}
              draftComparison={draftComparison}
              isBusy={isBusy}
              canConfirmDraftReview={canConfirmDraftReview}
              activeJiraConnection={activeJiraConnection}
              formulaReviewRequests={formulaReviewRequests}
              formulaReviewArtifacts={formulaReviewArtifacts}
              canPrepareJiraReview={canPrepareJiraReview}
              formulaLineDetails={formulaLineDetails}
              visibleParameterCodes={visibleParameterCodes}
              showOnlyPositiveParameters={showOnlyPositiveParameters}
              formatResultPrice={formatResultPrice}
              formatSignedDelta={formatSignedDelta}
              formatSignedInteger={formatSignedInteger}
              onToggle={toggleBuilderSection}
              onNotesChange={updateDraftReviewNotes}
              onConfirmDraftReview={confirmDraftReview}
              onSendCurrentFormulaToJira={sendCurrentFormulaToJira}
              onGenerateReviewExcel={generateJiraReviewExcel}
              onDownloadArtifact={downloadJiraReviewArtifact}
              onSendReviewToJira={sendJiraReviewToJira}
              onSyncReviewStatus={syncJiraReviewStatus}
              onRetryReviewAttachment={retryJiraReviewAttachment}
              onMoveLine={moveFormulaLine}
              onUpdateLine={updateFormulaLine}
              onDuplicateLine={duplicateFormulaLine}
              onRemoveLine={removeFormulaLine}
            />
            <FormulaCalculationStep
              isOpen={builderSections.calculation}
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
              onToggle={toggleBuilderSection}
              onShowOnlyPositiveChange={setShowOnlyPositiveParameters}
              onSelectParameterView={selectCurrentParameterView}
              onSaveFormula={saveFormula}
            />
          </section>

          <CalculationResultsPanel active={activeView === "results"} result={result} />
        </div>
      </section>
    </main>
  );
}
