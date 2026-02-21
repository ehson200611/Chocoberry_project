"use client";

import { useState, useEffect } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import EditableText from "../../components/EditableText";
import { authApi, User } from "../../services/api";

export default function About() {
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
              value="О Choco Berry"
              contentKey="about_title"
              page="about"
              tag="h1"
              className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-4 inline-block"
              isSuperuser={isSuperuser}
            />
            <EditableText
              value="Клубника в шоколаде с любовью"
              contentKey="about_subtitle"
              page="about"
              tag="p"
              className="text-xl text-red-700 font-semibold"
              isSuperuser={isSuperuser}
            />
          </div>

          {/* История */}
          <section className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <span>🍓</span>
              <EditableText
                value="Наша история"
                contentKey="history_title"
                page="about"
                tag="h2"
                className="text-3xl font-bold text-red-600"
                isSuperuser={isSuperuser}
              />
            </div>
            <EditableText
              value="Choco Berry — это место, где встречаются свежесть клубники и богатство шоколада. Мы создали этот проект с любовью, чтобы дарить вам незабываемые сладкие моменты."
              contentKey="history_text1"
              page="about"
              tag="p"
              className="text-gray-700 text-lg leading-relaxed mb-4"
              isSuperuser={isSuperuser}
            />
            <EditableText
              value="Каждое наше изделие готовится вручную с использованием только свежих ингредиентов. Мы тщательно отбираем каждую ягоду и используем только качественный шоколад премиум-класса."
              contentKey="history_text2"
              page="about"
              tag="p"
              className="text-gray-700 text-lg leading-relaxed"
              isSuperuser={isSuperuser}
            />
          </section>

          {/* Ценности */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-red-100 to-pink-100 rounded-xl p-6 text-center shadow-lg">
              <div className="text-5xl mb-4">🍫</div>
              <h3 className="text-xl font-bold text-red-700 mb-2">Качество</h3>
              <p className="text-gray-700">
                Только лучшие ингредиенты и проверенные рецепты
              </p>
            </div>
            <div className="bg-gradient-to-br from-pink-100 to-rose-100 rounded-xl p-6 text-center shadow-lg">
              <div className="text-5xl mb-4">❤️</div>
              <h3 className="text-xl font-bold text-red-700 mb-2">Любовь</h3>
              <p className="text-gray-700">
                Каждое изделие создается с заботой и вниманием
              </p>
            </div>
            <div className="bg-gradient-to-br from-rose-100 to-red-100 rounded-xl p-6 text-center shadow-lg">
              <div className="text-5xl mb-4">✨</div>
              <h3 className="text-xl font-bold text-red-700 mb-2">Уникальность</h3>
              <p className="text-gray-700">
                Эксклюзивные рецепты и авторские композиции
              </p>
            </div>
          </section>

          {/* Команда */}
          <section className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <span>👥</span>
              <EditableText
                value="Наша команда"
                contentKey="team_title"
                page="about"
                tag="h2"
                className="text-3xl font-bold text-red-600"
                isSuperuser={isSuperuser}
              />
            </div>
            <EditableText
              value="Мы — команда профессионалов, которые влюблены в свое дело. Наши кондитеры постоянно совершенствуют свои навыки и создают новые вкусные сочетания, чтобы радовать вас каждый день."
              contentKey="team_text"
              page="about"
              tag="p"
              className="text-gray-700 text-lg leading-relaxed"
              isSuperuser={isSuperuser}
            />
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

