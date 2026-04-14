import requests
import os

# Бот для заказов
TELEGRAM_BOT_TOKEN = "8528672956:AAEUqBRbi17A-9lRfA-KRltQByodb7UKQ-k"
TELEGRAM_API_URL = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}"

# Бот для уведомлений о сообщениях поддержки
TELEGRAM_SUPPORT_BOT_TOKEN = "8621662057:AAHMruOmqtrLnfmC7R6Lgqs-6RSmvMou2bU"
TELEGRAM_SUPPORT_API_URL = f"https://api.telegram.org/bot{TELEGRAM_SUPPORT_BOT_TOKEN}"

# Группа для получения заказов
GROUP_CHAT_ID = "-5038700988"

# Группа для сообщений поддержки
SUPPORT_GROUP_CHAT_ID = "-1003374305485"

STATUS_LABELS = {
    'pending':    '⏳ Ожидает',
    'confirmed':  '✅ Одобрен',
    'preparing':  '🍳 Готовится',
    'delivering': '🚗 Доставляется',
    'completed':  '🎉 Завершён',
    'cancelled':  '❌ Отменён',
}


def build_order_keyboard(order_id, current_status):
    """Инлайн-клавиатура для управления статусом заказа"""
    buttons = []

    if current_status not in ('confirmed', 'completed', 'cancelled'):
        row1 = []
        if current_status != 'confirmed':
            row1.append({"text": "✅ Одобрить",    "callback_data": f"order_{order_id}_confirmed"})
        if current_status != 'preparing':
            row1.append({"text": "🍳 Готовится",   "callback_data": f"order_{order_id}_preparing"})
        if row1:
            buttons.append(row1)

    row2 = []
    if current_status not in ('delivering', 'completed', 'cancelled'):
        row2.append({"text": "🚗 Доставляется", "callback_data": f"order_{order_id}_delivering"})
    if current_status != 'completed':
        row2.append({"text": "🎉 Завершён",     "callback_data": f"order_{order_id}_completed"})
    if current_status != 'cancelled':
        row2.append({"text": "❌ Отменить",     "callback_data": f"order_{order_id}_cancelled"})
    if row2:
        buttons.append(row2)

    return {"inline_keyboard": buttons}


def build_order_message(order, user_profile, status=None):
    """Формирует текст сообщения о заказе"""
    current_status = status or order.status
    status_label = STATUS_LABELS.get(current_status, current_status)

    msg = f"🍓 <b>Новый заказ #{order.id}</b>  |  {status_label}\n\n"
    msg += f"👤 <b>Клиент:</b>\n"
    msg += f"  Имя: <b>{user_profile.name}</b>\n"
    msg += f"  Телефон: <b>{user_profile.phone}</b>\n"
    msg += f"  Адрес: {user_profile.address}\n\n"
    msg += f"🛒 <b>Состав заказа:</b>\n"

    for item in order.items:
        product_name = item.get('name', '?')
        quantity     = item.get('quantity', 0)
        total        = item.get('total', item.get('price', 0))
        msg += f"  • {product_name}  ×{quantity}  —  {total} с.\n"

    msg += f"\n💰 <b>Итого: {order.total_price} сомони</b>\n"
    msg += f"📅 {order.created_at.strftime('%d.%m.%Y %H:%M')}"
    return msg


def send_order_to_telegram(order, user_profile):
    """Отправляет новый заказ в группу с кнопками управления"""
    try:
        text     = build_order_message(order, user_profile)
        keyboard = build_order_keyboard(order.id, order.status)

        response = requests.post(
            f"{TELEGRAM_API_URL}/sendMessage",
            json={
                "chat_id":      GROUP_CHAT_ID,
                "text":         text,
                "parse_mode":   "HTML",
                "reply_markup": keyboard,
            },
            timeout=10,
        )

        if response.status_code == 200:
            result = response.json()
            if result.get("ok"):
                return result["result"]["message_id"]
            else:
                print(f"Telegram error: {result}")
        else:
            print(f"Telegram HTTP {response.status_code}: {response.text}")
        return None

    except Exception as e:
        print(f"send_order_to_telegram error: {e}")
        return None


def update_order_message(order, user_profile, new_status):
    """Редактирует сообщение в группе при смене статуса"""
    if not order.telegram_message_id:
        return False
    try:
        text     = build_order_message(order, user_profile, status=new_status)
        keyboard = build_order_keyboard(order.id, new_status)

        response = requests.post(
            f"{TELEGRAM_API_URL}/editMessageText",
            json={
                "chat_id":      GROUP_CHAT_ID,
                "message_id":   int(order.telegram_message_id),
                "text":         text,
                "parse_mode":   "HTML",
                "reply_markup": keyboard,
            },
            timeout=10,
        )
        return response.status_code == 200
    except Exception as e:
        print(f"update_order_message error: {e}")
        return False


def answer_callback(callback_query_id, text="✅"):
    """Убирает 'часики' на кнопке после нажатия"""
    try:
        requests.post(
            f"{TELEGRAM_API_URL}/answerCallbackQuery",
            json={"callback_query_id": callback_query_id, "text": text},
            timeout=5,
        )
    except Exception:
        pass


def notify_admin_new_message(user, message_text):
    """Уведомляет группу о новом сообщении от клиента (использует бот поддержки)"""
    try:
        name = ""
        try:
            name = user.profile.name or user.username
        except Exception:
            name = user.username

        text = (
            f"💬 <b>Новое сообщение от клиента</b>\n\n"
            f"👤 <b>{name}</b> (@{user.username})\n"
            f"📩 {message_text}"
        )
        # Используем бот поддержки для сообщений в группу поддержки
        print(f"Sending support message via bot {TELEGRAM_SUPPORT_BOT_TOKEN[:10]}... to chat {SUPPORT_GROUP_CHAT_ID}")
        response = requests.post(
            f"{TELEGRAM_SUPPORT_API_URL}/sendMessage",
            json={"chat_id": SUPPORT_GROUP_CHAT_ID, "text": text, "parse_mode": "HTML"},
            timeout=8,
        )
        print(f"Support bot response: {response.status_code}, {response.text}")
        if response.status_code != 200:
            result = response.json()
            print(f"Telegram support bot error: {result}")
    except Exception as e:
        print(f"notify_admin_new_message error: {e}")
        import traceback
        traceback.print_exc()


def set_webhook(webhook_url):
    """Регистрирует webhook у Telegram"""
    try:
        r = requests.post(
            f"{TELEGRAM_API_URL}/setWebhook",
            json={"url": webhook_url, "allowed_updates": ["callback_query", "message"]},
            timeout=10,
        )
        return r.json()
    except Exception as e:
        return {"ok": False, "error": str(e)}


def test_support_bot():
    """Тестовая функция для проверки работы бота поддержки"""
    try:
        response = requests.post(
            f"{TELEGRAM_SUPPORT_API_URL}/sendMessage",
            json={
                "chat_id": SUPPORT_GROUP_CHAT_ID,
                "text": "🧪 Тестовое сообщение от бота поддержки",
                "parse_mode": "HTML"
            },
            timeout=8,
        )
        print(f"Test response: {response.status_code}")
        print(f"Test response body: {response.text}")
        return response.json()
    except Exception as e:
        print(f"Test error: {e}")
        return {"ok": False, "error": str(e)}
