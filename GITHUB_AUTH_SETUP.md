# Настройка аутентификации GitHub

## Проблема
```
Authentication failed for 'https://github.com/ehson200611/chocoberry.git/'
Repository not found.
```

## Решение

### Шаг 1: Создайте репозиторий на GitHub

1. Откройте: https://github.com/new
2. Repository name: `chocoberry`
3. Выберите Public или Private
4. **НЕ добавляйте** README, .gitignore или лицензию
5. Нажмите "Create repository"

### Шаг 2: Настройте аутентификацию

GitHub больше не поддерживает пароли для HTTPS. Нужно использовать **Personal Access Token** или **SSH**.

#### Вариант A: Personal Access Token (HTTPS) - Рекомендуется

1. **Создайте Personal Access Token:**
   - Откройте: https://github.com/settings/tokens
   - Нажмите "Generate new token" → "Generate new token (classic)"
   - Название: `chocoberry-local`
   - Выберите срок действия (например, 90 дней или "No expiration")
   - Отметьте права: `repo` (полный доступ к репозиториям)
   - Нажмите "Generate token"
   - **ВАЖНО:** Скопируйте токен сразу (он показывается только один раз!)

2. **Используйте токен вместо пароля:**
   ```bash
   git push -u origin master
   ```
   - Username: `ehson200611`
   - Password: **вставьте ваш Personal Access Token** (не пароль!)

3. **Или сохраните токен в Git:**
   ```bash
   git config --global credential.helper store
   git push -u origin master
   # Введите username и токен один раз, они сохранятся
   ```

#### Вариант B: SSH ключи (более безопасно)

1. **Проверьте, есть ли SSH ключ:**
   ```bash
   ls -la ~/.ssh
   ```

2. **Если нет ключа, создайте его:**
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   # Нажмите Enter для всех вопросов
   ```

3. **Скопируйте публичный ключ:**
   ```bash
   cat ~/.ssh/id_ed25519.pub
   # Скопируйте весь вывод
   ```

4. **Добавьте ключ на GitHub:**
   - Откройте: https://github.com/settings/keys
   - Нажмите "New SSH key"
   - Title: `My Computer`
   - Key: вставьте скопированный ключ
   - Нажмите "Add SSH key"

5. **Измените URL репозитория на SSH:**
   ```bash
   git remote set-url origin git@github.com:ehson200611/chocoberry.git
   git push -u origin master
   ```

### Шаг 3: Отправьте код

После настройки аутентификации:

```bash
git push -u origin master
```

## Быстрая проверка

Проверить текущий remote:
```bash
git remote -v
```

Изменить на SSH (если используете SSH ключи):
```bash
git remote set-url origin git@github.com:ehson200611/chocoberry.git
```

Изменить на HTTPS:
```bash
git remote set-url origin https://github.com/ehson200611/chocoberry.git
```

## Рекомендация

Используйте **Personal Access Token** (Вариант A) - это самый простой способ для начала.

