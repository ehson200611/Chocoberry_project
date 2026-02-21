"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { NewItem } from "../services/api";

interface NewItemsCarouselProps {
  items: NewItem[];
}

export default function NewItemsCarousel({ items }: NewItemsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (items.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
    }, 7000); // Меняется каждые 7 секунд

    return () => clearInterval(interval);
  }, [items.length]);

  if (items.length === 0) {
    return null;
  }

  const currentItem = items[currentIndex];

  return (
    <section className="mb-12 relative overflow-hidden rounded-3xl shadow-2xl">
      <div className="relative h-64 sm:h-80 md:h-96 lg:h-[500px]">
        {/* Фоновое изображение */}
        {currentItem.background_image_url ? (
          <div className="absolute inset-0">
            <Image
              src={currentItem.background_image_url}
              alt={currentItem.title}
              fill
              className="object-cover transition-opacity duration-1000"
              priority={currentIndex === 0}
            />
            {/* Затемнение для лучшей читаемости текста */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/60"></div>
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-pink-600 to-red-600"></div>
        )}

        {/* Контент */}
        <div className="relative h-full">
          {/* Надпись NEW в верхнем углу */}
          <div className="absolute top-4 right-4 bg-gradient-to-r from-red-600 to-pink-600 text-white px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold shadow-lg">
            NEW
          </div>
          
          {/* Надпись внизу в углу */}
          <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm sm:text-base font-semibold">
            {currentItem.title}
          </div>

          {/* Индикаторы */}
          {items.length > 1 && (
            <div className="absolute bottom-4 right-4 flex gap-2">
              {items.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? "w-8 bg-white"
                      : "w-2 bg-white/50 hover:bg-white/75"
                  }`}
                  aria-label={`Перейти к слайду ${index + 1}`}
                />
              ))}
            </div>
          )}

          {/* Стрелки навигации (опционально) */}
          {items.length > 1 && (
            <>
              <button
                onClick={() =>
                  setCurrentIndex((prev) => (prev - 1 + items.length) % items.length)
                }
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-all"
                aria-label="Предыдущий слайд"
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
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <button
                onClick={() =>
                  setCurrentIndex((prev) => (prev + 1) % items.length)
                }
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-all"
                aria-label="Следующий слайд"
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
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

