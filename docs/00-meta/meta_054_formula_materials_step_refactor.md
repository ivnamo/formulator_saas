# Meta 054 - Formula materials step extraction

## Decision

The Formula Builder materials step has been extracted from `apps/web/app/page.tsx` into `apps/web/app/formula-builder-ui/formula-materials-step.tsx`.

## Context

After extracting the basics and parameter selector fragments, the materials step still wired the parameter view panel, catalog filters, material list, inspector, and comparison controls directly in `Home`. That made the main page harder to scan and increased the cost of future catalog UX changes.

## Scope

- Add `FormulaMaterialsStep` as the composition layer for the materials step.
- Keep search/filter state, selected material state, and all mutation callbacks in `page.tsx`.
- Preserve the existing `BuilderStep`, parameter view, catalog controls, and catalog workspace behavior.
- Replace the inline “load more” callback with a named `loadMoreCatalogMaterials` handler.

## Verification

- Run the web app check.
- Smoke test the Formula Builder materials step in the browser.
- Commit and merge through the solo-dev fast-forward workflow.

## Next Step

Continue extracting the formula composition step, then evaluate whether the remaining builder orchestration should move into a dedicated hook or reducer.
