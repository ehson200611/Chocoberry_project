#!/bin/bash
# ============================================================
# CHOCOBERRY - DEPLOY TO NEW SERVER
# Server: 212.193.24.67
# ============================================================

set -e

NEW_SERVER="212.193.24.67"
NEW_PASS="aG1@2v_UAQ*qDF"
PROJECT_LOCAL="/home/ehson/Рабочий стол/chcooocooo"
DB_NAME="chocoberry_db"
DB_USER="chocoberry_user"
DB_PASS="Chocoberry2026!"

echo "============================================"
echo "  CHOCOBERRY - DEPLOY TO NEW SERVER"
echo "  Server: $NEW_SERVER"
echo "============================================"

# Helper function
run_ssh() {
    sshpass -p "$NEW_PASS" ssh -o StrictHostKeyChecking=no root@$NEW_SERVER "$1"
}

echo ""
echo "📦 ҚАДАМИ 1: Лоиҳаро ба сервер мефиристем..."
echo "----------------------------------------------"

# Create project directory on server
run_ssh "mkdir -p /var/www/chocoberry"

# Upload project files (exclude venv, node_modules, .git)
echo "  → Файлҳоро бор мекунем (ин чанд дақиқа мегирад)..."
sshpass -p "$NEW_PASS" rsync -avz --progress \
    --exclude='venv/' \
    --exclude='node_modules/' \
    --exclude='.git/' \
    --exclude='*.pyc' \
    --exclude='__pycache__/' \
    --exclude='.next/' \
    -e "ssh -o StrictHostKeyChecking=no" \
    "$PROJECT_LOCAL/" root@$NEW_SERVER:/var/www/chocoberry/

echo "  ✅ Файлҳо бор шуданд!"

echo ""
echo "🔧 ҚАДАМИ 2: Зарурияти системавӣ насб мекунем..."
echo "--------------------------------------------------"

run_ssh "apt-get update -qq && apt-get install -y -qq \
    python3 python3-pip python3-venv python3-dev \
    postgresql postgresql-contrib \
    nginx \
    curl wget git \
    build-essential libpq-dev \
    certbot python3-certbot-nginx \
    sshpass 2>/dev/null; \
    echo '  ✅ Системавӣ насб шуд!'"

echo ""
echo "🟢 ҚАДАМИ 3: Node.js насб мекунем..."
echo "--------------------------------------"

run_ssh "curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    node --version && npm --version && \
    echo '  ✅ Node.js насб шуд!'"

echo ""
echo "🐘 ҚАДАМИ 4: PostgreSQL танзим мекунем..."
echo "------------------------------------------"

run_ssh "systemctl start postgresql && systemctl enable postgresql && \
    sudo -u postgres psql -c \"CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';\" 2>/dev/null || true && \
    sudo -u postgres psql -c \"CREATE DATABASE $DB_NAME OWNER $DB_USER;\" 2>/dev/null || true && \
    sudo -u postgres psql -c \"GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;\" && \
    echo '  ✅ PostgreSQL танзим шуд!'"

echo ""
echo "🐍 ҚАДАМИ 5: Python Virtual Environment ва Django..."
echo "-----------------------------------------------------"

run_ssh "cd /var/www/chocoberry && \
    python3 -m venv venv && \
    venv/bin/pip install --upgrade pip -q && \
    venv/bin/pip install -r requirements.txt -q && \
    venv/bin/pip install psycopg2-binary gunicorn -q && \
    echo '  ✅ Python пакетҳо насб шуданд!'"

echo ""
echo "⚙️  ҚАДАМИ 6: Django миграция ва суперюзер..."
echo "----------------------------------------------"

run_ssh "cd /var/www/chocoberry && \
    venv/bin/python manage.py migrate --run-syncdb && \
    echo 'from django.contrib.auth.models import User; User.objects.filter(username=\"admin\").delete(); User.objects.create_superuser(\"admin\", \"admin@chocoberry.tj\", \"Admin2026!\")' | venv/bin/python manage.py shell && \
    venv/bin/python manage.py collectstatic --noinput -q && \
    echo '  ✅ Django танзим шуд! Admin: admin / Admin2026!'"

echo ""
echo "🌐 ҚАДАМИ 7: Frontend (Next.js) насб мекунем..."
echo "-------------------------------------------------"

