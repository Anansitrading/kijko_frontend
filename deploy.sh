#!/bin/bash
set -e

cd /root/Kijko-MVP

echo "=== Deploying Kijko-MVP ==="

echo "[1/4] Fetching latest..."
git fetch origin

echo "[2/4] Resetting to origin/Kijko-MVP..."
git reset --hard origin/Kijko-MVP
echo "Now at: $(git log --oneline -1)"

echo "[3/4] Rebuilding container..."
docker compose down
docker compose up -d --build

echo "[4/4] Verifying..."
sleep 3
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$HTTP_CODE" = "200" ]; then
    echo "Deploy successful - HTTP $HTTP_CODE"
else
    echo "ERROR: Deploy failed - HTTP $HTTP_CODE"
    docker compose logs --tail=20
    exit 1
fi

echo ""
echo "=== Deployed $(git log --oneline -1) ==="
