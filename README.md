# Chocoberry - Интернет-магазин десертов

Полнофункциональное веб-приложение для заказа десертов Chocoberry с React/Next.js фронтендом и Django REST Framework backend.

## Структура проекта

```
choco_react/
├── kfc-clone/          # Next.js фронтенд
└── chocoberry_backend/ # Django backend
```

## Фронтенд (Next.js)

### Установка и запуск

```bash
cd kfc-clone
npm install
npm run dev
```

Приложение будет доступно на `http://localhost:3000`

### Особенности

- ✅ Адаптивный дизайн (2 продукта в ряд на мобильных)
- ✅ Креативный UI с анимациями
- ✅ Интеграция с Django API
- ✅ Корзина покупок
- ✅ Современный дизайн с градиентами

## Backend (Django + DRF)

### Установка и запуск

1. Создайте виртуальное окружение:
```bash
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# или
venv\Scripts\activate  # Windows
```

2. Установите зависимости:
```bash
pip install -r requirements.txt
```

3. Выполните миграции:
```bash
python manage.py makemigrations
python manage.py migrate
```

4. Создайте суперпользователя (опционально):
```bash
python manage.py createsuperuser
```

5. Запустите сервер:
```bash
python manage.py runserver
```

API будет доступно на `http://localhost:8000/api/`

### API Endpoints

- `GET /api/products/` - Список всех продуктов
- `GET /api/products/{id}/` - Детали продукта
- `POST /api/products/` - Создать новый продукт
- `PATCH /api/products/{id}/` - Обновить продукт
- `DELETE /api/products/{id}/` - Удалить продукт

### Админ панель

Доступна на `http://localhost:8000/admin/` после создания суперпользователя.

## Переменные окружения

Для фронтенда создайте файл `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## Разработка

### Добавление продуктов через админ панель

1. Запустите Django сервер
2. Перейдите на `/admin/`
3. Войдите как суперпользователь
4. Добавьте продукты в разделе "Products"

### Добавление продуктов через API

```bash
curl -X POST http://localhost:8000/api/products/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Новый продукт",
    "description": "Описание продукта",
    "price": "99.00",
    "image": "/images/product.jpg"
  }'
```

## Технологии

### Frontend
- Next.js 15
- React 19
- TypeScript
- Tailwind CSS

### Backend
- Django 5.2
- Django REST Framework
- Django CORS Headers
- SQLite (для разработки)





# Chocoberry_project
# Chocoberry_project
