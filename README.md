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

## Installation

Choose the method that best fits your environment.

### Option A — Docker (recommended)

The easiest path. PostgreSQL is included — you don't need to install or configure it separately.

#### 1. Install Docker

**Mac/Windows:** Install [Docker Desktop](https://www.docker.com/products/docker-desktop/).

**Linux (including LXC/VPS):**
```bash
apt install docker.io docker-compose -y
systemctl enable docker
systemctl start docker
```

#### 2. Clone the repo and fix the entrypoint script

> **Known issue:** `docker-entrypoint.sh` uses a bash feature (`<<<`) that isn't supported by the Alpine shell inside the container. The fix below rewrites it correctly.

```bash
git clone https://github.com/danbasnett/AssetTracker.git
cd AssetTracker

cat > docker-entrypoint.sh << 'EOF'
#!/bin/sh
set -e

echo "Waiting for database..."
until echo "SELECT 1" | npx prisma db execute --stdin > /dev/null 2>&1; do
  sleep 1
done

echo "Running database migrations..."
npx prisma migrate deploy

echo "Starting Asset Tracker..."
exec node server.mjs
EOF
```

#### 3. Create the `.env` file

```bash
# Generate a secure session secret — copy the output
openssl rand -base64 32

nano .env
```

Paste the following, replacing the placeholder with your generated secret:

```env
DATABASE_URL="postgresql://postgres:postgres@db:5432/assetdb"
SESSION_SECRET="paste-your-generated-secret-here"
```

Save and exit with `Ctrl+X`, `Y`, `Enter`.

#### 4. Build and start

```bash
docker compose up --build
```

> **The first build takes a while.** It compiles the full Next.js app including TypeScript checking. On a low-spec machine (LXC, VPS, Raspberry Pi) expect 5–15 minutes. It is not frozen — just wait for `Starting Asset Tracker...` to appear in the logs.

Once running, open `http://your-server-ip:3000`. On first load you will be prompted to create the first admin account.

To run in the background (recommended for production):

```bash
docker compose up --build -d
```

To stop:

```bash
docker compose down
```

> **Data persistence:** The database and uploaded photos are stored in Docker volumes (`db_data` and `uploads`) and survive container restarts and rebuilds.

#### Updating (Docker)

```bash
git pull

# Re-apply the entrypoint fix in case it changed upstream
cat > docker-entrypoint.sh << 'EOF'
#!/bin/sh
set -e

echo "Waiting for database..."
until echo "SELECT 1" | npx prisma db execute --stdin > /dev/null 2>&1; do
  sleep 1
done

echo "Running database migrations..."
npx prisma migrate deploy

echo "Starting Asset Tracker..."
exec node server.mjs
EOF

docker compose up --build -d
```

Migrations run automatically on startup and your data is untouched.

---

### Option B — Guided setup script

A script that walks you through configuration interactively.

**Requirements:** Node.js 20+ and PostgreSQL 14+ already installed and running.

```bash
git clone https://github.com/danbasnett/AssetTracker.git
cd AssetTracker
bash setup.sh
```

The script will:
1. Check that Node.js, npm, and `psql` are available
2. Prompt you for your database host, port, name, user, and password
3. Generate a secure `SESSION_SECRET` automatically
4. Write a `.env` file
5. Install npm dependencies
6. Run Prisma database migrations

Follow the instructions it prints at the end to start the app.

> **Note:** If a `.env` file already exists, the script skips the environment setup step. Delete `.env` and re-run to reconfigure.

---

### Option C — Manual setup

Full control over every step.

**Requirements:** Node.js 20+, PostgreSQL 14+

```bash
git clone https://github.com/danbasnett/AssetTracker.git
cd AssetTracker
npm install
```

Create a `.env` file:

```bash
nano .env
```

Paste in the following, filling in your values:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/assetdb"
SESSION_SECRET="<output of: openssl rand -base64 32>"
NODE_ENV="production"
```

> **Connecting to a remote database:** replace `localhost` with the IP address of the machine running PostgreSQL.

Run database migrations:

```bash
npx prisma migrate deploy
```

Start the app:

```bash
# Development (auto-reloads on file changes)
npm run dev

# Production
npm run build && npm start
```

Open `http://localhost:3000`. On first load you will be prompted to create the first admin account.

---

### Option D — Production on a Raspberry Pi or LXC (with PM2)

Use this when you want the app to start automatically on boot and restart if it crashes, without Docker.

#### 1. Install Node.js 20

The default OS repositories may ship an older version. Install via NodeSource:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version   # should print v20.x.x or higher
```

#### 2. Install and start PostgreSQL

```bash
sudo apt install -y postgresql
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

Create the database and a dedicated user:

```bash
sudo -u postgres psql -c "CREATE USER assetuser WITH PASSWORD 'yourpassword';"
sudo -u postgres psql -c "CREATE DATABASE assetdb OWNER assetuser;"
```

#### 3. Clone and configure

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

#### 4. Build and migrate

```bash
npm run build
npx prisma migrate deploy
```

#### 5. Install PM2 and start the app

```bash
sudo npm install -g pm2

pm2 start ecosystem.config.cjs

# Enable autostart on boot
pm2 save
pm2 startup   # run the command it prints to complete autostart setup
```

Useful PM2 commands:

```bash
pm2 status                # check if the app is running
pm2 logs assettracker     # view live logs
pm2 restart assettracker  # restart after config changes
pm2 stop assettracker     # stop the app
```

#### 6. Updating (PM2)

```bash
cd AssetTracker
git pull
npm install
npm run build
npx prisma migrate deploy
pm2 restart assettracker
```

---

## HTTPS (optional, all install methods)

Place SSL certificate files at `./certs/key.pem` and `./certs/cert.pem`. The server automatically switches to HTTPS when both files are present.

To use custom paths, add these to `.env`:

```env
SSL_KEY_PATH=/path/to/key.pem
SSL_CERT_PATH=/path/to/cert.pem
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SESSION_SECRET` | Yes | Secret for signing session cookies (minimum 32 characters — generate with `openssl rand -base64 32`) |
| `PORT` | No | Port to listen on (default: `3000`) |
| `NODE_ENV` | No | Set to `production` for production deployments |
| `SSL_KEY_PATH` | No | Path to SSL private key — enables HTTPS when set alongside `SSL_CERT_PATH` |
| `SSL_CERT_PATH` | No | Path to SSL certificate — enables HTTPS when set alongside `SSL_KEY_PATH` |

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
app/              # Next.js app directory (pages + server actions)
  actions.ts      # All server actions (create/update/delete operations)
  page.tsx        # Dashboard
  assets/         # Asset management
  locations/      # Location management
  items/          # Consumables
  people/         # People/assignees
  maintenance/    # Maintenance scheduling
  allocations/    # Allocation plans
  kits/           # Kit management
  audit/          # Audit log (admin only)
  settings/       # Settings (admin only)
  help/           # Interactive user manual
components/       # Shared React components
lib/              # Prisma client, session helpers, audit logging
prisma/           # Schema and migrations
public/uploads/   # Uploaded photos and avatars
server.mjs        # Custom Node.js server with HTTPS and daily cron
ecosystem.config.cjs  # PM2 process config
```
