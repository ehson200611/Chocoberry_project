"use client";

import { useEffect, useRef, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import Profile from "../../components/Profile";
import { useRouter } from "next/navigation";
import { authApi, ordersApi, adminApi, chatApi, AdminStats, User, Order, ChatMsg } from "../../services/api";

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const [chatUnread, setChatUnread] = useState(0);
  const chatMsgContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const scrollClientChatToBottom = () => {
    setTimeout(() => {
      const el = chatMsgContainerRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }, 60);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await authApi.logout();
    } catch { /* ignore */ }
    setCurrentUser(null);
    router.push("/");
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = await authApi.getCurrentUser();
        setCurrentUser(user);
        if (user) {
          const userOrders = await ordersApi.getMyOrders();
          setOrders(userOrders);
          if (user.is_superuser) {
            const stats = await adminApi.getStats();
            setAdminStats(stats);
          }
        }
      } catch {
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };
    loadData();

    // Poll unread count every 10s when chat is closed
    const unreadInterval = setInterval(async () => {
      if (currentUser) {
        const cnt = await chatApi.getUnreadCount();
        setChatUnread(cnt);
      }
    }, 10000);

    const handleProfileUpdate = () => {
      authApi.getCurrentUser().then(setCurrentUser).catch(() => {});
    };
    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
      clearInterval(unreadInterval);
    };
  }, []);

  const openChat = async () => {
    setShowChat(true);
    const msgs = await chatApi.getMyMessages();
    setChatMessages(msgs);
    setChatUnread(0);
    scrollClientChatToBottom();
  };

  const sendChatMessage = async () => {
    const text = chatInput.trim();
    if (!text || chatSending) return;
    setChatSending(true);
    setChatInput("");
    const newMsg = await chatApi.sendMessage(text);
    if (newMsg) {
      setChatMessages(prev => [...prev, newMsg]);
      scrollClientChatToBottom();
    }
    setChatSending(false);
  };

  // Poll for new messages while chat is open
  useEffect(() => {
    if (!showChat) return;
    const interval = setInterval(async () => {
      const msgs = await chatApi.getMyMessages();
      setChatMessages(prev => {
        if (prev.length !== msgs.length) scrollClientChatToBottom();
        return msgs;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [showChat]);

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const completion = () => {
    if (!currentUser?.profile) return 0;
    const f = [
      currentUser.profile.name,
      currentUser.profile.phone,
      currentUser.profile.address,
      currentUser.profile.photo_url,
    ];
    return Math.round((f.filter(Boolean).length / f.length) * 100);
  };

  const pct = completion();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--pg-bg, #fff1f2)" }}>
      <style>{`
        :root { --pg-bg: #fff1f2; }
        html.dark { --pg-bg: #0d0505; }
        .profile-card { background: #fff; }
        html.dark .profile-card { background: #1e1414; }
        .profile-field { background: #fef2f2; border-color: #fee2e2; }
        html.dark .profile-field { background: #2a1414; border-color: #3d1a1a; }
        .profile-label { color: #dc2626; }
        html.dark .profile-label { color: #f87171; }
        .profile-value { color: #1f2937; }
        html.dark .profile-value { color: #f3f4f6; }
        .profile-stat { background: #fff; }
        html.dark .profile-stat { background: #1e1414; }
        .profile-stat-val { color: #dc2626; }
        html.dark .profile-stat-val { color: #fca5a5; }
        .profile-stat-lbl { color: #6b7280; }
        html.dark .profile-stat-lbl { color: #9ca3af; }
        .badge-text { color: #fff; }
        .divider { background: #f3f4f6; }
        html.dark .divider { background: #2a1a1a; }
        .not-auth-card { background: #fff; }
        html.dark .not-auth-card { background: #1e1414; }
        .not-auth-text { color: #374151; }
        html.dark .not-auth-text { color: #d1d5db; }
        .not-auth-sub { color: #6b7280; }
        html.dark .not-auth-sub { color: #9ca3af; }
      `}</style>

      <Header />

      <main className="flex-1 pb-28 sm:pb-16">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-red-200 border-t-red-600 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-2xl">🍓</div>
            </div>
            <p className="mt-5 font-bold" style={{ color: "#dc2626" }}>Загрузка профиля...</p>
          </div>

        ) : !currentUser ? (
          /* ── NOT LOGGED IN ── */
          <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
            <div
              className="not-auth-card w-full max-w-sm rounded-3xl shadow-2xl p-10 text-center"
              style={{ border: "1px solid #fecaca" }}
            >
              <div
                className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center text-4xl shadow-xl"
                style={{ background: "linear-gradient(135deg,#dc2626,#db2777)" }}
              >
                🔐
              </div>
              <h2 className="text-2xl font-black mb-2" style={{ color: "#dc2626" }}>Войдите в аккаунт</h2>
              <p className="not-auth-text mb-1 font-medium">Профиль недоступен</p>
              <p className="not-auth-sub text-sm mb-7">
                Войдите или зарегистрируйтесь, чтобы управлять профилем и заказами.
              </p>
              <div
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold shadow-lg badge-text"
                style={{ background: "linear-gradient(135deg,#dc2626,#db2777)" }}
              >
                ↑ Нажмите «Войти» вверху
              </div>
            </div>
          </div>

        ) : (
          <>
            {/* ══════════ HERO BANNER ══════════ */}
            <div
              className="relative overflow-hidden"
              style={{ background: "linear-gradient(135deg,#9b0000 0%,#dc2626 45%,#db2777 100%)" }}
            >
              {/* decorative blobs */}
              <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
              <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
              <div className="absolute top-10 left-1/3 w-40 h-40 rounded-full" style={{ background: "rgba(255,255,255,0.04)" }} />

              <div className="relative container mx-auto px-4 pt-12 pb-8 flex flex-col items-center text-center">
                {/* Avatar */}
                <div className="relative mb-5">
                  <div
                    className="w-32 h-32 rounded-full flex items-center justify-center overflow-hidden shadow-2xl"
                    style={{
                      border: "4px solid rgba(255,255,255,0.5)",
                      background: "rgba(255,255,255,0.15)",
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    {currentUser.profile?.photo_url ? (
                      <img
                        src={currentUser.profile.photo_url}
                        alt="avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-5xl font-black text-white select-none">
                        {currentUser.profile?.name
                          ? getInitials(currentUser.profile.name)
                          : "👤"}
                      </span>
                    )}
                  </div>
                  {/* online dot */}
                  <div
                    className="absolute bottom-2 right-2 w-5 h-5 rounded-full border-2 border-white"
                    style={{ background: "#22c55e" }}
                  />
                </div>

                <h1 className="text-3xl font-black text-white mb-1 drop-shadow-lg">
                  {currentUser.profile?.name || currentUser.username}
                </h1>
                <p className="text-white/70 text-sm mb-1">
                  {currentUser.profile?.phone || "Телефон не указан"}
                </p>
                {currentUser.is_superuser && (
                  <span
                    className="mt-2 inline-block px-3 py-1 rounded-full text-xs font-bold badge-text"
                    style={{ background: "rgba(255,255,255,0.25)" }}
                  >
                    ⭐ Администратор
                  </span>
                )}

                {/* Progress bar */}
                <div className="mt-5 w-full max-w-xs">
                  <div className="flex justify-between text-xs text-white/60 mb-1.5">
                    <span>Заполненность профиля</span>
                    <span className="font-black text-white">{pct}%</span>
                  </div>
                  <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.2)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        background: "linear-gradient(to right, #fff, rgba(255,255,255,0.7))",
                        transition: "width 1s ease",
                      }}
                    />
                  </div>
                  {pct < 100 && (
                    <p className="text-white/50 text-xs mt-1 text-center">
                      Заполните профиль полностью для лучшего опыта
                    </p>
                  )}
                </div>

                {/* ── CHAT BUTTON (below profile photo section) ── */}
                <button
                  onClick={openChat}
                  className="mt-5 relative flex items-center gap-3 px-6 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95 shadow-xl"
                  style={{
                    background: "rgba(255,255,255,0.18)",
                    backdropFilter: "blur(12px)",
                    border: "1.5px solid rgba(255,255,255,0.35)",
                    color: "#fff",
                  }}
                >
                  <span className="text-xl leading-none">💬</span>
                  <span>Написать в поддержку</span>
                  {chatUnread > 0 && (
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-yellow-400 text-xs font-black text-black flex items-center justify-center shadow-md border-2 border-white">
                      {chatUnread}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* ══════════ CONTENT ══════════ */}
            <div className="container mx-auto px-4 pt-6 max-w-lg space-y-4">

              {/* ── STATS ── */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { emoji: "🛍️", val: String(orders.length), lbl: "Заказов" },
                  { emoji: "💰", val: orders.length > 0 ? orders.reduce((sum, o) => sum + parseFloat(o.total_price || "0"), 0).toFixed(0) : "0", lbl: "Сомони" },
                  { emoji: "📅", val: currentUser?.profile?.created_at ? new Date(currentUser.profile.created_at).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" }) : "—", lbl: "С нами с" },
                ].map((s) => (
                  <div
                    key={s.lbl}
                    className="profile-stat rounded-2xl p-4 text-center shadow-lg"
                    style={{ border: "1px solid #fee2e2" }}
                  >
                    <div className="text-2xl mb-1">{s.emoji}</div>
                    <div className="profile-stat-val text-2xl font-black">{s.val}</div>
                    <div className="profile-stat-lbl text-xs font-semibold mt-0.5">{s.lbl}</div>
                  </div>
                ))}
              </div>

              {/* ── ADMIN STATS ── */}
              {currentUser.is_superuser && adminStats && (
                <div
                  className="rounded-3xl overflow-hidden shadow-xl"
                  style={{ border: "1px solid #fecaca" }}
                >
                  {/* Header */}
                  <div
                    className="px-6 py-4 flex items-center gap-3"
                    style={{ background: "linear-gradient(135deg,#7c0000,#9b0000,#b91c1c)" }}
                  >
                    <span className="text-2xl">👑</span>
                    <div>
                      <p className="text-white font-black text-base leading-tight">Панель администратора</p>
                      <p className="text-white/60 text-xs">Статистика приложения</p>
                    </div>
                  </div>
                  {/* Stats grid */}
                  <div className="profile-card grid grid-cols-2 divide-x divide-y" style={{ borderColor: "#fee2e2" }}>
                    <div className="p-5 text-center">
                      <div className="text-3xl mb-1">👥</div>
                      <div className="profile-stat-val text-3xl font-black">{adminStats.total_users}</div>
                      <div className="profile-stat-lbl text-xs font-semibold mt-0.5">Пользователей</div>
                    </div>
                    <div className="p-5 text-center">
                      <div className="text-3xl mb-1">📦</div>
                      <div className="profile-stat-val text-3xl font-black">{adminStats.total_orders}</div>
                      <div className="profile-stat-lbl text-xs font-semibold mt-0.5">Всего заказов</div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── INFO CARD ── */}
              <div
                className="profile-card rounded-3xl shadow-xl overflow-hidden"
                style={{ border: "1px solid #fecaca" }}
              >
                {/* Card header */}
                <div
                  className="px-6 py-4 flex items-center justify-between"
                  style={{ background: "linear-gradient(to right,#dc2626,#db2777)" }}
                >
                  <span className="text-white font-black text-lg">Мои данные</span>
                  <button
                    onClick={() => setShowProfileModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold transition-transform active:scale-95"
                    style={{ background: "rgba(255,255,255,0.25)", color: "#fff" }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Изменить
                  </button>
                </div>

                {/* Fields */}
                {[
                  {
                    icon: "👤",
                    label: "Имя",
                    value: currentUser.profile?.name,
                    placeholder: "Не заполнено",
                  },
                  {
                    icon: "📞",
                    label: "Телефон",
                    value: currentUser.profile?.phone,
                    placeholder: "Не указан",
                  },
                  {
                    icon: "📍",
                    label: "Адрес доставки",
                    value: currentUser.profile?.address,
                    placeholder: "Не указан",
                  },
                ].map((field, i, arr) => (
                  <div key={field.label}>
                    <div className="px-6 py-4 flex items-center gap-4">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 shadow-sm"
                        style={{
                          background: field.value
                            ? "linear-gradient(135deg,#dc2626,#db2777)"
                            : "#f3f4f6",
                        }}
                      >
                        {field.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="profile-label text-xs font-bold uppercase tracking-wider mb-0.5">
                          {field.label}
                        </p>
                        <p className={`font-bold text-base truncate ${field.value ? "profile-value" : "text-gray-300"}`}>
                          {field.value || field.placeholder}
                        </p>
                      </div>
                      {field.value && (
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: "#22c55e" }} />
                      )}
                    </div>
                    {i < arr.length - 1 && <div className="divider h-px mx-6" />}
                  </div>
                ))}
              </div>

              {/* ── MY ORDERS ── */}
              {orders.length > 0 && (
                <div className="profile-card rounded-3xl shadow-xl overflow-hidden" style={{ border: "1px solid #fecaca" }}>
                  {/* Header */}
                  <div className="px-6 py-4 flex items-center justify-between"
                    style={{ background: "linear-gradient(to right,#dc2626,#db2777)" }}>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">📦</span>
                      <span className="text-white font-black text-lg">Мои заказы</span>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-black text-white"
                      style={{ background: "rgba(255,255,255,0.25)" }}>
                      {orders.length}
                    </span>
                  </div>

                  {/* Orders list */}
                  <div className="divide-y" style={{ borderColor: "#fee2e2" }}>
                    {orders.map((order) => {
                      const STATUS_CONFIG: Record<string, { label: string; emoji: string; color: string; bg: string }> = {
                        pending:    { label: "Ожидает",      emoji: "⏳", color: "#92400e", bg: "#fef3c7" },
                        confirmed:  { label: "Одобрен",      emoji: "✅", color: "#1e40af", bg: "#dbeafe" },
                        preparing:  { label: "Готовится",    emoji: "🍳", color: "#5b21b6", bg: "#ede9fe" },
                        delivering: { label: "Доставляется", emoji: "🚗", color: "#0e7490", bg: "#cffafe" },
                        completed:  { label: "Завершён",     emoji: "🎉", color: "#14532d", bg: "#dcfce7" },
                        cancelled:  { label: "Отменён",      emoji: "❌", color: "#7f1d1d", bg: "#fee2e2" },
                      };
                      const st = STATUS_CONFIG[order.status || "pending"] || STATUS_CONFIG.pending;
                      const items = Array.isArray(order.items) ? order.items : [];

                      return (
                        <div key={order.id} className="px-5 py-4">
                          {/* Order header row */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-red-600 text-base">#{order.id}</span>
                              <span className="profile-stat-lbl text-xs">{order.created_at}</span>
                            </div>
                            {/* Status badge */}
                            <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold"
                              style={{ background: st.bg, color: st.color }}>
                              {st.emoji} {st.label}
                            </span>
                          </div>

                          {/* Progress bar for status */}
                          {order.status !== "cancelled" && (() => {
                            const steps = ["pending", "confirmed", "preparing", "delivering", "completed"];
                            const idx = steps.indexOf(order.status || "pending");
                            const pct = idx >= 0 ? Math.round(((idx + 1) / steps.length) * 100) : 20;
                            return (
                              <div className="mb-3">
                                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#fee2e2" }}>
                                  <div className="h-full rounded-full transition-all duration-700"
                                    style={{
                                      width: `${pct}%`,
                                      background: order.status === "completed"
                                        ? "linear-gradient(to right,#16a34a,#22c55e)"
                                        : "linear-gradient(to right,#dc2626,#db2777)"
                                    }} />
                                </div>
                                <div className="flex justify-between mt-1">
                                  {["⏳", "✅", "🍳", "🚗", "🎉"].map((e, i) => (
                                    <span key={i} className={`text-xs ${i <= idx ? "opacity-100" : "opacity-25"}`}>{e}</span>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}

                          {/* Items */}
                          {items.length > 0 && (
                            <div className="space-y-1">
                              {items.slice(0, 3).map((item, i) => (
                                <div key={i} className="flex justify-between items-center text-sm">
                                  <span className="profile-value font-medium truncate max-w-[60%]">
                                    {item.name} <span className="profile-stat-lbl">×{item.quantity}</span>
                                  </span>
                                  <span className="font-bold text-red-600">{item.total || item.price} с.</span>
                                </div>
                              ))}
                              {items.length > 3 && (
                                <p className="text-xs profile-stat-lbl">+{items.length - 3} ещё...</p>
                              )}
                            </div>
                          )}

                          {/* Total */}
                          <div className="flex justify-between items-center mt-3 pt-2"
                            style={{ borderTop: "1px dashed #fecaca" }}>
                            <span className="profile-stat-lbl text-xs font-semibold">Итого</span>
                            <span className="font-black text-green-600 text-base">{order.total_price} с.</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── ADMIN DASHBOARD BUTTON (superuser only) ── */}
              {currentUser.is_superuser && (
                <button
                  onClick={() => router.push("/dashboard")}
                  className="w-full py-4 rounded-2xl font-black text-white text-lg shadow-2xl transition-transform active:scale-95 flex items-center justify-center gap-3"
                  style={{
                    background: "linear-gradient(135deg,#16a34a 0%,#059669 100%)",
                    boxShadow: "0 8px 32px rgba(22,163,74,0.45)",
                  }}
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  👑 Панель администратора
                </button>
              )}

              {/* ── EDIT BUTTON ── */}
              <button
                onClick={() => setShowProfileModal(true)}
                className="w-full py-4 rounded-2xl font-black text-white text-lg shadow-2xl transition-transform active:scale-95 flex items-center justify-center gap-3"
                style={{
                  background: "linear-gradient(135deg,#dc2626 0%,#db2777 100%)",
                  boxShadow: "0 8px 32px rgba(220,38,38,0.45)",
                }}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Редактировать профиль
              </button>

              {/* ── ABOUT APP ── */}
              <div
                className="profile-card rounded-2xl p-5 flex items-center gap-4 shadow-md"
                style={{ border: "1px solid #fecaca" }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg flex-shrink-0"
                  style={{ background: "linear-gradient(135deg,#dc2626,#db2777)" }}
                >
                  🍓
                </div>
                <div>
                  <p className="font-black text-base profile-value">Chocoberry</p>
                  <p className="profile-stat-lbl text-sm">Клубника в шоколаде • Душанбе</p>
                  <p className="profile-stat-lbl text-xs mt-0.5">📞 +992 501 07 77 03</p>
                </div>
              </div>

              {/* ── LOGOUT BUTTON ── */}
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full py-4 rounded-2xl font-black text-base transition-transform active:scale-95 flex items-center justify-center gap-3"
                style={{
                  background: loggingOut ? "#f3f4f6" : "transparent",
                  color: loggingOut ? "#9ca3af" : "#dc2626",
                  border: "2px solid #fecaca",
                }}
              >
                {loggingOut ? (
                  <>
                    <div className="w-5 h-5 rounded-full border-2 border-red-300 border-t-red-600 animate-spin" />
                    Выход...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Выйти из аккаунта
                  </>
                )}
              </button>

              <div className="h-2" />
            </div>
          </>
        )}
      </main>

      <Footer />

      {showProfileModal && currentUser?.profile?.phone && (
        <Profile
          phone={currentUser.profile.phone}
          onClose={() => {
            setShowProfileModal(false);
            authApi.getCurrentUser().then(u => { setCurrentUser(u); }).catch(() => {});
          }}
        />
      )}


      {/* ── CHAT MODAL ── */}
      {showChat && currentUser && (
        <div className="fixed inset-0 z-[80] flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={e => { if (e.target === e.currentTarget) setShowChat(false); }}>
          <div className="w-full max-w-lg mx-auto rounded-t-3xl flex flex-col overflow-hidden"
            style={{ background: "#fff", maxHeight: "75svh" }}>

            {/* Chat header */}
            <div className="px-5 py-4 flex items-center justify-between flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#dc2626,#db2777)" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                  style={{ background: "rgba(255,255,255,0.2)" }}>🍓</div>
                <div>
                  <p className="text-white font-black">Chocoberry</p>
                  <p className="text-white/70 text-xs">Поддержка • обычно отвечаем быстро</p>
                </div>
              </div>
              <button onClick={() => setShowChat(false)} className="text-white/80 hover:text-white text-2xl leading-none">×</button>
            </div>

            {/* Messages */}
            <div ref={chatMsgContainerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ background: "#fef9f9" }}>
              {chatMessages.length === 0 && (
                <div className="text-center py-10">
                  <div className="text-4xl mb-3">👋</div>
                  <p className="font-bold text-gray-700">Здравствуйте!</p>
                  <p className="text-gray-500 text-sm mt-1">Напишите нам — мы всегда рады помочь.</p>
                </div>
              )}
              {chatMessages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender === 'client' ? 'justify-end' : 'justify-start'}`}>
                  {msg.sender === 'admin' && (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm mr-2 flex-shrink-0 self-end"
                      style={{ background: "linear-gradient(135deg,#dc2626,#db2777)" }}>🍓</div>
                  )}
                  <div className="max-w-[75%]">
                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.sender === 'client'
                        ? 'text-white rounded-br-sm'
                        : 'text-gray-800 rounded-bl-sm'
                    }`} style={{
                      background: msg.sender === 'client'
                        ? 'linear-gradient(135deg,#dc2626,#db2777)'
                        : '#fff',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
                    }}>
                      {msg.message}
                    </div>
                    <p className={`text-xs mt-1 ${msg.sender === 'client' ? 'text-right' : 'text-left'} text-gray-400`}>
                      {msg.created_at}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="px-4 py-3 flex gap-2 flex-shrink-0" style={{ borderTop: "1px solid #fee2e2", background: "#fff" }}>
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChatMessage()}
                placeholder="Напишите сообщение..."
                className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "#fef2f2", border: "1px solid #fecaca" }}
              />
              <button
                onClick={sendChatMessage}
                disabled={chatSending || !chatInput.trim()}
                className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-lg transition-transform active:scale-90 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#dc2626,#db2777)" }}
              >
                {chatSending ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : "➤"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
