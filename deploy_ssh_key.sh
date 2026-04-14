#!/bin/bash

# ============================================
# Скрипт отправки и деплоя через SSH (с ключом)
# Запуск: bash deploy_ssh_key.sh
# Требует: настроенный SSH ключ
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
PROJECT_DIR="/var/www/chocoberry"
PROJECT_NAME="chocoberry"
LOCAL_PATH="$(pwd)"
SSH_KEY=""  # Оставьте пустым для использования ~/.ssh/id_rsa или укажите путь

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🚀 Отправка проекта на сервер (SSH ключ)${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Определение SSH ключа
if [ -z "$SSH_KEY" ]; then
    if [ -f ~/.ssh/id_rsa ]; then
        SSH_KEY_OPT="-i ~/.ssh/id_rsa"
    elif [ -f ~/.ssh/id_ed25519 ]; then
        SSH_KEY_OPT="-i ~/.ssh/id_ed25519"
    else
        echo -e "${RED}Ошибка: SSH ключ не найден!${NC}"
        echo -e "${YELLOW}Создайте ключ: ssh-keygen -t ed25519${NC}"
        exit 1
    fi
else
    SSH_KEY_OPT="-i $SSH_KEY"
fi

# ============================================
# 1. ПРОВЕРКА ПОДКЛЮЧЕНИЯ
# ============================================
echo -e "${BLUE}[1/5] Проверка SSH подключения...${NC}"
if ! ssh $SSH_KEY_OPT -o ConnectTimeout=5 -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP "echo 'OK'" &>/dev/null; then
    echo -e "${RED}Ошибка: Не удалось подключиться к серверу!${NC}"
    echo -e "${YELLOW}Проверьте:${NC}"
    echo -e "  1. SSH ключ добавлен на сервер: ssh-copy-id $SERVER_USER@$SERVER_IP"
    echo -e "  2. IP адрес правильный: $SERVER_IP"
    exit 1
fi
echo -e "${GREEN}✓ Подключение установлено${NC}"

# ============================================
# 2. КОПИРОВАНИЕ ФАЙЛОВ НА СЕРВЕР
# ============================================
echo -e "${BLUE}[2/5] Копирование файлов на сервер...${NC}"
ssh $SSH_KEY_OPT -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP "mkdir -p $PROJECT_DIR"

echo -e "${YELLOW}Отправка файлов (это может занять время)...${NC}"
rsync -avz --progress $SSH_KEY_OPT \
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
# 3. ОТПРАВКА СКРИПТА ДЕПЛОЯ НА СЕРВЕР
# ============================================
echo -e "${BLUE}[3/5] Отправка скрипта деплоя...${NC}"
scp $SSH_KEY_OPT -o StrictHostKeyChecking=no \
    "$LOCAL_PATH/deploy_to_server.sh" \
    $SERVER_USER@$SERVER_IP:$PROJECT_DIR/

echo -e "${GREEN}✓ Скрипт отправлен${NC}"

# ============================================
# 4. ЗАПУСК ДЕПЛОЯ НА СЕРВЕРЕ
# ============================================
echo -e "${BLUE}[4/5] Запуск деплоя на сервере...${NC}"
ssh $SSH_KEY_OPT -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << ENDSSH
set -e
cd $PROJECT_DIR
chmod +x deploy_to_server.sh
bash deploy_to_server.sh
ENDSSH

# ============================================
# 5. ПРОВЕРКА СТАТУСА
# ============================================
echo -e "${BLUE}[5/5] Проверка статуса сервисов...${NC}"
ssh $SSH_KEY_OPT -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'ENDSSH'
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
echo -e "${YELLOW}Для проверки логов:${NC}"
echo -e "  ssh $SERVER_USER@$SERVER_IP"
echo -e "  journalctl -u $PROJECT_NAME -f"
echo ""
echo -e "${GREEN}🎉 Готово!${NC}"










