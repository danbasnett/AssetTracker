# Asset Tracker

A self-hosted asset management system built with Next.js, PostgreSQL, and Prisma. Track physical assets, locations, maintenance schedules, consumables, allocations, and more.

## Features

- **Assets** — full CRUD with tags, photos, serial/model numbers, and status tracking
- **Locations** — hierarchical location structure (building → room → shelf)
- **Kits** — group assets into named kits with an optional container asset
- **Consumables** — SKU-level inventory with reorder point alerts
- **People** — track assignees and their current assets
- **Maintenance** — scheduled and recurring maintenance with cost tracking
- **Allocations** — time-bounded deployment plans with barcode scanner support
- **Audit Log** — full history of every create/update/delete action
- **Role-based access** — View Only · Asset Control · Management · Admin
- **SSO/OAuth** — configurable Google, Apple, or custom OIDC providers
- **Import/Export** — bulk data in and out
- **Barcode & QR scanning** — camera-based scanning for fast asset lookup

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (React 19, TypeScript) |
| Database | PostgreSQL |
| ORM | Prisma 7 with PG adapter |
| Auth | Iron-session (cookie-based) |
| Styling | Tailwind CSS 4 |
| Server | Custom Node.js (HTTP or HTTPS) |

---

## Quick Install (Linux — recommended)

One command installs and starts everything. Run as root or with sudo:

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/danbasnett/AssetTracker/main/install.sh)
```

This script will:
- Install Docker if it isn't already present
- Clone the repo to `/opt/assettracker`
- Generate a secure session secret automatically
- Create the `.env` file
- Build and start the app in the background

When it finishes it will print the URL to open in your browser. On first load you will be prompted to create the first admin account.

> **First run takes 5–15 minutes** on low-spec machines (LXC, VPS, Raspberry Pi) while Next.js compiles. This is normal — it only happens once.

> **Space required:** The Docker build needs approximately 2–3 GB of free disk space. Check with `df -h /` before running.

### Updating

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/danbasnett/AssetTracker/main/install.sh)
```

Re-running the install script pulls the latest code and rebuilds. Your data is stored in Docker volumes and is never touched.

---

## Manual Install (Docker)

If you prefer to do it step by step, or aren't on Linux:

**Requirements:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Mac/Windows) or Docker Engine + Compose (Linux)

```bash
git clone https://github.com/danbasnett/AssetTracker.git
cd AssetTracker
```

Create the `.env` file:

```bash
nano .env
```

Paste in the following, replacing the session secret with the output of `openssl rand -base64 32`:

```env
DATABASE_URL="postgresql://postgres:postgres@db:5432/assetdb"
SESSION_SECRET="your-secret-here"
NODE_ENV="production"
```

Build and start:

```bash
docker compose up --build -d
```

Open `http://localhost:3000`. On first load you will be prompted to create the first admin account.

### Useful commands

```bash
docker compose logs -f          # stream logs
docker compose down             # stop the app
docker compose up -d            # start the app
docker compose up --build -d    # rebuild and start (after git pull)
```

---

## Manual Install (Node.js + PM2)

Use this for a Raspberry Pi or LXC where you want the app to start on boot without Docker.

### 1. Install Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Install PostgreSQL

```bash
sudo apt install -y postgresql
sudo systemctl enable --now postgresql
sudo -u postgres psql -c "CREATE USER assetuser WITH PASSWORD 'yourpassword';"
sudo -u postgres psql -c "CREATE DATABASE assetdb OWNER assetuser;"
```

### 3. Clone and configure

```bash
git clone https://github.com/danbasnett/AssetTracker.git
cd AssetTracker
npm install
nano .env
```

Paste in:

```env
DATABASE_URL="postgresql://assetuser:yourpassword@localhost:5432/assetdb"
SESSION_SECRET="<output of: openssl rand -base64 32>"
NODE_ENV="production"
```

### 4. Build and migrate

```bash
npm run build
npx prisma migrate deploy
```

### 5. Start with PM2

```bash
sudo npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup    # run the command it prints to enable autostart on boot
```

### Useful PM2 commands

```bash
pm2 status                # check if running
pm2 logs assettracker     # view logs
pm2 restart assettracker  # restart
pm2 stop assettracker     # stop
```

### Updating (PM2)

```bash
cd /path/to/AssetTracker
git pull
npm install
npm run build
npx prisma migrate deploy
pm2 restart assettracker
```

---

## HTTPS (optional)

Place certificate files at `./certs/key.pem` and `./certs/cert.pem`. The server switches to HTTPS automatically when both are present. Override the paths in `.env`:

```env
SSL_KEY_PATH=/path/to/key.pem
SSL_CERT_PATH=/path/to/cert.pem
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SESSION_SECRET` | Yes | Cookie signing secret — generate with `openssl rand -base64 32` (min 32 chars) |
| `PORT` | No | Port to listen on (default: `3000`) |
| `NODE_ENV` | No | Set to `production` for production deployments |
| `SSL_KEY_PATH` | No | Path to SSL private key (enables HTTPS when paired with `SSL_CERT_PATH`) |
| `SSL_CERT_PATH` | No | Path to SSL certificate (enables HTTPS when paired with `SSL_KEY_PATH`) |

---

## User Roles

| Role | Description |
|------|-------------|
| `VIEW_ONLY` | Read-only access to all sections |
| `ASSET_CONTROL` | Create/edit/delete assets, locations, consumables, maintenance, kits |
| `MANAGEMENT` | All of the above, plus manage allocations and barcode scanning |
| `ADMIN` | Full access including settings, user management, audit log, import/export |

The first account created on a fresh installation is automatically granted the `ADMIN` role.

---

## Documentation

A full user manual is available in [`MANUAL.md`](./MANUAL.md) and as an interactive searchable help page within the application at `/help`.

---

## Project Structure

```
app/                  # Next.js app directory (pages + server actions)
components/           # Shared React components
lib/                  # Prisma client, session helpers, audit logging
prisma/               # Schema and migrations
public/uploads/       # Uploaded photos and avatars
server.mjs            # Custom Node.js server with HTTPS and daily cron
ecosystem.config.cjs  # PM2 process config
install.sh            # One-command installer
docker-entrypoint.sh  # Docker container startup script
```
