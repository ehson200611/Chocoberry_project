import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Наш адрес — Как нас найти в Душанбе",
  description:
    "Chocoberry находится в Душанбе. Адрес, карта, время работы и контакты. ☎ +992 501 07 77 03. Приходите или заказывайте доставку онлайн!",
  alternates: {
    canonical: "https://chocoberry.tj/location",
  },
  openGraph: {
    title: "Адрес Chocoberry в Душанбе — Как нас найти",
    description: "Адрес, карта и контакты Chocoberry в Душанбе. ☎ +992 501 07 77 03",
    url: "https://chocoberry.tj/location",
  },
};

export default function LocationLayout({ children }: { children: React.ReactNode }) {
  return children;
}











