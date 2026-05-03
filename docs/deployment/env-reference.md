# Environment Variables Reference

Complete reference for all environment variables used in the shared-spaces booking system.

---

## API Environment Variables

Location: `/etc/shared-spaces/api.env`

### Database

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | — | `file:./data/app.db` | SQLite database file path. Format: `file:./path/to/file.db` |

**Example:**
```bash
DATABASE_URL="file:./data/app.db"
```

**Notes:**
- Path is relative to `apps/api/` working directory
- The `data/` directory must exist (created during initial setup)
- The SQLite file is created automatically on first run / migration
- To use an absolute path: `DATABASE_URL="file:/opt/apps/shared-spaces-booking-system/apps/api/data/app.db"`

---

### Site Branding

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SITE_NAME` | ✓ | — | Full site name (shown in browser title, PWA manifest) |
| `SITE_SHORT_NAME` | — | First 12 chars of `SITE_NAME` | Short name for PWA home screen icon (max 12 chars) |
| `SITE_WEBAPP_URL` | ✓ | — | Full webapp URL including protocol (used for PWA icon URLs) |

**Example:**
```bash
SITE_NAME="My Coliving Space"
SITE_SHORT_NAME="My Coliving"
SITE_WEBAPP_URL="https://booking.your-domain.com"
```

**Notes:**
- `SITE_SHORT_NAME` is optional — if omitted, derived from first 12 chars of `SITE_NAME`
- `SITE_SHORT_NAME` must be ≤12 characters (PWA spec recommendation)
- `SITE_WEBAPP_URL` must match the actual domain (used for CORS and manifest icon URLs)
- Changing `SITE_NAME` requires users to **uninstall and reinstall the PWA** to see the new name on their home screen

---

### API Server

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | — | `4000` | Port the API server listens on (localhost only) |
| `NODE_ENV` | — | `development` | Environment mode (`production` or `development`) |

**Example:**
```bash
PORT=4000
NODE_ENV=production
```

**Notes:**
- API binds to `127.0.0.1` (localhost only) — nginx proxies external traffic
- Don't use port 80/443 (reserved for nginx)
- In production, always set `NODE_ENV=production` for performance optimizations

---

### Booking Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_BOOKING_TZ` | — | `Europe/Madrid` | Timezone for booking display and validation |

**Example:**
```bash
VITE_BOOKING_TZ="Europe/Madrid"
```

**Notes:**
- Must be a valid IANA timezone identifier (e.g., `America/New_York`, `Asia/Tokyo`)
- Affects how booking times are displayed and stored
- Changing this after bookings exist may cause confusion — set it correctly from the start

---

## Webapp Environment Variables

Location: `apps/webapp/.env.local` (development) or build-time injection (production)

### API Connection

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | ✓ | — | Full URL to the API server (used by tRPC client) |

**Example (development):**
```bash
VITE_API_URL="http://localhost:4000"
```

**Example (production):**
```bash
VITE_API_URL="https://booking.your-domain.com"
```

**Notes:**
- In production, this should be the **same origin** as the webapp to avoid CORS issues
- The manifest link is injected dynamically using this URL
- Must include protocol (`http://` or `https://`)

---

## Complete Production Example

`/etc/shared-spaces/api.env`:
```bash
# Database (SQLite file, relative to apps/api/)
DATABASE_URL="file:./data/app.db"

# Site Branding
SITE_NAME="My Coliving Space"
SITE_SHORT_NAME="My Coliving"
SITE_WEBAPP_URL="https://booking.your-domain.com"

# API
PORT=4000
NODE_ENV=production

# Booking
VITE_BOOKING_TZ="Europe/Madrid"
```

**Note:** The webapp's `VITE_API_URL` is set at build time. In production with nginx, it's the same as `SITE_WEBAPP_URL`.

---

## Security Best Practices

1. **Never commit `.env` files** to git (already in `.gitignore`)
2. **Restrict file permissions:**
   ```bash
   chmod 600 /etc/shared-spaces/api.env
   chown root:root /etc/shared-spaces/api.env
   ```
3. **Use strong database passwords** (20+ chars, mixed case, numbers, symbols)
4. **Rotate secrets regularly** (at least annually)
5. **Backup `.env` file** securely (encrypted, off-server)

---

## Changing Environment Variables

### For API variables (in `/etc/shared-spaces/api.env`):

1. Edit the file:
   ```bash
   nano /etc/shared-spaces/api.env
   ```

2. Restart the API service:
   ```bash
   systemctl restart shared-spaces-api
   ```

3. Verify:
   ```bash
   journalctl -u shared-spaces-api -n 20
   ```

### For webapp variables (build-time):

1. Edit `apps/webapp/.env.local` in the repository

2. Commit and push changes

3. Deploy following [deploy.md](./deploy.md) (rebuild required)

---

## Troubleshooting

### "DATABASE_URL is not defined"

**Symptom:** API fails to start with error about missing `DATABASE_URL`

**Fix:**
1. Check file exists: `ls -la /etc/shared-spaces/api.env`
2. Check systemd service references it: `systemctl cat shared-spaces-api | grep EnvironmentFile`
3. Check file has correct variable: `grep DATABASE_URL /etc/shared-spaces/api.env`
4. If missing, add: `DATABASE_URL="file:./data/app.db"`

### "SITE_WEBAPP_URL is not a valid URL"

**Symptom:** API fails to start with Zod validation error

**Fix:**
1. Ensure URL includes protocol: `https://booking.your-domain.com` (not `booking.your-domain.com`)
2. No trailing slash: `https://booking.your-domain.com` (not `https://booking.your-domain.com/`)

### "Connection refused" from webapp to API

**Symptom:** Webapp loads but API calls fail with network errors

**Fix:**
1. Check `VITE_API_URL` matches the actual domain
2. In production, should be same origin as webapp (e.g., both `https://booking.your-domain.com`)
3. Rebuild webapp after changing: `bun run build`

---

## Adding New Environment Variables

When adding new variables to the codebase:

1. **Update this reference** with description and example
2. **Update `apps/api/src/env.ts`** with Zod schema validation
3. **Update `initial-setup.md`** with the new variable in the example `.env`
4. **Document in code** why the variable exists (comment in `env.ts`)
5. **Add to deployment checklist** if it's required

---

## See Also

- [initial-setup.md](./initial-setup.md) — Creating the initial `.env` file
- [deploy.md](./deploy.md) — Deployment process
- [runbook.md](./runbook.md) — Troubleshooting environment issues
