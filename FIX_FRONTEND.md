# Исправление проблемы с Next.js

## Что произошло:

✅ **Успешно:**
- Все файлы отправлены на сервер
- Django (Gunicorn) работает нормально
- Все 6 подарочных боксов добавлены в базу данных
- Next.js успешно собрался
- Nginx работает

❌ **Проблема:**
- Сервис `chocoberry-frontend` не запускается
- Процесс Next.js завершается сразу после запуска

## Быстрое исправление:

### Вариант 1: Автоматическое исправление

Отправьте скрипт на сервер и запустите:

```bash
# Отправка скрипта
scp fix_frontend.sh root@37.252.17.34:/var/www/chocoberry/

# Подключение к серверу
ssh root@37.252.17.34

# Запуск исправления
cd /var/www/chocoberry
bash fix_frontend.sh
```

### Вариант 2: Ручное исправление

```bash
# Подключитесь к серверу
ssh root@37.252.17.34

# Остановите сервис
systemctl stop chocoberry-frontend

# Освободите порт (если занят)
fuser -k 3000/tcp

# Проверьте логи
journalctl -u chocoberry-frontend -n 50

# Установите права
chown -R www-data:www-data /var/www/chocoberry/kfc-clone

# Перезапустите
systemctl daemon-reload
systemctl restart chocoberry-frontend

# Проверьте статус
systemctl status chocoberry-frontend
```

### Вариант 3: Запуск вручную для диагностики

```bash
ssh root@37.252.17.34
cd /var/www/chocoberry/kfc-clone

# Запуск от имени www-data
sudo -u www-data NODE_ENV=production PORT=3000 npm start
```

Если запустится - значит проблема в конфигурации systemd.

## Проверка логов:

```bash
# Логи сервиса
journalctl -u chocoberry-frontend -f

# Последние 50 строк
journalctl -u chocoberry-frontend -n 50

# Проверка порта
lsof -i :3000

# Проверка процессов
ps aux | grep next
```

## Возможные причины:

1. **Порт 3000 занят** - другой процесс использует порт
2. **Проблемы с правами** - www-data не может запустить процесс
3. **Проблемы с конфигурацией systemd** - неправильный путь или команда
4. **Недостаточно памяти** - сервер не может запустить процесс

## Проверка конфигурации systemd:

```bash
cat /etc/systemd/system/chocoberry-frontend.service
```

Должно быть примерно так:
```ini
[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/chocoberry/kfc-clone
Environment="NODE_ENV=production"
Environment="PORT=3000"
ExecStart=/usr/bin/npm start
```

## После исправления:

Проверьте, что все работает:
```bash
systemctl status chocoberry
systemctl status chocoberry-frontend
systemctl status nginx

# Проверьте сайт
curl http://localhost:3000
```










