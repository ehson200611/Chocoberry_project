"use client";

import { useEffect, useState } from "react";
import { Product } from "../context/CartContext";
import ProductCard from "../components/ProductCard";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Cart from "../components/Cart";
import NewItemsCarousel from "../components/NewItemsCarousel";
import EditableText from "../components/EditableText";
import { api, ApiProduct, newItemsApi, NewItem, authApi, User } from "../services/api";

// ─── Gift Box Card ───────────────────────────────────────────────────────────
import { useCart } from "../context/CartContext";
import Image from "next/image";

const GIFT_THEMES = [
  { bg: "linear-gradient(135deg,#1a0533,#6b21a8,#a855f7)", glow: "#a855f7" },
  { bg: "linear-gradient(135deg,#1a0020,#9b0050,#ec4899)", glow: "#ec4899" },
  { bg: "linear-gradient(135deg,#001a33,#1d4ed8,#60a5fa)", glow: "#60a5fa" },
  { bg: "linear-gradient(135deg,#1a0a00,#92400e,#f59e0b)", glow: "#f59e0b" },
  { bg: "linear-gradient(135deg,#001a10,#065f46,#34d399)", glow: "#34d399" },
  { bg: "linear-gradient(135deg,#1a0000,#991b1b,#f87171)", glow: "#f87171" },
];

const GIFT_BOX_EMOJIS_MAP: Record<string, string> = {
  "MAMA": "💐", "I LOVE U": "💌", "LOVE": "❤️",
  "Сердце Премиум": "👑", "Красное Сердце": "🌹", "Сердце Классик": "🤍",
};

