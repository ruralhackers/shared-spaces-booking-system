# PGlite Migration Guide

This guide covers migrating the production deployment from SQLite to PGlite (embedded PostgreSQL).

## What Changed

- **Database engine**: SQLite → PGlite (embedded PostgreSQL via WASM)
- **DATABASE_URL format**: `file:./data/app.db` → `pglite:./data/pglite`
- **Database location**: Single file (`app.db`) → Directory (`data/pglite/`)
- **Backup strategy**: `cp app.db` → `cp -r data/pglite/`
- **Schema initialization**: `bun run -F @dfs/database db:sync` → `bun run packages/database/src/init-schema.ts`

## Why PGlite?

- Full PostgreSQL compatibility (real JSONB, real enum types, standard SQL)
- Same operational simplicity as SQLite (no separate server, no Docker)
- Better alignment with PostgreSQL-first conventions
- Easier path to managed PostgreSQL (Neon, Supabase) if needed later

## Migration Steps

### 1. Backup Current Data

```bash
ssh root@jamardo.xyz

# Backup SQLite database
cp /opt/apps/shared-spaces-booking-system/apps/api/data/app.db \
   /root/backups/app.db.$(date +%Y%m%d-%H%M%S)

# Verify backup
ls -lh /root/backups/app.db.*
```

### 2. Update Environment Variable

```bash
# Edit environment file
nano /etc/shared-spaces/api.env

# Change this line:
DATABASE_URL="file:./data/app.db"

# To this:
DATABASE_URL="pglite:./data/pglite"

# Save and exit (Ctrl+X, Y, Enter)
```

### 3. Deploy New Code

```bash
cd /opt/apps/shared-spaces-booking-system

# Pull latest changes (includes PGlite migration)
git pull origin main

# Install new dependencies (@electric-sql/pglite, pglite-prisma-adapter)
bun install

# Remove old SQLite files
rm -rf apps/api/data/app.db*

# Initialize PGlite schema
bun run packages/database/src/init-schema.ts

# Build webapp
cd apps/webapp
VITE_API_URL=https://salas.espacioarroelo.es bun run build
cd ../..

# Restart API
systemctl restart shared-spaces-api

# Check logs
journalctl -u shared-spaces-api -n 50 --no-pager
```

### 4. Verify Deployment

```bash
# Check PGlite directory exists
ls -la /opt/apps/shared-spaces-booking-system/apps/api/data/pglite/

# Check API is running
curl http://127.0.0.1:4000/api/trpc/config.siteInfo

# Check webapp
curl -I https://salas.espacioarroelo.es

# Check service status
systemctl status shared-spaces-api
```

### 5. Test Functionality

1. Open https://salas.espacioarroelo.es
2. Verify spaces are visible (will be empty — need to recreate via admin)
3. Create a test booking
4. Reload page → booking should persist
5. Cancel booking → should succeed

### 6. Recreate Spaces (Admin)

Since this is a fresh database, you'll need to recreate the spaces via the admin panel:

1. Go to https://salas.espacioarroelo.es/admin?key=YOUR_ADMIN_KEY
2. Create each space with:
   - Slug (e.g., `sala-1`)
   - Display name (e.g., `Sala 1`)
   - Description
   - Open hours (JSON)
   - Color (optional)

## Rollback (If Needed)

If something goes wrong, you can rollback to SQLite:

```bash
# Revert DATABASE_URL
nano /etc/shared-spaces/api.env
# Change back to: DATABASE_URL="file:./data/app.db"

# Restore SQLite database
cp /root/backups/app.db.YYYYMMDD-HHMMSS \
   /opt/apps/shared-spaces-booking-system/apps/api/data/app.db

# Revert code
cd /opt/apps/shared-spaces-booking-system
git checkout <previous-commit-sha>
bun install

# Restart
systemctl restart shared-spaces-api
```

## New Backup Strategy

With PGlite, backups are directory-based:

```bash
# Backup (copy entire directory)
cp -r /opt/apps/shared-spaces-booking-system/apps/api/data/pglite \
      /root/backups/pglite-$(date +%Y%m%d-%H%M%S)

# Restore (copy directory back)
cp -r /root/backups/pglite-YYYYMMDD-HHMMSS \
      /opt/apps/shared-spaces-booking-system/apps/api/data/pglite

systemctl restart shared-spaces-api
```

## Troubleshooting

### "Cannot find module '@electric-sql/pglite'"

```bash
cd /opt/apps/shared-spaces-booking-system
bun install
```

### "Schema initialization failed"

Check that `DATABASE_URL` is set correctly:

```bash
grep DATABASE_URL /etc/shared-spaces/api.env
# Should show: DATABASE_URL="pglite:./data/pglite"
```

### API fails to start

Check logs:

```bash
journalctl -u shared-spaces-api -n 100 --no-pager
```

Common issues:
- `DATABASE_URL` format incorrect
- PGlite directory doesn't exist → run `init-schema.ts`
- Permissions issue → check `apps/api/data/` is writable

### Empty spaces list

This is expected — PGlite starts with a fresh database. Recreate spaces via admin panel.

## Notes

- **Data is NOT migrated** — this is a fresh start with PGlite
- The old `app.db` backup is kept in `/root/backups/` for reference
- Future deploys use the updated `/root/deploy-shared-spaces.sh` script (already updated)
- PGlite uses ~same RAM as SQLite (~80 MB for the API process)
