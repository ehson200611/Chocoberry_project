#!/bin/bash

# Скрипт для копирования SSH ключа в буфер обмена
# Использование: bash COPY_SSH_KEY.sh

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Ваш SSH публичный ключ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

KEY=$(cat ~/.ssh/id_ed25519.pub)

echo -e "${GREEN}$KEY${NC}"
echo ""

# Попытка скопировать в буфер обмена (если доступно)
if command -v xclip &> /dev/null; then
    echo "$KEY" | xclip -selection clipboard
    echo -e "${GREEN}✓ Ключ скопирован в буфер обмена!${NC}"
elif command -v xsel &> /dev/null; then
    echo "$KEY" | xsel --clipboard --input
    echo -e "${GREEN}✓ Ключ скопирован в буфер обмена!${NC}"
else
    echo -e "${YELLOW}Скопируйте ключ выше вручную${NC}"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${YELLOW}Инструкция по добавлению на GitHub:${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "1. Откройте в браузере:"
echo -e "   ${GREEN}https://github.com/settings/keys${NC}"
echo ""
echo "2. Нажмите кнопку: ${GREEN}'New SSH key'${NC} (справа вверху)"
echo ""
echo "3. Заполните форму:"
echo "   - Title: ${GREEN}My Computer${NC} (или любое имя)"
echo "   - Key: ${GREEN}вставьте ключ выше${NC} (весь текст)"
echo ""
echo "4. Нажмите: ${GREEN}'Add SSH key'${NC}"
echo ""
echo "5. После добавления выполните:"
echo -e "   ${GREEN}git push --set-upstream origin main${NC}"
echo ""

