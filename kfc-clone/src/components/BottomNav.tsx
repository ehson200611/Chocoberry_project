"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { User } from "../services/api";
import { useRef, useState, useCallback, useEffect } from "react";

type BottomNavProps = {
  currentUser: User | null;
  totalItems: number;
  onOpenCart?: () => void;
  onOpenProfile?: () => void;
  onOpenLogin: () => void;
};

export default function BottomNav({
  currentUser,
  totalItems,
  onOpenLogin,
}: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const navRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);

  type TabItem = { href: string; label: string; requiresAuth: boolean };

  const profileTab: TabItem = currentUser
    ? { href: "/profile", label: "Профиль", requiresAuth: false }
    : { href: "", label: "Войти", requiresAuth: true };

  const allTabs: TabItem[] = [
    { href: "/", label: "Главная", requiresAuth: false },
    { href: "/about", label: "О нас", requiresAuth: false },
    { href: "/location", label: "Адрес", requiresAuth: false },
    { href: "/blog", label: "Блог", requiresAuth: false },
    { href: "/cart", label: "Корзина", requiresAuth: false },
    profileTab,
  ];

  const activeIndex = allTabs.findIndex((t) => t.href === pathname);

  const getTabIndexFromX = useCallback((clientX: number) => {
    const tabs = tabRefs.current;
    for (let i = 0; i < tabs.length; i++) {
      const tab = tabs[i];
      if (!tab) continue;
      const rect = tab.getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.right) return i;
    }
    return null;
  }, []);

  const moveBubbleToTab = useCallback((index: number) => {
    const tab = tabRefs.current[index];
    const bubble = bubbleRef.current;
    if (!tab || !bubble) return;
    const tabRect = tab.getBoundingClientRect();
    const navRect = navRef.current?.getBoundingClientRect();
    if (!navRect) return;
    
    // Bubble width: only for icon (52px fixed)
    const bubbleWidth = 52;
    bubble.style.width = `${bubbleWidth}px`;
    const x = tabRect.left - navRect.left + tabRect.width / 2 - bubbleWidth / 2;
    bubble.style.transform = `translateX(${x}px)`;
  }, []);

  // Move bubble to active tab on mount/route change
  useEffect(() => {
    const idx = activeIndex >= 0 ? activeIndex : 0;
    // Use setTimeout to ensure DOM is ready
    setTimeout(() => {
      requestAnimationFrame(() => moveBubbleToTab(idx));
    }, 50);
  }, [pathname, activeIndex, moveBubbleToTab]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const idx = getTabIndexFromX(e.touches[0].clientX);
    if (idx === null) return;
    setDragging(true);
    setHoverIndex(idx);
    if (bubbleRef.current) {
      bubbleRef.current.style.transition = "transform 0.15s cubic-bezier(0.34,1.56,0.64,1), width 0.15s cubic-bezier(0.34,1.56,0.64,1)";
    }
    moveBubbleToTab(idx);
  }, [getTabIndexFromX, moveBubbleToTab]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragging) return;
    const idx = getTabIndexFromX(e.touches[0].clientX);
    if (idx === null || idx === hoverIndex) return;
    setHoverIndex(idx);
    if (bubbleRef.current) {
      bubbleRef.current.style.transition = "transform 0.25s cubic-bezier(0.34,1.56,0.64,1), width 0.25s cubic-bezier(0.34,1.56,0.64,1)";
    }
    moveBubbleToTab(idx);
  }, [dragging, hoverIndex, getTabIndexFromX, moveBubbleToTab]);

  const handleTouchEnd = useCallback(() => {
    if (!dragging) return;
    setDragging(false);
    const idx = hoverIndex;
    setHoverIndex(null);
    if (idx === null) return;
    const tab = allTabs[idx];
    if (!tab) return;
    if (tab.requiresAuth) {
      onOpenLogin();
    } else if (tab.href) {
      router.push(tab.href);
    }
    if (bubbleRef.current) {
      bubbleRef.current.style.transition = "transform 0.35s cubic-bezier(0.34,1.56,0.64,1), width 0.35s cubic-bezier(0.34,1.56,0.64,1)";
    }
    const finalIdx = allTabs.findIndex((t) => t.href === tab.href);
    if (finalIdx >= 0) moveBubbleToTab(finalIdx);
  }, [dragging, hoverIndex, allTabs, onOpenLogin, router, moveBubbleToTab]);

  const handleTabClick = useCallback((tab: TabItem, index: number) => {
    setHoverIndex(index);
    if (tab.requiresAuth) {
      onOpenLogin();
    } else if (tab.href) {
      router.push(tab.href);
    }
    setTimeout(() => {
      requestAnimationFrame(() => moveBubbleToTab(index));
    }, 50);
  }, [onOpenLogin, router, moveBubbleToTab]);

  const isActive = (href: string) => pathname === href;
  const currentIdx = hoverIndex !== null ? hoverIndex : (activeIndex >= 0 ? activeIndex : -1);

  const icons = [
    // Главная
    (active: boolean) => (
      <svg viewBox="0 0 24 24" className="w-[22px] h-[22px]" fill={active ? "currentColor" : "none"} stroke={active ? "none" : "currentColor"} strokeWidth={1.8}>
        {active
          ? <path d="M10.707 2.293a1 1 0 011.586 0l8 8A1 1 0 0120 12h-1v7a1 1 0 01-1 1h-4v-5H10v5H6a1 1 0 01-1-1v-7H4a1 1 0 01-.707-1.707l7-7z" />
          : <path strokeLinecap="round" strokeLinejoin="round" d="M3 11.5L12 4l9 7.5V20a1 1 0 01-1 1h-5.5a.5.5 0 01-.5-.5V15a1 1 0 00-1-1h-2a1 1 0 00-1 1v5.5a.5.5 0 01-.5.5H4a1 1 0 01-1-1v-8.5z" />}
      </svg>
    ),
    // О нас
    (active: boolean) => (
      <svg viewBox="0 0 24 24" className="w-[22px] h-[22px]" fill={active ? "currentColor" : "none"} stroke={active ? "none" : "currentColor"} strokeWidth={1.8}>
        {active
          ? <path fillRule="evenodd" d="M12 2a10 10 0 100 20A10 10 0 0012 2zm0 4a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm-1 5h2v6h-2v-6z" clipRule="evenodd" />
          : <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />}
      </svg>
    ),
    // Адрес
    (active: boolean) => (
      <svg viewBox="0 0 24 24" className="w-[22px] h-[22px]" fill={active ? "currentColor" : "none"} stroke={active ? "none" : "currentColor"} strokeWidth={1.8}>
        {active
          ? <path fillRule="evenodd" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" clipRule="evenodd" />
          : <><path strokeLinecap="round" strokeLinejoin="round" d="M12 3.5c-3.037 0-5.5 2.463-5.5 5.5 0 3.648 3.57 7.138 5.02 8.47a1 1 0 001.36 0C13.93 16.138 17.5 12.648 17.5 9c0-3.037-2.463-5.5-5.5-5.5z" /><circle cx="12" cy="9" r="2" /></>}
      </svg>
    ),
    // Блог
    (active: boolean) => (
      <svg viewBox="0 0 24 24" className="w-[22px] h-[22px]" fill={active ? "currentColor" : "none"} stroke={active ? "none" : "currentColor"} strokeWidth={1.8}>
        {active
          ? <path d="M19 3H5a2 2 0 00-2 2v14l4-2 4 2 4-2 4 2V5a2 2 0 00-2-2z" />
          : <path strokeLinecap="round" strokeLinejoin="round" d="M5 5.5A2.5 2.5 0 017.5 3h9A2.5 2.5 0 0119 5.5v13l-4-2-4 2-4-2v-13z" />}
      </svg>
    ),
    // Корзина
    (active: boolean) => (
      <span className="relative flex items-center justify-center">
        <svg viewBox="0 0 24 24" className="w-[22px] h-[22px]" fill={active || totalItems > 0 ? "currentColor" : "none"} stroke={active || totalItems > 0 ? "none" : "currentColor"} strokeWidth={1.8}>
          {active || totalItems > 0
            ? <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM2.5 3H1v2h1.5l3.6 7.59L4.25 14c-.16.28-.25.61-.25.96C4 16.1 4.9 17 6 17h12v-2H6.42a.25.25 0 01-.25-.25l.03-.12.9-1.63H17c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0021.46 4H5.21l-.42-1H2.5z" />
            : <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.3 2.3A1 1 0 005 17h12m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />}
        </svg>
        {totalItems > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[9px] font-bold rounded-full h-4 min-w-[16px] px-0.5 flex items-center justify-center border border-white/80 shadow-sm">
            {totalItems > 9 ? "9+" : totalItems}
          </span>
        )}
      </span>
    ),
    // Профиль / Войти
    (active: boolean) => (
      <svg viewBox="0 0 24 24" className="w-[22px] h-[22px]" fill={active ? "currentColor" : "none"} stroke={active ? "none" : "currentColor"} strokeWidth={1.8}>
        {active
          ? <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
          : <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM5 19a7 7 0 0114 0v1H5v-1z" />}
      </svg>
    ),
  ];

  return (
    <nav
      className="pointer-events-none fixed bottom-0 left-0 right-0 z-[60] md:hidden flex justify-center"
      style={{ paddingBottom: "max(14px, env(safe-area-inset-bottom))" }}
    >
      <div className="pointer-events-auto w-full max-w-sm mx-4">
        <div
          ref={navRef}
          className="relative flex items-center justify-around rounded-[30px] px-2 py-2"
          style={{
            background: "linear-gradient(145deg, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0.10) 100%)",
            backdropFilter: "blur(40px) saturate(200%)",
            WebkitBackdropFilter: "blur(40px) saturate(200%)",
            border: "1px solid rgba(255,255,255,0.38)",
            boxShadow: "0 10px 40px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.6)",
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Sliding Liquid Glass Bubble - only around icon */}
          <div
            ref={bubbleRef}
            className="absolute top-1.5 left-0 h-[46px] rounded-[23px] pointer-events-none flex items-center justify-center z-20"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.22) 100%)",
              boxShadow: "0 4px 20px rgba(220,38,38,0.22), inset 0 1px 0 rgba(255,255,255,0.75), inset 0 -1px 0 rgba(0,0,0,0.05)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.5)",
              transition: "transform 0.35s cubic-bezier(0.34,1.56,0.64,1), width 0.35s cubic-bezier(0.34,1.56,0.64,1)",
              transform: "translateX(0px)",
              willChange: "transform, width",
              width: "52px",
            }}
          >
            {/* Only icon inside bubble */}
            {currentIdx >= 0 && (
              <span 
                style={{ 
                  color: "#dc2626", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center"
                }}
              >
                {icons[currentIdx](true)}
              </span>
            )}
          </div>

          {/* Tabs */}
          {allTabs.map((tab, i) => {
            const active = currentIdx === i;
            const tabActive = !dragging && isActive(tab.href);

            const inner = (
              <div
                ref={(el) => { tabRefs.current[i] = el; }}
                className="flex flex-col items-center justify-center flex-1 min-w-0 py-1 gap-[3px] select-none relative z-10"
              >
                {/* Icon - hidden when active (active icon is in bubble) */}
                {!active && (
                  <span
                    className="flex items-center justify-center w-[52px] h-[46px] rounded-[22px] transition-colors duration-200"
                    style={{ color: "rgba(120,120,130,0.85)" }}
                  >
                    {icons[i](false)}
                  </span>
                )}
                {/* Placeholder for active tab to maintain spacing (icon is in bubble) */}
                {active && (
                  <span className="w-[52px] h-[46px]" />
                )}
                {/* Label - visible for all tabs (below bubble for active) */}
                <span
                  className="text-[10px] font-semibold tracking-tight transition-all duration-200 -mt-1"
                  style={{
                    color: active ? "#dc2626" : "rgba(120,120,130,0.7)",
                    opacity: active ? 1 : 0.85,
                  }}
                >
                  {tab.label}
                </span>
              </div>
            );

            if (tab.requiresAuth) {
              return (
                <button key={i} type="button" onClick={() => handleTabClick(tab, i)} className="flex flex-col flex-1 items-center min-w-0">
                  {inner}
                </button>
              );
            }

            return (
              <Link key={i} href={tab.href} className="flex flex-col flex-1 items-center min-w-0" onTouchStart={(e) => e.stopPropagation()}>
                {inner}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
