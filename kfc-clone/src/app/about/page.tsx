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
    <div className="min-h-screen flex flex-col" style={{ background: "var(--page-bg,#fff1f2)" }}>
      <style>{`
        :root { --page-bg: #fff1f2; }
        html.dark { --page-bg: #0d0505; }
        .page-card { background: #ffffff; }
        html.dark .page-card { background: #1e1414 !important; color: #f3f4f6 !important; }
        .page-card-gradient { background: linear-gradient(135deg,#fee2e2,#fce7f3); }
        html.dark .page-card-gradient { background: #2a1010 !important; }
        .page-text-body { color: #374151; }
        html.dark .page-text-body { color: #d1d5db !important; }
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
            🍫
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white drop-shadow-lg">О Choco Berry</h1>
            <p className="text-white/70 text-sm mt-0.5">Клубника в шоколаде с любовью</p>
          </div>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 pt-8 pb-28 sm:pb-16">
        <div className="max-w-4xl mx-auto">

          {/* История */}
          <section className="page-card rounded-2xl shadow-xl p-8 mb-8">
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
              className="page-text-body text-lg leading-relaxed mb-4"
              isSuperuser={isSuperuser}
            />
            <EditableText
              value="Каждое наше изделие готовится вручную с использованием только свежих ингредиентов. Мы тщательно отбираем каждую ягоду и используем только качественный шоколад премиум-класса."
              contentKey="history_text2"
              page="about"
              tag="p"
              className="page-text-body text-lg leading-relaxed"
              isSuperuser={isSuperuser}
            />
          </section>

          {/* Ценности */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="page-card-gradient rounded-xl p-6 text-center shadow-lg">
              <div className="text-5xl mb-4">🍫</div>
              <h3 className="text-xl font-bold text-red-700 mb-2">Качество</h3>
              <p className="page-text-body">
                Только лучшие ингредиенты и проверенные рецепты
              </p>
            </div>
            <div className="page-card-gradient rounded-xl p-6 text-center shadow-lg">
              <div className="text-5xl mb-4">❤️</div>
              <h3 className="text-xl font-bold text-red-700 mb-2">Любовь</h3>
              <p className="page-text-body">
                Каждое изделие создается с заботой и вниманием
              </p>
            </div>
            <div className="page-card-gradient rounded-xl p-6 text-center shadow-lg">
              <div className="text-5xl mb-4">✨</div>
              <h3 className="text-xl font-bold text-red-700 mb-2">Уникальность</h3>
              <p className="page-text-body">
                Эксклюзивные рецепты и авторские композиции
              </p>
            </div>
          </section>

          {/* Команда */}
          <section className="page-card rounded-2xl shadow-xl p-8">
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
              className="page-text-body text-lg leading-relaxed"
              isSuperuser={isSuperuser}
            />
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

