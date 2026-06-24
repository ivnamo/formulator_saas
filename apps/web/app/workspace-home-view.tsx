import { AppShell, type WorkspaceView } from "./app-shell";
import type { WorkspacePanelsProps } from "./workspace-panels";
import { WorkspacePanels } from "./workspace-panels";
import type { Status } from "./workspace-base-model";
import type { WorkspaceState } from "./workspace-state-model";

export type WorkspaceHomePanels = Omit<WorkspacePanelsProps, "activeView">;

export type WorkspaceHomeViewProps = {
  activeView: WorkspaceView;
  workspace: WorkspaceState;
  sessionEmail: string | undefined;
  status: Status;
  message: string;
  isBusy: boolean;
  onViewChange: (view: WorkspaceView) => void;
  onTrackControlClick: (element: string, metadata: Record<string, unknown>) => void;
  onClearStatus: () => void;
  onSignOut: () => void | Promise<void>;
  panels: WorkspaceHomePanels;
};

export function WorkspaceHomeView({
  activeView,
  workspace,
  sessionEmail,
  status,
  message,
  isBusy,
  onViewChange,
  onTrackControlClick,
  onClearStatus,
  onSignOut,
  panels,
}: WorkspaceHomeViewProps) {
  return (
    <AppShell
      activeView={activeView}
      workspace={workspace}
      sessionEmail={sessionEmail}
      status={status}
      message={message}
      isBusy={isBusy}
      onViewChange={onViewChange}
      onTrackControlClick={onTrackControlClick}
      onClearStatus={onClearStatus}
      onSignOut={onSignOut}
    >
      <div className="grid">
        <WorkspacePanels activeView={activeView} {...panels} />
      </div>
    </AppShell>
  );
}
