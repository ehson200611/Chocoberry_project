"use client";

import { useState, useEffect } from "react";
import Logo from "./Logo";
import EditableText from "./EditableText";
import { authApi, User } from "../services/api";

export default function Footer() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

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

  return (
    <footer className="bg-gradient-to-r from-red-800 to-pink-800 text-white mt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="mb-4">
              <Logo size="lg" showText={true} className="text-white" />
            </div>
            <EditableText
              value="Клубника в шоколаде. Сладкие моменты с любовью!"
              contentKey="footer_text"
              page="footer"
              tag="p"
              className="text-red-200 text-sm"
              isSuperuser={isSuperuser}
            />
            <div className="mt-4 flex gap-3">
              <a
                href="https://instagram.com/chocoberry_tjk"
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-200 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Контакты</h4>
            <ul className="space-y-2 text-red-200 text-sm">
              <li>📞 +992 (93) 123-45-67</li>
              <li>📧 info@chocoberry.tj</li>
              <li>📍 Душанбе, Таджикистан</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Режим работы</h4>
            <ul className="space-y-2 text-red-200 text-sm">
              <li>Пн-Вс: 09:00 - 22:00</li>
              <li>Доставка: круглосуточно</li>
              <li>Заказы онлайн: 24/7</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-red-700 mt-8 pt-8">
          <div className="flex flex-col items-center gap-4">
            <Logo size="md" showText={false} />
            <EditableText
              value="© 2024 Choco Berry. Все права защищены. 🍓🍫"
              contentKey="footer_copyright"
              page="footer"
              tag="p"
              className="text-red-200 text-sm text-center"
              isSuperuser={isSuperuser}
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
