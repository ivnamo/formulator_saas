"use client";

import { WorkspaceAuthGate } from "./workspace-auth-gate";
import { useWorkspaceHomeController } from "./workspace-home-controller";
import { WorkspaceHomeView } from "./workspace-home-view";

export function WorkspaceHome() {
  const controller = useWorkspaceHomeController();

  if (!controller.isReady) {
    return <WorkspaceAuthGate />;
  }

  return <WorkspaceHomeView {...controller.viewProps} />;
}
