import { AppShell, type WorkspaceView } from "./app-shell";
import type { WorkspacePanelsProps } from "./workspace-panels";
import { WorkspacePanels } from "./workspace-panels";
import type { Status, WorkspaceState } from "./workspace-model";

type WorkspaceHomeViewProps = {
  activeView: WorkspaceView;
  workspace: WorkspaceState;
  sessionEmail: string | undefined;
  status: Status;
  message: string;
  isBusy: boolean;
  onViewChange: (view: WorkspaceView) => void;
  onSignOut: () => void | Promise<void>;
  panels: Omit<WorkspacePanelsProps, "activeView">;
};

export function WorkspaceHomeView({
  activeView,
  workspace,
  sessionEmail,
  status,
  message,
  isBusy,
  onViewChange,
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
      onSignOut={onSignOut}
    >
      <div className="grid">
        <WorkspacePanels activeView={activeView} {...panels} />
      </div>
    </AppShell>
  );
}
