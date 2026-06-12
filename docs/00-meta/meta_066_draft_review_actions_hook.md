# Meta 066 - Draft review actions hook

## Decision

Draft review and optimizer draft actions have been extracted from `apps/web/app/page.tsx` into `apps/web/app/draft-review-actions.ts`.

## Context

The AI assistant can produce optimizer formula candidates that become review drafts. `page.tsx` still owned the domain actions for applying those drafts, recalculating via the backend, editing review notes, and confirming reviewed drafts.

## Scope

- Add `useDraftReviewActions`.
- Move draft pending invalidation, note updates, draft confirmation, ad-hoc formula calculation, and optimizer draft application.
- Keep draft state, formula state, and panel rendering in `page.tsx`.
- Preserve backend calculate payloads, candidate material merge behavior, builder section expansion, result invalidation, and user-facing messages.

## Verification

- Run the web app check.
- Smoke test Formula Builder and AI assistant panels in browser.
- Confirm draft-related controls render without console warning or error logs.
- Commit and merge through the solo-dev fast-forward workflow.

## Next Step

Continue reducing `page.tsx` by extracting formula basics/catalog UI actions or moving remaining view-level helpers into smaller hooks after tracing their dependencies.
