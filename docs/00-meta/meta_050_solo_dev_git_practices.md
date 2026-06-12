# Meta 050 - Solo-dev development and git practices

## Decision

For this repository, Codex work should follow a solo-dev workflow optimized for clarity, small recoverable changes, and a clean `main`. This is the default rule for implementation work unless the user explicitly asks for a different flow.

## Operating Rules

- Start every implementation slice from a clean worktree or explicitly account for existing changes before editing.
- Use a short-lived `codex/*` branch for each coherent change unless the task is purely read-only.
- Keep commits small, named by outcome, and scoped to the current slice.
- Run the narrowest meaningful verification before committing; for frontend changes, include a browser smoke test when the app is runnable.
- Prefer fast-forward merges back to `main` when the branch is based on current `main`.
- Push the branch before merging, then push `main` after the fast-forward merge.
- Finish with `git status -sb` clean or clearly report any remaining intentional changes.
- Do not mix unrelated refactors, generated artifacts, or exploratory notes into an implementation commit.

## Rationale

The project is moving quickly and mostly by one developer. This flow keeps history linear enough to reason about, while still making each change easy to inspect, revert, or continue from if a later UI or data issue appears.

## Review Checklist

- Is the branch name specific to the slice?
- Does the commit contain only the files needed for the stated change?
- Did typecheck/build/tests pass where relevant?
- Did browser validation cover the user-visible path if UI changed?
- Is `main` pushed and the local worktree clean?
