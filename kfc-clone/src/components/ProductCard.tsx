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
  const [hasValidImage, setHasValidImage] = useState(
    product.image && !product.image.includes("/images/") && !product.image.startsWith("/images")
  );
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getEmoji = (name: string) => {
    if (name.toLowerCase().includes("вафл")) return "🧇";
    if (name.toLowerCase().includes("бокс")) return "📦";
    if (name.toLowerCase().includes("клубник")) return "🍓";
    if (name.toLowerCase().includes("трайфл")) return "🍮";
    if (name.toLowerCase().includes("банан")) return "🍌";
    if (name.toLowerCase().includes("ананас")) return "🍍";
    if (name.toLowerCase().includes("микс")) return "🍓🍌";
    return "🍫";
  };

  const shouldShowImage = product.image && hasValidImage && !imageError;

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const user = await authApi.getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const isSuperuser = currentUser?.is_superuser || false;

  const saveProductName = async (newName: string) => {
    try {
      await api.updateProduct(product.id, { name: newName });
      // Обновляем страницу для перезагрузки продуктов
      window.location.reload();
    } catch (error) {
      console.error("Error saving product name:", error);
      throw error;
    }
  };

  const saveProductDescription = async (newDescription: string) => {
    try {
      await api.updateProduct(product.id, { description: newDescription });
      // Обновляем страницу для перезагрузки продуктов
      window.location.reload();
    } catch (error) {
      console.error("Error saving product description:", error);
      throw error;
    }
  };

  const handleImageClick = () => {
    if (isSuperuser && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите изображение');
      return;
    }

    // Проверка размера файла (макс 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Размер изображения не должен превышать 5MB');
      return;
    }

    // Проверка размеров изображения
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    
    img.onload = async () => {
      URL.revokeObjectURL(objectUrl);
      
      const width = img.width;
      const height = img.height;
      const aspectRatio = width / height;
      
      // Рекомендуемые размеры: 800x600px (4:3) или 800x450px (16:9)
      // Минимум: 400x300px, Максимум: 2000x1500px
      if (width < 400 || height < 300) {
        alert(`Изображение слишком маленькое. Рекомендуемый размер: минимум 800x600px (сейчас: ${width}x${height}px)`);
        return;
      }
      
      if (width > 2000 || height > 1500) {
        alert(`Изображение слишком большое. Рекомендуемый размер: максимум 1200x900px (сейчас: ${width}x${height}px)`);
        return;
      }
      
      // Проверка соотношения сторон (должно быть близко к 4:3 или 16:9)
      const idealRatio43 = 4/3;
      const idealRatio169 = 16/9;
      const ratioDiff43 = Math.abs(aspectRatio - idealRatio43);
      const ratioDiff169 = Math.abs(aspectRatio - idealRatio169);
      
      if (ratioDiff43 > 0.3 && ratioDiff169 > 0.3) {
        console.warn(`Соотношение сторон ${width}:${height} (${aspectRatio.toFixed(2)}) не оптимально. Рекомендуется 4:3 (1.33) или 16:9 (1.78)`);
      }
      
      // Продолжаем загрузку
      setUploadingImage(true);
      try {
        await api.updateProduct(product.id, {}, file);
        window.location.reload();
      } catch (error) {
        console.error("Error uploading image:", error);
        alert('Ошибка при загрузке изображения');
      } finally {
        setUploadingImage(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      alert('Ошибка при чтении изображения');
    };
    
    img.src = objectUrl;
  };

  return (
    <div className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-red-100 hover:border-red-300">
      <div 
        className={`h-32 sm:h-48 bg-gradient-to-br from-red-200 via-pink-200 to-rose-200 flex items-center justify-center relative overflow-hidden ${
          isSuperuser ? 'cursor-pointer' : ''
        }`}
        onClick={handleImageClick}
        title={isSuperuser ? 'Нажмите, чтобы изменить изображение' : ''}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />
        {uploadingImage && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
            <div className="text-white font-semibold">Загрузка...</div>
          </div>
        )}
        {shouldShowImage ? (
          <>
            <img 
              src={product.image} 
              alt={product.name}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            {isSuperuser && (
              <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                Изменить фото
              </div>
            )}
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent"></div>
            <div className="text-4xl sm:text-7xl z-10 transform group-hover:scale-110 transition-transform duration-300">
              {getEmoji(product.name)}
            </div>
            {isSuperuser && (
              <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                Добавить фото
              </div>
            )}
          </>
        )}
      </div>
      <div className="p-3 sm:p-5">
        <EditableText
          value={product.name}
          onSave={saveProductName}
          tag="h3"
          className="text-sm sm:text-lg font-bold text-red-900 mb-1 sm:mb-2 line-clamp-2 min-h-[2.5rem] sm:min-h-[3rem]"
          isSuperuser={isSuperuser}
        />
        <EditableText
          value={product.description}
          onSave={saveProductDescription}
          tag="p"
          className="text-red-700 text-xs sm:text-sm mb-2 sm:mb-4 min-h-[2.5rem] sm:min-h-[2.5rem] line-clamp-2"
          isSuperuser={isSuperuser}
        />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          <span className="text-lg sm:text-2xl font-bold text-red-600">
            {product.price} сомони
          </span>
          <button
            onClick={() => addToCart(product)}
            className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-pink-600 text-white px-4 sm:px-6 py-2 rounded-full text-xs sm:text-base font-semibold hover:from-red-700 hover:to-pink-700 transition-all shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
          >
            В корзину
          </button>
        </div>
      </div>
    </div>
  );
}
