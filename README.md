# Monorepo Boilerplate

> A production-ready TypeScript monorepo template following **Domain-Driven Design (DDD)** principles with **Hexagonal Architecture** (Ports & Adapters). Perfect for building scalable applications with clean architecture and maintainable code.

[![Use this template](https://img.shields.io/badge/Use_this_template-2ea44f?style=for-the-badge)](https://github.com/elevenyellow/ddd-fullstack-starter/generate)

## 🚀 Quick Start

### Prerequisites

- **Bun** runtime (v1.3 or higher)
- **Docker** or **Podman** (optional, only needed for Redis caching)

If you don't have Bun installed:
```bash
# macOS, Linux, and WSL
curl -fsSL https://bun.sh/install | bash

# Windows (PowerShell)
powershell -c "irm bun.sh/install.ps1 | iex"
```

### Setup Your Project

After creating a new repository from this template:

1. **Clone your new repository**
   ```bash
   git clone https://github.com/elevenyellow/your-project-name.git
   cd your-project-name
   ```

2. **Run the initialization script**
   ```bash
   bun run init
   ```

   The script will prompt you for:
   - Project name (e.g., `my-awesome-project`)
   - Project identifier (e.g., `@map`)
   - Project description (optional)

3. **Review and commit changes**
   ```bash
   git diff              # Review all changes
   git add .
   git commit -m "chore: initialize project from template"
   git push
   ```

4. **Install dependencies & start developing**
   ```bash
   bun install           # Install dependencies
   bun run redis         # Start Redis with Docker (optional, for caching)
   bun run db:sync       # Sync database schema (creates SQLite database file)
   bun run api           # Start the Bun/Elysia backend (localhost:4000)
   bun run webapp        # Start the Vite SPA (localhost:3000)
   bun run mobile        # Start the Expo mobile app
   ```

   Run `api` in its own terminal; `webapp` and `mobile` are HTTP clients of it.

## 📋 What's Included

### Architecture & Patterns
- **Domain-Driven Design**: Organized in bounded contexts
- **Hexagonal Architecture**: Clean separation of concerns with ports and adapters
- **Service Pattern**: All services use `run()` method as entry point
- **Repository Pattern**: Domain interfaces with infrastructure implementations

### Tech Stack
- **Runtime**: Bun (fast, modern JavaScript runtime)
- **Backend**: Bun + Elysia (`apps/api`) hosting tRPC and better-auth handlers
- **Web**: Vite + React 19 + TanStack Router + shadcn/ui + Tailwind v4
- **Mobile**: Expo 54 + React Native + NativeWind
- **Shared UI**: `@dfs/ui` package — design tokens, CVA variants, and `cn()` utility
- **API contract**: tRPC (type-safe end-to-end)
- **Database**: SQLite with Prisma ORM (file-based, zero-config)
- **Auth**: better-auth for authentication
- **Language**: TypeScript with strict conventions
- **Testing**: Bun test framework
- **Code Quality**: Biome for formatting and linting

### Project Structure

```
your-project/
├── .github/              # GitHub configuration (copilot-instructions symlinked to AGENTS.md)
├── .cursor/              # Cursor AI rules
├── .claude/              # Claude Code configuration (agents/commands/skills symlinked to .agents/)
├── .agents/              # Source of truth for reviewer agents, slash commands, and skills
├── apps/
│   ├── api/             # Bun + Elysia backend hosting tRPC + better-auth
│   ├── webapp/          # Vite SPA (React 19 + TanStack Router + shadcn/ui)
│   └── mobile/          # Expo 54 mobile app (iOS, Android, Web) with NativeWind
├── packages/
│   ├── api/             # tRPC router and procedures
│   ├── auth/            # Authentication with better-auth
│   ├── common/          # Shared domain concepts and infrastructure
│   ├── database/        # Prisma client and migrations
│   ├── ui/              # Design tokens, CVA variants, and cn() (cross-platform)
│   └── users/           # Example bounded context (user management)
├── docs/                 # Conventions, decisions, and development docs
│   ├── conventions/     # Naming, service/repository patterns, testing, DDD principles
│   ├── decisions/       # Architecture Decision Records (ADRs)
│   └── development/     # Roadmap, plans, implementation notes
├── AGENTS.md             # Shared agent instructions (source of truth)
├── CLAUDE.md             # Symlink to AGENTS.md
└── scripts/             # Utility scripts (init, etc.)
```

## 🎯 Package Structure (DDD Layers)

Each bounded context follows this structure:

```
packages/[context]/
├── domain/
│   ├── entities/           # Domain entities with business logic
│   ├── repositories/       # Repository interfaces (ports)
│   ├── services/          # Domain services
│   └── events/            # Domain events
├── application/
│   └── [entity]/          # Use case services
└── infrastructure/
    ├── repositories/      # Repository implementations (adapters)
    ├── controllers/       # Application controllers
    └── factories/         # Dependency injection factories
```

## 🛠️ Development Commands

| Command | Description |
|---------|-------------|
| `bun run init` | **Initialize project from template** (run once) |
| `bun install` | Install all dependencies |
| `bun run redis` | Start Redis with Docker Compose (optional) |
| `bun run db:sync` | Synchronize Prisma schema with SQLite database |
| `bun run api` | Start the Bun/Elysia backend (port 4000) |
| `bun run webapp` | Start the Vite SPA (port 3000) |
| `bun run mobile` | Start Expo mobile app |
| `bun run mobile:ios` | Run on iOS simulator |
| `bun run mobile:android` | Run on Android emulator |
| `bun test` | Run all tests |
| `bun run format` | Format code with Biome |
| `bun run lint` | Lint and check code quality |

## 💾 Database Management

### SQLite Setup

The project uses **SQLite** as the database, stored as a single file in `./data/app.db`. This provides:
- **Zero configuration** - no separate database server needed
- **Simple deployment** - just copy the `data/` directory
- **Fast development** - instant startup, no Docker required
- **Easy backups** - copy the database file

### Database Location

- **Development**: `./data/pglite/` (created automatically on first run)
- **Test**: In-memory PGlite instances (no files, cleaned up after tests)
- **Production**: Configure via `DATABASE_URL` environment variable (`pglite:./data/pglite`)

### Backup & Restore

**Backup:**
```bash
# Simple directory copy
cp -r ./data/pglite ./data-backup-$(date +%Y%m%d)

# Or use tar for compression
tar -czf backup-$(date +%Y%m%d).tar.gz ./data/pglite
```

**Restore:**
```bash
# From directory backup
cp -r ./data-backup-20260502/pglite ./data/pglite

# From tar backup
tar -xzf backup-20260502.tar.gz
```

### Deployment Notes

When deploying to platforms like **Fly.io**, **Railway**, or **Render**:

1. **Configure persistent volume** for the `./data/pglite/` directory
2. **Set `DATABASE_URL`** environment variable: `pglite:./data/pglite`
3. **Initialize schema** on first deploy: `bun run packages/database/src/init-schema.ts`
4. **Schedule backups** by copying the `data/pglite/` directory to object storage

Example Fly.io volume configuration:
```toml
[mounts]
  source = "app_data"
  destination = "/app/data/pglite"
```

### PGlite Configuration

The database uses PGlite (embedded PostgreSQL) with automatic configuration:
- Full PostgreSQL compatibility (real JSONB, real enum types)
- No separate server process required
- File-based persistence in `data/pglite/` directory
- Foreign keys enforced by default
- Optimal settings for embedded use
- `busy_timeout = 5000` - Wait up to 5 seconds for locks
- `synchronous = NORMAL` - Balance between safety and performance

## 📐 Key Conventions

### Naming Patterns
- **Files**: `kebab-case.type.ts` (e.g., `user-creator.service.ts`)
- **Classes**: `PascalCase` (e.g., `UserCreator`)
- **Methods**: `camelCase` with `run()` as main entry point for services
- **Packages**: `@[identifier]/package-name` (e.g., `@dfs/common`, `@dfs/users`)

### Service Patterns
- All services have a **single responsibility**
- Services expose a public `run()` method as the main entry point
- Constructor-based dependency injection
- Private logging using shared logger factory

### Repository Patterns
- Domain defines repository **interfaces** (ports)
- Infrastructure provides **implementations** (adapters)
- Standard methods: `findById()`, `save()`, `delete()`
- Entity transformation via `fromDto()` and `toDto()`

## 📚 Documentation

### Complete Guides in `docs/conventions/`
- **[Naming Conventions](./docs/conventions/naming-conventions.md)** - File, class, and method naming
- **[Service Patterns](./docs/conventions/patterns/service-patterns.md)** - Application and domain services
- **[Repository Patterns](./docs/conventions/patterns/repository-patterns.md)** - Port/Adapter pattern with Prisma
- **[Testing](./docs/conventions/patterns/testing.md)** - Test patterns and examples
- **[DDD Principles](./docs/conventions/architecture/ddd-principles.md)** - Domain-Driven Design implementation
- **[Complete Example](./docs/conventions/examples/user-management/complete-implementation.md)** - Full bounded context

### AI Assistant Configuration

All agents read the same source of truth: [AGENTS.md](./AGENTS.md).

- **Claude Code**: `CLAUDE.md` is a symlink to `AGENTS.md`; project-specific extensions live in `.claude/CLAUDE.md`.
- **GitHub Copilot**: `.github/copilot-instructions.md` is a symlink to `AGENTS.md`.
- **Cursor AI**: See `.cursor/.rules/*.mdc`.
- **Agents and skills**: defined in `.agents/` and symlinked from `.claude/`.
- **OpenCode**: `opencode.json` declares modes (`explore`, `plan`, `build`, `archive`) and subagents that reference `.agents/` paths directly — no symlink dependency.

### Claude Code `/init` Skill

If you're using [Claude Code](https://claude.ai/claude-code), you can use the `/init` skill for an interactive initialization experience:

```
/init my-project
```

The skill will:
1. Verify your environment (Bun, Docker)
2. Ask which components you want (Admin, Mobile, or both)
3. Collect project details (name, identifier, description)
4. Run the initialization script
5. Install dependencies and set up the database
6. Guide you through next steps

## 🎨 Example: User Management

The template includes a complete **User bounded context** as reference:

- Domain entities with business logic
- Value objects (Email, Id)
- Repository interface and Prisma implementation
- Application service (UserUpdater)
- Complete test coverage

Check `packages/users/` and the [complete implementation guide](./docs/conventions/examples/user-management/complete-implementation.md).

## 🔧 What the Init Script Does

The `bun run init` script will:

- Replace `@dfs` with your project identifier throughout the codebase
- Update project name in all configuration files (including `docker-compose.yml`)
- Update project description in documentation
- **Select components**: Choose Admin only, Mobile only, or both
- Remove unselected apps and their scripts from `package.json`
- Scan and update: TypeScript, JavaScript, JSON, Markdown, YAML files
- Create `.env.local` from `.env.example` with project-specific values

### Init Script Options

| Option | Description |
|--------|-------------|
| `--dry-run` | Preview changes without applying them |
| `-n, --name <name>` | Project name (lowercase, alphanumeric with hyphens) |
| `-i, --identifier <id>` | Project identifier (e.g., `@myproject`) |
| `-d, --description <desc>` | Project description |
| `-c, --components <list>` | Components to include: `both`, `webapp`, `mobile` (default: both) |
| `-v, --verbose` | Show detailed output |
| `--skip-git-check` | Skip uncommitted changes warning |
| `--no-backup` | Skip creating backup before changes |
| `-h, --help` | Show help message |

### Examples

```bash
# Interactive mode (recommended for first-time setup)
bun run init

# Preview what would change without modifying files
bun run init --dry-run

# Non-interactive mode with all components
bun run init -n my-project -i @mp -d "My awesome project"

# Webapp only (no mobile app)
bun run init -n my-project -i @mp --components webapp

# Mobile app only (no webapp)
bun run init -n my-project -i @mp --components mobile

# Preview with verbose output
bun run init --dry-run -v
```

The script includes safety features:
- **Git status check**: Warns if you have uncommitted changes
- **Backup system**: Creates a backup before applying changes (can be restored if needed)
- **Validation**: Ensures project name and identifier follow correct formats
- **Component selection**: Removes unselected apps cleanly

## 🤝 Contributing to Your Project

When working with this template:

1. Follow the established naming conventions
2. Maintain clear separation between domain, application, and infrastructure layers
3. Write domain-driven code with meaningful business concepts
4. Use dependency injection through factory patterns
5. Document significant architectural decisions in `docs/decisions/`

## � Slack Notifications (Optional)

To receive GitHub notifications (commits, PRs, merges) in a Slack channel:

1. Install the [GitHub + Slack App](https://slack.github.com) in your workspace
2. Go to the desired Slack channel and run:

```
/github subscribe elevenyellow/<repo> commits pulls reviews
```

| Command | Description |
|---------|-------------|
| `/github subscribe list` | See current subscriptions |
| `/github subscribe list features` | See which events are active |
| `/github unsubscribe <org>/<repo> <event>` | Remove a specific event |

## �📖 Learning Resources

- **DDD**: [Domain-Driven Design by Eric Evans](https://www.domainlanguage.com/ddd/)
- **Hexagonal Architecture**: [Ports and Adapters Pattern](https://alistair.cockburn.us/hexagonal-architecture/)
- **Bun**: [Official Documentation](https://bun.sh/docs)
- **Elysia**: [Official Documentation](https://elysiajs.com/)
- **Vite**: [Official Documentation](https://vite.dev/)
- **TanStack Router**: [Official Documentation](https://tanstack.com/router/latest)

---

**Built with ❤️ using Bun, Vite, Elysia, and DDD principles**



