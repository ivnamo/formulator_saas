# Meta 057 - Formula line actions hook

## Decision

Formula Builder line mutations have been extracted from `apps/web/app/page.tsx` into `apps/web/app/formula-builder-line-actions.ts`.

## Context

After the four builder steps were componentized, `Home` still owned a dense block of formula-line behavior. This made the page harder to scan and mixed view orchestration with row mutation rules.

## Scope

- Add `useFormulaLineActions` for add, remove, update, move, and duplicate row actions.
- Keep `WorkspaceState` ownership in `page.tsx`; the hook receives the existing setters.
- Keep raw material detail hydration, builder section expansion, local result invalidation, and draft-review pending behavior unchanged.
- Preserve stable `localId` generation when duplicating rows to avoid duplicate React keys.

## Verification

- Run the web app check.
- Smoke test add, duplicate, and remove line actions in the browser.
- Confirm browser console has no warning or error logs during the row-action smoke test.
- Commit and merge through the solo-dev fast-forward workflow.

## Next Step

Continue reducing `page.tsx` by extracting the next cohesive behavior cluster, preferably saved-formula selection/comparison actions or builder draft-review orchestration.
