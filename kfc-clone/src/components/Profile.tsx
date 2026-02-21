"use client";

import { useState, useEffect, useRef } from "react";
import { profileApi, authApi, UserProfile } from "../services/api";

interface ProfileProps {
  phone: string;
  onClose: () => void;
}

export default function Profile({ phone, onClose }: ProfileProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProfile();
  }, [phone]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      // Сначала пытаемся загрузить через авторизованного пользователя
      const user = await authApi.getCurrentUser();
      if (user && user.profile) {
        setProfile(user.profile);
        setFormData({
          name: user.profile.name || "",
          address: user.profile.address || "",
        });
        setPhotoPreview(user.profile.photo_url || null);
        setLoading(false);
        return;
      }
      
      // Если не авторизован, загружаем по телефону
      if (phone) {
        const data = await profileApi.getProfileByPhone(phone);
        if (data) {
          setProfile(data);
          setFormData({
            name: data.name,
            address: data.address,
          });
          if (data.photo_url) {
            setPhotoPreview(data.photo_url);
          }
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Проверяем тип файла
      if (!file.type.startsWith('image/')) {
        alert('Пожалуйста, выберите изображение');
        e.target.value = ''; // Очищаем input
        return;
      }
      
      // Проверяем размер файла (макс 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Размер изображения не должен превышать 5MB');
        e.target.value = ''; // Очищаем input
        return;
      }
      
      // Проверяем, что файл не пустой
      if (file.size === 0) {
        alert('Файл пустой');
        e.target.value = ''; // Очищаем input
        return;
      }
      
      console.log("Выбран файл:", {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified
      });
      
      // Сохраняем оригинальный файл
      setPhotoFile(file);
      
      // Создаем предпросмотр
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.onerror = () => {
        alert('Ошибка при чтении файла');
        setPhotoFile(null);
        setPhotoPreview(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    
    setSaving(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("address", formData.address);
      
      // Добавляем фото только если файл действительно выбран и валиден
      if (photoFile && photoFile instanceof File) {
        // Проверяем еще раз перед отправкой
        if (photoFile.type.startsWith('image/') && photoFile.size > 0) {
          console.log("Отправка фото:", {
            name: photoFile.name,
            type: photoFile.type,
            size: photoFile.size
          });
          // Используем оригинальный файл из input, если доступен
          formDataToSend.append("photo", photoFile, photoFile.name);
        } else {
          console.warn("Файл не прошел валидацию:", photoFile);
        }
      }

      console.log("FormData entries:", Array.from(formDataToSend.entries()).map(([k, v]) => [k, v instanceof File ? `File: ${v.name} (${v.size} bytes)` : v]));

      const response = await fetch(
        `http://localhost:8000/api/profiles/${profile.id}/`,
        {
          method: "PATCH",
          body: formDataToSend,
          // Не устанавливаем Content-Type, браузер сделает это автоматически с boundary
        }
      );

      if (!response.ok) {
        let errorMessage = "Ошибка при сохранении профиля";
        try {
          const errorData = await response.json();
          console.error("Error response:", errorData);
          
          // Обрабатываем разные типы ошибок
          if (errorData.photo) {
            errorMessage = `Ошибка загрузки фото: ${Array.isArray(errorData.photo) ? errorData.photo[0] : errorData.photo}`;
          } else if (errorData.detail) {
            errorMessage = errorData.detail;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          } else if (typeof errorData === 'object') {
            // Показываем первую ошибку из объекта
            const firstError = Object.values(errorData)[0];
            if (Array.isArray(firstError)) {
              errorMessage = firstError[0];
            } else if (typeof firstError === 'string') {
              errorMessage = firstError;
            }
          }
        } catch (e) {
          // Если не удалось распарсить JSON, используем текст ответа
          const text = await response.text().catch(() => '');
          console.error("Response text:", text);
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      await loadProfile();
      setEditing(false);
      setPhotoFile(null);
    } catch (error) {
      console.error("Error saving profile:", error);
      const errorMessage = error instanceof Error ? error.message : "Ошибка при сохранении профиля";
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8">
          <div className="text-4xl animate-spin">🍓</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <p className="text-center text-gray-600">Профиль не найден</p>
          <button
            onClick={onClose}
            className="mt-4 w-full bg-red-600 text-white py-2 rounded-lg"
          >
            Закрыть
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">👤 Мой профиль</h2>
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
        </div>

        <div className="p-6">
          {/* Photo Section */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-red-200 to-pink-200 flex items-center justify-center overflow-hidden border-4 border-red-300 shadow-lg">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-6xl">👤</span>
                )}
              </div>
              {editing && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-red-600 text-white rounded-full p-2 hover:bg-red-700 transition-colors shadow-lg"
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
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Profile Info */}
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-4 border border-red-200">
              <label className="block text-sm font-medium text-red-700 mb-1">
                Имя
              </label>
              {editing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              ) : (
                <p className="text-lg font-semibold text-red-900">
                  {profile.name}
                </p>
              )}
            </div>

            <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-4 border border-red-200">
              <label className="block text-sm font-medium text-red-700 mb-1">
                Телефон
              </label>
              <p className="text-lg font-semibold text-red-900">
                {profile.phone}
              </p>
            </div>

            <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-4 border border-red-200">
              <label className="block text-sm font-medium text-red-700 mb-1">
                Адрес доставки
              </label>
              {editing ? (
                <textarea
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              ) : (
                <p className="text-lg font-semibold text-red-900">
                  {profile.address}
                </p>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">
                <strong>Дата регистрации:</strong>{" "}
                {new Date(profile.created_at).toLocaleDateString("ru-RU")}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            {editing ? (
              <>
                <button
                  onClick={() => {
                    setEditing(false);
                    setFormData({
                      name: profile.name,
                      address: profile.address,
                    });
                    setPhotoFile(null);
                    if (profile.photo_url) {
                      setPhotoPreview(profile.photo_url);
                    } else {
                      setPhotoPreview(null);
                    }
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  disabled={saving}
                >
                  Отмена
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 text-white py-3 rounded-lg font-bold hover:from-red-700 hover:to-pink-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                >
                  {saving ? "Сохранение..." : "Сохранить"}
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="w-full bg-gradient-to-r from-red-600 to-pink-600 text-white py-3 rounded-lg font-bold hover:from-red-700 hover:to-pink-700 transition-all shadow-md hover:shadow-lg"
              >
                ✏️ Редактировать профиль
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

