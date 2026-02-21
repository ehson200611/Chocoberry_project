import requests
import os
from django.conf import settings

TELEGRAM_BOT_TOKEN = "8528672956:AAEUqBRbi17A-9lRfA-KRltQByodb7UKQ-k"
TELEGRAM_API_URL = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}"

def send_order_to_telegram(order, user_profile):
    """
    Отправляет заказ в Telegram
    """
    try:
        # Формируем сообщение
        message = f"🍓 <b>Новый заказ #{order.id}</b>\n\n"
        message += f"👤 <b>Клиент:</b>\n"
        message += f"Имя: {user_profile.name}\n"
        message += f"Телефон: {user_profile.phone}\n"
        message += f"Адрес: {user_profile.address}\n\n"
        message += f"🛒 <b>Заказ:</b>\n"
        
        for item in order.items:
            product_name = item.get('name', 'Неизвестный товар')
            quantity = item.get('quantity', 0)
            price = item.get('price', 0)
            total = item.get('total', 0)
            message += f"• {product_name} x{quantity} = {total} сомони\n"
        
        message += f"\n💰 <b>Итого: {order.total_price} сомони</b>\n"
        message += f"\n📅 {order.created_at.strftime('%d.%m.%Y %H:%M')}"
        
        # Отправляем сообщение
        # Chat ID пользователя
        chat_id = os.getenv('TELEGRAM_CHAT_ID', '1617694108')
        
        url = f"{TELEGRAM_API_URL}/sendMessage"
        data = {
            'chat_id': chat_id,
            'text': message,
            'parse_mode': 'HTML'
        }
        
        response = requests.post(url, json=data, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            if result.get('ok'):
                message_id = result.get('result', {}).get('message_id')
                return message_id
        else:
            print(f"Telegram API error: {response.status_code} - {response.text}")
            return None
            
    except Exception as e:
        print(f"Error sending to Telegram: {str(e)}")
        return None

