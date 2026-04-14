import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "../context/CartContext";
import { ThemeProvider } from "../context/ThemeContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Chocoberry — Клубника в шоколаде 🍓 Доставка по Душанбе",
    template: "%s | Chocoberry Душанбе",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ChocoBerrry",
    startupImage: [
      {
        url: "/icons/icon-512x512.png",
      },
    ],
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "192x192", type: "image/png" },
    ],
  },
  description:
    "Chocoberry — лучшая клубника в шоколаде в Душанбе! Вафли, фрукты, десерты ручной работы. Быстрая доставка по всему городу. Заказывайте онлайн 24/7. ☎ +992 501 07 77 03",
  keywords: [
    "клубника в шоколаде Душанбе",
    "Chocoberry",
    "чокоберри",
    "доставка десертов Душанбе",
    "вафли Душанбе",
    "фрукты в шоколаде",
    "клубника шоколад Таджикистан",
    "заказ десертов онлайн Душанбе",
    "подарки Душанбе",
    "шоколадные десерты",
    "кондитерская Душанбе",
    "chocoberry.tj",
  ],
  authors: [{ name: "Chocoberry", url: "https://chocoberry.tj" }],
  creator: "Chocoberry",
  publisher: "Chocoberry",
  metadataBase: new URL("https://chocoberry.tj"),
  alternates: {
    canonical: "https://chocoberry.tj",
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "https://chocoberry.tj",
    siteName: "Chocoberry",
    title: "Chocoberry — Клубника в шоколаде 🍓 Душанбе",
    description:
      "Лучшая клубника в шоколаде в Душанбе! Вафли, фрукты, десерты ручной работы. Быстрая доставка. Заказывайте онлайн!",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Chocoberry — Клубника в шоколаде Душанбе",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Chocoberry — Клубника в шоколаде 🍓 Душанбе",
    description: "Лучшая клубника в шоколаде в Душанбе! Быстрая доставка по городу.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "wy7kVyItie6hafy9vGlN_SvlCfu9sZIxuM6reId5UpE",
  },
  category: "food",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "FoodEstablishment",
      "@id": "https://chocoberry.tj/#business",
      name: "Chocoberry",
      url: "https://chocoberry.tj",
      logo: "https://chocoberry.tj/logo.png",
      image: "https://chocoberry.tj/og-image.jpg",
      description:
        "Лучшая клубника в шоколаде в Душанбе. Вафли, фрукты, десерты ручной работы. Быстрая доставка.",
      telephone: "+992501077703",
      priceRange: "$$",
      servesCuisine: ["Десерты", "Кондитерские изделия"],
      address: {
        "@type": "PostalAddress",
        streetAddress: "Душанбе",
        addressLocality: "Душанбе",
        addressCountry: "TJ",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: 38.5598,
        longitude: 68.7741,
      },
      openingHoursSpecification: [
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: [
            "Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday",
          ],
          opens: "09:00",
          closes: "22:00",
        },
      ],
      sameAs: [
        "https://www.instagram.com/chocoberry.tj",
      ],
      hasMap: "https://maps.google.com/?q=Chocoberry+Душанбе",
    },
    {
      "@type": "WebSite",
      "@id": "https://chocoberry.tj/#website",
      url: "https://chocoberry.tj",
      name: "Chocoberry",
      description: "Клубника в шоколаде — доставка по Душанбе",
      publisher: { "@id": "https://chocoberry.tj/#business" },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: "https://chocoberry.tj/?q={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" prefix="og: https://ogp.me/ns#">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* PWA iOS Meta Tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ChocoBerrry" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#7c2d12" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <CartProvider>{children}</CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
