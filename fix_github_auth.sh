#!/bin/bash

# Скрипт для исправления аутентификации GitHub
# Использование: bash fix_github_auth.sh

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Исправление аутентификации GitHub${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo -e "${YELLOW}GitHub больше не поддерживает пароли для HTTPS.${NC}"
echo -e "${YELLOW}Нужно использовать Personal Access Token.${NC}"
echo ""

echo -e "${GREEN}Шаг 1: Создайте Personal Access Token${NC}"
echo ""
echo "1. Откройте: https://github.com/settings/tokens"
echo "2. Нажмите 'Generate new token' → 'Generate new token (classic)'"
echo "3. Название токена: Chocoberry_project"
echo "4. Срок действия: выберите нужный (например, 90 дней)"
echo "5. Отметьте право: ${BLUE}repo${NC} (полный доступ к репозиториям)"
echo "6. Прокрутите вниз и нажмите 'Generate token'"
echo "7. ${RED}ВАЖНО:${NC} Скопируйте токен сразу (он показывается только один раз!)"
echo ""
read -p "Нажмите Enter после создания токена..."

echo ""
echo -e "${GREEN}Шаг 2: Настройка credential helper...${NC}"
git config --global credential.helper store

echo ""
echo -e "${GREEN}Шаг 3: Попытка отправки кода...${NC}"
echo -e "${YELLOW}Когда Git попросит:${NC}"
echo "  Username: ${BLUE}ehson200611${NC}"
echo "  Password: ${BLUE}вставьте ваш Personal Access Token${NC} (не пароль от GitHub!)"
echo ""

CURRENT_BRANCH=$(git branch --show-current)
if [ -z "$CURRENT_BRANCH" ]; then
    CURRENT_BRANCH="main"
fi

if git push -u origin "$CURRENT_BRANCH"; then
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}✅ Код успешно отправлен!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${BLUE}Ваш репозиторий:${NC}"
    echo -e "  🌐 https://github.com/ehson200611/Chocoberry_project"
    echo ""
    echo -e "${GREEN}Токен сохранен, больше не нужно вводить его каждый раз!${NC}"
else
    echo ""
    echo -e "${RED}❌ Ошибка при отправке${NC}"
    echo ""
    echo -e "${YELLOW}Возможные причины:${NC}"
    echo "1. Репозиторий не создан на GitHub"
    echo "2. Использован пароль вместо токена"
    echo "3. Токен не имеет права 'repo'"
    echo "4. Неправильное имя репозитория"
    echo ""
    echo -e "${BLUE}Проверьте:${NC}"
    echo "  git remote -v"
    echo ""
    echo -e "${BLUE}Попробуйте вручную:${NC}"
    echo "  git push -u origin $CURRENT_BRANCH"
    echo ""
    echo -e "${YELLOW}Или используйте SSH:${NC}"
    echo "  bash setup_ssh_github.sh"
fi

