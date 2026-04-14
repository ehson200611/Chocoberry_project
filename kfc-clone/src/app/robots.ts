import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/profile/", "/cart/"],
      },
    ],
    sitemap: "https://chocoberry.tj/sitemap.xml",
    host: "https://chocoberry.tj",
  };
}











