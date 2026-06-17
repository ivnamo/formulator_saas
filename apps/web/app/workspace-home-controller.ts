import { useCallback, useEffect, useState } from "react";
import { useFormulaBuilderDerivedState } from "./formula-builder-derived";
import { useFormulaBuilderCatalogState } from "./formula-builder-catalog";
import { useFormulaLineActions } from "./formula-builder-line-actions";
import { useFormulaBuilderUiState } from "./formula-builder-ui-state";
import { useExcelImportState } from "./excel-import-state";
import {
  useSavedFormulaComparisonDerivedState,
  useSavedFormulaComparisonState,
} from "./saved-formula-comparison-state";
import { useSavedFormulaActions } from "./saved-formula-actions";
import { useJiraReviewActions } from "./jira-review-actions";
import { useExcelImportActions } from "./excel-import-actions";
import { useIsoDesignActions } from "./iso-design-actions";
import { useJiraConnectionActions } from "./jira-connection-actions";
import { useAiAssistantActions } from "./ai-assistant-actions";
import { useCompatibilityActions } from "./compatibility-actions";
import { useRawMaterialActions } from "./raw-material-actions";
import { useWorkspaceSettingsActions } from "./workspace-settings-actions";
import { useDraftReviewActions } from "./draft-review-actions";
import { useFormulaBuilderLocalActions } from "./formula-builder-local-actions";
import { DEFAULT_BUILDER_SECTIONS } from "./formula-builder-model";
import {
  useAuthenticatedWorkspaceLoad,
  useWorkspaceAuthSession,
} from "./workspace-auth-session";
import { useWorkspaceCapabilities } from "./workspace-capabilities";
import { useWorkspaceCoreState } from "./workspace-core-state";
import { useRawMaterialWorkspaceState } from "./raw-material-state";
import { useFormulaWorkspaceState } from "./formula-workspace-state";
import { useCompatibilityState } from "./compatibility-state";
import { useAiWorkflowState } from "./ai-workflow-state";
import { useIsoDesignState } from "./iso-design-state";
import { useJiraConnectionState } from "./jira-connection-state";
import { isoJiraIssueTypeLabels } from "./iso-design-model";
import type { WorkspaceHomeViewProps } from "./workspace-home-view";
import { buildWorkspaceHomePanels } from "./workspace-home-panels";
import { useWorkspaceShellState } from "./workspace-shell-state";

export type WorkspaceHomeControllerState =
  | {
      isReady: false;
    }
  | {
      isReady: true;
      viewProps: WorkspaceHomeViewProps;
    };

