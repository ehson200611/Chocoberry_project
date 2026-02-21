"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useCart } from "../context/CartContext";
import OrderForm from "./OrderForm";
import Profile from "./Profile";
import { profileApi, UserProfile, authApi } from "../services/api";

const LAST_PHONE_KEY = "chocoberry_last_phone";

export default function Cart() {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalPrice,
    isOpen,
    setIsOpen,
  } = useCart();
  const pathname = usePathname();
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Загружаем профиль и проверяем авторизацию при открытии корзины
  useEffect(() => {
    if (isOpen) {
      checkAuthAndLoadProfile();
    }
  }, [isOpen]);

  // Автоматически закрываем корзину при смене страницы
  useEffect(() => {
    if (isOpen) {
      setIsOpen(false);
      setShowOrderForm(false);
      setShowProfile(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const checkAuthAndLoadProfile = async () => {
    try {
      // Проверяем авторизацию
      const user = await authApi.getCurrentUser();
      if (user && user.profile) {
        setIsAuthenticated(true);
        setUserProfile(user.profile);
        return;
      }
      
      // Если не авторизован, загружаем по телефону
      const lastPhone = localStorage.getItem(LAST_PHONE_KEY);
      if (lastPhone) {
        loadProfile(lastPhone);
      }
    } catch (error) {
      console.error("Error checking auth:", error);
      // Пытаемся загрузить по телефону
      const lastPhone = localStorage.getItem(LAST_PHONE_KEY);
      if (lastPhone) {
        loadProfile(lastPhone);
      }
    }
  };

  const loadProfile = async (phone: string) => {
    setLoadingProfile(true);
    try {
      const profile = await profileApi.getProfileByPhone(phone);
      setUserProfile(profile);
    } catch (error) {
      console.error("Error loading profile:", error);
      setUserProfile(null);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleOrderSuccess = (phone: string) => {
    // Сохраняем телефон для следующего раза
    localStorage.setItem(LAST_PHONE_KEY, phone);
    // Загружаем обновленный профиль
    loadProfile(phone);
    // Обновляем профиль в Header через событие
    window.dispatchEvent(new CustomEvent('profileUpdated'));
  };

  if (!isOpen) return null;

  const getEmoji = (name: string) => {
    if (name.toLowerCase().includes("вафл")) return "🧇";
    if (name.toLowerCase().includes("бокс")) return "📦";
    if (name.toLowerCase().includes("клубник")) return "🍓";
    if (name.toLowerCase().includes("трайфл")) return "🍮";
    if (name.toLowerCase().includes("банан")) return "🍌";
    if (name.toLowerCase().includes("ананас")) return "🍍";
    if (name.toLowerCase().includes("микс")) return "🍓🍌";
    return "🍫";
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-300"
        onClick={() => setIsOpen(false)}
      />
      <div className="fixed right-0 top-0 h-full w-full sm:max-w-md bg-white shadow-2xl z-50 overflow-y-auto animate-in slide-in-from-right duration-300">
        <div className="sticky top-0 bg-gradient-to-r from-red-600 via-pink-600 to-red-600 text-white p-6 flex items-center justify-between shadow-lg z-10">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold">Корзина</h2>
            {cart.length > 0 && (
              <span className="bg-white/30 text-white px-3 py-1 rounded-full text-sm font-bold">
                {cart.length}
              </span>
            )}
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-all duration-300 transform hover:rotate-90"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* Показываем профиль пользователя, если он есть */}
          {userProfile && (
            <div className="bg-gradient-to-br from-red-50 via-pink-50 to-rose-50 border-2 border-red-200 rounded-2xl p-5 mb-6 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-red-900 text-lg flex items-center gap-2">
                  <div className="bg-gradient-to-r from-red-600 to-pink-600 p-2 rounded-full">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  Ваш профиль
                </h3>
                <button
                  onClick={() => setShowProfile(true)}
                  className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:from-red-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-md"
                >
                  Редактировать
                </button>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-200 to-pink-200 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                  {userProfile.photo_url ? (
                    <img
                      src={userProfile.photo_url}
                      alt={userProfile.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl">👤</span>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-red-900 font-bold text-lg">{userProfile.name}</p>
                  <p className="text-red-700 font-medium flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {userProfile.phone}
                  </p>
                </div>
              </div>
            </div>
          )}

          {cart.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-block bg-gradient-to-br from-red-100 to-pink-100 p-8 rounded-full mb-6">
                <div className="text-7xl animate-bounce">🍓</div>
              </div>
              <p className="text-red-700 text-2xl font-bold mb-2">Корзина пуста</p>
              <p className="text-red-600 text-lg">Добавьте что-нибудь сладкое!</p>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="group bg-gradient-to-br from-white to-red-50 rounded-2xl p-5 flex items-center gap-4 border-2 border-red-100 hover:border-red-300 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
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
                          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-full w-9 h-9 flex items-center justify-center font-bold transition-all duration-300 transform hover:scale-110 active:scale-95 shadow-md"
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
                          className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white rounded-full w-9 h-9 flex items-center justify-center font-bold transition-all duration-300 transform hover:scale-110 active:scale-95 shadow-md"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-lg transition-all duration-300 transform hover:scale-110 active:scale-95"
                        title="Удалить"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="sticky bottom-0 bg-white border-t-4 border-red-200 pt-6 pb-6 mt-8 shadow-2xl -mx-6 px-6">
                <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl p-6 mb-4 border-2 border-red-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xl font-bold text-red-900">Итого:</span>
                    <span className="text-3xl font-extrabold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                      {totalPrice} сомони
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 text-right">Доставка включена</p>
                </div>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={clearCart}
                    className="w-full bg-red-100 hover:bg-red-200 text-red-800 py-3 rounded-xl font-bold text-base transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg border-2 border-red-200"
                  >
                    🗑️ Очистить корзину
                  </button>
                  <button
                    onClick={() => setShowOrderForm(true)}
                    className="group relative w-full bg-gradient-to-r from-red-600 via-pink-600 to-red-600 text-white py-4 rounded-xl font-extrabold text-lg hover:from-red-700 hover:via-pink-700 hover:to-red-700 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-2xl hover:shadow-red-300/50 overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-3">
                      <svg className="w-6 h-6 transform group-hover:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Оформить заказ
                      <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-600 via-red-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      {showOrderForm && (
        <OrderForm
          onClose={() => setShowOrderForm(false)}
          onSuccess={(phone?: string) => {
            if (phone) {
              handleOrderSuccess(phone);
            }
            alert("✅ Заказ успешно оформлен!\n\nВаш профиль создан/обновлен в системе.\n\nМы свяжемся с вами в ближайшее время.");
          }}
        />
      )}
      {showProfile && userProfile && (
        <Profile
          phone={userProfile.phone}
          onClose={() => {
            setShowProfile(false);
            loadProfile(userProfile.phone);
          }}
        />
      )}
    </>
  );
}
