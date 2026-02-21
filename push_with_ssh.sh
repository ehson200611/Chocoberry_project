#!/bin/bash

# Скрипт для отправки кода через SSH
# Использование: bash push_with_ssh.sh

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Отправка кода через SSH${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo -e "${YELLOW}⚠️  ВАЖНО: Сначала добавьте SSH ключ на GitHub!${NC}"
echo ""
echo -e "${GREEN}Ваш SSH публичный ключ:${NC}"
echo -e "${BLUE}========================================${NC}"
cat ~/.ssh/id_ed25519.pub
echo -e "${BLUE}========================================${NC}"
echo ""

echo -e "${YELLOW}Инструкция:${NC}"
echo "1. Откройте: https://github.com/settings/keys"
echo "2. Нажмите 'New SSH key'"
echo "3. Title: My Computer"
echo "4. Key: скопируйте ключ выше"
echo "5. Нажмите 'Add SSH key'"
echo ""
read -p "Нажмите Enter после добавления ключа на GitHub..."

echo ""
echo -e "${GREEN}Тестирование SSH подключения...${NC}"
echo -e "${YELLOW}При первом подключении введите 'yes'${NC}"
ssh -T git@github.com 2>&1 | head -3

echo ""
echo -e "${GREEN}Отправка кода...${NC}"
CURRENT_BRANCH=$(git branch --show-current)
if [ -z "$CURRENT_BRANCH" ]; then
    CURRENT_BRANCH="main"
fi

if git push --set-upstream origin "$CURRENT_BRANCH" 2>&1; then
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}✅ Код успешно отправлен!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${BLUE}Ваш репозиторий:${NC}"
    echo -e "  🌐 https://github.com/ehson200611/Chocoberry_project"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Ошибка при отправке${NC}"
    echo ""
    echo -e "${YELLOW}Возможные причины:${NC}"
    echo "1. SSH ключ не добавлен на GitHub"
    echo "2. Репозиторий не создан на GitHub"
    echo "3. Проблемы с SSH подключением"
    echo ""
    echo -e "${BLUE}Попробуйте вручную:${NC}"
    echo "  git push --set-upstream origin $CURRENT_BRANCH"
fi

