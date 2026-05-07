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

**Requirements:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine + Compose on Linux)

```bash
git clone https://github.com/danbasnett/AssetTracker.git
cd AssetTracker

# Generate a secure session secret
openssl rand -base64 32

# Copy the example env file and edit it
cp .env.example .env
nano .env   # set SESSION_SECRET to the value generated above
```

Then start the app:

```bash
docker compose up --build
```

Open http://localhost:3000. On first load you will be prompted to create the first admin account.

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
docker compose up --build -d
```

The new image is built, database migrations run automatically, and your data is untouched. The app will be briefly unavailable during the restart (usually under a minute).

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

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
nano .env
```

The two required values are:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/assetdb"
SESSION_SECRET="<output of: openssl rand -base64 32>"
```

> **Connecting to a remote database** (e.g. a separate Raspberry Pi running PostgreSQL): replace `localhost` in `DATABASE_URL` with that machine's IP address.

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

Open http://localhost:3000. On first load you will be prompted to create the first admin account.

---

### Option D — Production on a Raspberry Pi (with PM2)

Use this approach for a headless Raspberry Pi where you want the app to start automatically on boot and restart if it crashes.

**Requirements:** Node.js 20+, PostgreSQL 14+, PM2

#### 1. Install Node.js 20

The default Raspberry Pi OS repositories may ship an older version. Install via NodeSource:

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

Create the database and user:

```bash
sudo -u postgres psql -c "CREATE USER assetuser WITH PASSWORD 'yourpassword';"
sudo -u postgres psql -c "CREATE DATABASE assetdb OWNER assetuser;"
```

#### 3. Clone and configure the app

```bash
git clone https://github.com/danbasnett/AssetTracker.git
cd AssetTracker
npm install
cp .env.example .env
nano .env
```

Set the following in `.env`:

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

# Start using the included PM2 config
pm2 start ecosystem.config.cjs

# Save the process list and enable startup on boot
pm2 save
pm2 startup   # follow the command it prints to enable autostart
```

Useful PM2 commands:

```bash
pm2 status              # check if the app is running
pm2 logs assettracker   # view live logs
pm2 restart assettracker
pm2 stop assettracker
```

#### 6. Updating (Raspberry Pi / PM2)

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

To use custom paths, set these in `.env`:

```env
SSL_KEY_PATH=/path/to/key.pem
SSL_CERT_PATH=/path/to/cert.pem
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SESSION_SECRET` | Yes | Secret for signing session cookies (minimum 32 characters) |
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
