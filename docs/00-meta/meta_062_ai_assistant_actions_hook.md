# Meta 062 - AI assistant actions hook

## Decision

AI assistant actions have been extracted from `apps/web/app/page.tsx` into `apps/web/app/ai-assistant-actions.ts`.

## Context

The AI panel already existed as a component, but parse, supervisor plan, run refresh, and infeasibility action reuse still lived in the main page. These operations are cohesive around the requirement assistant flow and can be isolated without changing panel rendering.

## Scope

- Add `useAiAssistantActions`.
- Move requirement parse, supervisor plan, AI run refresh, and infeasibility action reuse.
- Keep AI state ownership in `page.tsx`.
- Preserve API paths, status messages, tenant/text validation, and silent run refresh after parse/plan.

## Verification

- Run the web app check.
- Smoke test the AI assistant panel in browser.
- Confirm Parse, Plan, and Runs controls render and the console has no warning or error logs.
- Commit and merge through the solo-dev fast-forward workflow.

## Next Step

Continue reducing `page.tsx` by extracting raw-material creation/detail/alias actions or compatibility-rule actions. Raw-material actions are broader and should be split carefully.
