"use client";

import { useState } from "react";
import { authApi } from "../services/api";

interface LoginProps {
  onClose: () => void;
  onSuccess: () => void;
  onSwitchToRegister: () => void;
}

export default function Login({ onClose, onSuccess, onSwitchToRegister }: LoginProps) {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await authApi.login(formData.username, formData.password);
      // Вызываем onSuccess для обновления состояния перед закрытием
      onSuccess();
      // Небольшая задержка, чтобы состояние успело обновиться
      await new Promise(resolve => setTimeout(resolve, 200));
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка при входе");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white p-6 rounded-t-2xl flex items-center justify-between">
          <h2 className="text-2xl font-bold">Вход</h2>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Имя пользователя *
            </label>
            <input
              type="text"
              required
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Введите имя пользователя"
            />
          </div>

          <div>
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Введите пароль"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              disabled={loading}
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 text-white py-3 rounded-lg font-bold hover:from-red-700 hover:to-pink-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
            >
              {loading ? "Вход..." : "Войти"}
            </button>
          </div>

          <div className="text-center pt-4 border-t">
            <p className="text-gray-600 text-sm">
              Нет аккаунта?{" "}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="text-red-600 font-semibold hover:text-red-700"
              >
                Зарегистрироваться
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