function GiftBoxCard({ product, idx }: { product: Product; idx: number }) {
  const cart = useCart();
  const theme = GIFT_THEMES[idx % GIFT_THEMES.length];
  const emoji = Object.entries(GIFT_BOX_EMOJIS_MAP).find(([k]) => product.name.includes(k))?.[1] ?? "🎁";

  return (
    <div
      className="relative flex-shrink-0 rounded-3xl overflow-hidden transition-transform hover:-translate-y-2 active:scale-95 cursor-pointer"
      style={{
        background: theme.bg,
        width: "160px",
        minWidth: "160px",
        boxShadow: `0 8px 32px ${theme.glow}40`,
        border: `1px solid ${theme.glow}30`,
      }}
    >
      {/* Glow top */}
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full blur-2xl opacity-40"
        style={{ background: theme.glow }} />

      {/* Badge */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full text-white font-black text-xs"
        style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(6px)" }}>
        🎁 Подарок
      </div>

      {/* Image or Emoji */}
      <div className="relative flex justify-center pt-10 pb-2 z-10">
        {product.image ? (
          <div className="relative w-24 h-24 rounded-2xl overflow-hidden shadow-xl"
            style={{ border: `2px solid ${theme.glow}50` }}>
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="text-5xl select-none" style={{ filter: `drop-shadow(0 0 12px ${theme.glow})` }}>
            {emoji}
          </div>
        )}
      </div>

      {/* Name */}
      <div className="px-3 pb-1 z-10 relative">
        <p className="text-white font-black text-sm text-center leading-tight line-clamp-2">
          {product.name}
        </p>
      </div>

      {/* Price + Button */}
      <div className="px-3 pb-4 pt-2 z-10 relative flex flex-col gap-2">
        <div className="text-center">
          <span className="font-black text-xl" style={{ color: theme.glow, filter: `drop-shadow(0 0 6px ${theme.glow})` }}>
            {product.price}с
          </span>
        </div>
        <button
          onClick={() => cart.addToCart(product)}
          className="w-full py-2 rounded-2xl font-black text-xs text-white transition-all active:scale-95"
          style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.3)" }}
        >
          + В корзину
        </button>
      </div>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

const GIFT_BOX_KEYWORDS = ["MAMA", "I LOVE U", "Бокс \"LOVE\"", "Сердце Премиум", "Красное Сердце", "Сердце Классик"];

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [newItems, setNewItems] = useState<NewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // Параллельно загружаем всё — ошибка одного не блокирует другие
      const [userResult, productsResult, newItemsResult] = await Promise.allSettled([
        authApi.getCurrentUser(),
        api.getProducts(),
        newItemsApi.getNewItems(),
      ]);

      // Пользователь
      if (userResult.status === 'fulfilled') {
        setCurrentUser(userResult.value);
      }

      // Продукты
      if (productsResult.status === 'fulfilled' && productsResult.value.length > 0) {
        const converted: Product[] = productsResult.value.map((p: ApiProduct) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: parseFloat(p.price),
          image: p.image_url || p.image || "",
        }));
        setProducts(converted);
        setError(null);
      } else {
        // Используем данные по умолчанию если API недоступен
        setProducts(getDefaultProducts());
        if (productsResult.status === 'rejected') {
          setError('Не удалось загрузить данные с сервера.');
        }
      }

      // Новинки (независимо от продуктов)
      if (newItemsResult.status === 'fulfilled') {
        setNewItems(newItemsResult.value);
      }

      setLoading(false);
    };
    fetchData();
  }, []);

  const isSuperuser = currentUser?.is_superuser || false;

  const getDefaultProducts = (): Product[] => [
    { id: 1, name: "Большой бокс с вафлями и фруктами", description: "Мини-вафли, бананы, клубника и шоколадный соус", price: 90, image: "/images/large-box-waffles.jpg" },
    { id: 2, name: "Микс бокс с дубайской начинкой", description: "Вафли с шоколадом, зелёным соусом, киви и клубникой", price: 140, image: "/images/mix-box-dubai.jpg" },
    { id: 3, name: "Клубника с дубайской начинкой", description: "Клубника с шоколадом и фисташками в стаканчике", price: 80, image: "/images/strawberry-dubai.jpg" },
    { id: 4, name: "Вафли с фруктами", description: "Мини-вафли с бананами и клубникой в шоколаде", price: 30, image: "/images/waffles-fruits.jpg" },
  ];

  const features = [
    { icon: "🚀", title: "Быстрая доставка", sub: "По всему Душанбе" },
    { icon: "🍓", title: "Свежие продукты", sub: "Каждый день" },
    { icon: "🍫", title: "Бельгийский шоколад", sub: "Премиум качество" },
    { icon: "🎁", title: "Красивая упаковка", sub: "Идеально в подарок" },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--pg-bg, #fff1f2)" }}>
      <style>{`
        :root { --pg-bg: #fff1f2; }
        html.dark { --pg-bg: #0d0505; }
        .home-card { background: #fff; border: 1px solid #fee2e2; }
        html.dark .home-card { background: #1e1414; border-color: #3d1a1a; }
        .feat-card { background: #fff; }
        html.dark .feat-card { background: #1e1414; border-color: #3d1a1a; }
        .feat-title { color: #1f2937; }
        html.dark .feat-title { color: #f3f4f6; }
        .feat-sub { color: #6b7280; }
        html.dark .feat-sub { color: #9ca3af; }
        .section-title { color: #9b0000; }
        html.dark .section-title { color: #fca5a5; }
        .section-sub { color: #6b7280; }
        html.dark .section-sub { color: #9ca3af; }
        .divider-line { background: linear-gradient(to right, transparent, #dc2626, transparent); }
      `}</style>

      <Header />

      <main className="flex-1 pb-28 sm:pb-12">

        {/* ══════════ HERO BANNER ══════════ */}
        <div
          className="relative overflow-hidden"
          style={{ background: "linear-gradient(135deg,#6b0000 0%,#9b0000 30%,#dc2626 60%,#db2777 100%)" }}
        >
          {/* Декоративные круги */}
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }} />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }} />
          <div className="absolute top-8 left-1/3 w-48 h-48 rounded-full" style={{ background: "rgba(255,255,255,0.03)" }} />

          <div className="relative container mx-auto px-4 py-12 sm:py-16 flex flex-col sm:flex-row items-center gap-6">
            {/* Left text */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight mb-3 drop-shadow-lg">
                Клубника<br />
                <span style={{ color: "#fde8f0" }}>в шоколаде</span>
              </h1>
              <p className="text-white/75 text-base sm:text-lg mb-6 max-w-md">
                Свежая клубника, бельгийский шоколад и фирменные десерты — созданы с любовью для вас
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center sm:justify-start">
                <a
                  href="#catalog"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl font-black text-base shadow-2xl transition-transform active:scale-95"
                  style={{ background: "#fff", color: "#dc2626" }}
                >
                  🛍️ Смотреть меню
                </a>
                <a
                  href="/location"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-base transition-transform active:scale-95"
                  style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "2px solid rgba(255,255,255,0.3)" }}
                >
                  📍 Найти нас
                </a>
              </div>
            </div>

            {/* Right emoji art */}
            <div className="flex-shrink-0 flex items-center justify-center">
              <div className="relative">
                <div
                  className="w-36 h-36 sm:w-52 sm:h-52 rounded-full flex items-center justify-center"
                  style={{
                    background: "rgba(255,255,255,0.12)",
                    backdropFilter: "blur(8px)",
                    border: "3px solid rgba(255,255,255,0.2)",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
                  }}
                >
                  <span className="text-7xl sm:text-9xl select-none" style={{ filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.3))" }}>🍓</span>
                </div>
                {/* Floating badges */}
                <div
                  className="absolute -top-3 -right-3 w-12 h-12 rounded-full flex items-center justify-center text-xl font-black shadow-xl"
                  style={{ background: "#fff", color: "#dc2626" }}
                >
                  ✨
                </div>
                <div
                  className="absolute -bottom-2 -left-4 px-3 py-1.5 rounded-full text-xs font-black shadow-xl"
                  style={{ background: "#fbbf24", color: "#7c2d12" }}
                >
                  🍫 Шоколад
                </div>
              </div>
            </div>
          </div>

          {/* Wave bottom */}
          <div className="absolute bottom-0 left-0 right-0 overflow-hidden" style={{ height: "40px" }}>
            <svg viewBox="0 0 1440 40" preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
              <path d="M0,40 C360,0 1080,0 1440,40 L1440,40 L0,40 Z" fill="var(--pg-bg, #fff1f2)" />
            </svg>
          </div>
        </div>

        {/* ══════════ FEATURES ══════════ */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="feat-card rounded-2xl p-4 text-center shadow-md transition-transform hover:-translate-y-1"
                style={{ border: "1px solid #fee2e2" }}
              >
                <div className="text-3xl mb-2">{f.icon}</div>
                <p className="feat-title font-black text-sm leading-tight">{f.title}</p>
                <p className="feat-sub text-xs mt-0.5">{f.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ══════════ CAROUSEL ══════════ */}
        {!loading && newItems.length > 0 && (
          <div className="container mx-auto px-4 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-1 w-8 rounded-full" style={{ background: "linear-gradient(to right,#dc2626,#db2777)" }} />
              <h2 className="section-title text-xl font-black">Новинки</h2>
              <div className="h-1 flex-1 rounded-full divider-line" style={{ height: "1px", opacity: 0.3 }} />
            </div>
            <NewItemsCarousel items={newItems} />
          </div>
        )}

        {/* ══════════ GIFT BOXES ══════════ */}
        {!loading && products.some(p => GIFT_BOX_KEYWORDS.some(k => p.name.includes(k))) && (
          <div className="mb-8">
            {/* Section Title */}
            <div className="container mx-auto px-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-lg"
                    style={{ background: "linear-gradient(135deg,#9b0000,#db2777)" }}>🎁</div>
                  <div>
                    <h2 className="font-black text-lg" style={{ color: "#9b0000" }}>Подарочные боксы</h2>
                    <p className="text-xs" style={{ color: "#9ca3af" }}>Ручная работа · Красивая упаковка</p>
                  </div>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full"
                  style={{ background: "linear-gradient(to right,#dc2626,#db2777)", color: "#fff" }}>
                  {products.filter(p => GIFT_BOX_KEYWORDS.some(k => p.name.includes(k))).length} бокса
                </span>
              </div>
            </div>

            {/* Horizontal Scroll */}
            <div className="px-4 overflow-x-auto pb-3" style={{ scrollbarWidth: "none" }}>
              <div className="flex gap-3" style={{ width: "max-content" }}>
                {products.filter(p => GIFT_BOX_KEYWORDS.some(k => p.name.includes(k))).map((product, idx) => (
                  <GiftBoxCard key={product.id} product={product} idx={idx} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════ CATALOG ══════════ */}
        <div id="catalog" className="container mx-auto px-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="relative mb-4">
                <div className="w-20 h-20 rounded-full border-4 border-red-200 border-t-red-600 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-2xl">🍓</div>
              </div>
              <p className="font-bold" style={{ color: "#dc2626" }}>Загружаем меню...</p>
            </div>
          ) : (
            <>
              {/* Section header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="h-1 w-8 rounded-full" style={{ background: "linear-gradient(to right,#dc2626,#db2777)" }} />
                <EditableText
                  value="Весь каталог"
                  contentKey="catalog_title"
                  page="home"
                  tag="h2"
                  className="section-title text-xl sm:text-2xl font-black"
                  isSuperuser={isSuperuser}
                />
                <div className="flex-1 h-px divider-line" style={{ opacity: 0.3 }} />
                <span
                  className="text-xs font-bold px-3 py-1 rounded-full"
                  style={{ background: "linear-gradient(to right,#dc2626,#db2777)", color: "#fff" }}
                >
                  {products.length} позиций
                </span>
              </div>

              {error && (
                <div className="text-center py-3 mb-4 rounded-2xl text-sm font-semibold" style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
                  ⚠️ {error} Используются данные по умолчанию.
                </div>
              )}

              {products.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">🍽️</div>
                  <p className="font-bold text-lg" style={{ color: "#dc2626" }}>Пока нет продуктов</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* ══════════ PROMO BANNER ══════════ */}
        {!loading && (
          <div className="container mx-auto px-4 mt-10">
            <div
              className="rounded-3xl p-6 sm:p-10 flex flex-col sm:flex-row items-center gap-6 overflow-hidden relative"
              style={{ background: "linear-gradient(135deg,#9b0000,#dc2626,#db2777)" }}
            >
              <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
              <div className="absolute -left-8 -bottom-8 w-32 h-32 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
              <div className="text-5xl sm:text-7xl flex-shrink-0 relative z-10">🎁</div>
              <div className="relative z-10 text-center sm:text-left">
                <h3 className="text-white font-black text-xl sm:text-2xl mb-2">Закажи и подари радость!</h3>
                <p className="text-white/75 text-sm sm:text-base">Красивая упаковка, свежие ингредиенты и доставка по всему Душанбе</p>
              </div>
              <a
                href="tel:+992501077703"
                className="flex-shrink-0 relative z-10 inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm shadow-xl transition-transform active:scale-95"
                style={{ background: "#fff", color: "#dc2626" }}
              >
                📞 Позвонить
              </a>
            </div>
          </div>
        )}

        <div className="h-8" />
      </main>

      <Footer />
      <Cart />
    </div>
  );
}
