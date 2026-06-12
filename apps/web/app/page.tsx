"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { request } from "./workspace-api";
import {
  emptyJiraConnectionForm,
  formatDateTime,
  type AiRun,
  type AgentPlan,
  type JiraConnection,
  type JiraConnectionForm,
  type JiraMetadataState,
  type RequirementParse,
} from "./workspace-model";
import { type DraftReviewState } from "./workspace-comparison";
import { useFormulaBuilderDerivedState } from "./formula-builder-derived";
import { useFormulaBuilderCatalogState } from "./formula-builder-catalog";
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
import { FormulaBasicsStep } from "./formula-builder-ui/formula-basics-step";
import { FormulaMaterialsStep } from "./formula-builder-ui/formula-materials-step";
import { SavedFormulaComparisonPanel } from "./saved-formula-comparison-panel";
import {
  useSavedFormulaComparisonDerivedState,
  useSavedFormulaComparisonState,
} from "./saved-formula-comparison-state";
import { useSavedFormulaActions } from "./saved-formula-actions";
import { useJiraReviewActions } from "./jira-review-actions";
import { useExcelImportActions } from "./excel-import-actions";
import { useJiraConnectionActions } from "./jira-connection-actions";
import { useAiAssistantActions } from "./ai-assistant-actions";
import { useCompatibilityActions } from "./compatibility-actions";
import { useRawMaterialActions } from "./raw-material-actions";
import { useWorkspaceSettingsActions } from "./workspace-settings-actions";
import { useDraftReviewActions } from "./draft-review-actions";
import { useFormulaBuilderLocalActions } from "./formula-builder-local-actions";
import {
  useAuthenticatedWorkspaceLoad,
  useWorkspaceAuthSession,
} from "./workspace-auth-session";
import { useWorkspaceCapabilities } from "./workspace-capabilities";
import { AppShell, type WorkspaceView } from "./app-shell";
import { useWorkspaceActionStatus } from "./workspace-action-status";
import { useWorkspaceCoreState } from "./workspace-core-state";
import { useRawMaterialWorkspaceState } from "./raw-material-state";
import { useFormulaWorkspaceState } from "./formula-workspace-state";
import { useCompatibilityState } from "./compatibility-state";

export default function Home() {
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
  } = useFormulaWorkspaceState();
  const {
    compatibilityRules,
    setCompatibilityRules,
    compatibilityRuleForm,
    setCompatibilityRuleForm,
  } = useCompatibilityState();
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
  const { status, message, setStatus, setMessage, setError, runAction } =
    useWorkspaceActionStatus();
  const [activeView, setActiveView] = useState<WorkspaceView>("formula");
  const { session, authChecked, authHeaders, headers, uploadHeaders } =
    useWorkspaceAuthSession(workspace.tenant);
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
    localPreview,
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
    comparisonConstraints,
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
    result,
  });
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
    <AppShell
      activeView={activeView}
      workspace={workspace}
      sessionEmail={session.user.email}
      status={status}
      message={message}
      isBusy={isBusy}
      onViewChange={setActiveView}
      onSignOut={signOut}
    >
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
            showInvitationAdminPanel={showInvitationAdminPanel}
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
              canSearch={canSearchCatalog}
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
    </AppShell>
  );
}
