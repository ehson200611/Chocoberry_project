#!/bin/bash

# ============================================
# Скрипт деплоя Chocoberry на сервер
# Включает: Nginx, HTTPS, Gunicorn, Systemd
# ============================================

set -e  # Остановка при ошибке

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Переменные (ИЗМЕНИТЕ ПОД ВАШ СЕРВЕР!)
DOMAIN="yourdomain.com"  # Ваш домен
PROJECT_DIR="/var/www/chocoberry"  # Путь к проекту на сервере
PROJECT_NAME="chocoberry"
USER="www-data"  # Пользователь для запуска (обычно www-data)
BACKEND_PORT="8000"  # Порт для Gunicorn
FRONTEND_PORT="3000"  # Порт для Next.js

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Деплой Chocoberry на сервер${NC}"
echo -e "${GREEN}========================================${NC}"

# Проверка прав root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Пожалуйста, запустите скрипт с правами root (sudo)${NC}"
    exit 1
fi

# ============================================
# 1. Обновление системы
# ============================================
echo -e "${YELLOW}[1/10] Обновление системы...${NC}"
apt-get update
apt-get upgrade -y

# ============================================
# 2. Установка необходимых пакетов
# ============================================
echo -e "${YELLOW}[2/10] Установка пакетов...${NC}"
apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    nginx \
    certbot \
    python3-certbot-nginx \
    nodejs \
    npm \
    git \
    build-essential \
    sqlite3

# ============================================
# 3. Создание директорий
# ============================================
echo -e "${YELLOW}[3/10] Создание директорий...${NC}"
mkdir -p $PROJECT_DIR
mkdir -p /var/log/$PROJECT_NAME
mkdir -p /etc/nginx/sites-available
mkdir -p /etc/nginx/sites-enabled

# ============================================
# 4. Клонирование/копирование проекта
# ============================================
echo -e "${YELLOW}[4/10] Настройка проекта...${NC}"
# Если проект уже есть, обновляем его
if [ -d "$PROJECT_DIR" ]; then
    cd $PROJECT_DIR
    git pull || echo "Git pull не выполнен (возможно, не git репозиторий)"
else
    echo -e "${YELLOW}Скопируйте проект в $PROJECT_DIR вручную${NC}"
fi

# ============================================
# 5. Настройка Python окружения
# ============================================
echo -e "${YELLOW}[5/10] Настройка Python окружения...${NC}"
cd $PROJECT_DIR

# Создание виртуального окружения
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# ============================================
# 6. Настройка Django для продакшена
# ============================================
echo -e "${YELLOW}[6/10] Настройка Django...${NC}"

# Создание production settings (если нужно)
cat > $PROJECT_DIR/chocoberry_backend/settings_production.py << EOF
from .settings import *
import os

DEBUG = False
ALLOWED_HOSTS = ['$DOMAIN', 'www.$DOMAIN', 'localhost', '127.0.0.1']

# Безопасность
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# CORS для продакшена
CORS_ALLOWED_ORIGINS = [
    "https://$DOMAIN",
    "https://www.$DOMAIN",
]

CORS_ALLOW_ALL_ORIGINS = False
CSRF_TRUSTED_ORIGINS = [
    'https://$DOMAIN',
    'https://www.$DOMAIN',
]

# Статические файлы
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
EOF

# Выполнение миграций
python manage.py collectstatic --noinput
python manage.py migrate

# ============================================
# 7. Настройка Gunicorn (Systemd сервис)
# ============================================
echo -e "${YELLOW}[7/10] Настройка Gunicorn...${NC}"

cat > /etc/systemd/system/$PROJECT_NAME.service << EOF
[Unit]
Description=Gunicorn daemon for $PROJECT_NAME
After=network.target

[Service]
User=$USER
Group=$USER
WorkingDirectory=$PROJECT_DIR
Environment="PATH=$PROJECT_DIR/venv/bin"
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
chown -R $USER:$USER $PROJECT_DIR
chown -R $USER:$USER /var/log/$PROJECT_NAME

# Запуск сервиса
systemctl daemon-reload
systemctl enable $PROJECT_NAME
systemctl restart $PROJECT_NAME

# ============================================
# 8. Настройка Next.js (Systemd сервис)
# ============================================
echo -e "${YELLOW}[8/10] Настройка Next.js...${NC}"

cd $PROJECT_DIR/kfc-clone

# Установка зависимостей
npm install

# Сборка проекта
npm run build

# Создание systemd сервиса для Next.js
cat > /etc/systemd/system/${PROJECT_NAME}-frontend.service << EOF
[Unit]
Description=Next.js frontend for $PROJECT_NAME
After=network.target

[Service]
User=$USER
Group=$USER
WorkingDirectory=$PROJECT_DIR/kfc-clone
Environment="NODE_ENV=production"
Environment="PORT=$FRONTEND_PORT"
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable ${PROJECT_NAME}-frontend
systemctl restart ${PROJECT_NAME}-frontend

# ============================================
# 9. Настройка Nginx
# ============================================
echo -e "${YELLOW}[9/10] Настройка Nginx...${NC}"

cat > /etc/nginx/sites-available/$PROJECT_NAME << EOF
# Редирект HTTP на HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;
    
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
    server_name $DOMAIN www.$DOMAIN;

    # SSL сертификаты (будут установлены certbot)
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # SSL настройки
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Логи
    access_log /var/log/nginx/${PROJECT_NAME}_access.log;
    error_log /var/log/nginx/${PROJECT_NAME}_error.log;

    # Максимальный размер загружаемых файлов
    client_max_body_size 100M;

    # Проксирование на Next.js (фронтенд)
    location / {
        proxy_pass http://127.0.0.1:$FRONTEND_PORT;
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
        proxy_pass http://127.0.0.1:$BACKEND_PORT;
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
        alias $PROJECT_DIR/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Медиа файлы Django
    location /media/ {
        alias $PROJECT_DIR/media/;
        expires 7d;
        add_header Cache-Control "public";
    }

    # Админка Django
    location /admin/ {
        proxy_pass http://127.0.0.1:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Активация сайта
ln -sf /etc/nginx/sites-available/$PROJECT_NAME /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Проверка конфигурации Nginx
nginx -t

# ============================================
# 10. Установка SSL сертификата (Let's Encrypt)
# ============================================
echo -e "${YELLOW}[10/10] Установка SSL сертификата...${NC}"

# Временно запускаем Nginx без SSL для получения сертификата
systemctl start nginx

# Получение сертификата
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN || {
    echo -e "${YELLOW}Не удалось получить сертификат автоматически.${NC}"
    echo -e "${YELLOW}Выполните вручную: certbot --nginx -d $DOMAIN -d www.$DOMAIN${NC}"
}

# Перезапуск Nginx
systemctl restart nginx
systemctl enable nginx

# ============================================
# Завершение
# ============================================
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Деплой завершен!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e ""
echo -e "Проверьте статус сервисов:"
echo -e "  systemctl status $PROJECT_NAME"
echo -e "  systemctl status ${PROJECT_NAME}-frontend"
echo -e "  systemctl status nginx"
echo -e ""
echo -e "Логи:"
echo -e "  journalctl -u $PROJECT_NAME -f"
echo -e "  journalctl -u ${PROJECT_NAME}-frontend -f"
echo -e "  tail -f /var/log/nginx/${PROJECT_NAME}_error.log"
echo -e ""
echo -e "Ваш сайт должен быть доступен на: https://$DOMAIN"
echo -e ""



