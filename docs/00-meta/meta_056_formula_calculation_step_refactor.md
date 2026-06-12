# Meta 056 - Formula calculation step extraction

## Decision

The Formula Builder live calculation step has been extracted from `apps/web/app/page.tsx` into `apps/web/app/formula-builder-ui/formula-calculation-step.tsx`.

## Context

After extracting the materials and formula composition steps, `Home` still rendered the step shell for “4. Calculo vivo” directly. The calculation panel itself was already presentational, so this slice completes the builder step-level composition.

## Scope

- Add `FormulaCalculationStep` as the builder step wrapper for live calculation.
- Keep `FormulaCalculationPanel` unchanged.
- Keep calculation state, saving behavior, parameter selection, and API calls in `page.tsx`.
- Preserve the existing summary text, CSS body class, and callbacks.

## Verification

- Run the web app check.
- Smoke test the live calculation step in the browser.
- Commit and merge through the solo-dev fast-forward workflow.

## Next Step

With all Formula Builder steps componentized, evaluate moving builder orchestration state and handlers into a dedicated hook or reducer.
