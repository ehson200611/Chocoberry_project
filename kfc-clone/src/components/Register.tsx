"use client";

import { useState } from "react";
import { authApi } from "../services/api";

interface RegisterProps {
  onClose: () => void;
  onSuccess: () => void;
  onSwitchToLogin: () => void;
}

export default function Register({ onClose, onSuccess, onSwitchToLogin }: RegisterProps) {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    password_confirm: "",
    name: "",
    phone: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (formData.password !== formData.password_confirm) {
      setError("Пароли не совпадают");
      return;
    }

    setLoading(true);

    try {
      // Используем телефон как логин, email не требуем
      const response = await authApi.register({
        username: formData.phone,
        email: "",
        password: formData.password,
        password_confirm: formData.password_confirm,
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
      });
      // Пользователь автоматически залогинен после регистрации
      // Вызываем onSuccess для обновления состояния перед закрытием
      onSuccess();
      // Небольшая задержка, чтобы состояние успело обновиться
      await new Promise(resolve => setTimeout(resolve, 200));
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка при регистрации");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="relative rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto bg-white/10 border border-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
        <div className="bg-gradient-to-r from-red-600/90 to-pink-600/90 text-white p-6 rounded-t-3xl flex items-center justify-between sticky top-0 backdrop-blur-xl">
          <h2 className="text-2xl font-bold">Регистрация</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-red-200 transition-colors"
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Имя *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-2 rounded-xl border border-white/30 bg-white/20 text-gray-900 placeholder:text-gray-400 shadow-[0_10px_25px_rgba(15,23,42,0.15)] focus:ring-2 focus:ring-red-400 focus:border-transparent focus:bg-white/80 backdrop-blur-md transition-all duration-200"
              placeholder="Введите ваше имя"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Телефон *
            </label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="w-full px-4 py-2 rounded-xl border border-white/30 bg-white/20 text-gray-900 placeholder:text-gray-400 shadow-[0_10px_25px_rgba(15,23,42,0.15)] focus:ring-2 focus:ring-red-400 focus:border-transparent focus:bg-white/80 backdrop-blur-md transition-all duration-200"
              placeholder="+992 XX XXX-XX-XX"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Адрес
            </label>
            <textarea
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              rows={2}
              className="w-full px-4 py-2 rounded-xl border border-white/30 bg-white/15 text-gray-900 placeholder:text-gray-400 shadow-[0_10px_25px_rgba(15,23,42,0.12)] focus:ring-2 focus:ring-red-400 focus:border-transparent focus:bg-white/70 backdrop-blur-md transition-all duration-200"
              placeholder="Введите адрес (необязательно)"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Пароль *
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="w-full px-4 py-2 rounded-xl border border-white/30 bg-white/20 text-gray-900 placeholder:text-gray-400 shadow-[0_10px_25px_rgba(15,23,42,0.15)] focus:ring-2 focus:ring-red-400 focus:border-transparent focus:bg-white/80 backdrop-blur-md transition-all duration-200"
              placeholder="Минимум 6 символов"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Подтвердите пароль *
            </label>
            <input
              type="password"
              required
              value={formData.password_confirm}
              onChange={(e) =>
                setFormData({ ...formData, password_confirm: e.target.value })
              }
              className="w-full px-4 py-2 rounded-xl border border-white/30 bg-white/20 text-gray-900 placeholder:text-gray-400 shadow-[0_10px_25px_rgba(15,23,42,0.15)] focus:ring-2 focus:ring-red-400 focus:border-transparent focus:bg-white/80 backdrop-blur-md transition-all duration-200"
              placeholder="Повторите пароль"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-semibold text-gray-800 bg-white/20 border border-white/40 hover:bg-white/40 hover:border-white/60 backdrop-blur-xl shadow-[0_8px_24px_rgba(15,23,42,0.25)] transition-all duration-200 active:scale-[0.98]"
              disabled={loading}
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 relative overflow-hidden py-3 rounded-xl font-bold text-white bg-gradient-to-r from-red-500/90 via-pink-500/90 to-red-500/90 border border-white/50 shadow-[0_12px_35px_rgba(244,63,94,0.55)] hover:from-red-500 hover:via-pink-500 hover:to-red-500 hover:shadow-[0_16px_45px_rgba(244,63,94,0.75)] backdrop-blur-2xl transition-all duration-200 active:scale-[0.98] disabled:opacity-60"
            >
              <span className="relative z-10">
                {loading ? "Регистрация..." : "Зарегистрироваться"}
              </span>
              <span className="pointer-events-none absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_0_0,rgba(255,255,255,0.9),transparent_55%),radial-gradient(circle_at_100%_0,rgba(255,255,255,0.6),transparent_55%)]" />
            </button>
          </div>

          <div className="text-center pt-4 border-t border-white/20">
            <p className="text-gray-100 text-sm">
              Уже есть аккаунт?{" "}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold text-red-100 bg-white/10 border border-white/30 hover:bg-white/20 hover:text-white transition-all duration-200 backdrop-blur-xl"
              >
                Войти
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

