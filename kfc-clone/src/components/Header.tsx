"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "../context/CartContext";
import Profile from "./Profile";
import Login from "./Login";
import Register from "./Register";
import Logo from "./Logo";
import { profileApi, authApi, UserProfile, User } from "../services/api";
import EditableText from "./EditableText";
import BottomNav from "./BottomNav";

export default function Header() {
  const { totalItems, setIsOpen } = useCart();
  const [showProfile, setShowProfile] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    loadCurrentUser();
    
    // Слушаем обновления профиля
    const handleProfileUpdate = () => {
      loadCurrentUser();
    };
    window.addEventListener('profileUpdated', handleProfileUpdate);
    
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, []);

  const loadCurrentUser = async () => {
    try {
      const user = await authApi.getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error("Error loading user:", error);
      setCurrentUser(null);
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
      setCurrentUser(null);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <>
      <header className="bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center">
              <Logo size="md" showText={true} />
            </Link>
            
            {/* Навигация для десктопа */}
            <nav className="hidden md:flex items-center gap-6">
              <Link 
                href="/" 
                className={`px-3 py-2 rounded-lg font-semibold transition-colors ${
                  pathname === "/" ? "bg-white/20" : "hover:bg-white/10"
                }`}
              >
                <EditableText
                  value="Главная"
                  contentKey="menu_home"
                  page="header"
                  tag="span"
                  className=""
                  isSuperuser={currentUser?.is_superuser || false}
                />
              </Link>
              <Link 
                href="/about" 
                className={`px-3 py-2 rounded-lg font-semibold transition-colors ${
                  pathname === "/about" ? "bg-white/20" : "hover:bg-white/10"
                }`}
              >
                <EditableText
                  value="О нас"
                  contentKey="menu_about"
                  page="header"
                  tag="span"
                  className=""
                  isSuperuser={currentUser?.is_superuser || false}
                />
              </Link>
              <Link 
                href="/location" 
                className={`px-3 py-2 rounded-lg font-semibold transition-colors ${
                  pathname === "/location" ? "bg-white/20" : "hover:bg-white/10"
                }`}
              >
                <EditableText
                  value="Адрес"
                  contentKey="menu_location"
                  page="header"
                  tag="span"
                  className=""
                  isSuperuser={currentUser?.is_superuser || false}
                />
              </Link>
              <Link 
                href="/blog" 
                className={`px-3 py-2 rounded-lg font-semibold transition-colors ${
                  pathname === "/blog" ? "bg-white/20" : "hover:bg-white/10"
                }`}
              >
                <EditableText
                  value="Блог"
                  contentKey="menu_blog"
                  page="header"
                  tag="span"
                  className=""
                  isSuperuser={currentUser?.is_superuser || false}
                />
              </Link>
            </nav>

          <div className="flex items-center gap-3">
            {/* Десктоп: профиль / вход и корзина */}
            <div className="hidden md:flex items-center gap-3">
              {/* Кнопка профиля или входа */}
              {currentUser ? (
                <button
                  onClick={() => setShowProfile(true)}
                  className="relative bg-white text-red-600 px-3 sm:px-4 py-2 rounded-full font-semibold hover:bg-pink-50 transition-colors flex items-center gap-2 shadow-md"
                  title={currentUser.profile?.name || currentUser.username}
                >
                  {currentUser.profile?.photo_url ? (
                    <img
                      src={currentUser.profile.photo_url}
                      alt={currentUser.profile.name}
                      className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover border-2 border-red-300"
                    />
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 sm:h-6 sm:w-6"
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
                  )}
                  <span className="hidden sm:inline">
                    {currentUser.profile?.name?.split(" ")[0] || currentUser.username}
                  </span>
                </button>
              ) : (
                <button
                  onClick={() => setShowLogin(true)}
                  className="bg-white text-red-600 px-3 sm:px-4 py-2 rounded-full font-semibold hover:bg-pink-50 transition-colors flex items-center gap-2 shadow-md"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 sm:h-6 sm:w-6"
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
                  <span className="hidden sm:inline">Войти</span>
                </button>
              )}

              {/* Кнопка корзины */}
              <button
                onClick={() => setIsOpen(true)}
                className="relative bg-white text-red-600 px-4 sm:px-6 py-2 rounded-full font-semibold hover:bg-pink-50 transition-colors flex items-center gap-2 shadow-md"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 sm:h-6 sm:w-6"
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
                <span className="hidden sm:inline">Корзина</span>
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>

            {/* Мобильная версия: только текстовый логотип */}
            <div className="flex md:hidden items-center">
              <span className="font-extrabold text-2xl sm:text-3xl tracking-wide drop-shadow-md">
                Chocoberry
              </span>
            </div>
          </div>
          </div>
          
          {/* Мобильное меню */}
          {isMenuOpen && (
            <nav className="md:hidden mt-4 pb-4 border-t border-white/20 pt-4">
              <div className="flex flex-col gap-2">
                <Link 
                  href="/" 
                  onClick={() => setIsMenuOpen(false)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    pathname === "/" ? "bg-white/20" : "hover:bg-white/10"
                  }`}
                >
                  <EditableText
                    value="Главная"
                    contentKey="menu_home"
                    page="header"
                    tag="span"
                    className=""
                    isSuperuser={currentUser?.is_superuser || false}
                  />
                </Link>
                <Link 
                  href="/about" 
                  onClick={() => setIsMenuOpen(false)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    pathname === "/about" ? "bg-white/20" : "hover:bg-white/10"
                  }`}
                >
                  <EditableText
                    value="О нас"
                    contentKey="menu_about"
                    page="header"
                    tag="span"
                    className=""
                    isSuperuser={currentUser?.is_superuser || false}
                  />
                </Link>
                <Link 
                  href="/location" 
                  onClick={() => setIsMenuOpen(false)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    pathname === "/location" ? "bg-white/20" : "hover:bg-white/10"
                  }`}
                >
                  <EditableText
                    value="Адрес"
                    contentKey="menu_location"
                    page="header"
                    tag="span"
                    className=""
                    isSuperuser={currentUser?.is_superuser || false}
                  />
                </Link>
                <Link 
                  href="/blog" 
                  onClick={() => setIsMenuOpen(false)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    pathname === "/blog" ? "bg-white/20" : "hover:bg-white/10"
                  }`}
                >
                  <EditableText
                    value="Блог"
                    contentKey="menu_blog"
                    page="header"
                    tag="span"
                    className=""
                    isSuperuser={currentUser?.is_superuser || false}
                  />
                </Link>
                {currentUser && (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      handleLogout();
                    }}
                    className="px-4 py-2 rounded-lg font-semibold transition-colors text-left text-red-200 hover:bg-white/10"
                  >
                    Выход
                  </button>
                )}
              </div>
            </nav>
          )}
        </div>
      </header>
      {/* Нижняя мобильная навигация */}
      <BottomNav
        currentUser={currentUser}
        totalItems={totalItems}
        onOpenCart={() => setIsOpen(true)}
        onOpenProfile={() => setShowProfile(true)}
        onOpenLogin={() => setShowLogin(true)}
      />
      {showProfile && currentUser && (
        <Profile
          phone={currentUser.profile?.phone || ""}
          onClose={() => {
            setShowProfile(false);
            loadCurrentUser();
          }}
        />
      )}
      {showLogin && (
        <Login
          onClose={() => setShowLogin(false)}
          onSuccess={loadCurrentUser}
          onSwitchToRegister={() => {
            setShowLogin(false);
            setShowRegister(true);
          }}
        />
      )}
      {showRegister && (
        <Register
          onClose={() => setShowRegister(false)}
          onSuccess={loadCurrentUser}
          onSwitchToLogin={() => {
            setShowRegister(false);
            setShowLogin(true);
          }}
        />
      )}
    </>
  );
}
