#!/bin/bash
set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'

echo -e "${CYAN}"
echo "  ╔══════════════════════════════╗"
echo "  ║     Asset Tracker Setup      ║"
echo "  ╚══════════════════════════════╝"
echo -e "${NC}"

# ── Check dependencies ────────────────────────────────────────────────────────

check() {
  if ! command -v "$1" &>/dev/null; then
    echo -e "${RED}✗ $1 not found.${NC} $2"
    exit 1
  fi
  echo -e "${GREEN}✓ $1 found${NC}"
}

echo "Checking dependencies..."
check node  "Install from https://nodejs.org or via: brew install node"
check npm   "Comes with Node.js"
check psql  "Install PostgreSQL from https://postgresql.org or via: brew install postgresql@17"
echo ""

# ── .env setup ───────────────────────────────────────────────────────────────

if [ -f .env ]; then
  echo -e "${YELLOW}⚠ .env already exists — skipping environment setup.${NC}"
  echo "  Delete .env and re-run this script to reconfigure."
  echo ""
else
  echo "Database connection"
  echo "-------------------"
  read -p "  PostgreSQL host     [localhost]: " DB_HOST;  DB_HOST="${DB_HOST:-localhost}"
  read -p "  PostgreSQL port     [5432]: "     DB_PORT;  DB_PORT="${DB_PORT:-5432}"
  read -p "  Database name       [assetdb]: "  DB_NAME;  DB_NAME="${DB_NAME:-assetdb}"
  read -p "  Database user       [$(whoami)]: " DB_USER; DB_USER="${DB_USER:-$(whoami)}"
  read -s -p "  Database password   (leave blank if none): " DB_PASS; echo ""
  echo ""

  if [ -n "$DB_PASS" ]; then
    DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
  else
    DATABASE_URL="postgresql://${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
  fi

  SESSION_SECRET=$(openssl rand -base64 32)

  cat > .env <<EOF
DATABASE_URL="${DATABASE_URL}"
SESSION_SECRET="${SESSION_SECRET}"
EOF

  echo -e "${GREEN}✓ .env created${NC}"
  echo ""
fi

# ── Install dependencies ──────────────────────────────────────────────────────

echo "Installing Node.js dependencies..."
npm ci --prefer-offline 2>/dev/null || npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# ── Prisma ───────────────────────────────────────────────────────────────────

echo "Generating Prisma client..."
npx prisma generate
echo -e "${GREEN}✓ Prisma client generated${NC}"
echo ""

echo "Running database migrations..."
if npx prisma migrate deploy; then
  echo -e "${GREEN}✓ Database ready${NC}"
else
  echo -e "${RED}✗ Migration failed.${NC}"
  echo "  Check that your database is running and the credentials in .env are correct."
  exit 1
fi
echo ""

# ── Done ─────────────────────────────────────────────────────────────────────

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Setup complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "  Start the development server:"
echo -e "    ${CYAN}npm run dev${NC}"
echo ""
echo "  Or build and start for production:"
echo -e "    ${CYAN}npm run build && npm start${NC}"
echo ""
echo "  Then open: http://localhost:3000"
echo "  On first load you will be prompted to create an admin account."
echo ""
