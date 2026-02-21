# Настройка Git Remote репозитория

## Проблема
При выполнении `git push` возникает ошибка: "Не настроена точка назначения для отправки"

## Решение

### Вариант 1: GitHub (рекомендуется)

1. **Создайте репозиторий на GitHub:**
   - Зайдите на https://github.com
   - Нажмите "+" → "New repository"
   - Назовите репозиторий (например, `chocoberry`)
   - НЕ добавляйте README, .gitignore или лицензию
   - Нажмите "Create repository"

2. **Подключите локальный репозиторий:**
   ```bash
   # Если используете HTTPS
   git remote add origin https://github.com/ВАШ_USERNAME/chocoberry.git
   
   # Или если используете SSH
   git remote add origin git@github.com:ВАШ_USERNAME/chocoberry.git
   ```

3. **Отправьте код:**
   ```bash
   git push -u origin master
   ```
   
   Если ваша ветка называется `main`:
   ```bash
   git branch -M main
   git push -u origin main
   ```

### Вариант 2: Использование скрипта

Я создал скрипт для автоматической настройки:

```bash
bash setup_git_remote.sh https://github.com/ВАШ_USERNAME/chocoberry.git
```

Затем:
```bash
git push -u origin master
```

### Вариант 3: GitLab или другой сервис

Аналогично, просто замените URL на URL вашего репозитория:
```bash
git remote add origin <URL_вашего_репозитория>
git push -u origin master
```

## Проверка

Проверить настроенный remote:
```bash
git remote -v
```

## Полезные команды

- `git remote -v` - показать все remote репозитории
- `git remote remove origin` - удалить remote
- `git remote set-url origin <новый_URL>` - изменить URL remote
- `git push` - отправить изменения (после первого push с -u)
- `git pull` - получить изменения с remote

