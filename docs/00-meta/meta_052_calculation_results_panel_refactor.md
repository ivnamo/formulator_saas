# Meta 052 - Calculation results panel extraction

## Decision

The calculation results surface has been extracted from `apps/web/app/page.tsx` into `apps/web/app/calculation-results-panel.tsx`.

## Context

`page.tsx` should coordinate workspace state and actions, while repeated UI surfaces should live in focused components. The result panel was still rendering totals, parameters, and warnings directly in the main page.

## Scope

- Move the `#results` panel into a named component.
- Keep `result` as the only prop for result rendering.
- Move warning severity normalization into `formula-formatters.ts` so calculation surfaces can share it.
- Remove the warning normalization callback from `FormulaCalculationPanel`.

## Verification

- Run the workspace check for the web app.
- Smoke test the result view in the browser.
- Keep the branch small and merge back to `main` by fast-forward.

## Next Step

Continue reducing `page.tsx` by extracting the remaining formula builder container or by moving more derived action helpers into focused hooks.
