#!/bin/bash

# ============================================
# Скрипт для исправления конфигурации Nginx для API
# ============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_NAME="chocoberry"
BACKEND_PORT="8000"
FRONTEND_PORT="3000"
PROJECT_DIR="/var/www/chocoberry"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🔧 Исправление Nginx для API${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Создаем правильную конфигурацию Nginx
cat > /etc/nginx/sites-available/${PROJECT_NAME} << 'EOFNginx'
# Редирект HTTP на HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name chocoberry.tj www.chocoberry.tj;
    
    # Для Let's Encrypt
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    # Редирект на HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS конфигурация
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name chocoberry.tj www.chocoberry.tj;

    # SSL сертификаты
    ssl_certificate /etc/letsencrypt/live/chocoberry.tj/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/chocoberry.tj/privkey.pem;
    
    # SSL настройки
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_stapling on;
    ssl_stapling_verify on;

    # Логи
    access_log /var/log/nginx/chocoberry_access.log;
    error_log /var/log/nginx/chocoberry_error.log;

    # Максимальный размер загружаемых файлов
    client_max_body_size 100M;

    # Проксирование на Django API (ВАЖНО: должно быть ПЕРЕД location /)
    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header Origin $scheme://$host;
        
        # CORS обрабатывается Django, Nginx только проксирует
        
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Проксирование на Next.js (фронтенд)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Статические файлы Django
    location /static/ {
        alias /var/www/chocoberry/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Медиа файлы Django
    location /media/ {
        alias /var/www/chocoberry/media/;
        expires 7d;
        add_header Cache-Control "public";
    }

    # Админка Django
    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOFNginx

# Активация конфигурации
ln -sf /etc/nginx/sites-available/${PROJECT_NAME} /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Проверка и перезапуск
echo -e "${YELLOW}Проверка конфигурации Nginx...${NC}"
if nginx -t; then
    echo -e "${GREEN}✓ Конфигурация правильная${NC}"
    systemctl reload nginx
    echo -e "${GREEN}✓ Nginx перезагружен${NC}"
else
    echo -e "${RED}✗ Ошибка в конфигурации Nginx!${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Nginx обновлен!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Проверка API:${NC}"
echo -e "  curl -I https://chocoberry.tj/api/products/"
echo ""

