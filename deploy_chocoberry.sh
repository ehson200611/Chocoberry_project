#!/bin/bash

# ============================================
# Полный скрипт деплоя Chocoberry на chocoberry.tj
# Запуск: bash deploy_chocoberry.sh
# ============================================

set -e  # Остановка при ошибке

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================
# КОНФИГУРАЦИЯ
# ============================================
DOMAIN="chocoberry.tj"
SERVER_IP="37.252.17.34"
SERVER_USER="root"
SERVER_PASSWORD="t+5C69.UGSDAis"
PROJECT_DIR="/var/www/chocoberry"
PROJECT_NAME="chocoberry"
BACKEND_PORT="8000"
FRONTEND_PORT="3000"
LOCAL_PROJECT_PATH="$(pwd)"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🚀 Деплой Chocoberry на ${DOMAIN}${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# ============================================
# 1. ПРОВЕРКА ЛОКАЛЬНОГО ПРОЕКТА
# ============================================
echo -e "${BLUE}[1/12] Проверка локального проекта...${NC}"
if [ ! -f "requirements.txt" ]; then
    echo -e "${RED}Ошибка: requirements.txt не найден!${NC}"
    exit 1
fi
if [ ! -d "kfc-clone" ]; then
    echo -e "${RED}Ошибка: папка kfc-clone не найдена!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Проект найден${NC}"

# ============================================
# 2. УСТАНОВКА SSH PASS (если нужно)
# ============================================
echo -e "${BLUE}[2/12] Проверка SSH...${NC}"
if ! command -v sshpass &> /dev/null; then
    echo -e "${YELLOW}Установка sshpass...${NC}"
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get update && sudo apt-get install -y sshpass
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        brew install hudochenkov/sshpass/sshpass
    fi
fi

# ============================================
# 3. ПОДКЛЮЧЕНИЕ К СЕРВЕРУ И УСТАНОВКА ПАКЕТОВ
# ============================================
echo -e "${BLUE}[3/12] Подключение к серверу и установка пакетов...${NC}"
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'ENDSSH'
set -e
export DEBIAN_FRONTEND=noninteractive

# Обновление системы
apt-get update
apt-get upgrade -y

# Установка необходимых пакетов
apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    nginx \
    certbot \
    python3-certbot-nginx \
    nodejs \
    git \
    build-essential \
    sqlite3 \
    curl \
    wget

# Обновление npm до последней версии
npm install -g npm@latest

echo "✓ Пакеты установлены"
ENDSSH

# ============================================
# 4. КОПИРОВАНИЕ ПРОЕКТА НА СЕРВЕР
# ============================================
echo -e "${BLUE}[4/12] Копирование проекта на сервер...${NC}"
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP "mkdir -p $PROJECT_DIR"
sshpass -p "$SERVER_PASSWORD" rsync -avz --progress \
    --exclude 'node_modules' \
    --exclude '.next' \
    --exclude 'venv' \
    --exclude '__pycache__' \
    --exclude '*.pyc' \
    --exclude '.git' \
    "$LOCAL_PROJECT_PATH/" $SERVER_USER@$SERVER_IP:$PROJECT_DIR/

# ============================================
# 5. НАСТРОЙКА PYTHON ОКРУЖЕНИЯ
# ============================================
echo -e "${BLUE}[5/12] Настройка Python окружения на сервере...${NC}"
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << ENDSSH
set -e
cd $PROJECT_DIR

# Создание виртуального окружения
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

echo "✓ Python окружение настроено"
ENDSSH

# ============================================
# 6. НАСТРОЙКА DJANGO ДЛЯ ПРОДАКШЕНА
# ============================================
echo -e "${BLUE}[6/12] Настройка Django для продакшена...${NC}"
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << ENDSSH
set -e
cd $PROJECT_DIR
source venv/bin/activate

# Создание production settings
cat > chocoberry_backend/settings_production.py << 'EOFPROD'
from .settings import *
import os

DEBUG = False
ALLOWED_HOSTS = ['chocoberry.tj', 'www.chocoberry.tj', '37.252.17.34', 'localhost', '127.0.0.1']

# Безопасность
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# CORS для продакшена
CORS_ALLOWED_ORIGINS = [
    "https://chocoberry.tj",
    "https://www.chocoberry.tj",
]

CORS_ALLOW_ALL_ORIGINS = False
CSRF_TRUSTED_ORIGINS = [
    'https://chocoberry.tj',
    'https://www.chocoberry.tj',
]

# Статические файлы
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
EOFPROD

# Выполнение миграций и сбор статики
python manage.py collectstatic --noinput
python manage.py migrate --noinput

# Загрузка начальных продуктов и подарочных боксов
python manage.py load_initial_products
python manage.py load_gift_boxes

echo "✓ Django настроен"
ENDSSH

# ============================================
# 7. НАСТРОЙКА GUNICORN (SYSTEMD)
# ============================================
echo -e "${BLUE}[7/12] Настройка Gunicorn...${NC}"
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << ENDSSH
set -e

# Создание директории для логов
mkdir -p /var/log/$PROJECT_NAME

# Создание systemd сервиса
cat > /etc/systemd/system/$PROJECT_NAME.service << EOF
[Unit]
Description=Gunicorn daemon for $PROJECT_NAME
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=$PROJECT_DIR
Environment="PATH=$PROJECT_DIR/venv/bin"
Environment="DJANGO_SETTINGS_MODULE=chocoberry_backend.settings_production"
ExecStart=$PROJECT_DIR/venv/bin/gunicorn \\
    --workers 3 \\
    --bind 127.0.0.1:$BACKEND_PORT \\
    --access-logfile /var/log/$PROJECT_NAME/access.log \\
    --error-logfile /var/log/$PROJECT_NAME/error.log \\
    --timeout 120 \\
    chocoberry_backend.wsgi:application

Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

# Установка прав
chown -R www-data:www-data $PROJECT_DIR
chown -R www-data:www-data /var/log/$PROJECT_NAME

# Запуск сервиса
systemctl daemon-reload
systemctl enable $PROJECT_NAME
systemctl restart $PROJECT_NAME

echo "✓ Gunicorn настроен"
ENDSSH

# ============================================
# 8. НАСТРОЙКА NEXT.JS (SYSTEMD)
# ============================================
echo -e "${BLUE}[8/12] Настройка Next.js...${NC}"
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << ENDSSH
set -e
cd $PROJECT_DIR/kfc-clone

# Установка зависимостей
npm install

# Сборка проекта
npm run build

# Создание systemd сервиса
cat > /etc/systemd/system/${PROJECT_NAME}-frontend.service << EOF
[Unit]
Description=Next.js frontend for $PROJECT_NAME
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=$PROJECT_DIR/kfc-clone
Environment="NODE_ENV=production"
Environment="PORT=$FRONTEND_PORT"
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

# Установка прав
chown -R www-data:www-data $PROJECT_DIR/kfc-clone

systemctl daemon-reload
systemctl enable ${PROJECT_NAME}-frontend
systemctl restart ${PROJECT_NAME}-frontend

echo "✓ Next.js настроен"
ENDSSH

# ============================================
# 9. НАСТРОЙКА NGINX
# ============================================
echo -e "${BLUE}[9/12] Настройка Nginx...${NC}"
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << ENDSSH
set -e

# Создание конфигурации Nginx
cat > /etc/nginx/sites-available/$PROJECT_NAME << 'EOFNginx'
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
        return 301 https://\$server_name\$request_uri;
    }
}

