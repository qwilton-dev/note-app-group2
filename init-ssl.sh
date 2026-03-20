#!/bin/bash
set -e

DOMAIN="qwilton.skbx.ru"
EMAIL="your@email.com"

echo "==> Starting nginx for ACME challenge..."
docker compose run --rm -p 80:80 \
  -v $(pwd)/nginx/default-init.conf:/etc/nginx/conf.d/default.conf:ro \
  nginx nginx -g "daemon off;" &
NGINX_PID=$!
sleep 3

echo "==> Obtaining certificate for $DOMAIN..."
docker compose run --rm certbot certbot certonly \
  --webroot \
  --webroot-path /var/www/certbot \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  -d "$DOMAIN"

echo "==> Stopping temporary nginx..."
kill $NGINX_PID 2>/dev/null || true
wait $NGINX_PID 2>/dev/null || true

echo "==> Certificate obtained. Starting full stack..."
docker compose up -d

echo "==> Done! https://$DOMAIN"
