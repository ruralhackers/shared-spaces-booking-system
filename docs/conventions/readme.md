# DDD Fullstack Starter — Conventions & Architecture

TypeScript monorepo built with Domain-Driven Design (DDD) and Hexagonal Architecture (Ports & Adapters).

## Stack

- **Runtime**: Bun
- **Language**: TypeScript (strict)
- **Database**: PostgreSQL + Prisma
- **Backend host**: Bun + Elysia (`apps/api`) — hosts tRPC and better-auth handlers
- **API contract**: tRPC
- **Auth**: better-auth
- **Web**: Vite + React 19 + TanStack Router + shadcn/ui + Tailwind v4
- **Mobile**: Expo 54 + React Native + NativeWind
- **Shared UI**: `@dfs/ui` — tokens, CVA variants, and `cn()`
- **Linting/Formatting**: Biome
- **Testing**: Bun test

## Project Structure

```
ddd-fullstack-starter/
├── apps/
│   ├── api/          # Bun + Elysia backend (tRPC + better-auth fetch handlers)
│   ├── webapp/       # Vite SPA (React 19 + TanStack Router + shadcn/ui)
│   └── mobile/       # Expo 54 mobile app (iOS/Android/Web, NativeWind)
├── packages/
│   ├── api/          # BC: tRPC router and procedures (framework-agnostic)
│   ├── auth/         # BC: Authentication with better-auth
│   ├── common/       # Shared kernel (logger, errors, types)
│   ├── database/     # Prisma client and migrations
│   ├── ui/           # Design tokens, CVA variants, and cn() utility
│   └── users/        # BC: Example domain (user management)
├── docs/             # Conventions and development docs
└── scripts/          # Utility scripts (init, etc.)
```

`apps/webapp` and `apps/mobile` are HTTP clients of `apps/api` — they do not re-host the tRPC router or the auth handler.

## Bounded Context Structure

Each bounded context follows the same three-layer architecture:

```
packages/{context}/
├── domain/
│   ├── entities/       # Domain entities with business logic
│   ├── repositories/   # Repository interfaces (ports)
│   ├── value-objects/  # Immutable domain data types
│   ├── services/       # Domain services
│   └── events/         # Domain events
├── application/
│   └── {entity}/       # Use case services
└── infrastructure/
    ├── repositories/   # Port implementations (Prisma adapters)
    ├── controllers/    # Thin delegation layer
    └── factories/      # Dependency injection wiring
```

## Dependency Direction

Within a bounded context:

```
Domain (no external deps) ← Application ← Infrastructure
```

Domain defines ports (interfaces). Infrastructure provides adapters (Prisma implementations). Application orchestrates domain objects.

Across bounded contexts, communication should happen through application services or domain ports, never through direct infrastructure coupling.

## Current Defaults

- **Rich domain models are class-based and immutable** — entities and value objects use `create()`, `fromDto()`, and `toDto()` when they cross persistence boundaries.
- **Application services orchestrate only** — invariants, lifecycle transitions, formatting, and selection logic belong in entities or domain services.
- **Shared workflows are extracted once** — if webapp, mobile, or tRPC routers repeat the same orchestration, move it to a dedicated application service.
- **Config enters through composition** — application services receive ports, collaborators, and policy objects; they do not import `config` directly.
- **Repositories and ports must be explicit** — no silent truncation, hidden defaults, or filesystem logic leaking into routers/controllers.
- **No getters/setters in classes** — expose behavior through methods.

## Convention Files

### Architecture & DDD

- [DDD Principles](./architecture/ddd-principles.md)
- [File Organization](./patterns/file-organization.md)

### Backend patterns

- [Service Patterns](./patterns/service-patterns.md)
- [Repository Patterns](./patterns/repository-patterns.md)
- [Error Handling](./patterns/error-handling.md)

### Frontend patterns

- [Frontend Patterns](./patterns/frontend-patterns.md) — Vite SPA, Expo, `@dfs/ui`, tRPC client, TanStack Router + Expo Router

### Testing & TDD

- [Testing](./patterns/testing.md)
- [TDD Practices](./patterns/tdd-practices.md) — 5-step cycle, TPP, inside-out

### Cross-cutting

- [Naming Conventions](./naming-conventions.md)
- [Git Strategy](./git-strategy.md) — branching, Conventional Commits, TDD commit discipline
- [Pre-Commit Workflow](./pre-commit-workflow.md)

### Example

- [Complete Example: User Management](./examples/user-management/complete-implementation.md)
