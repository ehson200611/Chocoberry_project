import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Блог — Новости и акции Chocoberry",
  description:
    "Последние новости, акции и специальные предложения от Chocoberry Душанбе. Следите за нашими обновлениями и получайте лучшие скидки!",
  alternates: {
    canonical: "https://chocoberry.tj/blog",
  },
  openGraph: {
    title: "Блог Chocoberry — Новости и акции",
    description: "Последние новости и акции от Chocoberry Душанбе. Скидки и специальные предложения.",
    url: "https://chocoberry.tj/blog",
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}











