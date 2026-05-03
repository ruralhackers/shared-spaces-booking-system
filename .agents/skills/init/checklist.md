# Post-Initialization Checklist

## Minimal Mode Verification (--components none)

If initialized with `--components none`, only these checks apply:

### 1. File Replacements
- [ ] All `@dfs` replaced with your identifier
- [ ] All `ddd-fullstack-starter` replaced with your project name

### 2. Structure
- [ ] `apps/` directory removed
- [ ] `packages/database/` removed
- [ ] `packages/auth/` removed
- [ ] `packages/api/` removed
- [ ] `packages/users/` removed
- [ ] `docker-compose.yml` removed
- [ ] `packages/common/` has no database dependencies
- [ ] `.env.example` contains only placeholder comment

### 3. Dependencies
- [ ] `bun install` completed without errors
- [ ] All workspace packages linked

Skip to "Code Quality" commands below.

---

## Fullstack Mode Verification

### 1. File Replacements
- [ ] All `@dfs` replaced with your identifier
- [ ] All `ddd-fullstack-starter` replaced with your project name
- [ ] App scheme updated in Expo config

### 2. Environment Configuration
- [ ] `.env.local` created with correct database URLs
- [ ] PostgreSQL port configured
- [ ] Redis port configured

### 3. Database Services
- [ ] Docker containers running: `docker ps`
- [ ] PostgreSQL accessible on configured port
- [ ] Redis accessible on configured port

### 4. Dependencies
- [ ] `bun install` completed without errors
- [ ] All workspace packages linked

### 5. Database Schema
- [ ] `bun run db:sync` completed
- [ ] Prisma client generated

### 6. SaaS Features (if enabled)
- [ ] User model has `role` field in Prisma schema
- [ ] `/admin` route exists and is protected by role check
- [ ] Sidebar shows Admin section for admin users only
- [ ] `adminProcedure` available in tRPC procedures

---

## Available Commands

### Development (Fullstack mode only)

| Command | Description |
|---------|-------------|
| `bun run api` | Start Bun/Elysia backend (localhost:4000) |
| `bun run webapp` | Start Vite SPA web application (localhost:3000) |
| `bun run app` | Start Expo development server |
| `bun run app:ios` | Run on iOS simulator |
| `bun run app:android` | Run on Android emulator |

### Database (Fullstack mode only)

| Command | Description |
|---------|-------------|
| `bun run dbs` | Start PostgreSQL and Redis containers |
| `bun run db:sync` | Generate Prisma client and push schema |
| `bun run db:studio` | Open Prisma Studio (database GUI) |
| `bun run db:seed` | Seed database with initial data |

### Code Quality (All modes)

| Command | Description |
|---------|-------------|
| `bun run lint` | Check code with Biome |
| `bun run lint:fix` | Auto-fix linting issues |
| `bun run typecheck` | Run TypeScript type checking |
| `bun run format` | Format code with Biome |

---

## Troubleshooting

### Docker containers not starting

```bash
# Check if ports are in use
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis

# Restart Docker
docker-compose down
bun run dbs
```

### Database connection errors

```bash
# Verify DATABASE_URL in .env.local
cat .env.local | grep DATABASE_URL

# Test connection
docker exec -it <project>-postgres psql -U <project>-user -d <project>-local
```

### Prisma client issues

```bash
# Regenerate Prisma client
cd packages/database
bun run db:sync
```

### Expo app not connecting to API

1. Check that webapp is running (API is served from webapp)
2. Verify the API URL in the mobile app config
3. For physical devices, use your machine's IP instead of localhost

---

## Project Structure

### Fullstack Mode
```
your-project/
├── apps/
│   ├── api/            # Bun + Elysia backend hosting tRPC + better-auth
│   ├── webapp/         # Vite SPA (React 19 + TanStack Router + shadcn/ui)
│   └── mobile/         # Expo 54 mobile app (NativeWind)
├── packages/
│   ├── api/            # tRPC router and procedures
│   ├── auth/           # Authentication (better-auth)
│   ├── common/         # Shared utilities and domain objects
│   ├── database/       # Prisma schema and client
│   ├── ui/             # Design tokens, CVA variants, cn()
│   └── users/          # Users bounded context (DDD example)
├── docs/               # Conventions, decisions, development docs
└── scripts/            # Utility scripts
```

### Minimal Mode (--components none)
```
your-project/
├── packages/
│   └── common/         # Shared utilities and domain objects
├── docs/               # Conventions, decisions, development docs
└── scripts/            # Utility scripts
```

---

## Next Steps

### Fullstack Mode
1. **Review the codebase structure** in `packages/` and `apps/`
2. **Update roadmap** in `docs/development/roadmap.md`
3. **Create your first bounded context** following the `users` package pattern
4. **Configure authentication** in `packages/auth/src/config.ts`
5. **Start building features!**

### Minimal Mode
1. **Review the codebase structure** in `packages/common/`
2. **Update roadmap** in `docs/development/roadmap.md`
3. **Create your first bounded context** as a new package in `packages/`
4. **Start building features!**
