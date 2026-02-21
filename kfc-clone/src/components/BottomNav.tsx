"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User } from "../services/api";

type BottomNavProps = {
  currentUser: User | null;
  totalItems: number;
  onOpenCart: () => void;
  onOpenProfile: () => void;
  onOpenLogin: () => void;
};

export default function BottomNav({
  currentUser,
  totalItems,
  onOpenCart,
  onOpenProfile,
  onOpenLogin,
}: BottomNavProps) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="pointer-events-none fixed bottom-0 left-0 right-0 z-[60] md:hidden flex justify-center pb-3">
      <div className="pointer-events-auto max-w-md w-full mx-auto px-4">
        <div className="flex items-center justify-between rounded-3xl border border-white/25 bg-white/18 shadow-[0_18px_45px_rgba(15,23,42,0.45)] backdrop-blur-2xl px-3 py-2 text-[11px] text-gray-700">
          {/* Главная */}
          <Link
            href="/"
            className={`flex flex-col items-center flex-1 min-w-0 px-2 py-1 rounded-2xl transition-all duration-200 ${
              isActive("/")
                ? "text-red-600 bg-white/40 shadow-[0_8px_20px_rgba(248,113,113,0.45)]"
                : "text-gray-500 hover:text-red-500 hover:bg-white/20"
            }`}
          >
            <span className="flex h-6 items-center justify-center transition-transform duration-150 group-active:scale-95">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={isActive("/") ? 2.2 : 1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 11.5L12 4l9 7.5V20a1 1 0 01-1 1h-5.5a.5.5 0 01-.5-.5V15a1 1 0 00-1-1h-2a1 1 0 00-1 1v5.5a.5.5 0 01-.5.5H4a1 1 0 01-1-1v-8.5z"
                />
              </svg>
            </span>
            <span className="mt-0.5 truncate">Главная</span>
          </Link>

          {/* О нас */}
          <Link
            href="/about"
            className={`flex flex-col items-center flex-1 min-w-0 px-2 py-1 rounded-2xl transition-all duration-200 ${
              isActive("/about")
                ? "text-red-600 bg-white/40 shadow-[0_8px_20px_rgba(248,113,113,0.45)]"
                : "text-gray-500 hover:text-red-500 hover:bg-white/20"
            }`}
          >
            <span className="flex h-6 items-center justify-center transition-transform duration-150 group-active:scale-95">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={isActive("/about") ? 2.2 : 1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6.5a1.75 1.75 0 110-3.5 1.75 1.75 0 010 3.5zM11 10h2v8h-2z"
                />
              </svg>
            </span>
            <span className="mt-0.5 truncate">О нас</span>
          </Link>

          {/* Адрес */}
          <Link
            href="/location"
            className={`flex flex-col items-center flex-1 min-w-0 px-2 py-1 rounded-2xl transition-all duration-200 ${
              isActive("/location")
                ? "text-red-600 bg-white/40 shadow-[0_8px_20px_rgba(248,113,113,0.45)]"
                : "text-gray-500 hover:text-red-500 hover:bg-white/20"
            }`}
          >
            <span className="flex h-6 items-center justify-center transition-transform duration-150 group-active:scale-95">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={isActive("/location") ? 2.2 : 1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3.5c-3.037 0-5.5 2.463-5.5 5.5 0 3.648 3.57 7.138 5.02 8.47a1 1 0 001.36 0C13.93 16.138 17.5 12.648 17.5 9c0-3.037-2.463-5.5-5.5-5.5z"
                />
                <circle cx="12" cy="9" r="2" />
              </svg>
            </span>
            <span className="mt-0.5 truncate">Адрес</span>
          </Link>

          {/* Блог */}
          <Link
            href="/blog"
            className={`flex flex-col items-center flex-1 min-w-0 px-2 py-1 rounded-2xl transition-all duration-200 ${
              isActive("/blog")
                ? "text-red-600 bg-white/40 shadow-[0_8px_20px_rgba(248,113,113,0.45)]"
                : "text-gray-500 hover:text-red-500 hover:bg-white/20"
            }`}
          >
            <span className="flex h-6 items-center justify-center transition-transform duration-150 group-active:scale-95">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={isActive("/blog") ? 2.2 : 1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 5.5A2.5 2.5 0 017.5 3h9A2.5 2.5 0 0119 5.5v13l-4-2-4 2-4-2v-13z"
                />
              </svg>
            </span>
            <span className="mt-0.5 truncate">Блог</span>
          </Link>

          {/* Корзина */}
          <button
            type="button"
            onClick={onOpenCart}
            className={`relative flex flex-col items-center flex-1 min-w-0 px-2 py-1 rounded-2xl transition-all duration-200 ${
              totalItems > 0
                ? "text-red-600 bg-white/40 shadow-[0_8px_20px_rgba(248,113,113,0.45)]"
                : "text-gray-500 hover:text-red-500 hover:bg-white/20"
            }`}
          >
            <span className="flex h-6 items-center justify-center transition-transform duration-150 group-active:scale-95">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className={`w-5 h-5 ${
                  totalItems > 0 ? "text-red-600" : ""
                }`}
                fill="none"
                stroke="currentColor"
                strokeWidth={totalItems > 0 ? 2.2 : 1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.3 2.3A1 1 0 005 17h12m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              {totalItems > 0 && (
                <span className="absolute -top-0.5 right-1.5 bg-red-600 text-white text-[10px] font-bold rounded-full h-4 min-w-[16px] px-0.5 flex items-center justify-center shadow-[0_0_0_1px_rgba(255,255,255,0.7)]">
                  {totalItems > 9 ? "9+" : totalItems}
                </span>
              )}
            </span>
            <span className="mt-0.5 truncate">Корзина</span>
          </button>

          {/* Профиль / Войти */}
          <button
            type="button"
            onClick={currentUser ? onOpenProfile : onOpenLogin}
            className="flex flex-col items-center flex-1 min-w-0 px-2 py-1 rounded-2xl text-gray-500 hover:text-red-500 hover:bg-white/20 transition-all duration-200"
          >
            <span className="flex h-6 items-center justify-center transition-transform duration-150 active:scale-95">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM5 19a7 7 0 0114 0v1H5v-1z"
                />
              </svg>
            </span>
            <span className="mt-0.5 truncate">
              {currentUser ? "Профиль" : "Войти"}
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
}


