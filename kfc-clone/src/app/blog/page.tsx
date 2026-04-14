"use client";

import { useState, useEffect } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import EditableText from "../../components/EditableText";
import EditableImage from "../../components/EditableImage";
import Link from "next/link";
import { authApi, User } from "../../services/api";

export default function Blog() {
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
  const blogPosts = [
    {
      id: 1,
      title: "Новинка: Микс бокс с дубайской ночинки",
      date: "15 декабря 2024",
      excerpt: "Попробуйте наш новый микс бокс с вафлями, шоколадом, зелёным соусом, киви и клубникой!",
      emoji: "🍓",
      category: "Новинки"
    },
    {
      id: 2,
      title: "Как правильно хранить клубнику в шоколаде",
      date: "10 декабря 2024",
      excerpt: "Полезные советы по хранению наших сладостей, чтобы они оставались свежими и вкусными.",
      emoji: "💡",
      category: "Советы"
    },
    {
      id: 3,
      title: "История создания Choco Berry",
      date: "5 декабря 2024",
      excerpt: "Узнайте, как появилась идея создать кафе с клубникой в шоколаде и как мы развивались.",
      emoji: "📖",
      category: "История"
    },
    {
      id: 4,
      title: "Топ-5 самых популярных десертов",
      date: "1 декабря 2024",
      excerpt: "Рейтинг самых любимых десертов наших клиентов. Узнайте, что выбирают чаще всего!",
      emoji: "🏆",
      category: "Топы"
    },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--page-bg,#fff1f2)" }}>
      <style>{`
        :root { --page-bg: #fff1f2; }
        html.dark { --page-bg: #0d0505; }
        .page-card { background: #ffffff; }
        html.dark .page-card { background: #1e1414 !important; color: #f3f4f6 !important; }
        .page-card-light { background: linear-gradient(135deg,#fee2e2,#fce7f3); }
        html.dark .page-card-light { background: #2a1010 !important; }
        .page-text-body { color: #4b5563; }
        html.dark .page-text-body { color: #d1d5db !important; }
        .page-text-meta { color: #6b7280; }
        html.dark .page-text-meta { color: #9ca3af !important; }
        .blog-post-border { border-color: transparent; }
        html.dark .blog-post-border { border-color: #3d1515 !important; }
        .blog-divider { border-color: #e5e7eb; }
        html.dark .blog-divider { border-color: #2a2020 !important; }
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
            📖
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white drop-shadow-lg">Наш блог</h1>
            <p className="text-white/70 text-sm mt-0.5">Новости, рецепты и интересные истории</p>
          </div>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 pt-8 pb-28 sm:pb-16">
        <div className="max-w-6xl mx-auto">

          {/* Посты блога */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {blogPosts.map((post, index) => (
              <article
                key={post.id}
                className="page-card blog-post-border group rounded-3xl shadow-2xl overflow-hidden transition-all duration-500 transform hover:-translate-y-2 border-2"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="page-card-light relative p-6 text-center overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-200/20 to-pink-200/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative z-10">
                    <EditableImage
                      defaultEmoji={post.emoji}
                      contentKey={`blog_post_${post.id}_image`}
                      page="blog"
                      className="mb-4"
                      isSuperuser={isSuperuser}
                      alt={post.title}
                    />
                    <EditableText
                      value={post.category}
                      contentKey={`blog_post_${post.id}_category`}
                      page="blog"
                      tag="span"
                      className="inline-block bg-gradient-to-r from-red-600 to-pink-600 text-white px-4 py-2 rounded-full text-xs font-bold mb-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                      isSuperuser={isSuperuser}
                    />
                  </div>
                </div>
                <div className="p-8">
                  <EditableText
                    value={post.title}
                    contentKey={`blog_post_${post.id}_title`}
                    page="blog"
                    tag="h2"
                    className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-4 group-hover:scale-105 transition-transform duration-300"
                    isSuperuser={isSuperuser}
                  />
                  <EditableText
                    value={post.excerpt}
                    contentKey={`blog_post_${post.id}_excerpt`}
                    page="blog"
                    tag="p"
                    className="page-text-body mb-6 text-lg leading-relaxed"
                    isSuperuser={isSuperuser}
                  />
                  <div className="blog-divider flex items-center justify-between pt-4 border-t">
                    <EditableText
                      value={post.date}
                      contentKey={`blog_post_${post.id}_date`}
                      page="blog"
                      tag="span"
                      className="page-text-meta text-sm font-medium"
                      isSuperuser={isSuperuser}
                    />
                    <button className="group/btn relative bg-gradient-to-r from-red-600 to-pink-600 text-white px-6 py-3 rounded-full font-bold text-sm shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-110 active:scale-95 overflow-hidden">
                      <span className="relative z-10 flex items-center gap-2">
                        Читать далее
                        <svg className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-red-600 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Подписка */}
          <section className="relative bg-gradient-to-r from-red-600 via-pink-600 to-red-600 rounded-3xl shadow-2xl p-10 sm:p-12 text-white text-center overflow-hidden">
            {/* Декоративные элементы */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
            
            <div className="relative z-10">
              <EditableText
                value="Подпишитесь на наши новости"
                contentKey="subscription_title"
                page="blog"
                tag="h2"
                className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 text-white drop-shadow-lg"
                isSuperuser={isSuperuser}
              />
              <EditableText
                value="Будьте в курсе всех новинок и специальных предложений"
                contentKey="subscription_text"
                page="blog"
                tag="p"
                className="text-red-100 mb-8 text-lg"
                isSuperuser={isSuperuser}
              />
              <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto mb-8">
                <input
                  type="email"
                  placeholder="Ваш email"
                  className="flex-1 px-6 py-4 rounded-xl text-gray-800 focus:outline-none focus:ring-4 focus:ring-white/50 shadow-lg text-lg font-medium transition-all duration-300"
                />
                <button className="group relative bg-white text-red-600 px-8 py-4 rounded-xl font-bold text-lg shadow-2xl hover:shadow-white/50 transition-all duration-300 transform hover:scale-105 active:scale-95 overflow-hidden">
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Подписаться
                    <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-red-50 to-pink-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              </div>
              <div className="mt-8">
                <a
                  href="https://instagram.com/chocoberry_tjk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/insta inline-flex items-center gap-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-110 hover:shadow-2xl border-2 border-white/30 hover:border-white/50"
                >
                  <svg className="w-6 h-6 transform group-hover/insta:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  <span>Подписаться в Instagram</span>
                </a>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

