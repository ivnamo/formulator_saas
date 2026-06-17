import type { BuilderSectionKey } from "../formula-builder-model";
import { BuilderStep } from "./builder-step";
import { JiraReviewPanel, type JiraReviewPanelProps } from "./jira-review-panel";

export type FormulaReviewStepProps = JiraReviewPanelProps & {
  isOpen: boolean;
  onToggle: (section: BuilderSectionKey) => void;
};

export function FormulaReviewStep({
  isOpen,
  onToggle,
  ...jiraReviewProps
}: FormulaReviewStepProps) {
  const connectionStatus = jiraReviewProps.activeJiraConnection
    ? "Jira configurado"
    : "Jira no configurado";
  const reviewCount = jiraReviewProps.formulaReviewRequests.length;
  const reviewLabel = reviewCount === 1 ? "1 revision" : `${reviewCount} revisiones`;

  return (
    <BuilderStep
      section="review"
      title="5. Revision y salidas"
      summary={`${connectionStatus} - ${reviewLabel}`}
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <JiraReviewPanel {...jiraReviewProps} />
    </BuilderStep>
  );
}
