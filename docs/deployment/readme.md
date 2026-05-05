# Deployment Documentation

This directory contains deployment guides for the shared-spaces booking system.

## Overview

The application is deployed on a VPS (your-domain.com) with a minimal stack optimized for low resource usage:

```
┌─────────────────────────────────────────────────────────┐
│                    DEPLOYMENT STACK                     │
└─────────────────────────────────────────────────────────┘

      Internet (subdomain.your-domain.com)
            │
            │ :443 (TLS via Let's Encrypt)
            ▼
      ┌──────────────┐
      │    Nginx     │  ← reverse proxy + HTTPS
      │  (apt pkg)   │     serves webapp static files
      └──────┬───────┘     proxies /api/* → :4000
             │
       ┌─────┴──────┐
       │            │
       ▼            ▼
  webapp/dist   apps/api (Bun)
  (static)      systemd unit
                :4000 localhost
                    │
                    ▼
              ┌──────────────┐
              │   PGlite    │  ← pglite:./data/pglite
              │  (embedded)  │     zero config, zero RAM
              └──────────────┘
```

## Stack Components

| Component | Technology | Why |
|-----------|-----------|-----|
| Runtime | Bun (native) | No Docker overhead, ~80MB RAM |
| Database | PGlite (embedded PostgreSQL) | Zero config, zero extra processes, directory-based |
| Reverse Proxy | Nginx | Already installed, SSL via certbot |
| Webapp | Static files | Served by Nginx, 0 extra processes |
| API | systemd unit | Auto-restart, logs via journalctl |
| Secrets | `/etc/shared-spaces/api.env` | Outside repo, chmod 600 |

**Estimated resource usage (idle):**
- Nginx: ~15 MB RAM
- Bun API (includes PGlite): ~80 MB RAM
- **Total**: ~100 MB RAM, <1% CPU

## Documentation Structure

- **[initial-setup.md](./initial-setup.md)** — One-time VPS provisioning (install Bun, configure nginx, etc.)
- **[deploy.md](./deploy.md)** — Recurring deployment process (git pull, build, restart) — **AI agents read this**
- **[runbook.md](./runbook.md)** — Troubleshooting and common operations
- **[env-reference.md](./env-reference.md)** — Environment variables reference
- **[pwa-installation.md](./pwa-installation.md)** — PWA installation guide for end users (Android, iOS, desktop)

## Quick Start

**First time setup:**
1. Read and execute [initial-setup.md](./initial-setup.md) once
2. Configure your subdomain DNS to point to the VPS
3. Run the first deployment following [deploy.md](./deploy.md)

**Subsequent deployments:**
1. Follow [deploy.md](./deploy.md)

**When something breaks:**
1. Check [runbook.md](./runbook.md) for symptoms and fixes

## Key Decisions
### Why PGlite instead of PostgreSQL?

The app uses Prisma with PGlite (`pglite:./data/pglite`). For a low-traffic coliving booking system (~2 visits/hour), PGlite is ideal: zero config, zero extra processes, zero extra RAM, full PostgreSQL compatibility. The database is a directory that can be backed up with `cp -r`.

### Why Nginx instead of Caddy?
Nginx is already installed and configured with Let's Encrypt certificates. Reusing it avoids installing another tool.

### Why Bun native instead of Docker?
No overhead. Bun binary runs directly, managed by systemd. Docker would add ~70MB RAM for the daemon alone.

### Why systemd instead of PM2/forever?
systemd is already on the system, provides logging (journalctl), auto-restart, and resource limits without extra dependencies.

### Why static webapp instead of serving via Bun?
Nginx serves static files faster and with better caching than any Node/Bun process. The webapp is a SPA that only needs the API at runtime.

## Security Notes

- PGlite directory stored in `/opt/apps/shared-spaces-booking-system/apps/api/data/pglite/` (not web-accessible)
- API binds to `127.0.0.1:4000` (not `0.0.0.0`)
- Secrets in `/etc/shared-spaces/api.env` with `chmod 600 root:root`
- Nginx handles TLS termination (Let's Encrypt)
- Firewall (ufw) active with fail2ban for SSH

## Branch Strategy

- **main** branch is deployed to production
- No staging environment (low traffic, manual testing before push)
- Deploy process: `git pull origin main` on the VPS

## Rollback Strategy

If a deployment breaks:
1. `cd /opt/apps/shared-spaces-booking-system`
2. `git log --oneline -5` — identify last working commit
3. `git checkout <commit-hash>`
4. `bun install --production`
5. `bun run build`
6. `systemctl restart shared-spaces-api`

See [runbook.md](./runbook.md) for detailed rollback procedures.
