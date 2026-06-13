import type {
  WorkspaceCapabilities,
  WorkspaceCapabilitiesOptions,
} from "./workspace-capability-model";
import { buildWorkspaceCapabilities } from "./workspace-capability-model";

export type { WorkspaceCapabilities, WorkspaceCapabilitiesOptions };

export function useWorkspaceCapabilities(
  options: WorkspaceCapabilitiesOptions,
): WorkspaceCapabilities {
  return buildWorkspaceCapabilities(options);
}
