"use client";

import { useState, useRef, useEffect } from "react";
import { editableContentApi } from "../services/api";

interface EditableTextProps {
  value: string;
  onSave?: (newValue: string) => Promise<void>;
  className?: string;
  tag?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  isSuperuser: boolean;
  contentKey?: string;
  page?: string;
}

export default function EditableText({ 
  value, 
  onSave, 
  className = "", 
  tag = 'p',
  isSuperuser,
  contentKey,
  page
}: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [currentValue, setCurrentValue] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditValue(value);
    setCurrentValue(value);
  }, [value]);

  // Загружаем значение из API если указан contentKey
  useEffect(() => {
    if (contentKey && !isSuperuser) {
      editableContentApi.getByKey(contentKey).then((content) => {
        if (content) {
          setCurrentValue(content);
          setEditValue(content);
        }
      });
    }
  }, [contentKey, isSuperuser]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select();
      }
    }
  }, [isEditing]);

  const handleSave = async () => {
    const trimmedValue = editValue.trim();
    if (trimmedValue === currentValue) {
      setIsEditing(false);
      return;
    }
    
    setSaving(true);
    try {
      if (contentKey) {
        // Сохраняем через API
        await editableContentApi.save(contentKey, trimmedValue, page);
        setCurrentValue(trimmedValue);
      } else if (onSave) {
        // Используем кастомный onSave
        await onSave(trimmedValue);
        setCurrentValue(trimmedValue);
      }
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving:", error);
      setEditValue(currentValue); // Восстанавливаем старое значение при ошибке
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(currentValue);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!isSuperuser) {
    const Tag = tag;
    return <Tag className={className}>{currentValue || value}</Tag>;
  }

  const Tag = tag;

  if (isEditing) {
    return (
      <div className="relative group">
        {tag === 'p' ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className={`${className} border-2 border-red-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-red-500`}
            rows={3}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className={`${className} border-2 border-red-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-red-500`}
          />
        )}
        <div className="absolute -top-8 right-0 bg-gray-800 text-white text-xs px-2 py-1 rounded">
          Enter - сохранить, Esc - отмена
        </div>
      </div>
    );
  }

  return (
    <div className="relative group inline-block w-full">
      <div className="relative">
        <Tag className={className}>{value}</Tag>
        <button
          onClick={() => setIsEditing(true)}
          className="absolute -top-1 -right-8 opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 text-white p-1.5 rounded-full text-xs hover:bg-red-700 shadow-lg z-10"
          title="Редактировать"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

