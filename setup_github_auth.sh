#!/bin/bash

# Скрипт для настройки аутентификации GitHub
# Использование: bash setup_github_auth.sh

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Настройка аутентификации GitHub${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo -e "${YELLOW}⚠️  ВАЖНО: Сначала создайте репозиторий на GitHub!${NC}"
echo ""
echo -e "${BLUE}1. Откройте: https://github.com/new${NC}"
echo -e "${BLUE}2. Repository name: chocoberry${NC}"
echo -e "${BLUE}3. Выберите Public или Private${NC}"
echo -e "${BLUE}4. НЕ добавляйте README, .gitignore или лицензию${NC}"
echo -e "${BLUE}5. Нажмите 'Create repository'${NC}"
echo ""
read -p "Нажмите Enter после создания репозитория..."

echo ""
echo -e "${YELLOW}Выберите метод аутентификации:${NC}"
echo "1) Personal Access Token (HTTPS) - Рекомендуется"
echo "2) SSH ключи"
read -p "Выберите (1 или 2): " choice

case $choice in
    1)
        echo ""
        echo -e "${GREEN}Настройка Personal Access Token...${NC}"
        echo ""
        echo -e "${YELLOW}Создайте Personal Access Token:${NC}"
        echo "1. Откройте: https://github.com/settings/tokens"
        echo "2. Нажмите 'Generate new token' → 'Generate new token (classic)'"
        echo "3. Название: chocoberry-local"
        echo "4. Срок действия: выберите нужный"
        echo "5. Отметьте право: repo (полный доступ)"
        echo "6. Нажмите 'Generate token'"
        echo "7. Скопируйте токен (показывается только один раз!)"
        echo ""
        read -p "Нажмите Enter после создания токена..."
        
        echo ""
        echo -e "${GREEN}Настройка credential helper...${NC}"
        git config --global credential.helper store
        
        echo ""
        echo -e "${GREEN}Попытка отправки кода...${NC}"
        echo -e "${YELLOW}Когда Git попросит пароль, вставьте ваш Personal Access Token${NC}"
        echo ""
        
        CURRENT_BRANCH=$(git branch --show-current)
        if git push -u origin "$CURRENT_BRANCH"; then
            echo ""
            echo -e "${GREEN}✅ Код успешно отправлен!${NC}"
        else
            echo ""
            echo -e "${RED}❌ Ошибка. Убедитесь, что:${NC}"
            echo "1. Репозиторий создан на GitHub"
            echo "2. Вы использовали токен, а не пароль"
            echo "3. Токен имеет права 'repo'"
        fi
        ;;
    2)
        echo ""
        echo -e "${GREEN}Настройка SSH ключей...${NC}"
        
        # Проверка существующих ключей
        if [ -f ~/.ssh/id_ed25519.pub ] || [ -f ~/.ssh/id_rsa.pub ]; then
            echo -e "${YELLOW}Найден существующий SSH ключ${NC}"
            if [ -f ~/.ssh/id_ed25519.pub ]; then
                KEY_FILE=~/.ssh/id_ed25519.pub
            else
                KEY_FILE=~/.ssh/id_rsa.pub
            fi
            echo -e "${GREEN}Публичный ключ:${NC}"
            cat "$KEY_FILE"
        else
            echo -e "${YELLOW}Создание нового SSH ключа...${NC}"
            read -p "Введите ваш email: " email
            ssh-keygen -t ed25519 -C "$email" -f ~/.ssh/id_ed25519 -N ""
            KEY_FILE=~/.ssh/id_ed25519.pub
            echo ""
            echo -e "${GREEN}Публичный ключ создан:${NC}"
            cat "$KEY_FILE"
        fi
        
        echo ""
        echo -e "${YELLOW}Добавьте этот ключ на GitHub:${NC}"
        echo "1. Откройте: https://github.com/settings/keys"
        echo "2. Нажмите 'New SSH key'"
        echo "3. Title: My Computer"
        echo "4. Key: скопируйте ключ выше"
        echo "5. Нажмите 'Add SSH key'"
        echo ""
        read -p "Нажмите Enter после добавления ключа на GitHub..."
        
        echo ""
        echo -e "${GREEN}Изменение URL на SSH...${NC}"
        git remote set-url origin git@github.com:ehson200611/chocoberry.git
        
        echo ""
        echo -e "${GREEN}Тестирование SSH подключения...${NC}"
        if ssh -T git@github.com 2>&1 | grep -q "successfully authenticated"; then
            echo -e "${GREEN}✅ SSH подключение работает!${NC}"
        else
            echo -e "${YELLOW}⚠️  SSH подключение требует подтверждения${NC}"
        fi
        
        echo ""
        echo -e "${GREEN}Отправка кода...${NC}"
        CURRENT_BRANCH=$(git branch --show-current)
        if git push -u origin "$CURRENT_BRANCH"; then
            echo ""
            echo -e "${GREEN}✅ Код успешно отправлен!${NC}"
        else
            echo ""
            echo -e "${RED}❌ Ошибка. Проверьте:${NC}"
            echo "1. Репозиторий создан на GitHub"
            echo "2. SSH ключ добавлен на GitHub"
            echo "3. Правильность URL репозитория"
        fi
        ;;
    *)
        echo -e "${RED}Неверный выбор${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Готово!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${BLUE}Ваш репозиторий:${NC}"
echo -e "  🌐 https://github.com/ehson200611/chocoberry"
echo ""

