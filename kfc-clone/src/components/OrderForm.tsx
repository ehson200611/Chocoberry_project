"use client";

import { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { api, authApi } from "../services/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface OrderFormProps {
  onClose: () => void;
  onSuccess: (phone?: string) => void;
}

export default function OrderForm({ onClose, onSuccess }: OrderFormProps) {
  const { cart, totalPrice, clearCart } = useCart();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [autoSubmitting, setAutoSubmitting] = useState(false);

  useEffect(() => {
    // Загружаем данные из профиля если пользователь авторизован
    const loadUserData = async () => {
      try {
        const user = await authApi.getCurrentUser();
        if (user && user.profile) {
          setIsAuthenticated(true);
          const userData = {
            name: user.profile.name || "",
            phone: user.profile.phone || "",
            address: user.profile.address || "",
          };
          setFormData(userData);
          
          // Если все данные заполнены, автоматически отправляем заказ
          if (userData.name && userData.phone && userData.address) {
            setAutoSubmitting(true);
            await submitOrder(userData);
          }
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    };
    loadUserData();
  }, []);

  const submitOrder = async (data: { name: string; phone: string; address: string }) => {
    setError(null);
    setLoading(true);

    try {
      const orderData = {
        name: data.name,
        phone: data.phone,
        address: data.address,
        items: cart.map((item) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price.toString(),
          total: (item.price * item.quantity).toString(),
        })),
        total_price: totalPrice.toString(),
      };

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const response = await fetch(`${API_BASE_URL}/orders/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Ошибка при оформлении заказа");
      }

      // Профиль создается автоматически на бэкенде
      clearCart();
      onSuccess(data.phone); // Передаем телефон для загрузки профиля
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка");
      setAutoSubmitting(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitOrder(formData);
  };

  // Если автоматически отправляем заказ, показываем загрузку
  if (autoSubmitting) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-600 border-t-transparent mx-auto mb-4"></div>
          <h3 className="text-xl font-bold text-red-600 mb-2">Оформление заказа...</h3>
          <p className="text-gray-600">Используем данные из вашего профиля</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-in zoom-in duration-300">
        <div className="sticky top-0 bg-gradient-to-r from-red-600 via-pink-600 to-red-600 text-white p-6 flex items-center justify-between shadow-lg z-10">
          <h2 className="text-2xl font-extrabold">Оформление заказа</h2>
          <button
            onClick={onClose}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl">
              <p className="font-semibold">{error}</p>
            </div>
          )}

          {isAuthenticated && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 text-green-700 px-5 py-4 rounded-xl">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-bold text-base">Вы авторизованы</p>
                  <p className="text-sm">Данные заполнены из вашего профиля</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Имя *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all ${
                isAuthenticated ? 'bg-gray-100 border-gray-300 cursor-not-allowed' : 'border-gray-300'
              }`}
              placeholder="Введите ваше имя"
              disabled={isAuthenticated}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Телефон *
            </label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all ${
                isAuthenticated ? 'bg-gray-100 border-gray-300 cursor-not-allowed' : 'border-gray-300'
              }`}
              placeholder="+992 XX XXX-XX-XX"
              disabled={isAuthenticated}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Адрес доставки *
            </label>
            <textarea
              required
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              rows={3}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all ${
                isAuthenticated ? 'bg-gray-100 border-gray-300 cursor-not-allowed' : 'border-gray-300'
              }`}
              placeholder="Введите адрес доставки"
              disabled={isAuthenticated}
            />
          </div>

          <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 p-5 rounded-xl">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-gray-700 text-lg">Итого:</span>
              <span className="text-2xl font-extrabold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                {totalPrice} сомони
              </span>
            </div>
            <p className="text-sm text-gray-600 font-medium">
              Товаров в заказе: {cart.length}
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-md"
              disabled={loading}
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="group flex-1 bg-gradient-to-r from-red-600 via-pink-600 to-red-600 text-white py-3 rounded-xl font-extrabold text-lg hover:from-red-700 hover:via-pink-700 hover:to-red-700 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl overflow-hidden relative"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Отправка...
                  </>
                ) : (
                  <>
                    Оформить заказ
                    <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-pink-600 via-red-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

