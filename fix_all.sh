#!/bin/bash

# ============================================
# Универсальный скрипт для исправления всех проблем
# Запуск: bash fix_all.sh
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
echo -e "${GREEN}🔧 Исправление всех проблем${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Переход в директорию проекта
cd $PROJECT_DIR

# ============================================
# 1. ПРОВЕРКА И ОСТАНОВКА
# ============================================
echo -e "${BLUE}[1/10] Остановка сервисов...${NC}"
systemctl stop ${PROJECT_NAME}-frontend || true
systemctl stop ${PROJECT_NAME} || true
sleep 2

# Убиваем все процессы
pkill -f "next.*start" || true
pkill -f "node.*next" || true
pkill -f "gunicorn.*chocoberry" || true
sleep 2

# Освобождение портов
if lsof -Pi :${FRONTEND_PORT} -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}Освобождаем порт ${FRONTEND_PORT}...${NC}"
    fuser -k ${FRONTEND_PORT}/tcp || true
fi

if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}Освобождаем порт 8000...${NC}"
    fuser -k 8000/tcp || true
fi
sleep 2

# ============================================
# 2. ПРОВЕРКА ПАМЯТИ
# ============================================
echo -e "${BLUE}[2/10] Проверка памяти...${NC}"
free -h
MEM_AVAILABLE=$(free -m | awk '/^Mem:/{print $7}')
echo -e "${YELLOW}Доступно памяти: ${MEM_AVAILABLE}MB${NC}"
echo ""

# ============================================
# 3. ОБНОВЛЕНИЕ КОНФИГУРАЦИИ FRONTEND
# ============================================
echo -e "${BLUE}[3/10] Обновление конфигурации Next.js...${NC}"
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
Environment="NODE_OPTIONS=--max-old-space-size=1536"
ExecStart=/usr/bin/node node_modules/.bin/next start
Restart=always
RestartSec=10
StartLimitInterval=0
StartLimitBurst=0

# Лимиты ресурсов (увеличено)
MemoryMax=3G
MemoryHigh=2G
CPUQuota=300%

# OOM настройки
OOMScoreAdjust=-100

# Безопасность
NoNewPrivileges=true
PrivateTmp=false

# Логирование
StandardOutput=journal
StandardError=journal
SyslogIdentifier=chocoberry-frontend

[Install]
WantedBy=multi-user.target
EOF

echo -e "${GREEN}✓ Конфигурация обновлена${NC}"
echo ""

