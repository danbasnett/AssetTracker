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

## Requirements

- Node.js 20+
- PostgreSQL 14+

## Setup

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd AssetTracker
npm install
```

### 2. Configure environment

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/assetdb"
SESSION_SECRET="your-secret-at-least-32-characters-long"
```

Generate a session secret:
```bash
openssl rand -base64 32
```

To use an existing remote database (e.g. on a Raspberry Pi), replace `localhost` with the host's IP address.

### 3. Run database migrations

```bash
npx prisma migrate deploy
```

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). On first load, you will be prompted to create the initial admin account.

### 5. Production

```bash
npm run build
npm start
```

### HTTPS (optional)

Place SSL certificate files at `./certs/key.pem` and `./certs/cert.pem`. The server detects these automatically and switches to HTTPS.

You can override the paths with environment variables:

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
