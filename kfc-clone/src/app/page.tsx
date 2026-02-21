"use client";

import { useEffect, useState } from "react";
import { Product } from "../context/CartContext";
import ProductCard from "../components/ProductCard";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Cart from "../components/Cart";
import NewItemsCarousel from "../components/NewItemsCarousel";
import EditableText from "../components/EditableText";
import { api, ApiProduct, newItemsApi, NewItem, authApi, User } from "../services/api";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [newItems, setNewItems] = useState<NewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Загружаем пользователя
        const user = await authApi.getCurrentUser();
        setCurrentUser(user);
        
        // Загружаем продукты
        const apiProducts = await api.getProducts();
        const convertedProducts: Product[] = apiProducts.map((p: ApiProduct) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: parseFloat(p.price),
          image: p.image_url || p.image || "",
        }));
        setProducts(convertedProducts);
        
        // Загружаем новинки
        const items = await newItemsApi.getNewItems();
        setNewItems(items);
      } catch (err) {
        console.error("Error fetching data:", err);
        const errorMessage = err instanceof Error ? err.message : "Неизвестная ошибка";
        setError(`Не удалось загрузить данные: ${errorMessage}. Проверьте, что Django сервер запущен на http://localhost:8000`);
        // Fallback на статичные данные если API недоступен
        setProducts(getDefaultProducts());
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const isSuperuser = currentUser?.is_superuser || false;

  const getDefaultProducts = (): Product[] => [
    {
      id: 1,
      name: "Большой бокс с вафлями и фруктами",
      description: "Мини-вафли, бананы, клубника и шоколадный соус",
      price: 90,
      image: "/images/large-box-waffles.jpg",
    },
    {
      id: 2,
      name: "Микс бокс с дубайской ночинки",
      description: "Вафли с шоколадом, зелёным соусом, киви и клубникой",
      price: 140,
      image: "/images/mix-box-dubai.jpg",
    },
    {
      id: 3,
      name: "Клубника с дубайский ночинки",
      description: "Клубника с шоколадом и фисташками в стаканчике",
      price: 80,
      image: "/images/strawberry-dubai.jpg",
    },
    {
      id: 4,
      name: "Вафли с фруктами",
      description: "Мини-вафли с бананами и клубникой в шоколаде",
      price: 30,
      image: "/images/waffles-fruits.jpg",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-red-50 via-rose-50 to-pink-50">
      <Header />
      <main className="flex-1 container mx-auto px-3 sm:px-4 pt-6 sm:pt-8 pb-24 sm:pb-12">
        {/* Карусель новинок */}
        {!loading && newItems.length > 0 && (
          <NewItemsCarousel items={newItems} />
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-6xl animate-spin">🍓</div>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-600">
            <p>{error}</p>
            <p className="text-sm mt-2">Используются данные по умолчанию</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-8 text-red-600">
            <p>Нет доступных продуктов</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <EditableText
                value="Весь каталог"
                contentKey="catalog_title"
                page="home"
                tag="h2"
                className="text-2xl sm:text-3xl font-bold text-red-700"
                isSuperuser={isSuperuser}
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </main>
      <Footer />
      <Cart />
    </div>
  );
}
