# Meta 064 - Raw material actions hook

## Decision

Raw-material detail, selection, creation, and alias actions have been extracted from `apps/web/app/page.tsx` into `apps/web/app/raw-material-actions.ts`.

## Context

The main page still owned raw-material workflow actions even though catalog rendering, formula rows, Excel import actions, and compatibility actions had already been split out. This made `page.tsx` responsible for both state composition and low-level raw-material API behavior.

## Scope

- Add `useRawMaterialActions`.
- Move raw-material detail loading, catalog inspection, comparison selection, expansion, creation, and alias creation.
- Keep raw-material state, catalog filters, and panel rendering in `page.tsx`.
- Preserve detail merge behavior, price/parameter creation, catalog refresh, import reset, result invalidation, and user-facing messages.
- Reorder `useFormulaLineActions` so it receives the hook-owned `ensureRawMaterialDetail`.

## Verification

- Run the web app check.
- Smoke test raw-material catalog/Formula Builder interactions in browser.
- Confirm material detail expansion and Raw Materials panel controls render without console warning or error logs.
- Commit and merge through the solo-dev fast-forward workflow.

## Next Step

Continue reducing `page.tsx` by extracting workspace/account actions or tenant/parameter setup actions. These are still cross-cutting and should be kept in small slices.
