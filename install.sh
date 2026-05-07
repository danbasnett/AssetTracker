#!/bin/bash
set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'

echo -e "${CYAN}"
echo " ╔══════════════════════════════════╗"
echo " ║   Asset Tracker Installer        ║"
echo " ╚══════════════════════════════════╝"
echo -e "${NC}"

# ── Check dependencies ────────────────────────────────────────────────────────
echo "Checking dependencies..."

if ! command -v docker &>/dev/null; then
  echo -e "${YELLOW}Docker not found. Installing...${NC}"
  apt-get install -y docker.io docker-compose
  systemctl enable docker
  systemctl start docker
  echo -e "${GREEN}✓ Docker installed and started${NC}"
else
  echo -e "${GREEN}✓ Docker found${NC}"
fi

if ! command -v git &>/dev/null; then
  echo -e "${YELLOW}Git not found. Installing...${NC}"
  apt-get install -y git
  echo -e "${GREEN}✓ Git installed${NC}"
else
  echo -e "${GREEN}✓ Git found${NC}"
fi

echo ""

# ── Clone repo ────────────────────────────────────────────────────────────────
INSTALL_DIR="/opt/assettracker"

if [ -d "$INSTALL_DIR/.git" ]; then
  echo -e "${YELLOW}AssetTracker already exists at $INSTALL_DIR — pulling latest...${NC}"
  git -C "$INSTALL_DIR" pull
else
  echo "Cloning AssetTracker into $INSTALL_DIR..."
  git clone https://github.com/danbasnett/AssetTracker.git "$INSTALL_DIR"
  echo -e "${GREEN}✓ Cloned${NC}"
fi

cd "$INSTALL_DIR"
echo ""

# ── Fix docker-entrypoint.sh ──────────────────────────────────────────────────
echo "Patching docker-entrypoint.sh..."
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
chmod +x docker-entrypoint.sh
echo -e "${GREEN}✓ Patched${NC}"
echo ""

# ── Create .env ───────────────────────────────────────────────────────────────
if [ -f .env ]; then
  echo -e "${YELLOW}⚠ .env already exists — skipping. Delete it and re-run to reconfigure.${NC}"
else
  echo "Generating session secret..."
  SECRET=$(openssl rand -base64 32)
  cat > .env << EOF
DATABASE_URL="postgresql://postgres:postgres@db:5432/assetdb"
SESSION_SECRET="${SECRET}"
NODE_ENV="production"
EOF
  echo -e "${GREEN}✓ .env created${NC}"
fi
echo ""

# ── Start ─────────────────────────────────────────────────────────────────────
echo "Starting Asset Tracker (this may take 5–15 minutes on first run)..."
echo ""
docker compose up --build -d

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN} Asset Tracker is running!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Get the machine's local IP
IP=$(hostname -I | awk '{print $1}')
echo -e " Open: ${CYAN}http://${IP}:3000${NC}"
echo ""
echo " On first load you will be prompted to create an admin account."
echo ""
echo " Useful commands:"
echo -e "   ${CYAN}docker compose -f $INSTALL_DIR/docker-compose.yml logs -f${NC}   (view logs)"
echo -e "   ${CYAN}docker compose -f $INSTALL_DIR/docker-compose.yml down${NC}       (stop)"
echo -e "   ${CYAN}docker compose -f $INSTALL_DIR/docker-compose.yml up -d${NC}      (start)"
echo ""
