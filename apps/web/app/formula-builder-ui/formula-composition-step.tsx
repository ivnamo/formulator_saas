import type { FormulaLineDetail } from "../formula-builder-derived";
import type { BuilderSectionKey } from "../formula-builder-model";
import type {
  CalculationResult,
  FormulaReviewArtifact,
  FormulaReviewRequest,
} from "../formula-model";
import type { IsoDesignProject } from "../iso-design-model";
import type { JiraConnection } from "../jira-connection-model";
import type { DraftComparison, DraftReviewState } from "../workspace-comparison";
import { BuilderStep } from "./builder-step";
import { DraftReviewPanel } from "./draft-review-panel";
import { FormulaLineTable } from "./formula-line-table";
import { FormulaProgressSummary } from "./formula-progress-summary";
import { JiraReviewPanel } from "./jira-review-panel";

export type FormulaCompositionStepProps = {
  isOpen: boolean;
  lineCount: number;
  totalPercentage: number;
  isFormulaBalanced: boolean;
  price: string;
  priceSource: string;
  draftReview: DraftReviewState | null;
  draftComparison: DraftComparison | null;
  isBusy: boolean;
  canConfirmDraftReview: boolean;
  activeJiraConnection: JiraConnection | null;
  formulaReviewRequests: FormulaReviewRequest[];
  formulaReviewArtifacts: Record<string, FormulaReviewArtifact[]>;
  isoDesignProjects: IsoDesignProject[];
  formulaJiraProjectId: string;
  formulaJiraIssueType: string;
  formulaJiraDescription: string;
  selectedIsoDesignProjectId: string;
  canPrepareJiraReview: boolean;
  formulaLineDetails: FormulaLineDetail[];
  visibleParameterCodes: string[];
  showOnlyPositiveParameters: boolean;
  formatResultPrice: (result: CalculationResult | null) => string;
  formatSignedDelta: (value: number | null, suffix?: string) => string;
  formatSignedInteger: (value: number) => string;
  onToggle: (section: BuilderSectionKey) => void;
  onNotesChange: (notes: string) => void;
  onConfirmDraftReview: () => void | Promise<void>;
  onSelectedIsoDesignProjectChange: (projectId: string) => void;
  onJiraDescriptionChange: (description: string) => void;
  onPrepareIsoProject: () => void | Promise<void>;
  onSendCurrentFormulaToJira: () => void | Promise<void>;
  onGenerateReviewExcel: (reviewId: string) => void | Promise<void>;
  onDownloadArtifact: (artifact: FormulaReviewArtifact) => void | Promise<void>;
  onSendReviewToJira: (reviewId: string) => void | Promise<void>;
  onSyncReviewStatus: (reviewId: string) => void | Promise<void>;
  onRetryReviewAttachment: (reviewId: string) => void | Promise<void>;
  onMoveLine: (localId: string, direction: -1 | 1) => void;
  onUpdateLine: (localId: string, percentage: number) => void;
  onDuplicateLine: (localId: string) => void;
  onRemoveLine: (localId: string) => void;
};

export function FormulaCompositionStep({
  isOpen,
  lineCount,
  totalPercentage,
  isFormulaBalanced,
  price,
  priceSource,
  draftReview,
  draftComparison,
  isBusy,
  canConfirmDraftReview,
  activeJiraConnection,
  formulaReviewRequests,
  formulaReviewArtifacts,
  isoDesignProjects,
  formulaJiraProjectId,
  formulaJiraIssueType,
  formulaJiraDescription,
  selectedIsoDesignProjectId,
  canPrepareJiraReview,
  formulaLineDetails,
  visibleParameterCodes,
  showOnlyPositiveParameters,
  formatResultPrice,
  formatSignedDelta,
  formatSignedInteger,
  onToggle,
  onNotesChange,
  onConfirmDraftReview,
  onSelectedIsoDesignProjectChange,
  onJiraDescriptionChange,
  onPrepareIsoProject,
  onSendCurrentFormulaToJira,
  onGenerateReviewExcel,
  onDownloadArtifact,
  onSendReviewToJira,
  onSyncReviewStatus,
  onRetryReviewAttachment,
  onMoveLine,
  onUpdateLine,
  onDuplicateLine,
  onRemoveLine,
}: FormulaCompositionStepProps) {
  return (
    <BuilderStep
      section="formula"
      title="3. Formula editable"
      summary={`${lineCount} lineas - ${totalPercentage.toFixed(1)}%`}
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <FormulaProgressSummary
        totalPercentage={totalPercentage}
        isBalanced={isFormulaBalanced}
        price={price}
        source={priceSource}
      />
      <DraftReviewPanel
        draftReview={draftReview}
        draftComparison={draftComparison}
        isBusy={isBusy}
        canConfirmDraftReview={canConfirmDraftReview}
        formatResultPrice={formatResultPrice}
        formatSignedDelta={formatSignedDelta}
        formatSignedInteger={formatSignedInteger}
        onNotesChange={onNotesChange}
        onConfirmDraftReview={onConfirmDraftReview}
      />
      <JiraReviewPanel
        activeJiraConnection={activeJiraConnection}
        formulaReviewRequests={formulaReviewRequests}
        formulaReviewArtifacts={formulaReviewArtifacts}
        isoDesignProjects={isoDesignProjects}
        formulaJiraProjectId={formulaJiraProjectId}
        formulaJiraIssueType={formulaJiraIssueType}
        formulaJiraDescription={formulaJiraDescription}
        selectedIsoDesignProjectId={selectedIsoDesignProjectId}
        canPrepareJiraReview={canPrepareJiraReview}
        isBusy={isBusy}
        onSelectedIsoDesignProjectChange={onSelectedIsoDesignProjectChange}
        onJiraDescriptionChange={onJiraDescriptionChange}
        onPrepareIsoProject={onPrepareIsoProject}
        onSendCurrentFormulaToJira={onSendCurrentFormulaToJira}
        onGenerateReviewExcel={onGenerateReviewExcel}
        onDownloadArtifact={onDownloadArtifact}
        onSendReviewToJira={onSendReviewToJira}
        onSyncReviewStatus={onSyncReviewStatus}
        onRetryReviewAttachment={onRetryReviewAttachment}
      />
      <FormulaLineTable
        lines={formulaLineDetails}
        visibleParameterCodes={visibleParameterCodes}
        showOnlyPositiveParameters={showOnlyPositiveParameters}
        isBusy={isBusy}
        onMoveLine={onMoveLine}
        onUpdateLine={onUpdateLine}
        onDuplicateLine={onDuplicateLine}
        onRemoveLine={onRemoveLine}
      />
    </BuilderStep>
  );
}
