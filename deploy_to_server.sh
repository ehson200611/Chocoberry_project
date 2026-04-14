#!/bin/bash

# ============================================
# Скрипт для деплоя на сервер
# Запуск на сервере: bash deploy_to_server.sh
# ============================================

set -e

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_DIR="/var/www/chocoberry"
PROJECT_NAME="chocoberry"
BACKEND_PORT="8000"
FRONTEND_PORT="3000"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🚀 Деплой Chocoberry${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Переход в директорию проекта
cd $PROJECT_DIR

# ============================================
# 1. Обновление кода (если используется git)
# ============================================
echo -e "${YELLOW}[1/8] Обновление кода...${NC}"
if [ -d ".git" ]; then
    git pull || echo "Git pull пропущен"
fi

# ============================================
# 2. Обновление Python окружения
# ============================================
echo -e "${YELLOW}[2/8] Обновление Python окружения...${NC}"
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# ============================================
# 3. Миграции и сбор статики
# ============================================
echo -e "${YELLOW}[3/8] Миграции Django...${NC}"
python manage.py collectstatic --noinput
python manage.py migrate --noinput

# ============================================
# 4. Загрузка продуктов
# ============================================
echo -e "${YELLOW}[4/8] Загрузка продуктов...${NC}"
python manage.py load_initial_products
python manage.py load_gift_boxes

# ============================================
# 5. Перезапуск Gunicorn
# ============================================
echo -e "${YELLOW}[5/8] Перезапуск Gunicorn...${NC}"
systemctl restart $PROJECT_NAME
systemctl status $PROJECT_NAME --no-pager -l

# ============================================
# 6. Обновление Next.js
# ============================================
echo -e "${YELLOW}[6/8] Обновление Next.js...${NC}"
cd $PROJECT_DIR/kfc-clone
npm install
npm run build

# ============================================
# 7. Перезапуск Next.js
# ============================================
echo -e "${YELLOW}[7/8] Перезапуск Next.js...${NC}"

# Остановка сервиса перед перезапуском
systemctl stop ${PROJECT_NAME}-frontend || true

# Проверка, не занят ли порт
if lsof -Pi :${FRONTEND_PORT} -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}Порт ${FRONTEND_PORT} занят, освобождаем...${NC}"
    fuser -k ${FRONTEND_PORT}/tcp || true
    sleep 2
fi

# Установка прав
chown -R www-data:www-data $PROJECT_DIR/kfc-clone

# Перезапуск сервиса
systemctl daemon-reload
systemctl restart ${PROJECT_NAME}-frontend
sleep 3

# Проверка статуса
if systemctl is-active --quiet ${PROJECT_NAME}-frontend; then
    echo -e "${GREEN}✓ Next.js запущен${NC}"
    systemctl status ${PROJECT_NAME}-frontend --no-pager -l | head -10
else
    echo -e "${RED}✗ Next.js не запустился, проверяем логи...${NC}"
    journalctl -u ${PROJECT_NAME}-frontend -n 20 --no-pager
    echo -e "${YELLOW}Попытка запуска вручную для диагностики...${NC}"
    cd $PROJECT_DIR/kfc-clone
    sudo -u www-data NODE_ENV=production PORT=${FRONTEND_PORT} npm start &
    sleep 2
    if lsof -Pi :${FRONTEND_PORT} -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo -e "${GREEN}✓ Next.js запустился вручную${NC}"
        pkill -f "npm start" || true
    fi
fi

# ============================================
# 8. Перезапуск Nginx
# ============================================
echo -e "${YELLOW}[8/8] Перезапуск Nginx...${NC}"
nginx -t && systemctl restart nginx

# ============================================
# Завершение
# ============================================
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Деплой завершен!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${GREEN}Проверка статуса:${NC}"
echo -e "  systemctl status ${PROJECT_NAME}"
echo -e "  systemctl status ${PROJECT_NAME}-frontend"
echo -e "  systemctl status nginx"
echo ""
echo -e "${YELLOW}Если Next.js не работает, проверьте логи:${NC}"
echo -e "  journalctl -u ${PROJECT_NAME}-frontend -f"
echo -e "  journalctl -u ${PROJECT_NAME}-frontend -n 50"
echo ""
echo -e "${GREEN}🎉 Готово!${NC}"

