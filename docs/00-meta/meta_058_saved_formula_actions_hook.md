# Meta 058 - Saved formula actions hook

## Decision

Saved-formula behavior has been extracted from `apps/web/app/page.tsx` into `apps/web/app/saved-formula-actions.ts`.

## Context

After splitting the Formula Builder UI and line actions, `page.tsx` still owned a large block for formula library refresh, saved formula comparison, formula saving, formula opening, history loading, and review loading. These operations are a cohesive remote-action cluster and can live outside the main screen without changing state ownership.

## Scope

- Add `useSavedFormulaActions`.
- Move saved formula comparison, save, open, library refresh, calculation-history loading, and formula-review loading into the hook.
- Keep `page.tsx` as the owner of workspace, formula library, calculation history, draft review, comparison state, and review artifacts.
- Keep existing validations, messages, API paths, result invalidation, and section-opening behavior.
- Preserve Jira and Excel import reuse by returning the history/review loaders.

## Verification

- Run the web app check.
- Smoke test the Library view in the browser.
- Confirm `Refresh library` and `Compare formulas` render after navigating to Library.
- Confirm browser console has no warning or error logs during the Library smoke test.
- Commit and merge through the solo-dev fast-forward workflow.

## Next Step

Continue extracting `page.tsx` by moving Jira review actions or Excel import persistence into dedicated hooks. Jira review actions are the next best target because they now depend on the returned formula-review loader.
