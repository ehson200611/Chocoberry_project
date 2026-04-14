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
import { useTheme } from "../context/ThemeContext";

export default function Header() {
  const { totalItems, setIsOpen } = useCart();
  const { theme, toggle: toggleTheme } = useTheme();
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
      <header
        className="text-white sticky top-0 z-50"
        style={{
          background: 'linear-gradient(135deg, #be0000 0%, #dc2626 40%, #db2777 100%)',
          boxShadow: '0 4px 20px rgba(220,38,38,0.5)',
        }}
      >
        {/* Мобильная шапка */}
        <div className="md:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            {/* Логотип */}
            <Link href="/" className="flex items-center gap-2">
              <Logo size="sm" showText={false} />
              <div className="flex flex-col leading-none">
                <span className="font-black text-lg tracking-wide drop-shadow-sm">Chocoberry</span>
                <span className="text-[10px] text-white/70 font-medium tracking-widest uppercase">Клубника в шоколаде</span>
              </div>
            </Link>

            {/* Правая часть: кнопки */}
            <div className="flex items-center gap-2">
              {/* Dark mode toggle */}
              <button
                onClick={toggleTheme}
                className="flex items-center justify-center w-10 h-10 rounded-xl transition-all active:scale-90"
                style={{
                  background: theme === 'dark' ? 'rgba(255,220,100,0.25)' : 'rgba(255,255,255,0.18)',
                  backdropFilter: 'blur(4px)',
                  border: theme === 'dark' ? '1px solid rgba(255,220,100,0.5)' : '1px solid rgba(255,255,255,0.25)'
                }}
                title={theme === 'dark' ? 'Переключить на светлый' : 'Переключить на тёмный'}
              >
                {theme === 'dark' ? (
                  // Currently DARK → show SUN to switch to light
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  // Currently LIGHT → show MOON to switch to dark
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" />
                  </svg>
                )}
              </button>

              {/* Звонок */}
              <a
                href="tel:+992501077703"
                className="flex items-center gap-2 px-3 py-2 rounded-xl transition-transform active:scale-90"
                style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.25)' }}
                title="+992 501 07 77 03"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="text-sm font-semibold hidden sm:inline">501 07 77 03</span>
              </a>
            </div>
          </div>

          {/* Нижняя полоска с эффектом */}
          <div style={{ height: '2px', background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.4), transparent)' }} />
        </div>

        {/* Десктоп шапка */}
        <div className="hidden md:block">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center">
                <Logo size="md" showText={true} />
              </Link>

              {/* Навигация для десктопа */}
              <nav className="flex items-center gap-6">
                <Link href="/" className={`px-3 py-2 rounded-lg font-semibold transition-colors ${pathname === "/" ? "bg-white/20" : "hover:bg-white/10"}`}>
                  <EditableText value="Главная" contentKey="menu_home" page="header" tag="span" className="" isSuperuser={currentUser?.is_superuser || false} />
                </Link>
                <Link href="/about" className={`px-3 py-2 rounded-lg font-semibold transition-colors ${pathname === "/about" ? "bg-white/20" : "hover:bg-white/10"}`}>
                  <EditableText value="О нас" contentKey="menu_about" page="header" tag="span" className="" isSuperuser={currentUser?.is_superuser || false} />
                </Link>
                <Link href="/location" className={`px-3 py-2 rounded-lg font-semibold transition-colors ${pathname === "/location" ? "bg-white/20" : "hover:bg-white/10"}`}>
                  <EditableText value="Адрес" contentKey="menu_location" page="header" tag="span" className="" isSuperuser={currentUser?.is_superuser || false} />
                </Link>
                <Link href="/blog" className={`px-3 py-2 rounded-lg font-semibold transition-colors ${pathname === "/blog" ? "bg-white/20" : "hover:bg-white/10"}`}>
                  <EditableText value="Блог" contentKey="menu_blog" page="header" tag="span" className="" isSuperuser={currentUser?.is_superuser || false} />
                </Link>
              </nav>

              <div className="flex items-center gap-3">
                {/* Dark mode toggle desktop */}
                <button
                  onClick={toggleTheme}
                  className="flex items-center justify-center w-10 h-10 rounded-full transition-all hover:scale-110"
                  style={{
                    background: theme === 'dark' ? 'rgba(255,220,100,0.25)' : 'rgba(255,255,255,0.2)',
                    border: theme === 'dark' ? '1px solid rgba(255,220,100,0.5)' : '1px solid rgba(255,255,255,0.3)',
                  }}
                  title={theme === 'dark' ? 'Переключить на светлый' : 'Переключить на тёмный'}
                >
                  {theme === 'dark' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" />
                    </svg>
                  )}
                </button>

                {currentUser ? (
                  <Link href="/profile" className="relative bg-white text-red-600 px-4 py-2 rounded-full font-semibold hover:bg-pink-50 transition-colors flex items-center gap-2 shadow-md" title={currentUser.profile?.name || currentUser.username}>
                    {currentUser.profile?.photo_url ? (
                      <img src={currentUser.profile.photo_url} alt={currentUser.profile.name} className="w-7 h-7 rounded-full object-cover border-2 border-red-300" />
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                    <span>{currentUser.profile?.name?.split(" ")[0] || currentUser.username}</span>
                  </Link>
                ) : (
                  <button onClick={() => setShowLogin(true)} className="bg-white text-red-600 px-4 py-2 rounded-full font-semibold hover:bg-pink-50 transition-colors flex items-center gap-2 shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Войти</span>
                  </button>
                )}
                <Link href="/cart" className="relative bg-white text-red-600 px-6 py-2 rounded-full font-semibold hover:bg-pink-50 transition-colors flex items-center gap-2 shadow-md">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>Корзина</span>
                  {totalItems > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                      {totalItems}
                    </span>
                  )}
                </Link>
              </div>
            </div>
          </div>
        </div>
          
      </header>
      {/* Нижняя мобильная навигация */}
      <BottomNav
        currentUser={currentUser}
        totalItems={totalItems}
        onOpenLogin={() => setShowLogin(true)}
      />
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
