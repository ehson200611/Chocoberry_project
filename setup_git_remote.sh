#!/bin/bash

# Скрипт для настройки remote репозитория Git
# Использование: bash setup_git_remote.sh <URL_репозитория>

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

if [ -z "$1" ]; then
    echo -e "${YELLOW}Использование: bash setup_git_remote.sh <URL_репозитория>${NC}"
    echo ""
    echo "Примеры:"
    echo "  bash setup_git_remote.sh https://github.com/username/chocoberry.git"
    echo "  bash setup_git_remote.sh git@github.com:username/chocoberry.git"
    echo ""
    echo -e "${YELLOW}Если у вас еще нет репозитория на GitHub:${NC}"
    echo "1. Зайдите на https://github.com"
    echo "2. Создайте новый репозиторий (New Repository)"
    echo "3. НЕ инициализируйте его (не добавляйте README, .gitignore и т.д.)"
    echo "4. Скопируйте URL репозитория"
    echo "5. Запустите этот скрипт с URL"
    exit 1
fi

REPO_URL=$1

echo -e "${GREEN}Настройка remote репозитория...${NC}"

# Проверка существующего remote
if git remote | grep -q "^origin$"; then
    echo -e "${YELLOW}Remote 'origin' уже существует. Обновляю URL...${NC}"
    git remote set-url origin "$REPO_URL"
else
    echo -e "${GREEN}Добавление remote 'origin'...${NC}"
    git remote add origin "$REPO_URL"
fi

# Проверка подключения
echo -e "${GREEN}Проверка подключения...${NC}"
git remote -v

echo ""
echo -e "${GREEN}✓ Remote настроен!${NC}"
echo ""
echo -e "${YELLOW}Теперь вы можете отправить код:${NC}"
echo "  git push -u origin master"
echo ""
echo "Или если ваша ветка называется 'main':"
echo "  git branch -M main"
echo "  git push -u origin main"

