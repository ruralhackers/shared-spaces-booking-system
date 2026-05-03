# Deployment Guide — Recurring Updates

**This guide is for recurring deployments** after initial setup is complete.

**AI agents should follow this guide** when deploying updates to production.

---

## Pre-requisites

- Initial setup completed ([initial-setup.md](./initial-setup.md))
- SSH access to VPS: `ssh root@your-vps-ip`
- Changes committed and pushed to `main` branch

---

## Deployment Process

### Step 1: Connect to VPS

```bash
ssh root@your-vps-ip
```

**Verify connection:**
```bash
hostname
```

**Expected output:** `your-vps-hostname` (or similar)

---

### Step 2: Navigate to Application Directory

```bash
cd /opt/apps/shared-spaces-booking-system
```

**Verify location:**
```bash
pwd
```

**Expected output:** `/opt/apps/shared-spaces-booking-system`

---

### Step 3: Check Current State

```bash
# Check current branch and commit
git branch
git log --oneline -1

# Check service status
systemctl status shared-spaces-api --no-pager
```

**Expected output:**
- Branch: `* main`
- Service: `active (running)` in green

**If service is not running**, check [runbook.md](./runbook.md) before proceeding.

---

### Step 4: Pull Latest Changes

```bash
# Fetch latest changes
git fetch origin

# Show what will be pulled
git log HEAD..origin/main --oneline

# Pull changes
git pull origin main
```

**Expected output:**
- List of commits being pulled
- `Already up to date` (if no changes) or `Updating <hash>..<hash>`

