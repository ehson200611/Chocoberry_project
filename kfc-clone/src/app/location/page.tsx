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
    <div className="min-h-screen flex flex-col" style={{ background: "var(--page-bg,#fff1f2)" }}>
      <style>{`
        :root { --page-bg: #fff1f2; }
        html.dark { --page-bg: #0d0505; }
        .page-card { background: #ffffff; }
        html.dark .page-card { background: #1e1414 !important; color: #f3f4f6 !important; }
        .page-card-light { background: linear-gradient(135deg,#fee2e2,#fce7f3); }
        html.dark .page-card-light { background: #2a1010 !important; }
        .page-text-body { color: #374151; }
        html.dark .page-text-body { color: #d1d5db !important; }
        .page-label { color: #1f2937; font-weight: 700; }
        html.dark .page-label { color: #f3f4f6 !important; }
        .page-subtext { color: #4b5563; }
        html.dark .page-subtext { color: #9ca3af !important; }
        .delivery-card { background: #ffffff; }
        html.dark .delivery-card { background: #2a1010 !important; }
      `}</style>
      <Header />

      {/* Hero Banner */}
      <div
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,#9b0000 0%,#dc2626 45%,#db2777 100%)" }}
      >
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
        <div className="absolute -bottom-12 -left-12 w-44 h-44 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
        <div className="relative container mx-auto px-4 py-8 flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-xl flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)" }}
          >
            📍
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white drop-shadow-lg">Наш адрес</h1>
            <p className="text-white/70 text-sm mt-0.5">Приходите к нам или заказывайте доставку</p>
          </div>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 pt-8 pb-28 sm:pb-16">
        <div className="max-w-4xl mx-auto">

          {/* Карта и информация */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Карта */}
            <div className="page-card rounded-2xl shadow-xl overflow-hidden">
              <iframe
                src="https://maps.google.com/maps?q=Chocoberry+Dushanbe+Tajikistan&output=embed&hl=ru"
                width="100%"
                height="256"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Chocoberry на карте"
              ></iframe>
            </div>

            {/* Контактная информация */}
            <div className="page-card rounded-2xl shadow-xl p-8">
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
                    <h3 className="page-label mb-1">Адрес</h3>
                    <a
                      href="https://maps.app.goo.gl/chocoberry"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-red-600 hover:underline font-medium"
                    >
                      Душанбе, Таджикистан
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="text-3xl">📞</div>
                  <div>
                    <h3 className="page-label mb-1">Телефон</h3>
                    <a href="tel:+992501077703" className="text-red-600 hover:underline font-medium">
                      +992 501 07 77 03
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="text-3xl">📧</div>
                  <div>
                    <h3 className="page-label mb-1">Email</h3>
                    <p className="page-subtext">info@chocoberry.tj</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="text-3xl">🕐</div>
                  <div>
                    <h3 className="page-label mb-1">Режим работы</h3>
                    <p className="page-subtext">Пн-Вс: 09:00 - 22:00</p>
                    <p className="page-subtext">Доставка: круглосуточно</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Доставка */}
          <section className="page-card-light rounded-2xl shadow-xl p-8">
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
              <div className="delivery-card rounded-xl p-6 shadow-md">
                <h3 className="text-xl font-bold text-red-700 mb-3">По городу</h3>
                <p className="page-subtext mb-2">Доставка в течение 30-60 минут</p>
                <p className="text-red-600 font-semibold">Бесплатно при заказе от 100 сомони</p>
              </div>
              <div className="delivery-card rounded-xl p-6 shadow-md">
                <h3 className="text-xl font-bold text-red-700 mb-3">Самовывоз</h3>
                <p className="page-subtext mb-2">Заберите заказ в нашем кафе</p>
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

