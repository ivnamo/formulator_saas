# Meta 061 - Jira connection actions hook

## Decision

Jira connection setup actions have been extracted from `apps/web/app/page.tsx` into `apps/web/app/jira-connection-actions.ts`.

## Context

Jira review actions were already isolated, but Settings still kept Jira connection refresh, save, test, metadata, OAuth, and field mapping logic in the main page. These operations belong to the integration setup workflow and can move without changing the Settings UI.

## Scope

- Add `useJiraConnectionActions`.
- Move refresh, save, test, metadata load, field mapping, and OAuth authorization actions.
- Move Jira connection payload, form, and JSON helpers into the hook.
- Keep Jira connection state, metadata state, active connection derivation, and UI capability flags owned by `page.tsx`.
- Preserve validations, API paths, status messages, field mapping behavior, and OAuth redirect behavior.

## Verification

- Run the web app check.
- Smoke test Settings/Jira in browser.
- Confirm Jira setup controls render and the console has no warning or error logs.
- Commit and merge through the solo-dev fast-forward workflow.

## Next Step

Continue reducing `page.tsx` by extracting AI requirement actions or compatibility/raw-material actions. AI requirement actions are the next cohesive remote-action cluster.