**If there are merge conflicts**, see [runbook.md](./runbook.md#merge-conflicts).

---

### Step 5: Install Dependencies

```bash
# Install/update dependencies (production only)
bun install --production
```

**Expected output:**
- `bun install` completes without errors
- May show packages added/removed/updated

**If installation fails**, check [runbook.md](./runbook.md#dependency-installation-fails).

---

### Step 6: Run Database Migrations

```bash
# Apply any new migrations
bun run -F @dfs/database db:sync
```

**Expected output:**
- `Prisma schema loaded from prisma/schema.prisma`
- `Datasource "db": SQLite database`
- `The database is already in sync with the Prisma schema.` (if no changes)
- Or schema changes applied to `apps/api/data/app.db`

**If migrations fail**, see [runbook.md](./runbook.md#migration-failures).

---

### Step 7: Build Webapp

```bash
# Build webapp static files
bun run build
```

**Expected output:**
- `webapp build` completes successfully
- `dist/` directory updated with new build

**Verify build:**
```bash
ls -la apps/webapp/dist/index.html
stat -c %y apps/webapp/dist/index.html
```

The timestamp should be recent (within the last minute).

**If build fails**, see [runbook.md](./runbook.md#build-failures).

---

### Step 8: Restart API Service

```bash
# Restart the API service
systemctl restart shared-spaces-api

# Wait 2 seconds for startup
sleep 2

# Check status
systemctl status shared-spaces-api --no-pager
```

**Expected output:**
- `active (running)` in green
- Recent log entries showing startup

**Check logs for errors:**
```bash
journalctl -u shared-spaces-api -n 50 --no-pager
```

**If service fails to start**, see [runbook.md](./runbook.md#service-fails-to-start).

---

### Step 9: Reload Nginx

```bash
# Test nginx configuration
nginx -t

# Reload nginx (picks up new static files)
systemctl reload nginx
```

**Expected output:**
- `nginx: configuration file /etc/nginx/nginx.conf test is successful`
- `nginx.service` reloaded

**If nginx test fails**, see [runbook.md](./runbook.md#nginx-configuration-errors).

---

### Step 10: Verify Deployment

Run these checks to ensure everything is working:

```bash
# 1. Check API health
curl -f http://127.0.0.1:4000/api/trpc/config.siteInfo || echo "API FAILED"

# 2. Check webapp is accessible
curl -f -I https://booking.your-domain.com || echo "WEBAPP FAILED"

# 3. Check manifest endpoint
curl -f https://booking.your-domain.com/manifest.webmanifest || echo "MANIFEST FAILED"

# 4. Check service is running
systemctl is-active shared-spaces-api || echo "SERVICE NOT RUNNING"
```

**Expected output:**
- API: JSON response with site info
- Webapp: `HTTP/2 200`
- Manifest: JSON with PWA metadata
- Service: `active`

**If any check fails**, see [runbook.md](./runbook.md) for troubleshooting.

---

### Step 11: Smoke Test from Browser

From your local machine:

1. **Visit the webapp:** `https://booking.your-domain.com`
   - Should load without errors
   - Check browser console (F12) — no red errors

2. **Test a booking flow:**
   - Navigate to spaces list
   - Try to create a booking
   - Verify it appears in the list

3. **Check PWA install:**
   - On mobile: install prompt should appear (Android) or "Add to Home Screen" available (iOS)
   - Verify favicon shows in browser tab

**If smoke test fails**, check [runbook.md](./runbook.md) for symptoms.

---

## Deployment Checklist

- [ ] Connected to VPS
- [ ] Navigated to `/opt/apps/shared-spaces-booking-system`
- [ ] Checked current state (branch, service status)
- [ ] Pulled latest changes from `main`
- [ ] Installed dependencies (`bun install --production`)
- [ ] Ran migrations (`bun run -F @dfs/database db:sync`)
- [ ] Built webapp (`bun run build`)
- [ ] Restarted API service (`systemctl restart shared-spaces-api`)
- [ ] Reloaded nginx (`systemctl reload nginx`)
- [ ] Verified API responds: `curl http://127.0.0.1:4000/api/trpc/config.siteInfo`
- [ ] Verified webapp loads: `https://booking.your-domain.com`
- [ ] Verified manifest: `https://booking.your-domain.com/manifest.webmanifest`
- [ ] Smoke tested from browser (no console errors, booking flow works)

---

## Quick Deploy Script

For convenience, you can save this as `/root/deploy-shared-spaces.sh`:

```bash
#!/bin/bash
set -e

echo "=== Deploying Shared Spaces Booking System ==="

cd /opt/apps/shared-spaces-booking-system

echo "→ Pulling latest changes..."
git pull origin main

echo "→ Installing dependencies..."
bun install --production

echo "→ Running migrations..."
bun run -F @dfs/database db:sync

echo "→ Building webapp..."
bun run build

echo "→ Restarting API service..."
systemctl restart shared-spaces-api
sleep 2

echo "→ Reloading nginx..."
nginx -t && systemctl reload nginx

echo "→ Verifying deployment..."
curl -f http://127.0.0.1:4000/api/trpc/config.siteInfo > /dev/null && echo "✓ API OK" || echo "✗ API FAILED"
curl -f -I https://booking.your-domain.com > /dev/null && echo "✓ Webapp OK" || echo "✗ Webapp FAILED"
systemctl is-active shared-spaces-api > /dev/null && echo "✓ Service OK" || echo "✗ Service FAILED"

echo "=== Deployment complete ==="
echo "Check logs: journalctl -u shared-spaces-api -f"
```

Make it executable:
```bash
chmod +x /root/deploy-shared-spaces.sh
```

Then deploy with:
```bash
/root/deploy-shared-spaces.sh
```

---

## Rollback Procedure

If the deployment breaks the application:

### Quick Rollback (last working commit)

```bash
cd /opt/apps/shared-spaces-booking-system

# Find last working commit
git log --oneline -10

# Checkout previous commit (replace <hash> with actual commit)
git checkout <hash>

# Reinstall dependencies
bun install --production

# Rebuild
bun run build

# Restart
systemctl restart shared-spaces-api
systemctl reload nginx

# Verify
curl -f http://127.0.0.1:4000/api/trpc/config.siteInfo
```

### Return to main branch after rollback

Once the issue is fixed in the codebase:

```bash
cd /opt/apps/shared-spaces-booking-system
git checkout main
git pull origin main
# ... follow normal deployment steps
```

---

## Post-Deployment

### Monitor Logs

```bash
# Follow API logs in real-time
journalctl -u shared-spaces-api -f

# Check nginx access logs
tail -f /var/log/nginx/access.log

# Check nginx error logs
tail -f /var/log/nginx/error.log
```

Press Ctrl+C to exit.

### Check Resource Usage

```bash
# Memory usage
free -h

# Disk usage
df -h /

# Service resource usage
systemctl status shared-spaces-api
```

### Database Backup (recommended after major changes)

```bash
# Create backup directory
mkdir -p /root/backups

# Copy SQLite database file
cp /opt/apps/shared-spaces-booking-system/apps/api/data/app.db /root/backups/shared-spaces-$(date +%Y%m%d-%H%M%S).db

# Verify backup
ls -lh /root/backups/
```

---

## Common Issues

See [runbook.md](./runbook.md) for detailed troubleshooting:

- Service fails to start
- API returns 502 Bad Gateway
- Webapp shows blank page
- Database connection errors
- Build failures
- Migration failures

---

## Notes for AI Agents

When executing this deployment guide:

1. **Always verify each step** — check expected output matches actual output
2. **Stop on first error** — don't proceed if a step fails
3. **Check logs immediately** if service fails: `journalctl -u shared-spaces-api -n 50`
4. **Report failures clearly** — include error messages and context
5. **Don't skip verification** — Step 10 is mandatory
6. **Use the quick script** only if all manual steps have succeeded at least once

**Critical checkpoints:**
- After Step 4: Confirm new commits were pulled
- After Step 7: Confirm `dist/index.html` timestamp is recent
- After Step 8: Confirm service is `active (running)`
- After Step 10: All 4 curl checks must succeed

If any checkpoint fails, **stop and consult runbook.md** before proceeding.
