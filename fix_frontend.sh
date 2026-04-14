#!/bin/bash

# ============================================
# Скрипт для исправления проблемы с Next.js
# Запуск на сервере: bash fix_frontend.sh
# ============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_DIR="/var/www/chocoberry"
PROJECT_NAME="chocoberry"
FRONTEND_PORT="3000"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🔧 Исправление Next.js${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

cd $PROJECT_DIR

# 1. Проверка логов
echo -e "${YELLOW}[1/6] Проверка логов...${NC}"
echo -e "${YELLOW}Последние 30 строк логов:${NC}"
journalctl -u ${PROJECT_NAME}-frontend -n 30 --no-pager || echo "Логи не найдены"
echo ""

# 2. Остановка сервиса
echo -e "${YELLOW}[2/6] Остановка сервиса...${NC}"
systemctl stop ${PROJECT_NAME}-frontend || true
sleep 2

# 3. Освобождение порта
echo -e "${YELLOW}[3/6] Освобождение порта ${FRONTEND_PORT}...${NC}"
if lsof -Pi :${FRONTEND_PORT} -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}Порт занят, освобождаем...${NC}"
    fuser -k ${FRONTEND_PORT}/tcp || true
    sleep 2
fi

# 4. Проверка прав доступа
echo -e "${YELLOW}[4/6] Проверка прав доступа...${NC}"
chown -R www-data:www-data $PROJECT_DIR/kfc-clone
chmod -R 755 $PROJECT_DIR/kfc-clone

# 5. Проверка конфигурации systemd
echo -e "${YELLOW}[5/6] Проверка конфигурации systemd...${NC}"
if [ -f "/etc/systemd/system/${PROJECT_NAME}-frontend.service" ]; then
    echo -e "${GREEN}✓ Файл сервиса найден${NC}"
    cat /etc/systemd/system/${PROJECT_NAME}-frontend.service | head -20
else
    echo -e "${RED}✗ Файл сервиса не найден!${NC}"
fi
echo ""

# 6. Попытка запуска вручную для диагностики
echo -e "${YELLOW}[6/6] Попытка запуска вручную...${NC}"
cd $PROJECT_DIR/kfc-clone

# Проверка наличия .next
if [ ! -d ".next" ]; then
    echo -e "${YELLOW}Папка .next не найдена, запускаем сборку...${NC}"
    npm run build
fi

# Попытка запуска
echo -e "${YELLOW}Запуск Next.js...${NC}"
sudo -u www-data bash -c "cd $PROJECT_DIR/kfc-clone && NODE_ENV=production PORT=${FRONTEND_PORT} npm start" &
NEXT_PID=$!
sleep 5

if ps -p $NEXT_PID > /dev/null; then
    echo -e "${GREEN}✓ Next.js запустился (PID: $NEXT_PID)${NC}"
    if lsof -Pi :${FRONTEND_PORT} -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo -e "${GREEN}✓ Порт ${FRONTEND_PORT} слушается${NC}"
        echo -e "${YELLOW}Останавливаем тестовый процесс...${NC}"
        kill $NEXT_PID || true
        sleep 2
        
        # Перезапуск через systemd
        echo -e "${YELLOW}Перезапуск через systemd...${NC}"
        systemctl daemon-reload
        systemctl restart ${PROJECT_NAME}-frontend
        sleep 3
        
        if systemctl is-active --quiet ${PROJECT_NAME}-frontend; then
            echo -e "${GREEN}✅ Сервис запущен успешно!${NC}"
        else
            echo -e "${RED}✗ Сервис все еще не работает${NC}"
            echo -e "${YELLOW}Проверьте логи: journalctl -u ${PROJECT_NAME}-frontend -f${NC}"
        fi
    else
        echo -e "${RED}✗ Порт не слушается${NC}"
        kill $NEXT_PID || true
    fi
else
    echo -e "${RED}✗ Next.js не запустился${NC}"
    echo -e "${YELLOW}Проверьте ошибки выше${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Проверка завершена${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Полезные команды:${NC}"
echo -e "  journalctl -u ${PROJECT_NAME}-frontend -f"
echo -e "  systemctl status ${PROJECT_NAME}-frontend"
echo -e "  lsof -i :${FRONTEND_PORT}"
echo ""










