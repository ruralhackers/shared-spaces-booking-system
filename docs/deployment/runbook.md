# Runbook — Troubleshooting & Operations

Common issues, symptoms, and fixes for the shared-spaces booking system in production.

---

## Quick Diagnostics

Run these commands first when something is wrong:

```bash
# Check service status
systemctl status shared-spaces-api

# Check recent logs
journalctl -u shared-spaces-api -n 50 --no-pager

# Check if API responds
curl http://127.0.0.1:4000/api/trpc/config.siteInfo

# Check nginx status
systemctl status nginx

# Check disk space
df -h /

# Check memory
free -h

# Check database
ls -la /opt/apps/shared-spaces-booking-system/apps/api/data/pglite/
```

---

## Service Issues

### Service Fails to Start

**Symptom:**
```bash
systemctl status shared-spaces-api
# Shows: failed (Result: exit-code)
```

**Diagnosis:**
```bash
journalctl -u shared-spaces-api -n 100 --no-pager
```

**Common causes:**

#### 1. Database file error

**Log shows:** `Error: SQLITE_CANTOPEN` or `no such table`

**Fix:**
```bash
# Check PGlite directory exists
ls -la /opt/apps/shared-spaces-booking-system/apps/api/data/pglite/

# If missing, create data directory and run migrations
mkdir -p /opt/apps/shared-spaces-booking-system/apps/api/data
cd /opt/apps/shared-spaces-booking-system
bun run -F @dfs/database db:sync
```

#### 2. Environment file missing or invalid

**Log shows:** `DATABASE_URL is not defined` or `Zod validation error`

**Fix:**
```bash
# Check file exists
ls -la /etc/shared-spaces/api.env

# Check systemd references it
systemctl cat shared-spaces-api | grep EnvironmentFile

# Verify variables
cat /etc/shared-spaces/api.env

# Fix permissions if needed
chmod 600 /etc/shared-spaces/api.env
chown root:root /etc/shared-spaces/api.env
```

See [env-reference.md](./env-reference.md) for correct format.

#### 3. Port already in use

**Log shows:** `Error: listen EADDRINUSE: address already in use :::4000`

**Fix:**
```bash
# Find what's using port 4000
ss -tlnp | grep :4000

# Kill the process (replace <PID> with actual PID)
kill <PID>

# Or change PORT in /etc/shared-spaces/api.env
nano /etc/shared-spaces/api.env
# Change PORT=4000 to PORT=4001
# Update nginx config to proxy to new port
```

#### 4. Bun not found

**Log shows:** `Failed to execute command: No such file or directory`

**Fix:**
```bash
# Check Bun is installed
which bun
bun --version

# If not found, install it (see initial-setup.md Step 1)

# Update systemd service with correct Bun path
systemctl cat shared-spaces-api | grep ExecStart
# Should be: ExecStart=/root/.bun/bin/bun run src/index.ts

# If wrong, edit service file
nano /etc/systemd/system/shared-spaces-api.service
# Fix ExecStart path
systemctl daemon-reload
systemctl restart shared-spaces-api
```

---

### Service Crashes After Starting

**Symptom:** Service starts but crashes within seconds/minutes

**Diagnosis:**
```bash
# Watch logs in real-time
journalctl -u shared-spaces-api -f

# Check for out-of-memory
dmesg | grep -i "out of memory"

# Check resource limits
systemctl show shared-spaces-api | grep -E "(Memory|CPU)"
```

**Common causes:**

#### 1. Out of memory

**Fix:**
```bash
# Increase memory limit in systemd service
nano /etc/systemd/system/shared-spaces-api.service
# Change: MemoryMax=512M to MemoryMax=1G

systemctl daemon-reload
systemctl restart shared-spaces-api
```

#### 2. Unhandled exception in code

**Log shows:** Stack trace with `Error:` or `Uncaught exception`

