import { useState } from "react";
import type { WorkspaceView } from "./app-shell";
import { useWorkspaceActionStatus } from "./workspace-action-status";

export function useWorkspaceShellState() {
  const [activeView, setActiveView] = useState<WorkspaceView>("formula");
  const actionStatus = useWorkspaceActionStatus();

  return {
    activeView,
    setActiveView,
    ...actionStatus,
  };
}
