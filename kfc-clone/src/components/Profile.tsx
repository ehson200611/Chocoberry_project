"use client";

import { useState, useEffect, useRef } from "react";
import { profileApi, authApi, UserProfile } from "../services/api";

const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    return '/api';
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
};
const API_BASE_URL = getApiBaseUrl();

function getCsrfToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.split(';').find(c => c.trim().startsWith('csrftoken='));
  return match ? decodeURIComponent(match.trim().split('=')[1]) : '';
}

interface ProfileProps {
  phone: string;
  onClose: () => void;
}

export default function Profile({ phone, onClose }: ProfileProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ name: "", address: "" });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadProfile(); }, [phone]); // eslint-disable-line

  const loadProfile = async () => {
    setLoading(true);
    try {
      const user = await authApi.getCurrentUser();
      if (user?.profile) {
        setProfile(user.profile);
        setFormData({ name: user.profile.name || "", address: user.profile.address || "" });
        setPhotoPreview(user.profile.photo_url || null);
        setLoading(false);
        return;
      }
      if (phone) {
        const data = await profileApi.getProfileByPhone(phone);
        if (data) {
          setProfile(data);
          setFormData({ name: data.name || "", address: data.address || "" });
          if (data.photo_url) setPhotoPreview(data.photo_url);
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
    setPhotoError(null);
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setPhotoError('Пожалуйста, выберите изображение (JPG, PNG, GIF)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Размер файла не должен превышать 5MB');
      return;
    }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setPhotoError(null);
    try {
      // Проверяем авторизацию
      const user = await authApi.getCurrentUser();
      if (!user) {
        throw new Error('Необходимо войти в систему для обновления профиля');
      }

      const fd = new FormData();
      fd.append("name", formData.name);
      fd.append("address", formData.address);
      if (photoFile instanceof File && photoFile.type.startsWith('image/') && photoFile.size > 0) {
        fd.append("photo", photoFile, photoFile.name);
      }
      const csrf = getCsrfToken();
      const apiUrl = typeof window !== 'undefined' ? '/api' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api');
      const response = await fetch(`${apiUrl}/profiles/${profile.id}/`, {
        method: "PATCH",
        credentials: "include",
        headers: csrf ? { 'X-CSRFToken': csrf } : {},
        body: fd,
      });
      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        let err;
        try {
          err = JSON.parse(errorText);
        } catch {
          err = { error: errorText || `Ошибка ${response.status}` };
        }
        throw new Error(err.photo?.[0] || err.detail || err.error || `Ошибка ${response.status}: ${response.statusText}`);
      }
      await loadProfile();
      setEditing(false);
      setPhotoFile(null);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      window.dispatchEvent(new CustomEvent('profileUpdated'));
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Ошибка при сохранении";
      console.error('Profile save error:', error);
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const cancelEditing = () => {
    setEditing(false);
    setPhotoFile(null);
    setPhotoError(null);
    setPhotoPreview(profile?.photo_url || null);
    setFormData({ name: profile?.name || "", address: profile?.address || "" });
  };

  const getInitials = (name: string) =>
    name.split(" ").filter(Boolean).map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  if (loading) {
    return (
      <div className="fixed inset-0 z-[90] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}>
        <div className="rounded-3xl p-10 flex flex-col items-center gap-4" style={{ background: "#1e1414" }}>
          <div className="w-14 h-14 rounded-full border-4 border-red-700 border-t-pink-400 animate-spin" />
          <p className="text-white font-semibold">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}>
        <div className="rounded-3xl p-8 text-center max-w-xs w-full" style={{ background: "#1e1414" }}>
          <p className="text-white mb-4">Профиль не найден</p>
          <button onClick={onClose} className="w-full py-3 rounded-xl text-white font-bold" style={{ background: "linear-gradient(135deg,#dc2626,#db2777)" }}>Закрыть</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .prof-modal { background: #ffffff; }
        html.dark .prof-modal { background: #160c0c !important; }
        .prof-field { background: #fef2f2; border-color: #fecaca; }
        html.dark .prof-field { background: #2a1010 !important; border-color: #5a1f1f !important; }
        .prof-label { color: #b91c1c; }
        html.dark .prof-label { color: #f87171 !important; }
        .prof-value { color: #1f2937; }
        html.dark .prof-value { color: #f3f4f6 !important; }
        .prof-input { background: #fff; border-color: #fca5a5; color: #1f2937; }
        html.dark .prof-input { background: #2a1a1a !important; border-color: #7f2020 !important; color: #f3f4f6 !important; }
        .prof-cancel { background: #f3f4f6; color: #374151; }
        html.dark .prof-cancel { background: #2a2020 !important; color: #d1d5db !important; }
        .prof-photo-zone { background: #fef2f2; border: 2px dashed #fca5a5; }
        html.dark .prof-photo-zone { background: #2a1010 !important; border-color: #7f2020 !important; }
        .prof-date-text { color: #6b7280; }
        html.dark .prof-date-text { color: #9ca3af !important; }
      `}</style>

      <div
        className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-0 sm:p-4"
        style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
        onClick={(e) => e.target === e.currentTarget && !editing && onClose()}
      >
        <div className="prof-modal w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col"
          style={{ maxHeight: "95vh" }}>

          {/* ─── TOP BAR ─── */}
          <div
            className="flex-shrink-0 flex items-center justify-between px-5 py-4 rounded-t-3xl"
            style={{ background: "linear-gradient(135deg,#9b0000 0%,#dc2626 50%,#db2777 100%)" }}
          >
            <div className="flex items-center gap-3">
              {editing && (
                <button onClick={cancelEditing} className="text-white/80 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <div>
                <h2 className="text-xl font-black text-white">
                  {editing ? "Редактирование" : "Мой профиль"}
                </h2>
                <p className="text-white/60 text-xs">
                  {editing ? "Измените данные и нажмите Сохранить" : "Управление аккаунтом"}
                </p>
              </div>
            </div>
            {!editing && (
              <button
                onClick={onClose}
                className="flex items-center justify-center w-9 h-9 rounded-full"
                style={{ background: "rgba(255,255,255,0.2)" }}
              >
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* ─── SCROLLABLE CONTENT ─── */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">

            {/* Success banner */}
            {saveSuccess && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl text-white font-semibold text-sm"
                style={{ background: "linear-gradient(135deg,#16a34a,#15803d)" }}>
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Профиль успешно сохранён! ✅
              </div>
            )}

            {/* ══ PHOTO SECTION ══ */}
            <div className="prof-field rounded-2xl p-4 border">
              <p className="prof-label text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Фото профиля
              </p>

              <div className="flex items-center gap-4">
                {/* Current / Preview photo */}
                <div
                  className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center shadow-md"
                  style={{ background: "linear-gradient(135deg,#fecaca,#fbcfe8)", border: "3px solid #fca5a5" }}
                >
                  {photoPreview ? (
                    <img src={photoPreview} alt="photo" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-black" style={{ color: "#dc2626" }}>
                      {getInitials(profile.name || profile.phone)}
                    </span>
                  )}
                </div>

                {/* Upload area */}
                <div className="flex-1">
                  {editing ? (
                    <>
                      {/* Big obvious button */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-white transition-all active:scale-95 shadow-lg mb-2"
                        style={{ background: "linear-gradient(135deg,#dc2626,#db2777)", boxShadow: "0 4px 14px rgba(220,38,38,0.4)" }}
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        📷 Выбрать фото
                      </button>
                      <p className="prof-date-text text-xs text-center">
                        JPG, PNG, GIF — до 5 MB
                      </p>
                      {photoFile && (
                        <p className="text-green-600 text-xs font-semibold text-center mt-1">
                          ✅ Выбрано: {photoFile.name}
                        </p>
                      )}
                      {photoError && (
                        <p className="text-red-500 text-xs font-semibold text-center mt-1">⚠️ {photoError}</p>
                      )}
                    </>
                  ) : (
                    <div>
                      <p className="prof-value font-semibold text-sm mb-1">
                        {photoPreview ? "Фото установлено ✅" : "Фото не установлено"}
                      </p>
                      <p className="prof-date-text text-xs">
                        Нажмите «Редактировать» чтобы изменить фото
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>

            {/* ══ NAME ══ */}
            <div className="prof-field rounded-2xl p-4 border">
              <p className="prof-label text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Имя
              </p>
              {editing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="prof-input w-full px-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-base font-semibold"
                  placeholder="Введите ваше имя"
                />
              ) : (
                <p className="prof-value text-lg font-bold">
                  {profile.name || <span style={{ opacity: 0.4 }}>Не заполнено</span>}
                </p>
              )}
            </div>

            {/* ══ PHONE (read-only) ══ */}
            <div className="prof-field rounded-2xl p-4 border">
              <p className="prof-label text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Телефон
              </p>
              <p className="prof-value text-lg font-bold">{profile.phone}</p>
              <p className="prof-date-text text-xs mt-0.5">🔒 Телефон нельзя изменить</p>
            </div>

            {/* ══ ADDRESS ══ */}
            <div className="prof-field rounded-2xl p-4 border">
              <p className="prof-label text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Адрес доставки
              </p>
              {editing ? (
                <textarea
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className="prof-input w-full px-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-base font-semibold resize-none"
                  placeholder="ул. Пример, д. 1, кв. 1"
                />
              ) : (
                <p className="prof-value text-lg font-bold">
                  {profile.address || <span style={{ opacity: 0.4 }}>Не заполнено</span>}
                </p>
              )}
            </div>

            {/* ══ REGISTERED DATE ══ */}
            <div className="prof-field rounded-2xl p-3.5 border flex items-center gap-3">
              <span className="text-2xl">📅</span>
              <div>
                <p className="prof-label text-xs font-bold uppercase tracking-wider">С нами с</p>
                <p className="prof-value font-bold text-sm mt-0.5">
                  {new Date(profile.created_at).toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" })}
                </p>
              </div>
            </div>

            <div className="h-1" />
          </div>

          {/* ─── BOTTOM ACTIONS ─── */}
          <div className="flex-shrink-0 px-5 pb-6 pt-3 flex gap-3 border-t" style={{ borderColor: "rgba(0,0,0,0.07)" }}>
            {editing ? (
              <>
                <button
                  onClick={cancelEditing}
                  className="prof-cancel flex-1 py-3.5 rounded-2xl font-bold text-base transition-all active:scale-95"
                  disabled={saving}
                >
                  Отмена
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-[2] py-3.5 rounded-2xl font-black text-white text-base transition-all active:scale-95 shadow-xl flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg,#dc2626,#db2777)" }}
                >
                  {saving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Сохранение...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      💾 Сохранить
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="w-full py-3.5 rounded-2xl font-black text-white text-base transition-all active:scale-95 shadow-xl flex items-center justify-center gap-2"
                style={{
                  background: "linear-gradient(135deg,#dc2626 0%,#db2777 100%)",
                  boxShadow: "0 8px 24px rgba(220,38,38,0.4)",
                }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                ✏️ Редактировать профиль
              </button>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
