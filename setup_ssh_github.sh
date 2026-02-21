#!/bin/bash

# Скрипт для настройки SSH аутентификации GitHub
# Использование: bash setup_ssh_github.sh

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Настройка SSH для GitHub${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Проверка существующих SSH ключей
if [ -f ~/.ssh/id_ed25519.pub ]; then
    echo -e "${GREEN}Найден существующий SSH ключ: id_ed25519${NC}"
    KEY_FILE=~/.ssh/id_ed25519.pub
elif [ -f ~/.ssh/id_rsa.pub ]; then
    echo -e "${GREEN}Найден существующий SSH ключ: id_rsa${NC}"
    KEY_FILE=~/.ssh/id_rsa.pub
else
    echo -e "${YELLOW}SSH ключ не найден. Создаю новый...${NC}"
    read -p "Введите ваш email (для SSH ключа): " email
    if [ -z "$email" ]; then
        email="nekruzifiruz4@gmail.com"
    fi
    
    ssh-keygen -t ed25519 -C "$email" -f ~/.ssh/id_ed25519 -N ""
    KEY_FILE=~/.ssh/id_ed25519.pub
    echo -e "${GREEN}✓ SSH ключ создан${NC}"
fi

echo ""
echo -e "${YELLOW}Ваш публичный SSH ключ:${NC}"
echo -e "${BLUE}========================================${NC}"
cat "$KEY_FILE"
echo -e "${BLUE}========================================${NC}"
echo ""

echo -e "${GREEN}Добавьте этот ключ на GitHub:${NC}"
echo "1. Откройте: https://github.com/settings/keys"
echo "2. Нажмите 'New SSH key'"
echo "3. Title: My Computer (или любое имя)"
echo "4. Key: скопируйте ключ выше (весь текст)"
echo "5. Нажмите 'Add SSH key'"
echo ""
read -p "Нажмите Enter после добавления ключа на GitHub..."

echo ""
echo -e "${GREEN}Изменение URL репозитория на SSH...${NC}"
git remote set-url origin git@github.com:ehson200611/Chocoberry_project.git

echo ""
echo -e "${GREEN}Тестирование SSH подключения...${NC}"
echo -e "${YELLOW}При первом подключении введите 'yes'${NC}"
ssh -T git@github.com

echo ""
echo -e "${GREEN}Отправка кода...${NC}"
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
else
    echo ""
    echo -e "${RED}❌ Ошибка при отправке${NC}"
    echo -e "${YELLOW}Проверьте, что:${NC}"
    echo "1. SSH ключ добавлен на GitHub"
    echo "2. Репозиторий создан на GitHub"
    echo "3. Правильность URL репозитория"
fi