**Fix:**
1. Note the error message and stack trace
2. Check if it's a known issue in the repository
3. Rollback to previous working version (see [deploy.md](./deploy.md#rollback-procedure))
4. Report the issue with logs

---

## API Issues

### API Returns 502 Bad Gateway

**Symptom:** Webapp loads but shows "Failed to fetch" errors, nginx returns 502

**Diagnosis:**
```bash
# Check if API service is running
systemctl status shared-spaces-api

# Check if API responds locally
curl http://127.0.0.1:4000/api/trpc/config.siteInfo

# Check nginx error log
tail -n 50 /var/log/nginx/error.log
```

**Common causes:**

#### 1. API service is down

**Fix:**
```bash
systemctl start shared-spaces-api
```

#### 2. API is running but not responding

**Fix:**
```bash
# Restart the service
systemctl restart shared-spaces-api

# If still fails, check logs
journalctl -u shared-spaces-api -n 100
```

#### 3. Nginx proxy misconfigured

**Fix:**
```bash
# Check nginx config
nginx -t

# Check proxy_pass points to correct port
grep -A 5 "location /api/" /etc/nginx/sites-available/booking.your-domain.com

# Should be: proxy_pass http://127.0.0.1:4000;
# If wrong, edit and reload
nano /etc/nginx/sites-available/booking.your-domain.com
nginx -t && systemctl reload nginx
```

---

### API Returns 500 Internal Server Error

**Symptom:** API responds but returns 500 errors

**Diagnosis:**
```bash
# Check API logs for errors
journalctl -u shared-spaces-api -n 100 | grep -i error

# Test specific endpoint
curl -v http://127.0.0.1:4000/api/trpc/config.siteInfo
```

**Common causes:**

#### 1. Database query error

**Log shows:** `PrismaClientKnownRequestError` or SQL syntax error

**Fix:**
```bash
# Check database file exists and is not corrupted
ls -la /opt/apps/shared-spaces-booking-system/apps/api/data/pglite/

# Run migrations if schema is out of sync
cd /opt/apps/shared-spaces-booking-system
bun run -F @dfs/database db:sync

# Restart API
systemctl restart shared-spaces-api
```

#### 2. Missing environment variable

**Log shows:** `undefined is not a function` or `Cannot read property of undefined`

**Fix:**
```bash
# Check all required variables are set
cat /etc/shared-spaces/api.env

# Compare with env-reference.md
# Add missing variables, then restart
systemctl restart shared-spaces-api
```

---

## Webapp Issues

### Webapp Shows Blank Page

**Symptom:** Browser shows white screen, no content

**Diagnosis:**
```bash
# Check if dist/ exists and has content
ls -la /opt/apps/shared-spaces-booking-system/apps/webapp/dist/

# Check nginx serves the file
curl -I https://booking.your-domain.com

# Check browser console (F12) for errors
```

**Common causes:**

#### 1. Build failed or incomplete

**Fix:**
```bash
cd /opt/apps/shared-spaces-booking-system
bun run build

# Verify dist/ was created
ls -la apps/webapp/dist/index.html

# Reload nginx
systemctl reload nginx
```

#### 2. Nginx root path wrong

**Fix:**
```bash
# Check nginx config
grep "root" /etc/nginx/sites-available/booking.your-domain.com

# Should be: root /opt/apps/shared-spaces-booking-system/apps/webapp/dist;
# If wrong, fix and reload
nano /etc/nginx/sites-available/booking.your-domain.com
nginx -t && systemctl reload nginx
```

#### 3. JavaScript error on load

**Browser console shows:** `Uncaught SyntaxError` or `Failed to load module`

**Fix:**
1. Clear browser cache (Ctrl+Shift+R)
2. Check if `VITE_API_URL` was set correctly during build
3. Rebuild webapp:
   ```bash
   cd /opt/apps/shared-spaces-booking-system
   bun run build
   systemctl reload nginx
   ```

---

### Webapp Loads But API Calls Fail

**Symptom:** Webapp loads, but shows "Failed to fetch" or "Network error"

**Diagnosis:**
```bash
# Check browser console (F12) Network tab
# Look for failed requests to /api/trpc/*

# Check if API is accessible from browser's perspective
curl https://booking.your-domain.com/api/trpc/config.siteInfo
```

**Common causes:**

#### 1. CORS error

**Browser console shows:** `CORS policy: No 'Access-Control-Allow-Origin' header`

**Fix:**
```bash
# Check nginx proxy headers
grep -A 10 "location /api/" /etc/nginx/sites-available/booking.your-domain.com

# Should have:
# proxy_set_header Host $host;
# proxy_set_header X-Forwarded-Proto $scheme;

# If missing, add them and reload
nano /etc/nginx/sites-available/booking.your-domain.com
nginx -t && systemctl reload nginx
```

#### 2. API URL mismatch

**Fix:**
```bash
# Check what URL the webapp is using
# In browser console: localStorage.getItem('VITE_API_URL')

# Should match the domain (same origin)
# If wrong, rebuild with correct VITE_API_URL
cd /opt/apps/shared-spaces-booking-system
# Set VITE_API_URL in build environment or .env.local
bun run build
systemctl reload nginx
```

---

## Database Issues

### Database File Issues

**Symptom:** API logs show `SQLITE_CANTOPEN` or `no such table`

**Diagnosis:**
```bash
# Check PGlite directory exists
ls -la /opt/apps/shared-spaces-booking-system/apps/api/data/pglite/

# Check DATABASE_URL in env
grep DATABASE_URL /etc/shared-spaces/api.env
```

**Fix:**
```bash
# Create data directory if missing
mkdir -p /opt/apps/shared-spaces-booking-system/apps/api/data

# Run migrations to create/update schema
cd /opt/apps/shared-spaces-booking-system
bun run -F @dfs/database db:sync

# Restart API
systemctl restart shared-spaces-api
```

---

### Migration Failures

**Symptom:** `bun run -F @dfs/database db:sync` fails with error

**Common causes:**

#### 1. Schema drift (manual changes to database)

**Error:** `The database schema is not in sync with the Prisma schema`

**Fix:**
```bash
# Reset database (WARNING: deletes all data)
cd /opt/apps/shared-spaces-booking-system
bun run -F @dfs/database db:reset

# Or manually fix schema to match Prisma
# Compare: packages/database/prisma/schema.prisma
# With: actual database schema
```

#### 2. Migration conflict

**Error:** `Migration X conflicts with migration Y`

**Fix:**
```bash
# Check migration history
cd /opt/apps/shared-spaces-booking-system/packages/database
ls -la prisma/migrations/

# Resolve conflict (usually requires manual intervention)
# See Prisma docs: https://www.prisma.io/docs/guides/database/developing-with-prisma-migrate
```

---

## SSL/Certificate Issues

### Certificate Expired

**Symptom:** Browser shows "Your connection is not private" or "NET::ERR_CERT_DATE_INVALID"

**Diagnosis:**
```bash
# Check certificate expiry
openssl x509 -in /etc/letsencrypt/live/booking.your-domain.com/fullchain.pem -noout -dates

# Check certbot timer
systemctl status certbot.timer
```

**Fix:**
```bash
# Manually renew certificate
certbot renew

# If renewal fails, check logs
journalctl -u certbot -n 50

# Force renewal
certbot renew --force-renewal

# Reload nginx
systemctl reload nginx
```

---

### Certificate Renewal Fails

**Symptom:** `certbot renew` fails with error

**Common causes:**

#### 1. Port 80 not accessible

**Error:** `Failed authorization procedure`

**Fix:**
```bash
# Check firewall allows port 80
ufw status | grep 80

# Check nginx is listening on port 80
ss -tlnp | grep :80

# Temporarily stop nginx if needed
systemctl stop nginx
certbot renew
systemctl start nginx
```

#### 2. DNS not pointing to server

**Fix:**
```bash
# Check DNS resolution
dig booking.your-domain.com +short

# Should return your VPS IP
# If not, update DNS records and wait for propagation
```

---

## Performance Issues

### High Memory Usage

**Symptom:** `free -h` shows low available memory

**Diagnosis:**
```bash
# Check what's using memory
ps aux --sort=-%mem | head -10

# Check service memory usage
systemctl status shared-spaces-api | grep Memory
```

**Fix:**
```bash
# Restart API service to free memory
systemctl restart shared-spaces-api

# Or increase VPS RAM (upgrade plan)
```

---

### Slow Response Times

**Symptom:** Webapp feels sluggish, API calls take >1s

**Diagnosis:**
```bash
# Check CPU usage
top -bn1 | head -20

# Check database file size
ls -lh /opt/apps/shared-spaces-booking-system/apps/api/data/pglite/

# Check nginx access log for slow requests
tail -f /var/log/nginx/access.log
```

**Fix:**
```bash
# Add database indexes (if missing)
# Check packages/database/prisma/schema.prisma for @@index directives

# Restart service
systemctl restart shared-spaces-api

# Consider enabling nginx caching for static assets (already configured)
```

---

## Deployment Issues

### Merge Conflicts During Pull

**Symptom:** `git pull` fails with merge conflict

**Fix:**
```bash
cd /opt/apps/shared-spaces-booking-system

# Check which files have conflicts
git status

# If conflicts are in generated files (e.g., bun.lockb), prefer remote
git checkout --theirs bun.lockb
git add bun.lockb

# If conflicts are in source files, manually resolve
nano <conflicted-file>
# Remove conflict markers (<<<<, ====, >>>>)
git add <conflicted-file>

# Complete merge
git commit -m "Merge remote changes"

# Continue deployment
bun install --production
bun run build
systemctl restart shared-spaces-api
```

---

### Build Failures

**Symptom:** `bun run build` fails with error

**Common causes:**

#### 1. TypeScript errors

**Error:** `TS2322: Type 'X' is not assignable to type 'Y'`

**Fix:**
```bash
# Check typecheck
bun run typecheck

# If errors, rollback to last working commit
git log --oneline -5
git checkout <last-working-commit>
bun install --production
bun run build
```

#### 2. Out of disk space

**Error:** `ENOSPC: no space left on device`

**Fix:**
```bash
# Check disk usage
df -h /

# Clean up old logs
journalctl --vacuum-time=7d

# Clean up old node_modules
cd /opt/apps/shared-spaces-booking-system
rm -rf node_modules
bun install --production

# Clean up old builds
rm -rf apps/webapp/dist
bun run build
```

---

## Backup & Restore

### Create Database Backup

```bash
# Create backup directory
mkdir -p /root/backups

# Copy PGlite database directory
cp -r /opt/apps/shared-spaces-booking-system/apps/api/data/pglite /root/backups/shared-spaces-$(date +%Y%m%d-%H%M%S)-pglite

# Verify backup
ls -lh /root/backups/
```

### Restore Database from Backup

```bash
# Stop API service
systemctl stop shared-spaces-api

# Replace database file with backup (replace YYYYMMDD-HHMMSS with actual timestamp)
cp -r /root/backups/shared-spaces-YYYYMMDD-HHMMSS-pglite /opt/apps/shared-spaces-booking-system/apps/api/data/pglite

# Start API service
systemctl start shared-spaces-api
```

---

## Monitoring

### Set Up Log Rotation

```bash
# Create logrotate config
cat > /etc/logrotate.d/shared-spaces << 'EOF'
/var/log/nginx/access.log /var/log/nginx/error.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        systemctl reload nginx > /dev/null
    endscript
}
EOF

# Test logrotate
logrotate -d /etc/logrotate.d/shared-spaces
```

### Set Up Automated Backups

```bash
# Create backup script
cat > /root/backup-shared-spaces.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/root/backups"
DB_PATH="/opt/apps/shared-spaces-booking-system/apps/api/data/pglite"
DATE=$(date +%Y%m%d-%H%M%S)
mkdir -p $BACKUP_DIR
cp $DB_PATH $BACKUP_DIR/shared-spaces-$DATE.db
gzip $BACKUP_DIR/shared-spaces-$DATE.db
find $BACKUP_DIR -name "shared-spaces-*.db.gz" -mtime +30 -delete
EOF

chmod +x /root/backup-shared-spaces.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /root/backup-shared-spaces.sh") | crontab -
```

---

## Emergency Contacts

When all else fails:

1. **Check repository issues:** https://github.com/YOUR_USERNAME/shared-spaces-booking-system/issues
2. **Review recent commits:** `git log --oneline -20`
3. **Rollback to last known good state:** See [deploy.md](./deploy.md#rollback-procedure)
4. **Contact maintainer:** [Add contact info here]

---

## See Also

- [deploy.md](./deploy.md) — Normal deployment process
- [initial-setup.md](./initial-setup.md) — Initial VPS setup
- [env-reference.md](./env-reference.md) — Environment variables
