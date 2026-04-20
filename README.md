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
|---|---|
| Framework | Next.js 16 (React 19, TypeScript) |
| Database | PostgreSQL |
| ORM | Prisma 7 with PG adapter |
| Auth | Iron-session (cookie-based) |
| Styling | Tailwind CSS 4 |
| Server | Custom Node.js (HTTP or HTTPS) |

## Installation

### Option A — Docker (recommended, no setup required)

Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/).

```bash
git clone <repo-url>
cd AssetTracker

# Copy the example env file and set your session secret
cp .env.example .env
# Edit .env and fill in SESSION_SECRET (run: openssl rand -base64 32)

docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000). On first load you will be prompted to create the first admin account. That's it — PostgreSQL is included, migrations run automatically.

To run in the background:
```bash
docker compose up --build -d
```

To stop:
```bash
docker compose down
```

Data is stored in Docker volumes (`db_data` for the database, `uploads` for photos) and persists between restarts.

#### Updating (Docker)

```bash
git pull
docker compose up --build -d
```

That's all. The new image is built, any new database migrations run automatically on startup, and your data is untouched. The app will be briefly unavailable while the container restarts (usually under a minute).

---

### Option B — Guided setup script

Requires Node.js 20+ and PostgreSQL 14+ to already be installed.

```bash
git clone <repo-url>
cd AssetTracker
bash setup.sh
```

The script checks dependencies, prompts for database details, creates `.env`, installs packages, and runs migrations. Follow the instructions it prints at the end.

---

### Option C — Manual setup

Requirements: Node.js 20+, PostgreSQL 14+

```bash
git clone <repo-url>
cd AssetTracker
npm install
```

Copy `.env.example` to `.env` and fill in the values:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/assetdb"
SESSION_SECRET="<output of: openssl rand -base64 32>"
```

To use an existing remote database (e.g. on a Raspberry Pi), set `DATABASE_URL` with that host's IP instead of `localhost`.

```bash
npx prisma migrate deploy
npm run dev        # development
# or
npm run build && npm start   # production
```

Open [http://localhost:3000](http://localhost:3000).

### HTTPS (optional, all install methods)

Place SSL certificate files at `./certs/key.pem` and `./certs/cert.pem`. The server switches to HTTPS automatically when both files exist. Override the paths with:

```env
SSL_KEY_PATH=/path/to/key.pem
SSL_CERT_PATH=/path/to/cert.pem
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SESSION_SECRET` | Yes | Secret for signing session cookies (min 32 chars) |
| `PORT` | No | Port to listen on (default: `3000`) |
| `SSL_KEY_PATH` | No | Path to SSL private key (enables HTTPS) |
| `SSL_CERT_PATH` | No | Path to SSL certificate (enables HTTPS) |

## User Roles

| Role | Description |
|---|---|
| `VIEW_ONLY` | Read-only access to all sections |
| `ASSET_CONTROL` | Create/edit/delete assets, locations, consumables, maintenance, kits |
| `MANAGEMENT` | All of the above + manage allocations and barcode scanning |
| `ADMIN` | Full access including settings, user management, audit log, import/export |

## Documentation

A full user manual is available at [`MANUAL.md`](MANUAL.md), and as an interactive searchable help page within the application at `/help`.

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
  audit/          # Audit log (admin)
  settings/       # Settings (admin)
  help/           # Interactive user manual
components/       # React components
lib/              # Prisma client, session helpers, audit logging
prisma/           # Schema and migrations
public/uploads/   # Uploaded photos and avatars
server.mjs        # Custom Node.js server with HTTPS and daily cron
```
