"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRef } from "react";
import { authApi, adminApi, chatApi, AdminOrder, AdminUser, ChatMsg, ChatUser } from "../../services/api";

interface OrderItem {
  name: string;
  quantity: number;
  price: string | number;
}

// ── Status config ─────────────────────────────────
const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  pending:    { label: "Ожидает",     color: "#92400e", bg: "#fef3c7" },
  confirmed:  { label: "Подтверждён", color: "#1e40af", bg: "#dbeafe" },
  preparing:  { label: "Готовится",   color: "#5b21b6", bg: "#ede9fe" },
  delivering: { label: "Доставляется",color: "#0e7490", bg: "#cffafe" },
  completed:  { label: "Завершён",    color: "#14532d", bg: "#dcfce7" },
  cancelled:  { label: "Отменён",     color: "#7f1d1d", bg: "#fee2e2" },
};

// ── PDF generation (pure browser) ────────────────
function downloadOrdersPDF(orders: AdminOrder[], totalSum: string, dateFrom?: string, dateTo?: string) {
  const rows = orders.map(o => {
    const items = Array.isArray(o.items)
      ? o.items.map((i: OrderItem) => `${i.name} ×${i.quantity}`).join(", ")
      : String(o.items);
    return [o.id, o.name, o.phone, items.substring(0, 60), `${o.total_price} с.`, STATUS_MAP[o.status]?.label || o.status, o.created_at];
  });

  const dateRange = (dateFrom || dateTo)
    ? `Период: ${dateFrom ? new Date(dateFrom).toLocaleDateString("ru") : "начало"} — ${dateTo ? new Date(dateTo).toLocaleDateString("ru") : "конец"}`
    : "Все время";

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
  h1 { color: #dc2626; text-align: center; margin-bottom: 4px; }
  .sub { text-align: center; color: #6b7280; margin-bottom: 8px; font-size: 11px; }
  .period { text-align: center; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 6px 16px; display: inline-block; margin: 0 auto 16px; font-size: 12px; font-weight: bold; color: #dc2626; }
  .period-wrap { text-align: center; margin-bottom: 16px; }
  .stats { display: flex; gap: 16px; justify-content: center; margin-bottom: 16px; }
  .stat { background: #fef2f2; border: 1px solid #fecaca; padding: 8px 16px; border-radius: 8px; text-align: center; }
  .stat b { display: block; font-size: 20px; color: #dc2626; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #1f2937; color: white; padding: 6px 8px; font-size: 11px; }
  td { padding: 5px 8px; border-bottom: 1px solid #f3f4f6; font-size: 10px; }
  tr:nth-child(even) td { background: #fef2f2; }
  .footer { margin-top: 20px; text-align: center; color: #9ca3af; font-size: 10px; }
</style></head><body>
<h1>🍓 Chocoberry — Отчёт по заказам</h1>
<div class="sub">Сформирован: ${new Date().toLocaleString("ru")}</div>
<div class="period-wrap"><span class="period">📅 ${dateRange}</span></div>
<div class="stats">
  <div class="stat"><b>${orders.length}</b>Заказов</div>
  <div class="stat"><b>${totalSum} с.</b>Общая сумма</div>
  <div class="stat"><b>${orders.filter(o=>o.status==='completed').length}</b>Завершено</div>
  <div class="stat"><b>${orders.filter(o=>o.status==='pending').length}</b>В ожидании</div>
</div>
<table>
  <thead><tr><th>#</th><th>Клиент</th><th>Телефон</th><th>Товары</th><th>Сумма</th><th>Статус</th><th>Дата</th></tr></thead>
  <tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join("")}</tr>`).join("")}</tbody>
</table>
<div class="footer">© Chocoberry — chocoberry.tj | +992 501 07 77 03</div>
</body></html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const suffix = dateFrom && dateTo ? `${dateFrom}_${dateTo}` : dateFrom ? `from_${dateFrom}` : dateTo ? `to_${dateTo}` : new Date().toISOString().slice(0,10);
  a.download = `chocoberry_orders_${suffix}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadUsersPDF(users: AdminUser[]) {
  const rows = users.map(u => [
    u.id, u.username, u.name || "—", u.phone || "—", u.email || "—",
    u.orders_count, `${u.orders_sum} с.`, u.date_joined,
    u.is_superuser ? "⭐ Админ" : "Пользователь"
  ]);

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
  h1 { color: #dc2626; text-align: center; margin-bottom: 4px; }
  .sub { text-align: center; color: #6b7280; margin-bottom: 16px; font-size: 11px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #1f2937; color: white; padding: 6px 8px; font-size: 11px; }
  td { padding: 5px 8px; border-bottom: 1px solid #f3f4f6; font-size: 10px; }
  tr:nth-child(even) td { background: #fef2f2; }
  .footer { margin-top: 20px; text-align: center; color: #9ca3af; font-size: 10px; }
</style></head><body>
<h1>🍓 Chocoberry — Список пользователей</h1>
<div class="sub">Дата: ${new Date().toLocaleString("ru")} | Всего: ${users.length}</div>
<table>
  <thead><tr><th>#</th><th>Логин</th><th>Имя</th><th>Телефон</th><th>Email</th><th>Заказов</th><th>Сумма</th><th>Дата рег.</th><th>Роль</th></tr></thead>
  <tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join("")}</tr>`).join("")}</tbody>
</table>
<div class="footer">© Chocoberry — chocoberry.tj | +992 501 07 77 03</div>
</body></html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `chocoberry_users_${new Date().toISOString().slice(0,10)}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Main Component ────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const [, setUser] = useState<{ is_superuser: boolean } | null>(null);
  const [tab, setTab] = useState<"orders" | "users" | "chat">("orders");
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [activeChatUser, setActiveChatUser] = useState<ChatUser | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const chatMsgContainerRef = useRef<HTMLDivElement>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState({ total: 0, total_sum: "0", pending: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [searchOrders, setSearchOrders] = useState("");
  const [searchUsers, setSearchUsers] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    const init = async () => {
      try {
        const u = await authApi.getCurrentUser();
        if (!u || !u.is_superuser) { router.push("/"); return; }
        setUser(u);
        try {
          const [ordersData, usersData] = await Promise.all([
            adminApi.getAllOrders(),
            adminApi.getAllUsers(),
          ]);
          setOrders(ordersData.orders || []);
          setStats({
            total: ordersData.total || 0,
            total_sum: ordersData.total_sum || "0",
            pending: ordersData.pending || 0,
            completed: ordersData.completed || 0,
          });
          setUsers(usersData.users || []);
        const chatsData = await chatApi.getAdminChats();
        setChatUsers(chatsData);
        } catch (apiErr) {
          console.error("Admin API error:", apiErr);
          // Still show dashboard even if data fails to load
        }
      } catch (err) {
        console.error("Auth error:", err);
        router.push("/");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [router]);

  const scrollChatToBottom = (smooth = true) => {
    setTimeout(() => {
      const el = chatMsgContainerRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }, smooth ? 80 : 0);
  };

  const openAdminChat = async (cu: ChatUser) => {
    setActiveChatUser(cu);
    const { messages } = await chatApi.getAdminChatMessages(cu.user_id);
    setChatMessages(messages);
    setChatUsers(prev => prev.map(c => c.user_id === cu.user_id ? { ...c, unread: 0 } : c));
    scrollChatToBottom();
  };

  const sendAdminReply = async () => {
    if (!activeChatUser || !chatInput.trim() || chatSending) return;
    setChatSending(true);
    const text = chatInput.trim();
    setChatInput("");
    const msg = await chatApi.adminReply(activeChatUser.user_id, text);
    if (msg) {
      setChatMessages(prev => [...prev, msg]);
      scrollChatToBottom();
    }
    setChatSending(false);
  };

  // Poll chat list for unread every 8s when on chat tab
  useEffect(() => {
    if (tab !== "chat") return;
    const interval = setInterval(async () => {
      const chats = await chatApi.getAdminChats();
      setChatUsers(chats);
    }, 8000);
    return () => clearInterval(interval);
  }, [tab]);

  // Poll active chat messages every 4s
  useEffect(() => {
    if (!activeChatUser) return;
    const interval = setInterval(async () => {
      const { messages } = await chatApi.getAdminChatMessages(activeChatUser.user_id);
      setChatMessages(prev => {
        if (prev.length !== messages.length) scrollChatToBottom(false);
        return messages;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [activeChatUser]);

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    setUpdatingStatus(orderId);
    try {
      await adminApi.updateOrderStatus(orderId, newStatus);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch { /* ignore */ }
    setUpdatingStatus(null);
  };

  const filteredOrders = orders.filter(o => {
    const q = searchOrders.toLowerCase();
    const matchSearch = !q || o.name.toLowerCase().includes(q) || o.phone.includes(q) || String(o.id).includes(q);
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    // Date filter — o.created_at format: "DD.MM.YYYY HH:MM"
    let matchDate = true;
    if (dateFrom || dateTo) {
      const parts = o.created_at.split(" ")[0].split(".");
      const orderDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      if (dateFrom) matchDate = matchDate && orderDate >= new Date(dateFrom);
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59);
        matchDate = matchDate && orderDate <= toDate;
      }
    }
    return matchSearch && matchStatus && matchDate;
  });

  const filteredUsers = users.filter(u => {
    const q = searchUsers.toLowerCase();
    return !q || u.name.toLowerCase().includes(q) || u.phone.includes(q) ||
      u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  if (loading) return (
    <div className="min-h-screen flex flex-col" style={{ background: "#fff1f2" }}>
      <Header />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto" />
          <p className="mt-4 font-bold text-red-600">Загрузка панели...</p>
        </div>
      </div>
      <Footer />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f8fafc" }}>
      <style>{`
        html.dark .dash-bg { background: #0a0a0a; }
        html.dark .dash-card { background: #1a1a1a; border-color: #2a2a2a; }
        html.dark .dash-text { color: #f3f4f6; }
        html.dark .dash-sub { color: #9ca3af; }
        html.dark .dash-input { background: #2a2a2a; border-color: #3a3a3a; color: #f3f4f6; }
        html.dark .dash-row:hover { background: #1e1e1e; }
        html.dark .dash-th { background: #1a1a1a; color: #9ca3af; }
        html.dark .dash-td { border-color: #2a2a2a; color: #e5e7eb; }
        html.dark .dash-tab-active { background: #dc2626; }
        html.dark .dash-tab { color: #9ca3af; }
      `}</style>

      <Header />

      <main className="flex-1 pb-24">
        {/* ── HERO ── */}
        <div style={{ background: "linear-gradient(135deg,#9b0000,#dc2626,#db2777)" }} className="relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }} />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }} />
          <div className="container mx-auto px-4 py-8 relative">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-xl"
                style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)" }}>
                👑
              </div>
              <div>
                <h1 className="text-2xl font-black text-white">Панель администратора</h1>
                <p className="text-white/70 text-sm">Chocoberry Dashboard</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { emoji: "📦", val: stats.total, label: "Заказов", color: "rgba(251,191,36,0.25)", border: "rgba(251,191,36,0.4)" },
                { emoji: "💰", val: `${parseFloat(stats.total_sum).toFixed(0)} с.`, label: "Выручка", color: "rgba(52,211,153,0.25)", border: "rgba(52,211,153,0.4)" },
                { emoji: "⏳", val: stats.pending, label: "В ожидании", color: "rgba(251,146,60,0.25)", border: "rgba(251,146,60,0.4)" },
                { emoji: "👥", val: users.length, label: "Клиентов", color: "rgba(167,139,250,0.25)", border: "rgba(167,139,250,0.4)" },
              ].map(s => (
                <div key={s.label} className="rounded-2xl p-4 text-center relative overflow-hidden"
                  style={{ background: s.color, backdropFilter: "blur(12px)", border: `1px solid ${s.border}` }}>
                  <div className="absolute -top-3 -right-3 text-4xl opacity-20 select-none">{s.emoji}</div>
                  <div className="text-3xl mb-0.5">{s.emoji}</div>
                  <div className="text-white font-black text-2xl leading-tight drop-shadow">{s.val}</div>
                  <div className="text-white/75 text-xs font-semibold mt-1 uppercase tracking-wider">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 max-w-6xl mt-6 space-y-4">

          {/* ── TABS ── */}
          <div className="dash-card flex rounded-2xl overflow-hidden shadow-md border"
            style={{ background: "#fff", borderColor: "#fecaca" }}>
            {([
              { key: "orders", icon: "📦", label: `Заказы (${orders.length})` },
              { key: "users",  icon: "👥", label: `Клиенты (${users.length})` },
              { key: "chat",   icon: "💬", label: `Чат${chatUsers.reduce((s, c) => s + c.unread, 0) > 0 ? ` (${chatUsers.reduce((s, c) => s + c.unread, 0)})` : ''}` },
            ] as const).map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex-1 py-3 font-bold text-sm transition-all flex items-center justify-center gap-2 relative
                  ${tab === t.key ? "text-white" : "dash-tab text-gray-500"}`}
                style={tab === t.key ? { background: "linear-gradient(135deg,#dc2626,#db2777)" } : {}}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* ══════════ ORDERS TAB ══════════ */}
          {tab === "orders" && (
            <div className="space-y-4">
              {/* Controls */}
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  value={searchOrders}
                  onChange={e => setSearchOrders(e.target.value)}
                  placeholder="🔍 Поиск по имени, телефону, №..."
                  className="dash-input flex-1 px-4 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ background: "#fff", borderColor: "#fecaca" }}
                />
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                  className="dash-input px-4 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ background: "#fff", borderColor: "#fecaca" }}>
                  <option value="all">Все статусы</option>
                  {Object.entries(STATUS_MAP).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>

              {/* Date range + Download */}
              <div className="dash-card rounded-2xl border p-4 shadow-sm"
                style={{ background: "#fff", borderColor: "#fecaca" }}>
                <div className="flex flex-col sm:flex-row gap-3 items-end">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 mb-1">📅 От даты</label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={e => setDateFrom(e.target.value)}
                      className="dash-input w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
                      style={{ background: "#fff", borderColor: "#fecaca" }}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 mb-1">📅 До даты</label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={e => setDateTo(e.target.value)}
                      className="dash-input w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
                      style={{ background: "#fff", borderColor: "#fecaca" }}
                    />
                  </div>
                  {(dateFrom || dateTo) && (
                    <button onClick={() => { setDateFrom(""); setDateTo(""); }}
                      className="px-4 py-2.5 rounded-xl border text-sm font-bold text-gray-500 transition-colors hover:bg-red-50"
                      style={{ borderColor: "#fecaca" }}>
                      ✕ Сбросить
                    </button>
                  )}
                  <button onClick={() => downloadOrdersPDF(
                    filteredOrders,
                    String(filteredOrders.reduce((s, o) => s + parseFloat(o.total_price), 0).toFixed(2)),
                    dateFrom, dateTo)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow-lg transition-transform active:scale-95 whitespace-nowrap"
                    style={{ background: "linear-gradient(135deg,#dc2626,#db2777)" }}>
                    📄 Скачать отчёт
                    {(dateFrom || dateTo) && (
                      <span className="bg-white/20 rounded-lg px-2 py-0.5 text-xs">
                        {filteredOrders.length} зак.
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Orders list */}
              <div className="dash-card rounded-2xl shadow-lg border overflow-hidden"
                style={{ background: "#fff", borderColor: "#fecaca" }}>
                {filteredOrders.length === 0 ? (
                  <div className="py-16 text-center text-gray-400">
                    <div className="text-5xl mb-3">📭</div>
                    <p className="font-semibold">Заказов не найдено</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="dash-th" style={{ background: "#fef2f2" }}>
                          {["№", "Клиент", "Телефон", "Товары", "Сумма", "Статус", "Дата", ""].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.map(order => {
                          const st = STATUS_MAP[order.status] || { label: order.status, color: "#6b7280", bg: "#f3f4f6" };
                          const items = Array.isArray(order.items) ? order.items : [];
                          const isExpanded = expandedOrder === order.id;
                          return (
                            <>
                              <tr key={order.id} className="dash-row border-t hover:bg-red-50 transition-colors cursor-pointer"
                                style={{ borderColor: "#fef2f2" }}
                                onClick={() => setExpandedOrder(isExpanded ? null : order.id)}>
                                <td className="px-4 py-3 dash-td">
                                  <span className="font-black text-red-600">#{order.id}</span>
                                </td>
                                <td className="px-4 py-3 dash-td">
                                  <div className="font-semibold text-sm dash-text">{order.name}</div>
                                  <div className="text-xs text-gray-400 truncate max-w-32">{order.address}</div>
                                </td>
                                <td className="px-4 py-3 dash-td">
                                  <a href={`tel:${order.phone}`} className="text-sm text-blue-600 font-medium"
                                    onClick={e => e.stopPropagation()}>{order.phone}</a>
                                </td>
                                <td className="px-4 py-3 dash-td">
                                  <div className="text-sm text-gray-600 max-w-48 truncate">
                                    {(items as OrderItem[]).slice(0, 2).map((i) => `${i.name} ×${i.quantity}`).join(", ")}
                                    {items.length > 2 && <span className="text-gray-400"> +{items.length - 2}</span>}
                                  </div>
                                </td>
                                <td className="px-4 py-3 dash-td">
                                  <span className="font-black text-green-600 whitespace-nowrap">{order.total_price} с.</span>
                                </td>
                                <td className="px-4 py-3 dash-td">
                                  <select
                                    value={order.status}
                                    onClick={e => e.stopPropagation()}
                                    onChange={e => handleStatusChange(order.id, e.target.value)}
                                    disabled={updatingStatus === order.id}
                                    className="text-xs font-bold px-2 py-1 rounded-full border-0 cursor-pointer"
                                    style={{ background: st.bg, color: st.color }}>
                                    {Object.entries(STATUS_MAP).map(([k, v]) => (
                                      <option key={k} value={k}>{v.label}</option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-4 py-3 dash-td text-xs text-gray-400 whitespace-nowrap">{order.created_at}</td>
                                <td className="px-4 py-3 dash-td text-gray-400 text-xs">
                                  {isExpanded ? "▲" : "▼"}
                                </td>
                              </tr>
                              {isExpanded && (
                                <tr key={`${order.id}-exp`} style={{ background: "#fef9f9" }}>
                                  <td colSpan={8} className="px-6 py-4">
                                    <div className="font-bold text-sm text-gray-700 mb-2">📦 Состав заказа:</div>
                                    <div className="flex flex-wrap gap-2">
                                      {(items as OrderItem[]).map((item, idx: number) => (
                                        <div key={idx} className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm"
                                          style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
                                          <span className="font-semibold">{item.name}</span>
                                          <span className="text-gray-400">×{item.quantity}</span>
                                          <span className="font-bold text-red-600">{item.price} с.</span>
                                        </div>
                                      ))}
                                    </div>
                                    <div className="mt-3 flex gap-6 text-sm">
                                      <span><span className="text-gray-400">Адрес:</span> <strong>{order.address}</strong></span>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════ USERS TAB ══════════ */}
          {tab === "users" && (
            <div className="space-y-4">
              {/* Controls */}
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  value={searchUsers}
                  onChange={e => setSearchUsers(e.target.value)}
                  placeholder="🔍 Поиск по имени, телефону, логину..."
                  className="dash-input flex-1 px-4 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ background: "#fff", borderColor: "#fecaca" }}
                />
                <button onClick={() => downloadUsersPDF(filteredUsers)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow-lg transition-transform active:scale-95 whitespace-nowrap"
                  style={{ background: "linear-gradient(135deg,#dc2626,#db2777)" }}>
                  📄 Скачать отчёт
                </button>
              </div>

              {/* Users grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUsers.map(u => (
                  <div key={u.id} className="dash-card rounded-2xl shadow-md border overflow-hidden"
                    style={{ background: "#fff", borderColor: "#fecaca" }}>
                    {/* User header */}
                    <div className="p-4 flex items-center gap-3"
                      style={{ background: u.is_superuser ? "linear-gradient(135deg,#16a34a,#059669)" : "linear-gradient(135deg,#dc2626,#db2777)" }}>
                      <div className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 shadow-lg"
                        style={{ background: "rgba(255,255,255,0.25)" }}>
                        {u.photo_url ? (
                          <img src={u.photo_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl font-black text-white">
                            {u.name ? u.name[0].toUpperCase() : u.username[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-black truncate">{u.name || u.username}</p>
                        <p className="text-white/70 text-xs truncate">@{u.username}</p>
                      </div>
                      {u.is_superuser && (
                        <span className="text-xs font-bold px-2 py-1 rounded-full text-white"
                          style={{ background: "rgba(255,255,255,0.25)" }}>⭐ Admin</span>
                      )}
                    </div>

                    {/* User info */}
                    <div className="p-4 space-y-2">
                      {[
                        { icon: "📞", val: u.phone || "—" },
                        { icon: "📧", val: u.email || "—" },
                        { icon: "📍", val: u.address || "—" },
                        { icon: "📅", val: `Регистрация: ${u.date_joined}` },
                      ].map(row => (
                        <div key={row.icon} className="flex items-start gap-2 text-sm">
                          <span className="flex-shrink-0">{row.icon}</span>
                          <span className="text-gray-600 truncate">{row.val}</span>
                        </div>
                      ))}
                    </div>

                    {/* Stats */}
                    <div className="px-4 pb-4 flex gap-3">
                      <div className="flex-1 text-center py-2 rounded-xl"
                        style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
                        <div className="font-black text-lg text-red-600">{u.orders_count}</div>
                        <div className="text-xs text-gray-500">заказов</div>
                      </div>
                      <div className="flex-1 text-center py-2 rounded-xl"
                        style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                        <div className="font-black text-lg text-green-600">{parseFloat(u.orders_sum).toFixed(0)}</div>
                        <div className="text-xs text-gray-500">сомони</div>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredUsers.length === 0 && (
                  <div className="col-span-3 py-16 text-center text-gray-400">
                    <div className="text-5xl mb-3">👤</div>
                    <p className="font-semibold">Пользователей не найдено</p>
                  </div>
                )}
              </div>
            </div>
          )}
          {/* ══════════ CHAT TAB ══════════ */}
          {tab === "chat" && (
            <div className="flex flex-col md:flex-row gap-4" style={{ height: '560px' }}>

              {/* ── Users list — hidden on mobile when chat is open ── */}
              <div className={`${activeChatUser ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-72 md:flex-shrink-0 dash-card rounded-2xl border overflow-hidden`}
                style={{ background: "#fff", borderColor: "#fecaca" }}>
                <div className="px-4 py-3 font-black text-sm flex-shrink-0"
                  style={{ background: "linear-gradient(135deg,#dc2626,#db2777)", color: "#fff" }}>
                  💬 Диалоги
                </div>
                <div className="flex-1 overflow-y-auto divide-y" style={{ borderColor: "#fef2f2" }}>
                  {chatUsers.length === 0 ? (
                    <div className="py-16 text-center text-gray-400">
                      <div className="text-4xl mb-2">💬</div>
                      <p className="text-sm font-semibold">Нет диалогов</p>
                    </div>
                  ) : chatUsers.map(cu => (
                    <button key={cu.user_id} onClick={() => openAdminChat(cu)}
                      className={`w-full text-left px-4 py-3 transition-colors ${activeChatUser?.user_id === cu.user_id ? 'bg-red-50' : 'hover:bg-red-50'}`}>
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-black text-white text-base"
                          style={{ background: "linear-gradient(135deg,#dc2626,#db2777)" }}>
                          {(cu.name || cu.username)[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm dash-text truncate">{cu.name || cu.username}</span>
                            <span className="text-gray-400 text-xs flex-shrink-0 ml-1">{cu.last_time}</span>
                          </div>
                          <div className="flex items-center justify-between mt-0.5">
                            <p className="text-xs text-gray-400 truncate">
                              {cu.last_sender === 'admin' ? '🍓 ' : ''}{cu.last_message || '—'}
                            </p>
                            {cu.unread > 0 && (
                              <span className="ml-1 flex-shrink-0 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-black flex items-center justify-center">{cu.unread}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Messages panel — full width on mobile when active ── */}
              <div className={`${activeChatUser ? 'flex' : 'hidden md:flex'} flex-1 dash-card rounded-2xl border flex-col overflow-hidden`}
                style={{ background: "#fff", borderColor: "#fecaca" }}>
                {!activeChatUser ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                    <div className="text-6xl mb-4">💬</div>
                    <p className="font-semibold">Выберите диалог</p>
                  </div>
                ) : (
                  <>
                    {/* Chat header */}
                    <div className="px-4 py-3 flex items-center gap-3 flex-shrink-0"
                      style={{ background: "linear-gradient(135deg,#dc2626,#db2777)" }}>
                      {/* Back button — mobile only */}
                      <button onClick={() => setActiveChatUser(null)}
                        className="md:hidden w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white"
                        style={{ background: "rgba(255,255,255,0.2)" }}>
                        ←
                      </button>
                      <div className="w-9 h-9 rounded-full flex items-center justify-center font-black text-white flex-shrink-0"
                        style={{ background: "rgba(255,255,255,0.25)" }}>
                        {activeChatUser.name ? activeChatUser.name[0].toUpperCase() : "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-black text-sm truncate">{activeChatUser.name || activeChatUser.username}</p>
                        <p className="text-white/70 text-xs">{activeChatUser.phone}</p>
                      </div>
                    </div>

                    {/* Messages */}
                    <div ref={chatMsgContainerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ background: "#fef9f9" }}>
                      {chatMessages.length === 0 && (
                        <div className="text-center py-8 text-gray-400 text-sm">Нет сообщений</div>
                      )}
                      {chatMessages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                          <div className="max-w-[78%]">
                            <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.sender === 'admin' ? 'text-white rounded-br-sm' : 'text-gray-800 rounded-bl-sm'}`}
                              style={{
                                background: msg.sender === 'admin' ? 'linear-gradient(135deg,#dc2626,#db2777)' : '#fff',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
                              }}>
                              {msg.message}
                            </div>
                            <p className={`text-xs mt-1 text-gray-400 ${msg.sender === 'admin' ? 'text-right' : 'text-left'}`}>
                              {msg.created_at}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Input */}
                    <div className="px-3 py-3 flex gap-2 flex-shrink-0" style={{ borderTop: "1px solid #fee2e2" }}>
                      <input
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendAdminReply()}
                        placeholder="Ответить клиенту..."
                        className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
                        style={{ background: "#fef2f2", border: "1px solid #fecaca" }}
                      />
                      <button onClick={sendAdminReply}
                        disabled={chatSending || !chatInput.trim()}
                        className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-lg transition-transform active:scale-90 disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg,#dc2626,#db2777)" }}>
                        {chatSending ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : "➤"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}

