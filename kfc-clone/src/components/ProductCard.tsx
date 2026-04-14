"use client";

import { useState, useEffect, useRef } from "react";
import { Product, useCart } from "../context/CartContext";
import EditableText from "./EditableText";
import { authApi, User, api } from "../services/api";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [imageError, setImageError] = useState(false);
  const [hasValidImage] = useState(
    product.image && !product.image.includes("/images/") && !product.image.startsWith("/images")
  );
  const [uploadingImage, setUploadingImage] = useState(false);
  const [added, setAdded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getEmoji = (name: string) => {
    if (name.toLowerCase().includes("вафл")) return "🧇";
    if (name.toLowerCase().includes("бокс")) return "📦";
    if (name.toLowerCase().includes("клубник")) return "🍓";
    if (name.toLowerCase().includes("трайфл")) return "🍮";
    if (name.toLowerCase().includes("банан")) return "🍌";
    if (name.toLowerCase().includes("ананас")) return "🍍";
    if (name.toLowerCase().includes("микс")) return "🍓";
    if (name.toLowerCase().includes("шоколад")) return "🍫";
    return "🍫";
  };

  const shouldShowImage = product.image && hasValidImage && !imageError;

  useEffect(() => {
    authApi.getCurrentUser().then(setCurrentUser).catch(() => {});
  }, []);

  const isSuperuser = currentUser?.is_superuser || false;

  const handleAddToCart = () => {
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const saveProductName = async (newName: string) => {
    await api.updateProduct(product.id, { name: newName });
    window.location.reload();
  };

  const saveProductDescription = async (newDescription: string) => {
    await api.updateProduct(product.id, { description: newDescription });
    window.location.reload();
  };

  const handleImageClick = () => {
    if (isSuperuser && fileInputRef.current) fileInputRef.current.click();
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { alert("Пожалуйста, выберите изображение"); return; }
    if (file.size > 5 * 1024 * 1024) { alert("Размер не должен превышать 5MB"); return; }
    setUploadingImage(true);
    try {
      await api.updateProduct(product.id, {}, file);
      window.location.reload();
    } catch {
      alert("Ошибка при загрузке изображения");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div
      className="product-card-root group flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1"
      style={{
        borderRadius: "20px",
        boxShadow: "0 2px 12px rgba(220,38,38,0.08)",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 12px 32px rgba(220,38,38,0.18)")}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 2px 12px rgba(220,38,38,0.08)")}
    >
      {/* Image area */}
      <div
        className="product-card-img-area relative overflow-hidden flex-shrink-0"
        style={{
          height: "clamp(120px, 40vw, 200px)",
          cursor: isSuperuser ? "pointer" : "default",
        }}
        onClick={handleImageClick}
      >
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />

        {uploadingImage && (
          <div className="absolute inset-0 z-20 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
            <div className="text-white font-bold text-sm">Загрузка...</div>
          </div>
        )}

        {shouldShowImage ? (
          <>
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={() => setImageError(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span
              className="text-5xl sm:text-6xl transition-transform duration-300 group-hover:scale-110 select-none"
              style={{ filter: "drop-shadow(0 4px 8px rgba(220,38,38,0.3))" }}
            >
              {getEmoji(product.name)}
            </span>
          </div>
        )}

        {/* Superuser badge */}
        {isSuperuser && (
          <div
            className="absolute top-2 right-2 px-2 py-1 rounded-lg text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity shadow"
            style={{ background: "#dc2626", color: "#fff" }}
          >
            {shouldShowImage ? "✏️ Фото" : "📷 Добавить"}
          </div>
        )}

        {/* Price badge */}
        <div
          className="absolute bottom-2 left-2 px-2.5 py-1 rounded-xl font-black text-sm shadow-lg"
          style={{ background: "linear-gradient(135deg,#dc2626,#db2777)", color: "#fff" }}
        >
          {product.price} с
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-3 sm:p-4 gap-2">
        <EditableText
          value={product.name}
          onSave={saveProductName}
          tag="h3"
          className="font-black text-sm sm:text-base line-clamp-2 leading-tight text-gray-800"
          isSuperuser={isSuperuser}
        />
        <EditableText
          value={product.description}
          onSave={saveProductDescription}
          tag="p"
          className="text-xs sm:text-sm line-clamp-2 flex-1 text-gray-500"
          isSuperuser={isSuperuser}
        />

        {/* Add to cart button */}
        <button
          onClick={handleAddToCart}
          className="w-full py-2.5 rounded-xl font-black text-sm transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 mt-1"
          style={{
            background: added
              ? "linear-gradient(135deg,#16a34a,#15803d)"
              : "linear-gradient(135deg,#dc2626,#db2777)",
            color: "#fff",
            boxShadow: added
              ? "0 4px 16px rgba(22,163,74,0.35)"
              : "0 4px 16px rgba(220,38,38,0.35)",
          }}
        >
          {added ? (
            <>✅ Добавлено</>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              В корзину
            </>
          )}
        </button>
      </div>
    </div>
  );
}
