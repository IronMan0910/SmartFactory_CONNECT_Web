#!/bin/bash

# ============================================================
# SmartFactory CONNECT - Get Cloudflare Tunnel URL
# ============================================================
# Usage: ./scripts/get-tunnel-url.sh
# ============================================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "smartfactory_tunnel"; then
    echo -e "${RED}❌ Cloudflare Tunnel container is not running!${NC}"
    echo -e "${YELLOW}   Start with: docker-compose up -d cloudflared${NC}"
    exit 1
fi

# Get URL from logs
TUNNEL_URL=$(docker logs smartfactory_tunnel 2>&1 | grep -oE "https://[a-zA-Z0-9-]+\.trycloudflare\.com" | tail -1)

if [ -z "$TUNNEL_URL" ]; then
    echo -e "${RED}❌ Could not find tunnel URL in logs${NC}"
    echo -e "${YELLOW}   Full logs:${NC}"
    docker logs smartfactory_tunnel 2>&1 | tail -20
    exit 1
fi

# Display information
echo -e "${GREEN}"
echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║              🚀 CLOUDFLARE TUNNEL ACTIVE                                  ║"
echo "╠═══════════════════════════════════════════════════════════════════════════╣"
echo -e "║  ${CYAN}Public URL:${GREEN} $TUNNEL_URL"
echo "╠═══════════════════════════════════════════════════════════════════════════╣"
echo "║  API Endpoints:                                                           ║"
echo -e "║    ${CYAN}Health:${GREEN}  $TUNNEL_URL/health"
echo -e "║    ${CYAN}API:${GREEN}     $TUNNEL_URL/api"
echo -e "║    ${CYAN}Swagger:${GREEN} $TUNNEL_URL/api-docs"
echo -e "║    ${CYAN}Metrics:${GREEN} $TUNNEL_URL/metrics"
echo "╠═══════════════════════════════════════════════════════════════════════════╣"
echo "║  Frontend Configuration (.env.local):                                     ║"
echo -e "║    ${CYAN}VITE_API_BASE_URL=${GREEN}$TUNNEL_URL/api"
echo -e "║    ${CYAN}VITE_WS_URL=${GREEN}$(echo $TUNNEL_URL | sed 's/https/wss/')"
echo "╠═══════════════════════════════════════════════════════════════════════════╣"
echo "║  Mobile App (api_config.dart):                                            ║"
echo -e "║    ${CYAN}static const String baseUrl =${GREEN} '$TUNNEL_URL/api';"
echo "╠═══════════════════════════════════════════════════════════════════════════╣"
echo -e "║  ${YELLOW}⚠️  URL changes each time container restarts${NC}${GREEN}                          ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Copy to clipboard (macOS)
if command -v pbcopy &> /dev/null; then
    echo "$TUNNEL_URL" | pbcopy
    echo -e "${GREEN}📋 URL copied to clipboard!${NC}"
fi

# Save to file
echo "$TUNNEL_URL" > /tmp/smartfactory-tunnel-url.txt
echo -e "${CYAN}📄 URL saved to: /tmp/smartfactory-tunnel-url.txt${NC}"
