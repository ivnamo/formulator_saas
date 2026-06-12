# Meta 065 - Workspace settings actions hook

## Decision

Workspace, account, invitation, and parameter setup actions have been extracted from `apps/web/app/page.tsx` into `apps/web/app/workspace-settings-actions.ts`.

## Context

`page.tsx` had already shed formula, saved-formula, Excel import, Jira, AI, compatibility, and raw-material actions. Settings still kept tenant creation, authenticated workspace loading, account sign-out, invitation sending, and parameter creation in the main page.

## Scope

- Add `useWorkspaceSettingsActions`.
- Move workspace creation, authenticated tenant loading, sign-out, tenant invitation creation, and parameter creation.
- Add `tenant-roles.ts` so admin-role checks are shared by Settings UI and workspace-loading actions.
- Stabilize shared action callbacks and Excel import state callbacks with `useCallback` so extracted hooks can be used safely as dependencies.
- Keep Settings form state and rendering in `page.tsx`.
- Preserve tenant reset behavior, invitation validation, parameter merge behavior, catalog refresh, comparison constraint update, and user-facing messages.

## Verification

- Run the web app check.
- Smoke test Settings in browser.
- Confirm Workspace, account, invitation/parameter, and Jira sections render without console warning or error logs.
- Commit and merge through the solo-dev fast-forward workflow.

## Next Step

Continue reducing `page.tsx` by extracting draft review / optimizer draft actions or formula calculation actions. These are domain-heavy and should be split only after tracing their result and review-state dependencies.