export function useWorkspaceHomeController(): WorkspaceHomeControllerState {
  const [isoProjectPreparedFromFormulaBuilder, setIsoProjectPreparedFromFormulaBuilder] =
    useState(false);
  const {
    workspace,
    setWorkspace,
    workspaceName,
    setWorkspaceName,
    parameterForm,
    setParameterForm,
    tenantInvitations,
    setTenantInvitations,
    invitationForm,
    setInvitationForm,
  } = useWorkspaceCoreState();
  const {
    materialForm,
    setMaterialForm,
    detailedMaterialIds,
    setDetailedMaterialIds,
    aliasInputs,
    setAliasInputs,
    resetRawMaterialWorkspaceState,
  } = useRawMaterialWorkspaceState();
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
    resetFormulaBuilderSelection,
    selectParameterView,
    toggleCustomParameterCode,
    addCatalogParameterCondition,
    updateCatalogParameterCondition,
    removeCatalogParameterCondition,
    resetCatalogFilters,
    toggleBuilderSection,
  } = useFormulaBuilderUiState();
  const {
    result,
    setResult,
    formulas,
    setFormulas,
    calculationHistory,
    setCalculationHistory,
    formulaReviewRequests,
    setFormulaReviewRequests,
    formulaReviewArtifacts,
    setFormulaReviewArtifacts,
    resetFormulaWorkspaceState,
  } = useFormulaWorkspaceState();
  const {
    compatibilityRules,
    setCompatibilityRules,
    compatibilityRuleForm,
    setCompatibilityRuleForm,
    resetCompatibilityState,
  } = useCompatibilityState();
  const {
    jiraConnections,
    setJiraConnections,
    jiraConnectionForm,
    setJiraConnectionForm,
    jiraMetadata,
    setJiraMetadata,
    jiraMappingKey,
    setJiraMappingKey,
    resetJiraConnectionState,
  } = useJiraConnectionState();
  const {
    isoSettings,
    setIsoSettings,
    isoDesignProjects,
    setIsoDesignProjects,
    isoDesignTrialsByProjectId,
    setIsoDesignTrialsByProjectId,
    isoProductValidationsByProjectId,
    setIsoProductValidationsByProjectId,
    selectedIsoDesignProjectId,
    setSelectedIsoDesignProjectId,
    selectedJiraIsoDesignProjectId,
    setSelectedJiraIsoDesignProjectId,
    isoProjectForm,
    setIsoProjectForm,
    isoLegacyImportFormat,
    setIsoLegacyImportFormat,
    isoLegacyImportFile,
    setIsoLegacyImportFile,
    selectedIsoLegacyImportSheet,
    setSelectedIsoLegacyImportSheet,
    isoLegacyImportPreview,
    setIsoLegacyImportPreview,
    resetIsoDesignState,
  } = useIsoDesignState();
  const {
    requirementText,
    setRequirementText,
    requirementParse,
    setRequirementParse,
    agentPlan,
    setAgentPlan,
    draftReview,
    setDraftReview,
    aiRuns,
    setAiRuns,
    resetAiWorkflowState,
  } = useAiWorkflowState();
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
    importFormulaName,
    availableImportSheets,
    selectedImportSheet,
    resetImportState,
    setPendingFile,
    setPreview: setImportPreview,
    setPastedPreview: setPastedImportPreview,
    setImportFormulaName,
    setSelectedImportSheet,
    resolveImportRow: resolveImportRowState,
  } = useExcelImportState();
  const { activeView, setActiveView, status, message, setStatus, setMessage, setError, runAction } =
    useWorkspaceShellState();
  const { session, authChecked, authHeaders, headers, uploadHeaders } =
    useWorkspaceAuthSession(workspace.tenant);

  useEffect(() => {
    setIsoProjectPreparedFromFormulaBuilder(false);
  }, [workspace.tenant?.id]);

  useEffect(() => {
    if (activeView === "formula") {
      setBuilderSections(DEFAULT_BUILDER_SECTIONS);
    }
  }, [activeView, setBuilderSections]);

  const {
    catalogMaterialIds,
    catalogTotal,
    catalogFamilies,
    catalogLoading,
    refreshCatalog,
  } = useFormulaBuilderCatalogState({
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
    parameterViewPreset,
    setWorkspace,
    setMaterialResultLimit,
    setError,
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
    setResult,
    setTenantInvitations,
    setStatus,
    setInvitationForm,
    resetFormulaBuilderSelection,
    resetRawMaterialWorkspaceState,
    resetFormulaWorkspaceState,
    resetCompatibilityState,
    resetJiraConnectionState,
    resetIsoDesignState,
    resetAiWorkflowState,
    resetSavedFormulaComparisonState,
    resetImportState,
    updateComparisonConstraint,
    refreshCatalog,
    runAction,
    setError,
    setMessage,
  });

  useAuthenticatedWorkspaceLoad({
    session,
    tenant: workspace.tenant,
    loadAuthenticatedWorkspace,
  });

  const {
    rawMaterialsById,
    formulaLineDetails,
    parameterCatalog,
    visibleParameterCodes,
    visibleParameterCodeSet,
    selectedParameterPreset,
    formulaBasicsValue,
    visibleParameterSummary,
    materialSearchResults,
    selectedMaterial,
    selectedMaterialParameters,
    comparisonMaterials,
    parameterRows,
    catalogMaterialFamilies,
    draftComparison,
    totalPercentage,
    isFormulaBalanced,
    formulaCompositionPrice,
    formulaCompositionPriceSource,
    visibleWarnings,
  } = useFormulaBuilderDerivedState({
    workspace,
    catalogMaterialIds,
    catalogFamilies,
    parameterViewPreset,
    customParameterCodes,
    selectedMaterialId,
    showOnlyPositiveParameters,
    comparisonMaterialIds,
    result,
    draftReview,
  });
  const {
    comparisonMaterialOptions,
    comparisonConstraintEvaluations,
    comparisonComplianceSummary,
    comparisonConstraintIssueCount,
    visibleComparisonConstraintEvaluations,
  } = useSavedFormulaComparisonDerivedState({
    formulas,
    rawMaterials: workspace.rawMaterials,
    formulaCompareSelection,
    comparisonConstraintForm,
    savedFormulaComparison,
    showOnlyConstraintIssues,
  });
  const {
    isBusy,
    canEditTenantData,
    canManageTenantUsers,
    showInvitationAdminPanel,
    hasPendingDraftReview,
    canConfirmDraftReview,
    canSaveFormula,
    canCompareSavedFormulas,
    canSelectImportSheet,
    canSaveImport,
    canParseRequirements,
    canPlanRequirements,
    canCreateCompatibilityRule,
    activeJiraConnection,
    canSaveJiraConnection,
    canTestJiraConnection,
    canLoadJiraMetadata,
    canAuthorizeJiraOAuth,
    canPrepareJiraReview,
    canSearchCatalog,
  } = useWorkspaceCapabilities({
    workspace,
    status,
    draftReview,
    isFormulaBalanced,
    formulaCompareSelection,
    availableImportSheets,
    importFile,
    importPreview,
    requirementText,
    compatibilityRuleForm,
    jiraConnections,
    jiraConnectionForm,
  });
  const {
    ensureRawMaterialDetail,
    inspectMaterial,
    toggleCompareMaterial,
    toggleExpandedMaterial,
    createMaterial,
    createAlias,
    updateMaterial,
    updateMaterialParameterValue,
    loadMaterialPriceHistory,
    addMaterialPrice,
    previewSapImport,
    applySapImport,
  } = useRawMaterialActions({
    workspace,
    rawMaterialsById,
    detailedMaterialIds,
    materialForm,
    aliasInputs,
    headers,
    uploadHeaders,
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
    updateFormulaBasics,
    loadMoreCatalogMaterials,
    selectCurrentParameterView,
    clearComparisonMaterials,
  } = useFormulaBuilderLocalActions({
    catalogTotal,
    visibleParameterCodes,
    setWorkspace,
    setMaterialResultLimit,
    setComparisonMaterialIds,
    selectParameterView,
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
    loadIsoModule,
    selectIsoDesignProject,
    enableIsoModule,
    createIsoDesignProject,
    selectIsoLegacyImportFormat,
    selectIsoLegacyImportFile,
    previewSelectedIsoLegacyImportSheet,
    applySelectedIsoLegacyImport,
    createIsoProductValidation,
    updateIsoProductValidationChecks,
    publishIsoProductValidation,
    exportIsoF1001,
    exportIsoF1002,
    exportIsoF1003,
    exportIsoDossier,
  } = useIsoDesignActions({
    workspace,
    headers,
    uploadHeaders,
    isoProjectForm,
    isoLegacyImportFormat,
    isoLegacyImportFile,
    selectedIsoLegacyImportSheet,
    selectedIsoDesignProjectId,
    isoDesignTrialsByProjectId,
    isoProductValidationsByProjectId,
    setIsoSettings,
    setIsoDesignProjects,
    setIsoDesignTrialsByProjectId,
    setIsoProductValidationsByProjectId,
    setSelectedIsoDesignProjectId,
    setIsoProjectForm,
    setIsoLegacyImportFormat,
    setIsoLegacyImportFile,
    setSelectedIsoLegacyImportSheet,
    setIsoLegacyImportPreview,
    runAction,
    setError,
    setMessage,
    onProjectCreated: (project) => {
      if (!isoProjectPreparedFromFormulaBuilder) {
        return false;
      }
      setWorkspace((current) => ({
        ...current,
        formulaJiraProjectId: project.project_code ?? current.formulaJiraProjectId,
      }));
      setSelectedJiraIsoDesignProjectId(project.id);
      setIsoProjectPreparedFromFormulaBuilder(false);
      setActiveView("formula");
      setMessage(
        `F10-01 creado: ProyectoID ${project.project_code ?? "-"} asignado a la formula.`,
      );
      return true;
    },
  });

  useEffect(() => {
    if (!workspace.tenant || !session?.access_token) {
      return;
    }
    void refreshJiraConnections({ silent: true });
  }, [refreshJiraConnections, session?.access_token, workspace.tenant]);
  useEffect(() => {
    if (!workspace.tenant || !session?.access_token) {
      return;
    }
    void loadIsoModule({ silent: true });
  }, [loadIsoModule, session?.access_token, workspace.tenant]);
  useEffect(() => {
    setSelectedJiraIsoDesignProjectId(() => {
      if (!isIsoQualityFormula(workspace.formulaJiraIssueType)) {
        return "";
      }
      const formulaProjectCode = normalizeIsoProjectCode(workspace.formulaJiraProjectId);
      if (!formulaProjectCode) {
        return "";
      }
      return (
        isoDesignProjects.find(
          (project) => normalizeIsoProjectCode(project.project_code) === formulaProjectCode,
        )?.id ?? ""
      );
    });
  }, [
    isoDesignProjects,
    setSelectedJiraIsoDesignProjectId,
    workspace.formulaJiraIssueType,
    workspace.formulaJiraProjectId,
  ]);
  const setFormulaJiraDescription = useCallback(
    (description: string) => {
      setWorkspace((current) => ({
        ...current,
        formulaJiraDescription: description,
      }));
    },
    [setWorkspace],
  );
  const prepareIsoProjectFromFormula = useCallback(() => {
    if (!isIsoQualityFormula(workspace.formulaJiraIssueType)) {
      setMessage("ISO solo aplica automaticamente a formulas con issue type Jira Calidad.");
      return;
    }

    const currentYear = String(new Date().getFullYear());
    setIsoProjectForm((current) => ({
      ...current,
      year: current.year || currentYear,
      projectCode: "",
      productName: current.productName || workspace.formulaName || "Nueva formula",
      productType: current.productType || workspace.formulaJiraProductType,
      acceptedStatus: current.acceptedStatus || "pending",
      lifecycleStatus: current.lifecycleStatus || "intake",
      comments:
        current.comments ||
        "Preparado desde Formula Builder. Completa No Solicitud; el ProyectoID se generara automaticamente al crear el F10-01.",
    }));
    setIsoProjectPreparedFromFormulaBuilder(true);
    setSelectedIsoDesignProjectId("");
    setActiveView("iso");
    setMessage(
      "F10-01 preparado desde el builder: completa No Solicitud y crea el expediente para generar ProyectoID.",
    );
  }, [
    setActiveView,
    setIsoProjectForm,
    setMessage,
    setSelectedIsoDesignProjectId,
    workspace.formulaJiraIssueType,
    workspace.formulaJiraProductType,
    workspace.formulaName,
  ]);
  const returnToFormulaBuilderFromIso = useCallback(() => {
    setActiveView("formula");
    setMessage(
      "Vuelta al Formula Builder. El enlace ISO se recalculara por ProyectoID.",
    );
  }, [setActiveView, setMessage]);
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
    exportCurrentFormulaIdLabExcel,
    exportSavedFormulaIdLabExcel,
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

  useEffect(() => {
    if (activeView !== "library" || !workspace.tenant || !session?.access_token) {
      return;
    }
    void refreshFormulaLibrary({ silent: true });
  }, [activeView, refreshFormulaLibrary, session?.access_token, workspace.tenant]);

  const {
    sendCurrentFormulaToJira,
    generateJiraReviewExcel,
    downloadJiraReviewArtifact,
    sendJiraReviewToJira,
    retryJiraReviewAttachment,
    syncJiraReviewStatus,
  } = useJiraReviewActions({
    workspace,
    activeJiraConnection,
    isFormulaBalanced,
    hasPendingDraftReview,
    formulaReviewRequests,
    selectedJiraIsoDesignProjectId,
    headers,
    uploadHeaders,
    setWorkspace,
    setResult,
    setFormulaReviewRequests,
    setFormulaReviewArtifacts,
    loadFormulaReviewRequests,
    onIsoModuleRefresh: () => loadIsoModule({ silent: true }),
    runAction,
    setError,
    setMessage,
  });
  const {
    selectExcelImportFile,
    previewSelectedImportSheet,
    parsePastedImportRows,
    saveExcelImport,
    resolveImportRow,
    acceptImportSuggestion,
    createMaterialFromImportRow,
    createAliasFromImportRow,
  } = useExcelImportActions({
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
    setPastedImportPreview,
    setSelectedImportSheet,
    resolveImportRowState,
    refreshCatalog,
    refreshFormulaLibrary,
    loadCalculationHistory,
    runAction,
    setError,
    setMessage,
  });

  if (!authChecked || !session) {
    return { isReady: false };
  }

  const panels = buildWorkspaceHomePanels({
    settings: {
      workspace,
      workspaceName,
      sessionEmail: session.user.email,
      invitationForm,
      tenantInvitations,
      parameterForm,
      activeJiraConnection,
      jiraConnectionForm,
      jiraMetadata,
      jiraMappingKey,
      isBusy,
      canEditTenantData,
      canManageTenantUsers,
      canSaveJiraConnection,
      canTestJiraConnection,
      canLoadJiraMetadata,
      canAuthorizeJiraOAuth,
      showInvitationAdminPanel,
      setWorkspaceName,
      createWorkspace,
      setInvitationForm,
      createTenantInvitation,
      setParameterForm,
      createParameter,
      setJiraConnectionForm,
      saveJiraConnection,
      refreshJiraConnections,
      testJiraConnection,
      loadJiraMetadata,
      authorizeJiraOAuth,
      setJiraMappingKey,
      mapJiraField,
    },
    isoDesign: {
      settings: isoSettings,
      projects: isoDesignProjects,
      trialsByProjectId: isoDesignTrialsByProjectId,
      validationsByProjectId: isoProductValidationsByProjectId,
      selectedProjectId: selectedIsoDesignProjectId,
      projectForm: isoProjectForm,
      legacyImportFormat: isoLegacyImportFormat,
      legacyImportPreview: isoLegacyImportPreview,
      legacyImportFileName: isoLegacyImportFile?.name ?? "",
      selectedLegacyImportSheet: selectedIsoLegacyImportSheet,
      isPreparedFromFormulaBuilder: isoProjectPreparedFromFormulaBuilder,
      isBusy,
      canEditTenantData,
      canManageIsoSettings: showInvitationAdminPanel,
      setSelectedProjectId: selectIsoDesignProject,
      setIsoProjectForm,
      loadIsoModule,
      enableIsoModule,
      createIsoDesignProject,
      selectIsoLegacyImportFormat,
      selectIsoLegacyImportFile,
      previewSelectedIsoLegacyImportSheet,
      applySelectedIsoLegacyImport,
      createIsoProductValidation,
      updateIsoProductValidationChecks,
      publishIsoProductValidation,
      exportIsoF1001,
      exportIsoF1002,
      exportIsoF1003,
      exportIsoDossier,
      returnToFormulaBuilderFromIso,
    },
    rawMaterials: {
      rawMaterials: workspace.rawMaterials,
      parameters: workspace.parameters,
      materialForm,
      aliasInputs,
      canEditTenantData,
      isBusy,
      setMaterialForm,
      setAliasInputs,
      createMaterial,
      inspectMaterial,
      addFormulaLine,
      createAlias,
      updateMaterial,
      updateMaterialParameterValue,
      loadMaterialPriceHistory,
      addMaterialPrice,
      previewSapImport,
      applySapImport,
    },
    compatibility: {
      rules: compatibilityRules,
      rawMaterials: workspace.rawMaterials,
      rawMaterialsById,
      form: compatibilityRuleForm,
      canEditTenantData,
      canCreateRule: canCreateCompatibilityRule,
      setCompatibilityRuleForm,
      createCompatibilityRule,
    },
    library: {
      formulas,
      calculationHistory,
      formulaCompareSelection,
      comparisonConstraintForm,
      comparisonMaterialOptions,
      canEditTenantData,
      canCompareSavedFormulas,
      isBusy,
      savedFormulaComparison,
      comparisonComplianceSummary,
      comparisonConstraintEvaluations,
      comparisonConstraintIssueCount,
      visibleComparisonConstraintEvaluations,
      showOnlyConstraintIssues,
      selectFormulaForComparison,
      refreshFormulaLibrary,
      compareSavedFormulas,
      exportSavedFormulaIdLabExcel,
      openFormula,
      updateComparisonConstraint,
      setShowOnlyConstraintIssues,
    },
    excelImport: {
      importPreview,
      importFileName,
      importFormulaName,
      availableImportSheets,
      selectedImportSheet,
      rawMaterials: workspace.rawMaterials,
      canEditTenantData,
      canSelectImportSheet,
      canSaveImport,
      isBusy,
      setImportFormulaName,
      selectExcelImportFile,
      previewSelectedImportSheet,
      parsePastedImportRows,
      saveExcelImport,
      resolveImportRow,
      createMaterialFromImportRow,
      acceptImportSuggestion,
      createAliasFromImportRow,
    },
    aiAssistant: {
      requirementText,
      requirementParse,
      agentPlan,
      aiRuns,
      canParseRequirements,
      canPlanRequirements,
      canEditTenantData,
      isBusy,
      setRequirementText,
      parseRequirements,
      planRequirements,
      refreshAiRuns,
      reuseInfeasibilityAction,
      applyOptimizerDraft,
    },
    formulaBuilder: {
      workspace,
      builderSections,
      totalPercentage,
      isFormulaBalanced,
      isBusy,
      activeJiraConnection,
      formulaBasicsValue,
      catalogLoading,
      catalogTotal,
      visibleParameterSummary,
      selectedParameterPreset,
      showOnlyPositiveParameters,
      parameterViewPreset,
      parameterCatalog,
      customParameterCodes,
      formulaMaterialQuery,
      canSearchCatalog,
      catalogParameterConditions,
      catalogFamilyFilter,
      catalogMaterialFamilies,
      catalogPriceFilter,
      catalogPriceMin,
      catalogPriceMax,
      catalogParameterToAdd,
      visibleParameterCodeSet,
      materialResultLimit,
      materialSearchResults,
      selectedMaterialId,
      selectedMaterial,
      selectedMaterialParameters,
      comparisonMaterials,
      detailedMaterialIds,
      expandedMaterialIds,
      comparisonMaterialIds,
      visibleParameterCodes,
      formulaCompositionPrice,
      formulaCompositionPriceSource,
      draftReview,
      draftComparison,
      canConfirmDraftReview,
      formulaReviewRequests,
      formulaReviewArtifacts,
      isoDesignProjects,
      jiraIssueTypeOptions: isoJiraIssueTypeLabels(isoSettings),
      formulaJiraProjectId: workspace.formulaJiraProjectId,
      formulaJiraIssueType: workspace.formulaJiraIssueType,
      formulaJiraDescription: workspace.formulaJiraDescription,
      selectedIsoDesignProjectId: selectedJiraIsoDesignProjectId,
      canPrepareJiraReview,
      formulaLineDetails,
      parameterRows,
      visibleWarnings,
      hasBackendResult: Boolean(result),
      canSaveFormula,
      toggleBuilderSection,
      updateFormulaBasics,
      setShowOnlyPositiveParameters,
      selectCurrentParameterView,
      toggleCustomParameterCode,
      setFormulaMaterialQuery,
      setCatalogFamilyFilter,
      setCatalogPriceFilter,
      setCatalogPriceMin,
      setCatalogPriceMax,
      setCatalogParameterToAdd,
      addCatalogParameterCondition,
      updateCatalogParameterCondition,
      removeCatalogParameterCondition,
      loadMoreCatalogMaterials,
      resetCatalogFilters,
      inspectMaterial,
      toggleCompareMaterial,
      addFormulaLine,
      toggleExpandedMaterial,
      clearComparisonMaterials,
      updateDraftReviewNotes,
      confirmDraftReview,
      setSelectedIsoDesignProjectId: setSelectedJiraIsoDesignProjectId,
      setFormulaJiraDescription,
      prepareIsoProjectFromFormula,
      sendCurrentFormulaToJira,
      generateJiraReviewExcel,
      downloadJiraReviewArtifact,
      sendJiraReviewToJira,
      syncJiraReviewStatus,
      retryJiraReviewAttachment,
      moveFormulaLine,
      updateFormulaLine,
      duplicateFormulaLine,
      removeFormulaLine,
      saveFormula,
      exportCurrentFormulaIdLabExcel,
    },
    results: { result },
  });

  return {
    isReady: true,
    viewProps: {
      activeView,
      workspace,
      sessionEmail: session.user.email,
      status,
      message,
      isBusy,
      onViewChange: setActiveView,
      onSignOut: signOut,
      panels,
    },
  };
}

function normalizeIsoProjectCode(value: string | null | undefined) {
  return (value ?? "").trim().toUpperCase();
}

function isIsoQualityFormula(issueType: string | null | undefined) {
  return (issueType ?? "").trim().toLowerCase() === "calidad";
}
