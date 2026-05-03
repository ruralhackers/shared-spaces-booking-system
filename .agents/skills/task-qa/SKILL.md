---
name: task-qa
description: Functional QA of the Vite webapp against a spec or description with Playwright MCP, plus e2e coverage audit. Triggers "QA", "manual testing", "check flows".
argument-hint: "[spec:<path> | description of flows to test]"
context: fork
agent: qa-tester
allowed-tools: Read, Glob, Grep, Bash, mcp__playwright__browser_navigate, mcp__playwright__browser_snapshot, mcp__playwright__browser_take_screenshot, mcp__playwright__browser_click, mcp__playwright__browser_type, mcp__playwright__browser_fill_form, mcp__playwright__browser_select_option, mcp__playwright__browser_press_key, mcp__playwright__browser_wait_for, mcp__playwright__browser_resize, mcp__playwright__browser_tabs, mcp__playwright__browser_console_messages, mcp__playwright__browser_network_requests, mcp__playwright__browser_evaluate
---

# QA Testing

Launch the `qa-tester` subagent to verify application flows against a spec (or free-text description) using the Playwright MCP, and audit e2e test coverage for the flows exercised. Requires the Playwright MCP at the user/global level.

## Usage

```
/task-qa spec:docs/specs/feature.md                 → Extract flows from a spec file
/task-qa "User sign-up + email verification"        → Free-text flow description
/task-qa                                             → Auto-discover primary flow from TanStack Router routes
```

## Prerequisites

- Backend running at `http://localhost:4000` (`bun run api`).
- Webapp running at `http://localhost:3000` (`bun run webapp`).
- Database stack up if the flow touches persistence: `bun run dbs` + `bun run db:sync`.
- Test credentials resolved for auth-gated flows.

## What the agent verifies

- Each acceptance criterion reachable through the UI (not direct tRPC calls).
- Form validation: required fields, error messages, disabled submit states.
- Success + at least one failure path per flow.
- Auth-gated routes redirect when unauthenticated.
- Mutations refresh the UI without manual reload (TanStack Query invalidation).
- Browser console has no unexpected errors; tRPC calls return expected status codes.

## E2E coverage audit

After running the flows, the agent inspects `apps/webapp/` and `packages/` for existing e2e tests and reports:

- Which flows are covered by automated e2e vs only verified manually.
- Recommended new e2e tests (file path + description).

## Rules

- Never modify production code to make a flow pass — report the bug.
- Never write new e2e tests inside this run — only recommend them.
- Never use `npm` — Bun only.

## Output

- Per acceptance criterion: ✅ / ❌ with evidence (route, snapshot, network call).
- Console errors and network anomalies.
- Coverage audit table: flow → covered by e2e? → recommendation.
