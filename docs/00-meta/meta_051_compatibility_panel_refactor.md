# Meta 051 - Compatibility panel extraction

## Decision

The compatibility rules UI has been extracted from `apps/web/app/page.tsx` into `apps/web/app/compatibility-panel.tsx`.

## Context

`page.tsx` still owns orchestration, data loading, and workspace state, but several views are now separate panels. Compatibility was still embedded in the main render tree even though its UI is isolated from the formula builder flow.

## Scope

- Move the compatibility section markup into a named `CompatibilityPanel` component.
- Keep rule creation and API mutation logic in `page.tsx`.
- Pass only the required state, permission flags, material lookup, and callbacks as props.
- Preserve existing labels, CSS classes, disabled states, and list rendering.

## Verification

- Run the app workspace check.
- Smoke test the compatibility view in the browser.
- Confirm no unrelated worktree changes remain.

## Next Step

Continue reducing `page.tsx` by extracting the remaining result/history surface or by moving formula-builder orchestration into a dedicated container when the next slice can be verified safely.
