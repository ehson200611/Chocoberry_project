#!/bin/bash

# Скрипт для создания репозитория на GitHub и отправки кода
# Использование: bash create_and_push_repo.sh <имя_репозитория>

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

REPO_NAME=${1:-"chocoberry"}
GITHUB_USER="ehson200611"
REPO_URL="https://github.com/${GITHUB_USER}/${REPO_NAME}.git"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Создание репозитория на GitHub${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo -e "${YELLOW}Имя репозитория: ${REPO_NAME}${NC}"
echo -e "${YELLOW}GitHub пользователь: ${GITHUB_USER}${NC}"
echo -e "${YELLOW}URL репозитория: ${REPO_URL}${NC}"
echo ""

echo -e "${GREEN}Шаг 1: Подключение к GitHub репозиторию...${NC}"
git remote add origin "$REPO_URL" 2>/dev/null || git remote set-url origin "$REPO_URL"

echo -e "${GREEN}✓ Remote настроен${NC}"
echo ""

echo -e "${YELLOW}⚠️  ВАЖНО: Сначала создайте репозиторий на GitHub!${NC}"
echo ""
echo -e "${BLUE}Инструкция:${NC}"
echo "1. Откройте: https://github.com/new"
echo "2. Repository name: ${REPO_NAME}"
echo "3. Выберите Public или Private"
echo "4. НЕ добавляйте README, .gitignore или лицензию"
echo "5. Нажмите 'Create repository'"
echo ""
read -p "Нажмите Enter после создания репозитория на GitHub..."

echo ""
echo -e "${GREEN}Шаг 2: Отправка кода на GitHub...${NC}"

# Проверка текущей ветки
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${YELLOW}Текущая ветка: ${CURRENT_BRANCH}${NC}"

# Отправка кода
if git push -u origin "$CURRENT_BRANCH" 2>&1; then
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}✅ Код успешно отправлен!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${BLUE}Ваш репозиторий:${NC}"
    echo -e "  🌐 ${REPO_URL}"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Ошибка при отправке кода${NC}"
    echo ""
    echo -e "${YELLOW}Возможные причины:${NC}"
    echo "1. Репозиторий еще не создан на GitHub"
    echo "2. Проблемы с аутентификацией"
    echo "3. Репозиторий уже существует и не пустой"
    echo ""
    echo -e "${BLUE}Попробуйте вручную:${NC}"
    echo "  git push -u origin ${CURRENT_BRANCH}"
    echo ""
    echo -e "${BLUE}Или если нужно переименовать ветку в main:${NC}"
    echo "  git branch -M main"
    echo "  git push -u origin main"
    exit 1
fi

