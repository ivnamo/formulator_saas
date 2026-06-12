# Meta 060 - Excel import actions hook

## Decision

Excel import actions have been extracted from `apps/web/app/page.tsx` into `apps/web/app/excel-import-actions.ts`.

## Context

The Excel import panel was already presentational, but `page.tsx` still owned upload, sheet discovery, preview, save, row resolution, suggestion acceptance, material creation, and alias creation. These actions form a cohesive import workflow and can be isolated while leaving import state ownership unchanged.

## Scope

- Add `useExcelImportActions`.
- Move file selection, sheet preview, imported formula save, row resolution, suggestion acceptance, material creation from import rows, and alias creation from import rows into the hook.
- Keep `useExcelImportState` as the source of import preview/file/sheet state.
- Keep workspace, formula library, calculation history, draft review, saved comparison, and raw material catalog state owned by `page.tsx`.
- Preserve existing validations, API paths, status messages, and row-resolution behavior.

## Verification

- Run the web app check.
- Smoke test the Excel import panel in the browser.
- Confirm upload `.xlsx`, sheet selector, disabled save button without preview, and empty preview state render.
- Confirm browser console has no warning or error logs during the smoke test.
- Commit and merge through the solo-dev fast-forward workflow.

## Next Step

Continue reducing `page.tsx` by extracting Jira connection setup actions or AI requirement actions. Jira connection setup is the cleaner next slice because it is adjacent to existing Jira review extraction.
