# Инструкция по деплою Chocoberry на chocoberry.tj

## Быстрый старт

Для деплоя выполните одну команду:

```bash
bash deploy_chocoberry.sh
```

## Что делает скрипт

1. ✅ Проверяет локальный проект
2. ✅ Устанавливает необходимые пакеты на сервере
3. ✅ Копирует проект на сервер
4. ✅ Настраивает Python окружение и устанавливает зависимости
5. ✅ Настраивает Django для продакшена
6. ✅ Настраивает Gunicorn (WSGI сервер)
7. ✅ Настраивает Next.js фронтенд
8. ✅ Настраивает Nginx как reverse proxy
9. ✅ Устанавливает SSL сертификат от Let's Encrypt
10. ✅ Настраивает HTTPS и автоматическое обновление сертификата

## Требования

- Локальная машина с установленным `sshpass` (скрипт установит автоматически)
- Доступ к серверу по SSH
- Домен `chocoberry.tj` должен указывать на IP `37.252.17.34`

## После деплоя

### Проверка статуса сервисов:
```bash
ssh root@37.252.17.34
systemctl status chocoberry
systemctl status chocoberry-frontend
systemctl status nginx
```

### Просмотр логов:
```bash
# Логи Django
journalctl -u chocoberry -f

# Логи Next.js
journalctl -u chocoberry-frontend -f

# Логи Nginx
tail -f /var/log/nginx/chocoberry_error.log
```

### Перезапуск сервисов:
```bash
systemctl restart chocoberry
systemctl restart chocoberry-frontend
systemctl restart nginx
```

## Важные файлы на сервере

- **Проект**: `/var/www/chocoberry`
- **Nginx конфиг**: `/etc/nginx/sites-available/chocoberry`
- **Логи**: `/var/log/chocoberry/`
- **SSL сертификаты**: `/etc/letsencrypt/live/chocoberry.tj/`

## Обновление проекта

Для обновления проекта после изменений:

1. Внесите изменения локально
2. Запустите скрипт деплоя снова (он обновит файлы на сервере)
3. Или вручную:
   ```bash
   # На сервере
   cd /var/www/chocoberry
   git pull  # если используете git
   source venv/bin/activate
   pip install -r requirements.txt
   python manage.py collectstatic --noinput
   python manage.py migrate
   systemctl restart chocoberry
   systemctl restart chocoberry-frontend
   ```

## Проблемы и решения

### SSL сертификат не установился
```bash
ssh root@37.252.17.34
certbot --nginx -d chocoberry.tj -d www.chocoberry.tj
```

### Сервисы не запускаются
```bash
# Проверьте логи
journalctl -u chocoberry -n 50
journalctl -u chocoberry-frontend -n 50

# Проверьте права доступа
chown -R www-data:www-data /var/www/chocoberry
```

### Nginx не запускается
```bash
# Проверьте конфигурацию
nginx -t

# Проверьте логи
tail -f /var/log/nginx/error.log
```

## Контакты

Если возникли проблемы, проверьте:
1. Логи сервисов
2. Конфигурацию Nginx
3. Доступность портов (80, 443, 3000, 8000)
4. DNS настройки домена

