# Meta 053 - Formula builder step UI extraction

## Decision

The first two inline Formula Builder UI fragments in `page.tsx` have been extracted into focused components:

- `apps/web/app/formula-builder-ui/formula-basics-step.tsx`
- `apps/web/app/formula-builder-ui/parameter-view-panel.tsx`

## Context

The Formula Builder already has dedicated files for tables, catalog controls, calculation, draft review, and Jira review. The main page still contained inline JSX for basic formula metadata and parameter visibility controls, which made `Home` harder to scan.

## Scope

- Move formula name and optional Jira metadata fields into `FormulaBasicsStep`.
- Move parameter preset, custom parameter selection, and `Solo > 0` toggle into `ParameterViewPanel`.
- Keep all state ownership, API actions, and domain mutation in `page.tsx`.
- Preserve labels, datalist options, CSS classes, and existing callbacks.

## Verification

- Run the web app check.
- Smoke test the Formula Builder basics and material filter controls in the browser.
- Commit and merge through the solo-dev branch workflow.

## Next Step

Continue by extracting the remaining Formula Builder section shell or moving builder state/action orchestration into a dedicated hook once the prop contracts are stable enough.
