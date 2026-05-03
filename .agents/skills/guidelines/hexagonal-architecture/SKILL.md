---
name: hexagonal-architecture
description: Hexagonal + DDD rules for this monorepo — bounded contexts, inward-only layer dependencies (domain → application → infrastructure), repository port/adapter, application services with run(), cross-context communication through services/ports only. Load when writing, reviewing, or refactoring backend code in packages/ or planning cross-context workflows.
---

# Hexagonal Architecture + DDD

Short checklist. Full structure, examples, and rationale live in `docs/conventions/` — go there for any detail.

## Bounded contexts

Each package in `packages/` is a bounded context with its own ubiquitous language:

- `common` — shared kernel (DomainError, `Id`, `Email`, `Logger`).
- `database` — Prisma client, migrations, schema.
- `auth` — authentication via better-auth.
- `api` — tRPC routers; thin surface that delegates to application services.
- `users` — example domain; reference implementation.

Contexts communicate through **application services or domain ports**, never direct adapter coupling.

## Layers — dependency direction is inward only

```
packages/<context>/
  domain/           ← no external dependencies
  application/      ← depends on domain
  infrastructure/   ← depends on domain + application
```

- **Domain**: entities (rich models, behavior as methods), value objects (immutable), repository **interfaces** (ports), domain services, `DomainError` subclasses.
- **Application**: services with a single `run(input)` entry point, constructor-injected deps, DTOs next to the service. No `@trpc/*`, no Prisma imports.
- **Infrastructure**: repository **implementations** (adapters), tRPC procedure bodies, external-service adapters, factories for wiring.

## Repository port/adapter

Port in domain, adapter in infrastructure. Method names use **business language**, not database verbs. Parameters and returns use domain entities and value objects.

→ Full pattern: [patterns/repository-patterns.md](../../../../docs/conventions/patterns/repository-patterns.md)

## Application service shape

- One public method: `run()`.
- Constructor injection for every dependency.
- Orchestrate — do not put invariants in the service; delegate to entities.
- No `UseCase` suffix — the convention is `<Subject><Verb>` with `run()`.

→ Full pattern: [patterns/service-patterns.md](../../../../docs/conventions/patterns/service-patterns.md)

## Frontend boundary

`apps/webapp` and `apps/mobile` delegate to application services through the tRPC boundary in `@dfs/api`. No domain logic or Prisma access in the frontend.

→ Full rules: [patterns/frontend-patterns.md](../../../../docs/conventions/patterns/frontend-patterns.md)

## Common violations to fix

- Adapter or Prisma import inside `domain/` or `application/`.
- Business rule inside a tRPC procedure body instead of an application service.
- Anemic entity with public getters/setters and logic living in a service.
- Frontend component calling Prisma or a repository directly.
- Cross-context import reaching into another context's `domain/` or `infrastructure/`.
- `UseCase` suffix, or services without `run()`.

→ Full principles: [architecture/ddd-principles.md](../../../../docs/conventions/architecture/ddd-principles.md)
