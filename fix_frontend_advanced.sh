#!/bin/bash

# ============================================
# Продвинутый скрипт для исправления Next.js
# Проверяет OOM Killer, лимиты памяти и т.д.
# ============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_DIR="/var/www/chocoberry"
PROJECT_NAME="chocoberry"
FRONTEND_PORT="3000"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🔧 Продвинутое исправление Next.js${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

cd $PROJECT_DIR

# 1. Проверка OOM Killer
echo -e "${BLUE}[1/8] Проверка OOM Killer...${NC}"
if dmesg | grep -i "killed process" | tail -5; then
    echo -e "${RED}⚠ Обнаружены записи об убитых процессах!${NC}"
    echo -e "${YELLOW}Возможно, не хватает памяти${NC}"
else
    echo -e "${GREEN}✓ OOM Killer не убивал процессы недавно${NC}"
fi
echo ""

# 2. Проверка памяти
echo -e "${BLUE}[2/8] Проверка памяти...${NC}"
free -h
MEM_AVAILABLE=$(free -m | awk '/^Mem:/{print $7}')
echo -e "${YELLOW}Доступно памяти: ${MEM_AVAILABLE}MB${NC}"
if [ "$MEM_AVAILABLE" -lt 512 ]; then
    echo -e "${RED}⚠ Мало памяти! Может быть проблема${NC}"
fi
echo ""

# 3. Проверка лимитов systemd
echo -e "${BLUE}[3/8] Проверка лимитов systemd...${NC}"
if [ -f "/etc/systemd/system/${PROJECT_NAME}-frontend.service" ]; then
    if grep -q "MemoryLimit\|MemoryMax" /etc/systemd/system/${PROJECT_NAME}-frontend.service; then
        echo -e "${YELLOW}Найдены лимиты памяти в конфигурации:${NC}"
        grep "MemoryLimit\|MemoryMax" /etc/systemd/system/${PROJECT_NAME}-frontend.service
    else
        echo -e "${GREEN}✓ Лимиты памяти не установлены (используются по умолчанию)${NC}"
    fi
else
    echo -e "${RED}✗ Файл сервиса не найден!${NC}"
fi
echo ""

# 4. Остановка и очистка
echo -e "${BLUE}[4/8] Остановка сервиса...${NC}"
systemctl stop ${PROJECT_NAME}-frontend || true
sleep 2

# Убиваем все процессы node в kfc-clone
pkill -f "next.*start" || true
pkill -f "node.*next" || true
sleep 2

# Освобождение порта
if lsof -Pi :${FRONTEND_PORT} -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}Освобождаем порт ${FRONTEND_PORT}...${NC}"
    fuser -k ${FRONTEND_PORT}/tcp || true
    sleep 2
fi

# 5. Обновление конфигурации systemd с лимитами памяти
echo -e "${BLUE}[5/8] Обновление конфигурации systemd...${NC}"
cat > /etc/systemd/system/${PROJECT_NAME}-frontend.service << 'EOF'
[Unit]
Description=Next.js frontend for chocoberry
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/chocoberry/kfc-clone
Environment="NODE_ENV=production"
Environment="PORT=3000"
Environment="HOME=/var/www/chocoberry"
ExecStart=/usr/bin/node node_modules/.bin/next start
Restart=always
RestartSec=5
StartLimitInterval=0

# Лимиты ресурсов (увеличено для Next.js)
MemoryMax=2G
MemoryHigh=1.5G
CPUQuota=200%

# Безопасность
NoNewPrivileges=true
PrivateTmp=true

# Логирование
StandardOutput=journal
StandardError=journal
SyslogIdentifier=chocoberry-frontend

[Install]
WantedBy=multi-user.target
EOF

echo -e "${GREEN}✓ Конфигурация обновлена${NC}"
echo ""

# 6. Установка прав
echo -e "${BLUE}[6/8] Установка прав...${NC}"
chown -R www-data:www-data $PROJECT_DIR/kfc-clone
chmod -R 755 $PROJECT_DIR/kfc-clone
echo -e "${GREEN}✓ Права установлены${NC}"
echo ""

# 7. Проверка сборки
echo -e "${BLUE}[7/8] Проверка сборки Next.js...${NC}"
cd $PROJECT_DIR/kfc-clone
if [ ! -d ".next" ]; then
    echo -e "${YELLOW}Папка .next не найдена, запускаем сборку...${NC}"
    sudo -u www-data npm run build
else
    echo -e "${GREEN}✓ Сборка найдена${NC}"
fi
echo ""

# 8. Перезапуск сервиса
echo -e "${BLUE}[8/8] Перезапуск сервиса...${NC}"
systemctl daemon-reload
systemctl restart ${PROJECT_NAME}-frontend
sleep 5

# Проверка статуса
if systemctl is-active --quiet ${PROJECT_NAME}-frontend; then
    echo -e "${GREEN}✅ Сервис запущен!${NC}"
    systemctl status ${PROJECT_NAME}-frontend --no-pager -l | head -15
    
    # Проверка порта
    sleep 2
    if lsof -Pi :${FRONTEND_PORT} -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo -e "${GREEN}✅ Порт ${FRONTEND_PORT} слушается!${NC}"
    else
        echo -e "${YELLOW}⚠ Порт ${FRONTEND_PORT} пока не слушается, подождите...${NC}"
    fi
else
    echo -e "${RED}✗ Сервис не запустился${NC}"
    echo -e "${YELLOW}Последние логи:${NC}"
    journalctl -u ${PROJECT_NAME}-frontend -n 30 --no-pager
    
    # Проверка dmesg на OOM
    echo ""
    echo -e "${YELLOW}Проверка OOM Killer:${NC}"
    dmesg | tail -20 | grep -i "killed\|oom" || echo "Нет записей об OOM"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Проверка завершена${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Полезные команды:${NC}"
echo -e "  systemctl status ${PROJECT_NAME}-frontend"
echo -e "  journalctl -u ${PROJECT_NAME}-frontend -f"
echo -e "  dmesg | grep -i killed"
echo -e "  free -h"
echo ""










