import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "О нас — История Chocoberry",
  description:
    "Узнайте историю Chocoberry — лучшей кондитерской Душанбе. Мы делаем клубнику в шоколаде, вафли и десерты ручной работы с любовью с 2020 года.",
  alternates: {
    canonical: "https://chocoberry.tj/about",
  },
  openGraph: {
    title: "О нас — Chocoberry Душанбе",
    description: "История Chocoberry — лучшей кондитерской Душанбе. Клубника в шоколаде, вафли, десерты ручной работы.",
    url: "https://chocoberry.tj/about",
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}











