# Быстрый старт Chocoberry

## Проблема: "Не удалось загрузить продукты"

Если вы видите эту ошибку, значит Django backend не запущен или недоступен.

## Решение:

### 1. Запустите Django Backend

Откройте новый терминал и выполните:

```bash
cd "/home/ehson/Рабочий стол/choco_react"
source venv/bin/activate
python manage.py runserver
```

Или используйте скрипт:
```bash
./start_backend.sh
```

Сервер должен запуститься на `http://localhost:8000`

### 2. Проверьте, что API работает

Откройте в браузере: `http://localhost:8000/api/products/`

Вы должны увидеть JSON с продуктами.

### 3. Убедитесь, что фронтенд запущен

В другом терминале:
```bash
cd kfc-clone
npm run dev
```

### 4. Если продукты не загружаются

Проверьте:
- Django сервер запущен на порту 8000
- Нет ошибок в консоли браузера (F12)
- CORS настроен правильно (уже настроено в settings.py)

### 5. Загрузите начальные данные (если нужно)

```bash
python manage.py load_initial_products
```

## Проверка работы API

```bash
# Получить все продукты
curl http://localhost:8000/api/products/

# Создать продукт
curl -X POST http://localhost:8000/api/products/ \
  -H "Content-Type: application/json" \
  -d '{"name":"Тест","description":"Описание","price":"99.00","image":""}'
```

## Админ панель

1. Создайте суперпользователя:
```bash
python manage.py createsuperuser
```

2. Откройте: http://localhost:8000/admin/

3. Войдите и управляйте продуктами через админ-панель