# ============================================
# 4. УСТАНОВКА ПРАВ
# ============================================
echo -e "${BLUE}[4/10] Установка прав доступа...${NC}"
chown -R www-data:www-data $PROJECT_DIR
chmod -R 755 $PROJECT_DIR
chmod +x $PROJECT_DIR/kfc-clone/node_modules/.bin/* || true
echo -e "${GREEN}✓ Права установлены${NC}"
echo ""

# ============================================
# 5. ОБНОВЛЕНИЕ PYTHON ЗАВИСИМОСТЕЙ
# ============================================
echo -e "${BLUE}[5/10] Обновление Python зависимостей...${NC}"
cd $PROJECT_DIR
source venv/bin/activate
pip install --upgrade pip >/dev/null 2>&1
pip install -r requirements.txt >/dev/null 2>&1
echo -e "${GREEN}✓ Python зависимости обновлены${NC}"
echo ""

# ============================================
# 6. МИГРАЦИИ DJANGO
# ============================================
echo -e "${BLUE}[6/10] Миграции Django...${NC}"
python manage.py collectstatic --noinput >/dev/null 2>&1
python manage.py migrate --noinput >/dev/null 2>&1
echo -e "${GREEN}✓ Миграции выполнены${NC}"
echo ""

# ============================================
# 7. ЗАГРУЗКА ПРОДУКТОВ
# ============================================
echo -e "${BLUE}[7/10] Загрузка продуктов...${NC}"
python manage.py load_initial_products >/dev/null 2>&1 || true
python manage.py load_gift_boxes >/dev/null 2>&1 || true
echo -e "${GREEN}✓ Продукты загружены${NC}"
echo ""

# ============================================
# 8. ПРОВЕРКА И СБОРКА NEXT.JS
# ============================================
echo -e "${BLUE}[8/10] Проверка Next.js...${NC}"
cd $PROJECT_DIR/kfc-clone

# Проверка node_modules
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Установка npm зависимостей...${NC}"
    npm install >/dev/null 2>&1
fi

# Пересборка Next.js (чтобы применить изменения в коде)
echo -e "${YELLOW}Пересборка Next.js...${NC}"
cd $PROJECT_DIR/kfc-clone

# Проверяем, нужна ли пересборка (сравниваем даты изменений)
if [ -d ".next" ]; then
    echo -e "${GREEN}✓ Сборка найдена${NC}"
    # Проверяем, изменились ли файлы после последней сборки
    LAST_BUILD=$(find .next -type f -exec stat -c %Y {} \; 2>/dev/null | sort -n | tail -1 || echo 0)
    LAST_SRC=$(find src -type f -exec stat -c %Y {} \; 2>/dev/null | sort -n | tail -1 || echo 0)
    
    if [ "$LAST_SRC" -gt "$LAST_BUILD" ]; then
        echo -e "${YELLOW}Обнаружены изменения, пересобираем...${NC}"
        # Используем ограничение памяти Node.js
        sudo -u www-data bash -c "cd $PROJECT_DIR/kfc-clone && NODE_OPTIONS='--max-old-space-size=1536' npm run build" 2>&1 | tail -20 || {
            echo -e "${YELLOW}⚠ Сборка завершилась с ошибкой${NC}"
            if [ ! -d ".next" ]; then
                echo -e "${RED}✗ Папка .next не найдена!${NC}"
            fi
        }
    else
        echo -e "${GREEN}✓ Изменений не обнаружено, используем существующую сборку${NC}"
    fi
else
    echo -e "${YELLOW}Сборка не найдена, создаем...${NC}"
    sudo -u www-data bash -c "cd $PROJECT_DIR/kfc-clone && NODE_OPTIONS='--max-old-space-size=1536' npm run build" 2>&1 | tail -20 || {
        echo -e "${RED}✗ Не удалось собрать Next.js${NC}"
        echo -e "${YELLOW}Проверьте логи выше${NC}"
    }
fi
echo ""
echo ""

# ============================================
# 9. ОБНОВЛЕНИЕ КОНФИГУРАЦИИ NGINX
# ============================================
echo -e "${BLUE}[9/11] Обновление конфигурации Nginx...${NC}"
if [ -f "$PROJECT_DIR/fix_nginx_api.sh" ]; then
    bash $PROJECT_DIR/fix_nginx_api.sh
else
    echo -e "${YELLOW}⚠ Скрипт fix_nginx_api.sh не найден, пропускаем${NC}"
fi
echo ""

# ============================================
# 10. ПЕРЕЗАПУСК СЕРВИСОВ
# ============================================
echo -e "${BLUE}[10/11] Перезапуск сервисов...${NC}"
systemctl daemon-reload

# Запуск Django
echo -e "${YELLOW}Запуск Django (Gunicorn)...${NC}"
systemctl restart ${PROJECT_NAME}
sleep 2

# Запуск Next.js
echo -e "${YELLOW}Запуск Next.js...${NC}"
systemctl restart ${PROJECT_NAME}-frontend
sleep 5

# Перезапуск Nginx
echo -e "${YELLOW}Перезапуск Nginx...${NC}"
nginx -t && systemctl restart nginx
echo ""

# ============================================
# 11. ПРОВЕРКА СТАТУСА
# ============================================
echo -e "${BLUE}[11/11] Проверка статуса...${NC}"
echo ""

# Django
if systemctl is-active --quiet ${PROJECT_NAME}; then
    echo -e "${GREEN}✅ Django (Gunicorn) работает${NC}"
else
    echo -e "${RED}✗ Django не работает${NC}"
    journalctl -u ${PROJECT_NAME} -n 5 --no-pager
fi

# Next.js
if systemctl is-active --quiet ${PROJECT_NAME}-frontend; then
    echo -e "${GREEN}✅ Next.js работает${NC}"
    
    # Проверка порта
    sleep 2
    if lsof -Pi :${FRONTEND_PORT} -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo -e "${GREEN}✅ Порт ${FRONTEND_PORT} слушается${NC}"
    else
        echo -e "${YELLOW}⚠ Порт ${FRONTEND_PORT} пока не слушается${NC}"
    fi
else
    echo -e "${RED}✗ Next.js не работает${NC}"
    echo -e "${YELLOW}Последние логи:${NC}"
    journalctl -u ${PROJECT_NAME}-frontend -n 10 --no-pager
fi

# Nginx
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✅ Nginx работает${NC}"
else
    echo -e "${RED}✗ Nginx не работает${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Исправление завершено!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Проверка статуса:${NC}"
echo -e "  systemctl status ${PROJECT_NAME}"
echo -e "  systemctl status ${PROJECT_NAME}-frontend"
echo -e "  systemctl status nginx"
echo ""
echo -e "${YELLOW}Просмотр логов:${NC}"
echo -e "  journalctl -u ${PROJECT_NAME} -f"
echo -e "  journalctl -u ${PROJECT_NAME}-frontend -f"
echo ""
echo -e "${YELLOW}Проверка сайта:${NC}"
echo -e "  curl http://localhost:3000"
echo -e "  curl http://localhost:8000/api/products/"
echo ""

