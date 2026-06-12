# Meta 059 - Jira review actions hook

## Decision

Jira review actions have been extracted from `apps/web/app/page.tsx` into `apps/web/app/jira-review-actions.ts`.

## Context

The Formula Builder composition step delegates Jira review operations through callbacks, but the page still owned the full remote-action block. After extracting saved-formula actions, the review loader is already available as a dependency, so Jira review orchestration can be isolated without changing UI components.

## Scope

- Add `useJiraReviewActions`.
- Move prepare review, send current formula, generate Excel, download artifact, send existing review, retry attachment, and sync status into the hook.
- Keep workspace, active Jira connection, review state, artifacts, status, and messages owned by `page.tsx`.
- Preserve existing validations, API paths, status messages, artifact download behavior, and review reload behavior.
- Remove the now-unneeded `apiUrl` import from `page.tsx`.

## Verification

- Run the web app check.
- Smoke test the Formula Builder composition step in the browser.
- Confirm browser console has no warning or error logs during the smoke test.
- Commit and merge through the solo-dev fast-forward workflow.

## Next Step

Continue reducing `page.tsx` by extracting Excel import persistence or Jira connection setup actions. Excel import is the next clean slice because it contains file upload, preview, save, and row-resolution behavior that can be grouped.