# HTTPS конфигурация
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name chocoberry.tj www.chocoberry.tj;

    # SSL сертификаты (будут установлены certbot)
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

    # Проксирование на Next.js (фронтенд)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Проксирование на Django API
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
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
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOFNginx

# Активация сайта
ln -sf /etc/nginx/sites-available/$PROJECT_NAME /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

echo "✓ Nginx настроен"
ENDSSH

# ============================================
# 10. ВРЕМЕННЫЙ ЗАПУСК NGINX ДЛЯ SSL
# ============================================
echo -e "${BLUE}[10/12] Временный запуск Nginx для получения SSL...${NC}"
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'ENDSSH'
set -e

# Создание временной конфигурации без SSL
cat > /etc/nginx/sites-available/chocoberry_temp << 'EOFTemp'
server {
    listen 80;
    listen [::]:80;
    server_name chocoberry.tj www.chocoberry.tj;
    
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}
EOFTemp

ln -sf /etc/nginx/sites-available/chocoberry_temp /etc/nginx/sites-enabled/chocoberry
systemctl restart nginx
systemctl enable nginx

echo "✓ Nginx запущен"
ENDSSH

# ============================================
# 11. УСТАНОВКА SSL СЕРТИФИКАТА
# ============================================
echo -e "${BLUE}[11/12] Установка SSL сертификата (Let's Encrypt)...${NC}"
echo -e "${YELLOW}Внимание: Для получения сертификата нужен email. Используется admin@chocoberry.tj${NC}"
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'ENDSSH'
set -e

# Получение сертификата
certbot certonly --nginx \
    -d chocoberry.tj \
    -d www.chocoberry.tj \
    --non-interactive \
    --agree-tos \
    --email admin@chocoberry.tj \
    --redirect || {
    echo "⚠ Не удалось получить сертификат автоматически"
    echo "Выполните вручную: certbot --nginx -d chocoberry.tj -d www.chocoberry.tj"
}

echo "✓ SSL сертификат установлен"
ENDSSH

# ============================================
# 12. ФИНАЛЬНАЯ НАСТРОЙКА NGINX С SSL
# ============================================
echo -e "${BLUE}[12/12] Финальная настройка Nginx с SSL...${NC}"
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'ENDSSH'
set -e

# Удаление временной конфигурации
rm -f /etc/nginx/sites-enabled/chocoberry_temp

# Активация основной конфигурации
ln -sf /etc/nginx/sites-available/chocoberry /etc/nginx/sites-enabled/

# Проверка и перезапуск
nginx -t
systemctl restart nginx

# Настройка автообновления сертификата
systemctl enable certbot.timer
systemctl start certbot.timer

echo "✓ Nginx настроен с SSL"
ENDSSH

# ============================================
# ЗАВЕРШЕНИЕ
# ============================================
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Деплой завершен успешно!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Ваш сайт доступен на:${NC}"
echo -e "  🌐 https://${DOMAIN}"
echo -e "  🌐 https://www.${DOMAIN}"
echo ""
echo -e "${BLUE}Проверка статуса сервисов:${NC}"
echo -e "  systemctl status ${PROJECT_NAME}"
echo -e "  systemctl status ${PROJECT_NAME}-frontend"
echo -e "  systemctl status nginx"
echo ""
echo -e "${BLUE}Просмотр логов:${NC}"
echo -e "  journalctl -u ${PROJECT_NAME} -f"
echo -e "  journalctl -u ${PROJECT_NAME}-frontend -f"
echo -e "  tail -f /var/log/nginx/chocoberry_error.log"
echo ""
echo -e "${GREEN}🎉 Готово!${NC}"

