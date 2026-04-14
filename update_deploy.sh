#!/bin/bash

# ============================================
# Скрипт для обновления скриптов деплоя на сервере
# Запуск: bash update_deploy.sh
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
LOCAL_PATH="$(pwd)"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🔄 Обновление скриптов деплоя${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Проверка sshpass
if ! command -v sshpass &> /dev/null; then
    echo -e "${YELLOW}Установка sshpass...${NC}"
    sudo apt-get update && sudo apt-get install -y sshpass
fi

# Список скриптов для отправки
SCRIPTS=(
    "deploy_ssh.sh"
    "deploy_to_server.sh"
    "fix_all.sh"
    "deploy_ssh_key.sh"
)

echo -e "${BLUE}[1/2] Отправка скриптов на сервер...${NC}"
for script in "${SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        echo -e "${YELLOW}Отправка $script...${NC}"
        sshpass -p "$SERVER_PASSWORD" scp -o StrictHostKeyChecking=no \
            "$LOCAL_PATH/$script" \
            $SERVER_USER@$SERVER_IP:$PROJECT_DIR/
        echo -e "${GREEN}✓ $script отправлен${NC}"
    else
        echo -e "${RED}✗ $script не найден${NC}"
    fi
done

echo ""
echo -e "${BLUE}[2/2] Установка прав на выполнение...${NC}"
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << ENDSSH
cd $PROJECT_DIR
chmod +x deploy_ssh.sh deploy_to_server.sh fix_all.sh deploy_ssh_key.sh 2>/dev/null || true
echo "✓ Права установлены"
ENDSSH

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Скрипты обновлены!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Теперь можно запустить деплой:${NC}"
echo -e "  bash deploy_ssh.sh"
echo ""










