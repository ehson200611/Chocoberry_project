#!/bin/bash

# ============================================
# Скрипт отправки и деплоя через SSH
# Запуск: bash deploy_ssh.sh
# ============================================

set -e

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ============================================
# КОНФИГУРАЦИЯ
# ============================================
SERVER_IP="37.252.17.34"
SERVER_USER="root"
SERVER_PASSWORD="t+5C69.UGSDAis"
PROJECT_DIR="/var/www/chocoberry"
PROJECT_NAME="chocoberry"
LOCAL_PATH="$(pwd)"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🚀 Отправка проекта на сервер${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# ============================================
# 1. ПРОВЕРКА SSH PASS
# ============================================
echo -e "${BLUE}[1/5] Проверка sshpass...${NC}"
if ! command -v sshpass &> /dev/null; then
    echo -e "${YELLOW}Установка sshpass...${NC}"
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get update && sudo apt-get install -y sshpass
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        brew install hudochenkov/sshpass/sshpass
    fi
fi

# ============================================
# 2. КОПИРОВАНИЕ ФАЙЛОВ НА СЕРВЕР
# ============================================
echo -e "${BLUE}[2/5] Копирование файлов на сервер...${NC}"
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP "mkdir -p $PROJECT_DIR"

echo -e "${YELLOW}Отправка файлов (это может занять время)...${NC}"
sshpass -p "$SERVER_PASSWORD" rsync -avz --progress \
    --exclude 'node_modules' \
    --exclude '.next' \
    --exclude 'venv' \
    --exclude '__pycache__' \
    --exclude '*.pyc' \
    --exclude '.git' \
    --exclude 'db.sqlite3' \
    --exclude 'media' \
    "$LOCAL_PATH/" $SERVER_USER@$SERVER_IP:$PROJECT_DIR/

echo -e "${GREEN}✓ Файлы скопированы${NC}"

# ============================================
# 3. ОТПРАВКА СКРИПТОВ НА СЕРВЕР
# ============================================
echo -e "${BLUE}[3/5] Отправка скриптов...${NC}"
sshpass -p "$SERVER_PASSWORD" scp -o StrictHostKeyChecking=no \
    "$LOCAL_PATH/deploy_to_server.sh" \
    "$LOCAL_PATH/fix_all.sh" \
    "$LOCAL_PATH/fix_nginx_api.sh" \
    "$LOCAL_PATH/deploy_ssh.sh" \
    "$LOCAL_PATH/deploy_ssh_key.sh" \
    $SERVER_USER@$SERVER_IP:$PROJECT_DIR/

# Установка прав на выполнение
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP \
    "chmod +x $PROJECT_DIR/*.sh 2>/dev/null || true && bash $PROJECT_DIR/fix_nginx_api.sh"

echo -e "${GREEN}✓ Скрипты отправлены и права установлены${NC}"

# ============================================
# 4. ЗАПУСК ДЕПЛОЯ НА СЕРВЕРЕ
# ============================================
echo -e "${BLUE}[4/5] Запуск деплоя на сервере...${NC}"
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << ENDSSH
set -e
cd $PROJECT_DIR
chmod +x deploy_to_server.sh fix_all.sh

# Запускаем деплой
bash deploy_to_server.sh || true

# Ждем немного и проверяем Next.js
sleep 5
if ! systemctl is-active --quiet ${PROJECT_NAME}-frontend 2>/dev/null; then
    echo ""
    echo "⚠ Next.js не работает, запускаем fix_all.sh..."
    bash fix_all.sh
fi
ENDSSH

# ============================================
# 5. ПРОВЕРКА СТАТУСА
# ============================================
echo -e "${BLUE}[5/5] Проверка статуса сервисов...${NC}"
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'ENDSSH'
echo ""
echo "=== Статус сервисов ==="
systemctl status chocoberry --no-pager -l | head -5
echo ""
systemctl status chocoberry-frontend --no-pager -l | head -5
echo ""
systemctl status nginx --no-pager -l | head -5
ENDSSH

# ============================================
# ЗАВЕРШЕНИЕ
# ============================================
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Деплой завершен!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Ваш сайт: https://chocoberry.tj${NC}"
echo ""
echo -e "${YELLOW}Для проверки логов на сервере:${NC}"
echo -e "  ssh $SERVER_USER@$SERVER_IP"
echo -e "  journalctl -u $PROJECT_NAME -f"
echo -e "  journalctl -u ${PROJECT_NAME}-frontend -f"
echo ""
echo -e "${GREEN}🎉 Готово!${NC}"

