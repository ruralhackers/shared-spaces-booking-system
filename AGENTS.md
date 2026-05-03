# Shared Spaces Booking

Coliving shared-spaces booking webapp — TypeScript monorepo following Domain-Driven Design with Hexagonal Architecture (Ports & Adapters).

## Quick Reference

- **Runtime**: Bun | **Language**: TypeScript (strict) | **DB**: PostgreSQL + Prisma
- **API host**: Bun + Elysia (`apps/api`) serving tRPC
- **API surface**: tRPC | **Auth**: none (name-only bookings; admin via shared-secret URL)
- **Web**: Vite + React 19 + TanStack Router + shadcn/ui + Tailwind v4 (`apps/webapp`)
- **Shared UI**: `@dfs/ui` (tokens + CVA variants + `cn`); each app implements its own components
- **Linting**: Biome | **Testing**: bun test
- **Package prefix**: `@dfs/`

## Architecture

4 packages in `packages/`: `api` (tRPC router), `common` (DDD kernel), `database` (Prisma client & migrations), `ui` (design tokens + variants + `cn`).
2 applications in `apps/`: `api` (Bun + Elysia backend), `webapp` (Vite SPA).
Each bounded context follows: `domain/` → `application/` → `infrastructure/` with ports & adapters. `apps/*` are thin shells — no domain logic.

## Key Conventions

- Files: `kebab-case.type.ts` (e.g., `user-creator.service.ts`)
- Classes: `PascalCase` | Methods: `camelCase` | Entry point: `run()`
- Constructor injection for all dependencies
- Ports in domain, adapters in infrastructure
- Tests live in `tests/{unit,integration,e2e}/` inside each package, mirroring the source layout; integration tests as `*.integration.test.ts`

## Operational Defaults

- Rich domain models are class-based and immutable; entities and value objects use `create()`, `fromDto()`, and `toDto()` at persistence boundaries.
- Application services orchestrate through `run()` and delegate invariants, transitions, and formatting to entities or domain services.
- If webapp or tRPC routers repeat the same workflow, extract a shared application service instead of copying orchestration.
- Configuration enters through factories and policy objects; application services do not import `config` directly.
- Bounded contexts communicate through application services or domain ports, never through direct adapter coupling.
- Repositories and ports stay explicit; routers/controllers should not own filesystem or persistence logic.
- No getters/setters in classes — expose behavior through methods.
- Don't include JSDoc comments unless requested; let TypeScript infer return types except on interfaces and abstract methods.
- Validation uses `bun run typecheck` and terminal `bun test`; the IDE test runner is not the source of truth.
- Integration tests use PGlite in-memory via `createTestPrisma()` from `@dfs/database/testing`; Docker Postgres is only for `bun run dev`. Regenerate `packages/database/prisma/schema.sql` with `bun run -F @dfs/database db:sync` after any schema change.
- After code changes, run the `lint:fix` + `typecheck` + `test` trio before committing.

## Mandatory Review Gate

After implementing or modifying production code, you MUST run `/task-code-review`, `/task-tests-review`, and `/task-architecture-review` in parallel **before reporting the task as complete**. This is non-negotiable — do not skip, defer, or summarize completion until the three reviews have run and their findings have been addressed. If the task only touches frontend code, also run `/task-frontend-review`.

## Agent tooling layout

Source of truth lives in `.agents/`:

- `.agents/agents/` — reviewer subagents (code-reviewer, tests-reviewer, etc.)
- `.agents/skills/` — skill prompts (`openspec-*`, `action-*`, `task-*`, `guidelines/*`)

Tool-specific folders are symlinks into `.agents/`:

- `.claude/agents` → `.agents/agents`
- `.claude/skills` → `.agents/skills`

**Rule**: always reference `.agents/...` paths in configuration files (`opencode.json`), code, and docs. Never `.claude/...`. The symlinks exist for Claude Code compatibility, not as a canonical path. OpenCode reads `.agents/` directly via `opencode.json`.

## Commands

```text
bun install          # Install dependencies
bun run api          # Start Bun/Elysia backend (localhost:4000)
bun run webapp       # Start Vite SPA (localhost:3000)
bun run dbs          # Start PostgreSQL & Redis via docker-compose
bun run db:sync      # Generate Prisma client and push schema
bun test             # Run tests
bun run typecheck    # TypeScript type check
bun run lint         # Biome lint check
bun run lint:fix     # Biome lint + auto-fix
bun run format       # Biome format
```

The webapp is an HTTP client of `apps/api`. Start `api` first in one terminal, then `webapp` in another.

## Tooling: Context7 (MCP)

Always use Context7 MCP tools automatically (without explicit user request) when:

- **Code generation**: creating new services, repositories, entities, or any implementation code.
- **Setup/Configuration**: setting up libraries, frameworks, build tools, or project configuration.
- **Library/API documentation**: looking up usage patterns, APIs, or best practices for external libraries.

Workflow: first resolve the library ID with `resolve-library-id`, then fetch documentation with `get-library-docs`. Prefer Context7 over web search for library docs.

## Full Conventions

See [docs/conventions/](docs/conventions/readme.md) for complete documentation:

- [Naming Conventions](docs/conventions/naming-conventions.md)
- [Git Strategy](docs/conventions/git-strategy.md)
- [Pre-Commit Workflow](docs/conventions/pre-commit-workflow.md)
- [Service Patterns](docs/conventions/patterns/service-patterns.md)
- [Repository Patterns](docs/conventions/patterns/repository-patterns.md)
- [File Organization](docs/conventions/patterns/file-organization.md)
- [Error Handling](docs/conventions/patterns/error-handling.md)
- [Frontend Patterns](docs/conventions/patterns/frontend-patterns.md)
- [Testing](docs/conventions/patterns/testing.md)
- [TDD Practices](docs/conventions/patterns/tdd-practices.md)
- [DDD Principles](docs/conventions/architecture/ddd-principles.md)
- [Complete Example: User Management](docs/conventions/examples/user-management/complete-implementation.md)
