"use client";

import { useEffect, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import Profile from "../../components/Profile";
import { authApi, User } from "../../services/api";

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await authApi.getCurrentUser();
        setCurrentUser(user);
      } catch (err) {
        console.error("Error loading user in profile page:", err);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-red-50 via-rose-50 to-pink-50">
      <Header />
      <main className="flex-1 container mx-auto px-4 pt-10 pb-28 sm:pb-16">
        <div className="max-w-xl mx-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="text-6xl animate-spin">🍓</div>
              <p className="mt-4 text-red-700 font-semibold">
                Загружаем ваш профиль...
              </p>
            </div>
          ) : !currentUser ? (
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl p-8 text-center border border-red-100">
              <h1 className="text-2xl font-bold text-red-700 mb-3">
                Профиль недоступен
              </h1>
              <p className="text-gray-700 mb-4">
                Пожалуйста, войдите или зарегистрируйтесь, чтобы увидеть ваш
                профиль и заказы.
              </p>
              <p className="text-sm text-gray-500">
                Откройте меню входа в правом верхнем углу.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Profile Header Card */}
              <div className="bg-gradient-to-br from-red-500 via-pink-500 to-rose-500 rounded-3xl shadow-2xl p-8 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative z-10">
                  <div className="flex flex-col items-center mb-6">
                    <div className="w-32 h-32 rounded-full bg-white/20 backdrop-blur-md border-4 border-white/30 flex items-center justify-center overflow-hidden shadow-2xl mb-4">
                      {currentUser.profile?.photo_url ? (
                        <img
                          src={currentUser.profile.photo_url}
                          alt={currentUser.profile.name || "Profile"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-6xl">👤</span>
                      )}
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 text-center">
                      {currentUser.profile?.name || "Пользователь"}
                    </h1>
                    <p className="text-white/90 text-lg">
                      {currentUser.profile?.phone || "Телефон не указан"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Profile Details Card */}
              <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl p-6 sm:p-8 border-2 border-red-100">
                <h2 className="text-xl font-bold text-red-700 mb-6 flex items-center gap-2">
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
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Информация о профиле
                </h2>
                <div className="space-y-5">
                  <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-4 border border-red-200 hover:shadow-md transition-shadow">
                    <div className="text-sm font-medium text-red-600 mb-2 flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      Имя
                    </div>
                    <div className="text-lg font-bold text-red-900">
                      {currentUser.profile?.name || "Не заполнено"}
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-4 border border-red-200 hover:shadow-md transition-shadow">
                    <div className="text-sm font-medium text-red-600 mb-2 flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                      Телефон
                    </div>
                    <div className="text-lg font-bold text-red-900">
                      {currentUser.profile?.phone || "Не заполнено"}
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-4 border border-red-200 hover:shadow-md transition-shadow">
                    <div className="text-sm font-medium text-red-600 mb-2 flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      Адрес доставки
                    </div>
                    <div className="text-lg font-bold text-red-900">
                      {currentUser.profile?.address || "Не заполнено"}
                    </div>
                  </div>
                </div>

                {/* Edit Button - More Prominent */}
                <div className="mt-8 pt-6 border-t-2 border-red-100">
                  <button
                    onClick={() => setShowProfileModal(true)}
                    className="group relative w-full bg-gradient-to-r from-red-600 via-pink-600 to-red-600 text-white py-4 rounded-xl font-extrabold text-lg hover:from-red-700 hover:via-pink-700 hover:to-red-700 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-2xl hover:shadow-red-300/50 overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-3">
                      <svg
                        className="w-6 h-6 transform group-hover:rotate-12 transition-transform"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      ✏️ Редактировать профиль
                      <svg
                        className="w-5 h-5 transform group-hover:translate-x-1 transition-transform"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-600 via-red-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
      {showProfileModal && currentUser?.profile?.phone && (
        <Profile
          phone={currentUser.profile.phone}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </div>
  );
}



