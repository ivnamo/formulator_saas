import type { WorkspaceHomePanels } from "./workspace-home-view";

type AiAssistantPanelProps = WorkspaceHomePanels["aiAssistant"];

type BuildWorkspaceAiAssistantPanelPropsArgs = {
  requirementText: AiAssistantPanelProps["requirementText"];
  requirementParse: AiAssistantPanelProps["requirementParse"];
  agentPlan: AiAssistantPanelProps["agentPlan"];
  aiRuns: AiAssistantPanelProps["aiRuns"];
  canParseRequirements: AiAssistantPanelProps["canParseRequirements"];
  canPlanRequirements: AiAssistantPanelProps["canPlanRequirements"];
  canEditTenantData: AiAssistantPanelProps["canEditTenantData"];
  isBusy: AiAssistantPanelProps["isBusy"];
  setRequirementText: AiAssistantPanelProps["onRequirementTextChange"];
  parseRequirements: AiAssistantPanelProps["onParseRequirements"];
  planRequirements: AiAssistantPanelProps["onPlanRequirements"];
  refreshAiRuns: AiAssistantPanelProps["onRefreshAiRuns"];
  reuseInfeasibilityAction: AiAssistantPanelProps["onReuseInfeasibilityAction"];
  applyOptimizerDraft: AiAssistantPanelProps["onApplyOptimizerDraft"];
};

export function buildWorkspaceAiAssistantPanelProps(
  args: BuildWorkspaceAiAssistantPanelPropsArgs,
): AiAssistantPanelProps {
  return {
    requirementText: args.requirementText,
    requirementParse: args.requirementParse,
    agentPlan: args.agentPlan,
    aiRuns: args.aiRuns,
    canParseRequirements: args.canParseRequirements,
    canPlanRequirements: args.canPlanRequirements,
    canEditTenantData: args.canEditTenantData,
    isBusy: args.isBusy,
    onRequirementTextChange: args.setRequirementText,
    onParseRequirements: args.parseRequirements,
    onPlanRequirements: args.planRequirements,
    onRefreshAiRuns: args.refreshAiRuns,
    onReuseInfeasibilityAction: args.reuseInfeasibilityAction,
    onApplyOptimizerDraft: args.applyOptimizerDraft,
  };
}
