# Initial Setup — One-Time VPS Provisioning

**Run this guide once** to prepare the VPS for the shared-spaces booking system.

**Target VPS:** root@your-vps-ip (Ubuntu 24.04 LTS, 4GB RAM, 2 CPU)

---

## Pre-requisites

- SSH access as root: `ssh root@your-vps-ip`
- Subdomain DNS record pointing to VPS IP (e.g., `booking.your-domain.com`)
- Nginx already installed and running (✓ confirmed)
- Git already installed (✓ confirmed)

---

## Step 1: Install Bun

Bun is the runtime for the API server.

```bash
# Install unzip (required by Bun installer)
apt update && apt install -y unzip

# Install Bun
curl -fsSL https://bun.sh/install | bash

# Add Bun to PATH for root
echo 'export BUN_INSTALL="$HOME/.bun"' >> ~/.bashrc
echo 'export PATH="$BUN_INSTALL/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Verify installation
bun --version
```

**Expected output:** `1.x.x` (any recent version)

---

## Step 2: Clone Repository

```bash
# Create app directory (follows existing convention on this VPS)
mkdir -p /opt/apps
cd /opt/apps

# Clone repository
git clone https://github.com/YOUR_USERNAME/shared-spaces-booking-system.git
cd shared-spaces-booking-system

# Verify
git branch
git log --oneline -1
```

**Expected output:**
- `* main`
- Latest commit hash and message

**TODO:** Replace `YOUR_USERNAME` with actual GitHub username/org.

---

## Step 3: Create Environment File

```bash
# Create secrets directory
mkdir -p /etc/shared-spaces
chmod 700 /etc/shared-spaces

# Create environment file
cat > /etc/shared-spaces/api.env << 'EOF'
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
EOF

# Secure the file
chmod 600 /etc/shared-spaces/api.env
chown root:root /etc/shared-spaces/api.env
```

**Edit the file** and replace:
- `booking.your-domain.com` with your actual subdomain
- `SITE_NAME` and `SITE_SHORT_NAME` with your branding

```bash
nano /etc/shared-spaces/api.env
```

See [env-reference.md](./env-reference.md) for all available variables.

---

## Step 4: Install Dependencies and Build

```bash
cd /opt/apps/shared-spaces-booking-system

# Install dependencies
bun install

# Create the data directory for SQLite
mkdir -p apps/api/data

# Run database migrations (creates/updates the SQLite file)
bun run -F @dfs/database db:sync

# Build webapp
bun run build
```

**Expected output:**
- `bun install` completes without errors
- `db:sync` creates/updates `apps/api/data/app.db`
- `build` creates `apps/webapp/dist/` directory

**Verify:**
```bash
ls -la apps/api/data/app.db
ls -la apps/webapp/dist/index.html
```

Both files should exist.

---

## Step 5: Create systemd Service

```bash
cat > /etc/systemd/system/shared-spaces-api.service << 'EOF'
[Unit]
Description=Shared Spaces Booking API
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/apps/shared-spaces-booking-system/apps/api
EnvironmentFile=/etc/shared-spaces/api.env
ExecStart=/root/.bun/bin/bun run src/index.ts
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=shared-spaces-api

# Security
NoNewPrivileges=true
PrivateTmp=true

# Resource limits
MemoryMax=512M
CPUQuota=50%

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
systemctl daemon-reload

# Enable service (start on boot)
systemctl enable shared-spaces-api

# Start service
systemctl start shared-spaces-api

# Check status
systemctl status shared-spaces-api
```

**Expected output:**
- `active (running)` in green
- No errors in logs

**Check logs:**
```bash
journalctl -u shared-spaces-api -f
```

Press Ctrl+C to exit. Should see API startup messages.

---

## Step 6: Configure Nginx

Replace `booking.your-domain.com` with your actual subdomain in the config below.

```bash
# Create nginx config
cat > /etc/nginx/sites-available/booking.your-domain.com << 'NGINX'
server {
    listen 80;
    server_name booking.your-domain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name booking.your-domain.com;

    # SSL certificates (certbot will fill these in)
    # ssl_certificate /etc/letsencrypt/live/booking.your-domain.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/booking.your-domain.com/privkey.pem;

    # Root for static webapp
    root /opt/apps/shared-spaces-booking-system/apps/webapp/dist;
    index index.html;

    # API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }

    # Manifest endpoint (served by API)
    location = /manifest.webmanifest {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files (webapp SPA)
    location / {
        try_files $uri $uri/ /index.html;

        # Cache static assets aggressively
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Block access to SQLite database file (defense in depth)
    location ~* \.db$ {
        deny all;
        return 404;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/manifest+json;
}
NGINX

# Enable site
ln -sf /etc/nginx/sites-available/booking.your-domain.com /etc/nginx/sites-enabled/

# Test nginx config
nginx -t

# Reload nginx
systemctl reload nginx
```

**Expected output:**
- `nginx: configuration file /etc/nginx/nginx.conf test is successful`

---

## Step 7: Configure SSL with Let's Encrypt

```bash
# Install certbot if not already installed
apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
certbot --nginx -d booking.your-domain.com
```

Follow prompts:
- Enter email address
- Agree to terms
- Choose redirect HTTP to HTTPS

**Expected output:**
- `Successfully received certificate`

**Verify auto-renewal:**
```bash
systemctl status certbot.timer
```

Should be `active (waiting)`.

---

## Step 8: Verify Deployment

```bash
# Check API is running
curl http://127.0.0.1:4000/api/trpc/config.siteInfo

# Check webapp is accessible
curl -I https://booking.your-domain.com

# Check manifest endpoint
curl https://booking.your-domain.com/manifest.webmanifest
```

**Expected outputs:**
- API: JSON response with site info
- Webapp: `HTTP/2 200` with `content-type: text/html`
- Manifest: JSON with PWA metadata

---

## Post-Setup Checklist

- [ ] Bun installed and in PATH
- [ ] Repository cloned to `/opt/apps/shared-spaces-booking-system`
- [ ] Environment file at `/etc/shared-spaces/api.env` with correct values
- [ ] SQLite database created at `apps/api/data/app.db`
- [ ] Dependencies installed, webapp built
- [ ] systemd service running: `systemctl status shared-spaces-api`
- [ ] Nginx configured and reloaded
- [ ] SSL certificate obtained and auto-renewal enabled
- [ ] API responds: `curl http://127.0.0.1:4000/api/trpc/config.siteInfo`
- [ ] Webapp loads: `https://booking.your-domain.com`
- [ ] Manifest accessible: `https://booking.your-domain.com/manifest.webmanifest`

---

## Next Steps

- Read [deploy.md](./deploy.md) for recurring deployment process
- Read [runbook.md](./runbook.md) for troubleshooting
- Customize PWA icons in `apps/webapp/public/` (replace blue placeholders)
