"use client";

import { useEffect, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import OrderForm from "../../components/OrderForm";
import Profile from "../../components/Profile";
import { useCart } from "../../context/CartContext";
import { authApi, profileApi, User, UserProfile } from "../../services/api";

const LAST_PHONE_KEY = "chocoberry_last_phone";

export default function CartPage() {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalPrice,
  } = useCart();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    const loadUserAndProfile = async () => {
      try {
        const user = await authApi.getCurrentUser();
        setCurrentUser(user);
        if (user && user.profile) {
          setUserProfile(user.profile);
          setLoadingProfile(false);
          return;
        }

        const lastPhone = localStorage.getItem(LAST_PHONE_KEY);
        if (lastPhone) {
          setLoadingProfile(true);
          const profile = await profileApi.getProfileByPhone(lastPhone);
          setUserProfile(profile);
        }
      } catch (err) {
        console.error("Error loading profile on cart page:", err);
        setUserProfile(null);
      } finally {
        setLoadingProfile(false);
      }
    };

    loadUserAndProfile();
  }, []);

  const handleOrderSuccess = (phone?: string) => {
    if (phone) {
      localStorage.setItem(LAST_PHONE_KEY, phone);
    }
    clearCart();
    window.dispatchEvent(new CustomEvent("profileUpdated"));
  };

  const getEmoji = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("вафл")) return "🧇";
    if (lower.includes("бокс")) return "📦";
    if (lower.includes("клубник")) return "🍓";
    if (lower.includes("трайфл")) return "🍮";
    if (lower.includes("банан")) return "🍌";
    if (lower.includes("ананас")) return "🍍";
    if (lower.includes("микс")) return "🍓🍌";
    return "🍫";
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--page-bg,#fff1f2)" }}>
      <style>{`
        :root { --page-bg: #fff1f2; }
        html.dark { --page-bg: #0d0505; }
        .cart-card { background: #ffffff; border-color: #fee2e2; }
        html.dark .cart-card { background: #1e1414 !important; border-color: #3d1515 !important; }
        .cart-item-emoji-bg { background: linear-gradient(135deg,#fee2e2,#fce7f3); }
        html.dark .cart-item-emoji-bg { background: #2a1010 !important; }
        .cart-total-card { background: rgba(255,255,255,0.85); }
        html.dark .cart-total-card { background: rgba(30,20,20,0.95) !important; border-color: #3d1515 !important; }
        .cart-profile-card { background: rgba(255,255,255,0.85); }
        html.dark .cart-profile-card { background: rgba(30,20,20,0.95) !important; border-color: #3d1515 !important; }
        .cart-qty-wrap { background: #ffffff; }
        html.dark .cart-qty-wrap { background: #2a1a1a !important; }
        .empty-cart-circle { background: linear-gradient(135deg,#fee2e2,#fce7f3); }
        html.dark .empty-cart-circle { background: #2a1010 !important; }
        .empty-cart-title { color: #b91c1c; }
        html.dark .empty-cart-title { color: #fca5a5 !important; }
        .empty-cart-sub { color: #dc2626; }
        html.dark .empty-cart-sub { color: #f87171 !important; }
        .item-name { color: #7f1d1d; }
        html.dark .item-name { color: #f3f4f6 !important; }
        .item-price { color: #b91c1c; }
        html.dark .item-price { color: #fca5a5 !important; }
        .item-total { color: #dc2626; }
        html.dark .item-total { color: #f87171 !important; }
        .total-label { color: #7f1d1d; }
        html.dark .total-label { color: #f3f4f6 !important; }
        .delivery-note { color: #4b5563; }
        html.dark .delivery-note { color: #9ca3af !important; }
        .clear-btn { background: #fee2e2; color: #991b1b; border-color: #fecaca; }
        html.dark .clear-btn { background: #2a1010 !important; color: #fca5a5 !important; border-color: #3d1515 !important; }
        .profile-info-label { color: #991b1b; }
        html.dark .profile-info-label { color: #fca5a5 !important; }
        .profile-info-text { color: #374151; }
        html.dark .profile-info-text { color: #d1d5db !important; }
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
            🛒
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white drop-shadow-lg">Моя корзина</h1>
            <p className="text-white/70 text-sm mt-0.5">
              {cart.length === 0 ? "Корзина пуста" : `${cart.length} позиций • ${totalPrice} сомони`}
            </p>
          </div>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-3 sm:px-4 pt-6 pb-28 sm:pb-16">
        <div className="max-w-3xl mx-auto">

          {!loadingProfile && userProfile && (
            <div className="cart-profile-card mb-6 rounded-2xl border p-5 shadow-md">
              <div className="flex items-center justify-between mb-3">
                <p className="profile-info-label font-semibold flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full text-white text-lg" style={{ background: "linear-gradient(135deg,#ef4444,#ec4899)" }}>
                    👤
                  </span>
                  Доставка на:
                </p>
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="text-sm font-semibold text-red-600 hover:text-red-700"
                >
                  Изменить профиль
                </button>
              </div>
              <div className="space-y-1 text-sm profile-info-text">
                <div>
                  <span className="font-semibold">Имя: </span>
                  {userProfile.name || "Не заполнено"}
                </div>
                <div>
                  <span className="font-semibold">Телефон: </span>
                  {userProfile.phone || "Не заполнено"}
                </div>
                <div>
                  <span className="font-semibold">Адрес: </span>
                  {userProfile.address || "Не заполнено"}
                </div>
              </div>
            </div>
          )}

          {cart.length === 0 ? (
            <div className="text-center py-20">
              <div className="empty-cart-circle inline-block p-8 rounded-full mb-6">
                <div className="text-7xl">🍓</div>
              </div>
              <p className="empty-cart-title text-2xl font-bold mb-2">
                В вашей корзине пока пусто
              </p>
              <p className="empty-cart-sub text-lg">
                Добавьте что-нибудь вкусное из каталога.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-8">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="cart-card group rounded-2xl p-5 flex items-center gap-4 border-2 hover:shadow-xl transition-all duration-300"
                  >
                    <div className="cart-item-emoji-bg rounded-xl p-4 shadow-md">
                      <div className="text-4xl transform group-hover:scale-110 transition-transform duration-300">
                        {getEmoji(item.name)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="item-name font-bold text-lg mb-2 truncate">
                        {item.name}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="item-price font-semibold">
                          {item.price} сомони
                        </span>
                        <span className="text-gray-400">×</span>
                        <span style={{ background: "rgba(220,38,38,0.15)", color: "#dc2626" }} className="px-2 py-1 rounded-full text-sm font-bold">
                          {item.quantity}
                        </span>
                        <span className="text-gray-400">=</span>
                        <span className="item-total font-bold text-lg">
                          {item.price * item.quantity} сомони
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="cart-qty-wrap flex items-center gap-2 rounded-full p-1 shadow-md">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="text-white rounded-full w-9 h-9 flex items-center justify-center font-bold transition-all duration-300"
                          style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)" }}
                        >
                          −
                        </button>
                        <span className="item-name w-10 text-center font-bold text-lg">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="text-white rounded-full w-9 h-9 flex items-center justify-center font-bold transition-all duration-300"
                          style={{ background: "linear-gradient(135deg,#ec4899,#db2777)" }}
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="cart-item-emoji-bg text-red-600 p-2 rounded-lg transition-all duration-300"
                        title="Удалить"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="cart-total-card rounded-2xl border p-6 shadow-lg space-y-4">
                <div className="flex items-center justify-between">
                  <span className="total-label text-xl font-bold">
                    Итого:
                  </span>
                  <span className="text-3xl font-extrabold" style={{ background: "linear-gradient(to right,#dc2626,#db2777)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    {totalPrice} сомони
                  </span>
                </div>
                <p className="delivery-note text-sm text-right">
                  Доставка включена
                </p>
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={clearCart}
                    className="clear-btn w-full sm:w-1/3 py-3 rounded-xl font-bold text-base transition-all duration-300 border"
                  >
                    🗑️ Очистить
                  </button>
                  <button
                    onClick={() => setShowOrderForm(true)}
                    className="w-full sm:flex-1 text-white py-3 rounded-xl font-extrabold text-lg transition-all shadow-xl"
                    style={{ background: "linear-gradient(135deg,#dc2626,#db2777,#dc2626)" }}
                  >
                    Оформить заказ
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />

      {showOrderForm && (
        <OrderForm
          onClose={() => setShowOrderForm(false)}
          onSuccess={(phone?: string) => {
            handleOrderSuccess(phone);
          }}
        />
      )}

      {showProfileModal && userProfile && (
        <Profile
          phone={userProfile.phone}
          onClose={() => {
            setShowProfileModal(false);
          }}
        />
      )}
    </div>
  );
}



