"use client";

import { useState, useRef, useEffect } from "react";
import { editableContentApi } from "../services/api";
import Image from "next/image";

interface EditableImageProps {
  defaultEmoji: string;
  contentKey: string;
  page: string;
  className?: string;
  isSuperuser: boolean;
  alt?: string;
}

export default function EditableImage({
  defaultEmoji,
  contentKey,
  page,
  className = "",
  isSuperuser,
  alt = "Blog post image"
}: EditableImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadImageUrl();
  }, [contentKey]);

  const loadImageUrl = async () => {
    setLoading(true);
    try {
      const url = await editableContentApi.getByKey(contentKey);
      if (url && url.startsWith('http')) {
        setImageUrl(url);
      } else {
        setImageUrl(null);
      }
    } catch (error) {
      console.error("Error loading image URL:", error);
      setImageUrl(null);
    } finally {
      setLoading(false);
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

    setUploading(true);
    try {
      // Загружаем изображение на сервер
      const formData = new FormData();
      formData.append('image', file);
      formData.append('key', contentKey);
      formData.append('page', page);

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const response = await fetch(`${API_BASE_URL}/blog-upload-image/`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      const imageUrl = data.image_url;

      // Сохраняем URL в EditableContent
      await editableContentApi.save(contentKey, imageUrl, page);
      setImageUrl(imageUrl);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert('Ошибка при загрузке изображения');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (loading) {
    return (
      <div className={`${className} flex items-center justify-center`}>
        <div className="text-6xl">{defaultEmoji}</div>
      </div>
    );
  }

  return (
    <div className={`relative ${className} ${isSuperuser ? 'cursor-pointer group' : ''}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleImageChange}
        className="hidden"
      />
      {uploading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20 rounded-lg">
          <div className="text-white font-semibold">Загрузка...</div>
        </div>
      )}
      {imageUrl ? (
        <>
          <div className="relative w-full h-48 rounded-lg overflow-hidden">
            <Image
              src={imageUrl}
              alt={alt}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          {isSuperuser && (
            <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity z-10">
              Изменить фото
            </div>
          )}
        </>
      ) : (
        <>
          <div
            onClick={handleImageClick}
            className="flex items-center justify-center h-48 bg-gradient-to-br from-red-100 to-pink-100 rounded-lg"
          >
            <div className="text-6xl">{defaultEmoji}</div>
          </div>
          {isSuperuser && (
            <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
              Добавить фото
            </div>
          )}
        </>
      )}
    </div>
  );
}

