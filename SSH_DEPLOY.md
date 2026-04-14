# Инструкция по деплою через SSH

## Доступные скрипты:

### 1. `deploy_ssh.sh` - С паролем
Использует пароль для подключения (требует `sshpass`)

```bash
bash deploy_ssh.sh
```

**Что делает:**
- Копирует все файлы проекта на сервер
- Отправляет скрипт деплоя
- Запускает деплой на сервере
- Проверяет статус сервисов

### 2. `deploy_ssh_key.sh` - С SSH ключом (рекомендуется)
Использует SSH ключ (безопаснее, не требует пароль)

```bash
bash deploy_ssh_key.sh
```

**Требования:**
- Настроенный SSH ключ на сервере
- Если ключа нет, создайте: `ssh-keygen -t ed25519`
- Добавьте на сервер: `ssh-copy-id root@37.252.17.34`

### 3. `deploy_to_server.sh` - Только на сервере
Запускается непосредственно на сервере

```bash
# На сервере:
cd /var/www/chocoberry
bash deploy_to_server.sh
```

## Быстрый старт:

### Вариант 1: С паролем
```bash
# Установите sshpass (если нет)
sudo apt-get install sshpass  # Linux
brew install hudochenkov/sshpass/sshpass  # Mac

# Запустите деплой
bash deploy_ssh.sh
```

### Вариант 2: С SSH ключом
```bash
# 1. Создайте ключ (если нет)
ssh-keygen -t ed25519

# 2. Добавьте на сервер
ssh-copy-id root@37.252.17.34

# 3. Запустите деплой
bash deploy_ssh_key.sh
```

## Что происходит при деплое:

1. ✅ Копирование файлов на сервер (исключая node_modules, venv, .git)
2. ✅ Отправка скрипта деплоя
3. ✅ Обновление Python зависимостей
4. ✅ Миграции Django
5. ✅ Загрузка продуктов и подарочных боксов
6. ✅ Перезапуск Gunicorn (Django)
7. ✅ Обновление Next.js
8. ✅ Перезапуск Next.js сервиса
9. ✅ Перезапуск Nginx

## Проверка после деплоя:

```bash
# Подключитесь к серверу
ssh root@37.252.17.34

# Проверьте статус
systemctl status chocoberry
systemctl status chocoberry-frontend
systemctl status nginx

# Посмотрите логи
journalctl -u chocoberry -f
journalctl -u chocoberry-frontend -f
```

## Изменение конфигурации:

Отредактируйте переменные в начале скрипта:
- `SERVER_IP` - IP адрес сервера
- `SERVER_USER` - пользователь (обычно root)
- `SERVER_PASSWORD` - пароль (только для deploy_ssh.sh)
- `PROJECT_DIR` - путь к проекту на сервере

## Устранение проблем:

### Ошибка подключения
```bash
# Проверьте доступность сервера
ping 37.252.17.34

# Проверьте SSH
ssh root@37.252.17.34
```

### Ошибка sshpass
```bash
# Установите sshpass
sudo apt-get install sshpass
```

### Ошибка прав доступа
```bash
# На сервере проверьте права
ls -la /var/www/chocoberry
chown -R www-data:www-data /var/www/chocoberry
```