run_ssh "cd /var/www/chocoberry/kfc-clone && \
    npm install --silent && \
    NODE_OPTIONS='--max-old-space-size=1024' npm run build && \
    echo '  ✅ Frontend build шуд!'"

echo ""
echo "📋 ҚАДАМИ 8: Systemd сервисҳо месозем..."
echo "------------------------------------------"

# Backend service
run_ssh "cat > /etc/systemd/system/chocoberry.service << 'EOF'
[Unit]
Description=Chocoberry Django Backend
After=network.target postgresql.service

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/chocoberry
ExecStart=/var/www/chocoberry/venv/bin/gunicorn chocoberry_backend.wsgi:application --bind 0.0.0.0:8000 --workers 3 --timeout 120
Restart=always
RestartSec=5
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target
EOF"

# Frontend service
run_ssh "cat > /etc/systemd/system/chocoberry-frontend.service << 'EOF'
[Unit]
Description=Chocoberry Next.js Frontend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/chocoberry/kfc-clone
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=NODE_OPTIONS=--max-old-space-size=512

[Install]
WantedBy=multi-user.target
EOF"

run_ssh "systemctl daemon-reload && \
    systemctl enable chocoberry chocoberry-frontend && \
    systemctl start chocoberry && sleep 3 && \
    systemctl start chocoberry-frontend && sleep 3 && \
    systemctl is-active chocoberry && \
    systemctl is-active chocoberry-frontend && \
    echo '  ✅ Сервисҳо кор мекунанд!'"

echo ""
echo "🌍 ҚАДАМИ 9: Nginx танзим мекунем..."
echo "--------------------------------------"

run_ssh "cat > /etc/nginx/sites-available/chocoberry << 'EOF'
server {
    listen 80;
    server_name chocoberry.tj www.chocoberry.tj;

    client_max_body_size 50M;

    # Frontend
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300;
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300;
    }

    # Django Admin
    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Static & Media files
    location /static/ {
        alias /var/www/chocoberry/staticfiles/;
        expires 30d;
    }

    location /media/ {
        alias /var/www/chocoberry/media/;
        expires 30d;
    }
}
EOF

ln -sf /etc/nginx/sites-available/chocoberry /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx && systemctl enable nginx && \
echo '  ✅ Nginx танзим шуд!'"

echo ""
echo "🔒 ҚАДАМИ 10: SSL/HTTPS бо Let's Encrypt..."
echo "---------------------------------------------"

run_ssh "certbot --nginx -d chocoberry.tj -d www.chocoberry.tj \
    --non-interactive --agree-tos \
    --email admin@chocoberry.tj \
    --redirect && \
    echo '  ✅ HTTPS насб шуд!' || \
    echo '  ⚠️  HTTPS хато дод - баъдтар iҷро кун'"

echo ""
echo "🔍 ҚАДАМИ 11: Санҷиши ниҳоӣ..."
echo "---------------------------------"

run_ssh "echo '--- Ҳолати сервисҳо ---' && \
    systemctl is-active chocoberry && echo 'Backend: ✅ ACTIVE' || echo 'Backend: ❌ FAILED' && \
    systemctl is-active chocoberry-frontend && echo 'Frontend: ✅ ACTIVE' || echo 'Frontend: ❌ FAILED' && \
    systemctl is-active nginx && echo 'Nginx: ✅ ACTIVE' || echo 'Nginx: ❌ FAILED' && \
    systemctl is-active postgresql && echo 'PostgreSQL: ✅ ACTIVE' || echo 'PostgreSQL: ❌ FAILED' && \
    echo '' && \
    echo '--- API санҷиш ---' && \
    curl -s -o /dev/null -w 'Backend API: %{http_code}\n' http://127.0.0.1:8000/api/products/ && \
    curl -s -o /dev/null -w 'Frontend: %{http_code}\n' http://127.0.0.1:3000/"

echo ""
echo "============================================"
echo "  ✅ НАСБ ТАМОМ ШУД!"
echo "============================================"
echo "  🌐 Сайт: https://chocoberry.tj"
echo "  🔧 Django Admin: https://chocoberry.tj/admin/"
echo "  👤 Admin логин: admin"
echo "  🔑 Admin пароль: Admin2026!"
echo "============================================"
echo ""
echo "  ⚠️  DNS танзим: chocoberry.tj → 212.193.24.67"
echo "  (Агар DNS ҳоло ба IP-и қадим ишора кунад,"
echo "   дар панели домен IP-ро иваз кун)"
echo "============================================"








