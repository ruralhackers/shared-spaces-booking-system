---
name: task-ux-review
description: Visual UX evaluation of the Vite webapp using Playwright MCP. Triggers "review UX", "visual review", "check UI".
argument-hint: "[spec:<path> | description of what to review]"
context: fork
agent: ux-reviewer
allowed-tools: Read, Glob, Bash, mcp__playwright__browser_navigate, mcp__playwright__browser_snapshot, mcp__playwright__browser_take_screenshot, mcp__playwright__browser_click, mcp__playwright__browser_type, mcp__playwright__browser_wait_for, mcp__playwright__browser_resize, mcp__playwright__browser_tabs
---

# UX Review

Launch the `ux-reviewer` subagent to perform a visual UX review of the Vite webapp via the Playwright MCP. Requires the Playwright MCP at the user/global level.

## Usage

```
/task-ux-review spec:docs/specs/feature.md    → Extract target screens from a spec file
/task-ux-review "session dashboard"            → Free-text focus
/task-ux-review                                → Auto-discover top-level routes from TanStack Router
```

## Prerequisites

- Backend running at `http://localhost:4000` (`bun run api` if not started).
- Webapp running at `http://localhost:3000` (`bun run webapp` if not started).
- Test credentials available if any screen requires authentication.

## What the agent checks

- Visual hierarchy (typographic scale, spacing, primary-action prominence)
- Readability (contrast, alignment, font size, line height)
- Interactivity (hover, `:focus-visible`, transitions, touch targets)
- Responsiveness (layout below 900px, no horizontal scroll)
- Accessibility (labels, color independence, focus outlines, form error announcement)

## Output

Per screen: route path, snapshot reference, findings table (category → issue → proposed fix → severity).
