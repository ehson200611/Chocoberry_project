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
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-red-50 via-rose-50 to-pink-50">
      <Header />
      <main className="flex-1 container mx-auto px-3 sm:px-4 pt-8 pb-28 sm:pb-16">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
              Моя корзина
            </h1>
            {cart.length > 0 && (
              <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-700">
                {cart.length} позиций
              </span>
            )}
          </div>

          {!loadingProfile && userProfile && (
            <div className="mb-6 bg-white/80 backdrop-blur-xl rounded-2xl border border-red-100 p-5 shadow-md">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-red-800 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white text-lg">
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
              <div className="space-y-1 text-sm text-gray-700">
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
              <div className="inline-block bg-gradient-to-br from-red-100 to-pink-100 p-8 rounded-full mb-6">
                <div className="text-7xl">🍓</div>
              </div>
              <p className="text-red-700 text-2xl font-bold mb-2">
                В вашей корзине пока пусто
              </p>
              <p className="text-red-600 text-lg">
                Добавьте что-нибудь вкусное из каталога.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-8">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="group bg-gradient-to-br from-white to-red-50 rounded-2xl p-5 flex items-center gap-4 border-2 border-red-100 hover:border-red-300 hover:shadow-xl transition-all duration-300"
                  >
                    <div className="bg-gradient-to-br from-red-100 to-pink-100 rounded-xl p-4 shadow-md group-hover:shadow-lg transition-shadow">
                      <div className="text-4xl transform group-hover:scale-110 transition-transform duration-300">
                        {getEmoji(item.name)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-red-900 text-lg mb-2 truncate">
                        {item.name}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-red-700 font-semibold">
                          {item.price} сомони
                        </span>
                        <span className="text-gray-400">×</span>
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm font-bold">
                          {item.quantity}
                        </span>
                        <span className="text-gray-400">=</span>
                        <span className="text-red-600 font-bold text-lg">
                          {item.price * item.quantity} сомони
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex items-center gap-2 bg-white rounded-full p-1 shadow-md">
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-full w-9 h-9 flex items-center justify-center font-bold transition-all duration-300"
                        >
                          −
                        </button>
                        <span className="w-10 text-center font-bold text-red-900 text-lg">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white rounded-full w-9 h-9 flex items-center justify-center font-bold transition-all duration-300"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-lg transition-all duration-300"
                        title="Удалить"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-red-100 p-6 shadow-lg space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-red-900">
                    Итого:
                  </span>
                  <span className="text-3xl font-extrabold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                    {totalPrice} сомони
                  </span>
                </div>
                <p className="text-sm text-gray-600 text-right">
                  Доставка включена
                </p>
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={clearCart}
                    className="w-full sm:w-1/3 bg-red-100 hover:bg-red-200 text-red-800 py-3 rounded-xl font-bold text-base transition-all duration-300 border border-red-200"
                  >
                    🗑️ Очистить
                  </button>
                  <button
                    onClick={() => setShowOrderForm(true)}
                    className="w-full sm:flex-1 bg-gradient-to-r from-red-600 via-pink-600 to-red-600 text-white py-3 rounded-xl font-extrabold text-lg hover:from-red-700 hover:via-pink-700 hover:to-red-700 transition-all shadow-xl"
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



