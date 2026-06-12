# Meta 055 - Formula composition step extraction

## Decision

The Formula Builder “Formula editable” step has been extracted from `apps/web/app/page.tsx` into `apps/web/app/formula-builder-ui/formula-composition-step.tsx`.

## Context

The materials step now lives in its own composition component. The next inline block in `Home` was the formula composition step, which assembled progress summary, draft review, Jira review, and the editable formula line table.

## Scope

- Add `FormulaCompositionStep` as the composition layer for builder step 3.
- Keep all data loading, mutations, calculation, draft review state, and Jira actions in `page.tsx`.
- Preserve existing child components, labels, callbacks, and visible behavior.
- Move only UI composition and small derived price/source props out of the main render tree.

## Verification

- Run the web app check.
- Smoke test the Formula Builder step shell and formula table area in the browser.
- Commit and merge through the solo-dev fast-forward workflow.

## Next Step

Extract the live calculation step or start moving formula-builder orchestration into a dedicated hook after the remaining builder sections are componentized.
