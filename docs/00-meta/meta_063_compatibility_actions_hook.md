# Meta 063 - Compatibility actions hook

## Decision

Compatibility rule creation has been extracted from `apps/web/app/page.tsx` into `apps/web/app/compatibility-actions.ts`.

## Context

The Compatibility panel already owns rendering and form inputs, but the remote create action still lived in the main page. Moving it to a hook keeps the main page focused on state composition and view wiring.

## Scope

- Add `useCompatibilityActions`.
- Move compatibility rule validation and POST request.
- Keep compatibility form state, rule list state, and `canCreateCompatibilityRule` in `page.tsx`.
- Preserve API path, payload shape, result invalidation, and status messages.

## Verification

- Run the web app check.
- Smoke test the Compatibility panel in browser.
- Confirm the Save rule control renders and the console has no warning or error logs.
- Commit and merge through the solo-dev fast-forward workflow.

## Next Step

Continue reducing `page.tsx` by extracting raw-material detail/create/alias actions. That slice is broader because it touches catalog refresh, import reset, parameter values, aliases, and formula-line preparation.
