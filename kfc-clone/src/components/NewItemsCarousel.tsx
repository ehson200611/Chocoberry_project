"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { NewItem } from "../services/api";

interface NewItemsCarouselProps {
  items: NewItem[];
}

export default function NewItemsCarousel({ items }: NewItemsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (items.length <= 1) return;
    const interval = setInterval(() => {
      goTo((prev) => (prev + 1) % items.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [items.length]);

  const goTo = (indexOrFn: number | ((prev: number) => number)) => {
    if (animating) return;
    setAnimating(true);
    setCurrentIndex(indexOrFn as number);
    setTimeout(() => setAnimating(false), 600);
  };

  if (items.length === 0) return null;

  const currentItem = items[currentIndex];

  return (
    <div className="relative rounded-3xl overflow-hidden shadow-2xl" style={{ minHeight: "260px" }}>
      {/* Background image or gradient */}
      <div className="absolute inset-0">
        {currentItem.background_image_url ? (
          <Image
            src={currentItem.background_image_url}
            alt={currentItem.title}
            fill
            className="object-cover transition-all duration-700"
            priority={currentIndex === 0}
          />
        ) : (
          <div style={{ background: "linear-gradient(135deg,#6b0000,#dc2626,#db2777)", width: "100%", height: "100%" }} />
        )}
        {/* Overlay */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.55) 100%)" }} />
      </div>

      {/* Content */}
      <div className="relative h-64 sm:h-80 md:h-96 flex flex-col justify-between p-5 sm:p-8">
        {/* Top row */}
        <div className="flex items-start justify-between">
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black shadow-lg"
            style={{ background: "linear-gradient(to right,#dc2626,#db2777)", color: "#fff" }}
          >
            ✨ НОВИНКА
          </div>
          {/* Dot indicators */}
          {items.length > 1 && (
            <div className="flex gap-1.5">
              {items.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className="rounded-full transition-all duration-300 focus:outline-none"
                  style={{
                    width: i === currentIndex ? "24px" : "8px",
                    height: "8px",
                    background: i === currentIndex ? "#fff" : "rgba(255,255,255,0.45)",
                  }}
                  aria-label={`Слайд ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Bottom content */}
        <div className="flex items-end justify-between gap-4">
          <div className="flex-1">
            <h3
              className="text-white font-black text-xl sm:text-3xl mb-2 drop-shadow-lg"
              style={{ textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}
            >
              {currentItem.title}
            </h3>
            {currentItem.description && (
              <p className="text-white/75 text-sm sm:text-base line-clamp-2 max-w-md">
                {currentItem.description}
              </p>
            )}
          </div>

          {/* Nav arrows */}
          {items.length > 1 && (
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => goTo((currentIndex - 1 + items.length) % items.length)}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90"
                style={{ background: "rgba(255,255,255,0.2)", color: "#fff", backdropFilter: "blur(4px)" }}
                aria-label="Назад"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => goTo((currentIndex + 1) % items.length)}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90"
                style={{ background: "rgba(255,255,255,0.2)", color: "#fff", backdropFilter: "blur(4px)" }}
                aria-label="Вперёд"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
