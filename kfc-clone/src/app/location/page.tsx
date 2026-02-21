"use client";

import { useState, useEffect } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import EditableText from "../../components/EditableText";
import { authApi, User } from "../../services/api";

export default function Location() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const user = await authApi.getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const isSuperuser = currentUser?.is_superuser || false;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-red-50 via-rose-50 to-pink-50">
      <Header />
      <main className="flex-1 container mx-auto px-4 pt-12 pb-28 sm:pb-16">
        <div className="max-w-4xl mx-auto">
          {/* Заголовок */}
          <div className="text-center mb-12">
            <EditableText
              value="Наш адрес"
              contentKey="location_title"
              page="location"
              tag="h1"
              className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-4 inline-block"
              isSuperuser={isSuperuser}
            />
            <EditableText
              value="Приходите к нам или заказывайте доставку"
              contentKey="location_subtitle"
              page="location"
              tag="p"
              className="text-xl text-red-700 font-semibold"
              isSuperuser={isSuperuser}
            />
          </div>

          {/* Карта и информация */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Карта */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="h-64 bg-gradient-to-br from-red-200 to-pink-200 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">📍</div>
                  <p className="text-red-700 font-semibold text-lg">Карта</p>
                </div>
              </div>
            </div>

            {/* Контактная информация */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <EditableText
                value="Контакты"
                contentKey="contacts_title"
                page="location"
                tag="h2"
                className="text-2xl font-bold text-red-600 mb-6"
                isSuperuser={isSuperuser}
              />
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">📍</div>
                  <div>
                    <h3 className="font-bold text-gray-800 mb-1">Адрес</h3>
                    <p className="text-gray-600">Душанбе, Таджикистан</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="text-3xl">📞</div>
                  <div>
                    <h3 className="font-bold text-gray-800 mb-1">Телефон</h3>
                    <p className="text-gray-600">+992 (93) 123-45-67</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="text-3xl">📧</div>
                  <div>
                    <h3 className="font-bold text-gray-800 mb-1">Email</h3>
                    <p className="text-gray-600">info@chocoberry.tj</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="text-3xl">🕐</div>
                  <div>
                    <h3 className="font-bold text-gray-800 mb-1">Режим работы</h3>
                    <p className="text-gray-600">Пн-Вс: 09:00 - 22:00</p>
                    <p className="text-gray-600">Доставка: круглосуточно</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Доставка */}
          <section className="bg-gradient-to-r from-red-100 to-pink-100 rounded-2xl shadow-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <span>🚚</span>
              <EditableText
                value="Доставка"
                contentKey="delivery_title"
                page="location"
                tag="h2"
                className="text-3xl font-bold text-red-600"
                isSuperuser={isSuperuser}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-md">
                <h3 className="text-xl font-bold text-red-700 mb-3">По городу</h3>
                <p className="text-gray-700 mb-2">Доставка в течение 30-60 минут</p>
                <p className="text-red-600 font-semibold">Бесплатно при заказе от 100 сомони</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-md">
                <h3 className="text-xl font-bold text-red-700 mb-3">Самовывоз</h3>
                <p className="text-gray-700 mb-2">Заберите заказ в нашем кафе</p>
                <p className="text-red-600 font-semibold">Готово через 15-20 минут</p>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

