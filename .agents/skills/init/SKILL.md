---
name: init
description: Initialize a new project from the DDD fullstack starter template
argument-hint: "project-name"
---

# Project Initialization Wizard

You are initializing a new project from the DDD fullstack starter template. Guide the user through the setup process.

## Pre-requisites Check

First, verify the environment:

```bash
# Check Bun is installed
bun --version

# Check Docker or Podman is available (for PostgreSQL/Redis)
docker --version || podman --version
```

If Bun is missing, inform the user and provide installation instructions before proceeding.

**Note**: Either Docker or Podman works for container management. The init script automatically detects which one is available and configures the `dbs` script accordingly. Docker/Podman is **not needed** for `--components none` (minimal mode).

## Information Gathering

If a project name was provided as argument, use it: `$ARGUMENTS`

Otherwise, gather the following information from the user using AskUserQuestion:

### 1. Project Name
- Must be lowercase
- Can contain letters, numbers, and hyphens
- Must start with a letter
- Example: `my-awesome-project`

### 2. Components to Include
Ask the user which components they want:
- **Webapp + Mobile** (recommended) - Full stack with Vite SPA web application and Expo mobile app
- **Webapp only** - Just the Vite SPA web application
- **Mobile only** - Just the Expo mobile application
- **None** (Minimal DDD monorepo) - No apps, no database, no auth. Pure DDD monorepo with only `packages/common/`

### 3. Package Identifier
- Must start with `@`
- Suggest based on project name initials (e.g., `@map` for `my-awesome-project`)
- Example: `@myproject` or `@mp`

### 4. Database Configuration
**Skip this section entirely if user selected "None" for components.**

Ask about database setup:
- **PostgreSQL port**: Default is 5432. Ask if they want a custom port (useful if 5432 is already in use)
- **Include Redis?**: Redis is optional. Ask if they need it (for caching, sessions, etc.)
- **Redis port**: Only if Redis is included. Default is 6379

### 5. SaaS Features
Ask if this is a SaaS project:
- **Yes** (default) - Includes user roles (admin/user), admin panel with users table, role-based route protection
- **No** - Simple app without roles or admin panel

### 6. Email Provider
Ask which email provider to use:
- **SendGrid** (default) — Uses nodemailer with SMTP transport. Requires `EMAIL_SERVER` env var.
- **Resend** — Uses Resend SDK with API key. Requires `RESEND_API_KEY` env var.

## Execution

Once you have all the information:

### Fullstack Mode (admin, mobile, or both)

#### Step 1: Run the initialization script

```bash
# Full SaaS with Redis (SendGrid by default)
bun run init -n <project-name> -i <identifier> --components <webapp,mobile|webapp|mobile> --postgres-port <port> --redis-port <port> --skip-git-check

# With Resend as email provider
bun run init -n <project-name> -i <identifier> --components <webapp,mobile|webapp|mobile> --postgres-port <port> --email-provider resend --skip-git-check

# Without Redis
bun run init -n <project-name> -i <identifier> --components <webapp,mobile|webapp|mobile> --postgres-port <port> --no-redis --skip-git-check

# Without SaaS features (no roles, no admin panel)
bun run init -n <project-name> -i <identifier> --components <webapp,mobile|webapp|mobile> --postgres-port <port> --no-saas --skip-git-check
```

#### Step 2: Install dependencies

```bash
bun install
```

#### Step 3: Start database services

```bash
bun run dbs
```

Wait for containers to be ready, then:

#### Step 4: Sync database schema

```bash
bun run db:sync
```

### Minimal Mode (none)

#### Step 1: Run the initialization script

```bash
bun run init -n <project-name> -i <identifier> --components none --skip-git-check
```

#### Step 2: Install dependencies

```bash
bun install
```

Steps 3 and 4 (database) are not needed in minimal mode.

## Post-Initialization

After successful initialization, show the user:

1. **Summary of changes made**
2. **Available commands** based on selected components:
   - If webapp included: `bun run webapp` - Start webapp at localhost:3000
   - If mobile included: `bun run mobile` - Start Expo development server
   - If not "none": `bun run dbs` - Start/restart database services
   - **If "none" selected**: Only code quality commands are available (lint, typecheck, format)

3. **Next steps**:
   - If components is "none":
     - Review the code structure in `packages/common/`
     - Update `docs/development/roadmap.md` with project goals
     - Create your first bounded context as a new package
     - Start developing!
   - Otherwise:
     - Review the code structure in `packages/` and `apps/`
     - Update `docs/development/roadmap.md` with project goals
     - Start developing!

## Error Handling

If any step fails:
1. Show the error clearly
2. Suggest common fixes
3. Reference the checklist.md for troubleshooting

### Common Issues

**Port already in use**: If a database port is occupied, the init script allows specifying custom ports. Re-run with `--postgres-port <port>` or `--redis-port <port>`.

**Container runtime not found**: Install Docker Desktop or Podman. The script auto-detects and configures the appropriate command. Not needed for minimal mode.

## Important Notes

- The script creates a backup before making changes
- Use `--dry-run` first if the user wants to preview changes
- All `@dfs` references will be replaced with the new identifier
- Database URLs and ports will be configured in `.env.local` (fullstack mode only)
- Container runtime (Docker/Podman) is auto-detected and configured (fullstack mode only)
- Redis is optional and can be excluded with `--no-redis`
- SaaS features (roles, admin panel) are optional and can be excluded with `--no-saas`
- Email provider defaults to SendGrid, use `--email-provider resend` for Resend
- Use `--components none` for a minimal DDD monorepo without apps, database, or auth
