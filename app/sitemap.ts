import type { MetadataRoute } from "next";

const demoRoutes = [
  "",
  "/markets",
  "/screener",
  "/argentina",
  "/crypto",
  "/reports",
  "/agents",
  "/status",
  "/asset/AAPL",
  "/asset/SPY",
  "/asset/QQQ",
  "/asset/BTC-USD",
  "/asset/ETH-USD",
  "/asset/AL30",
  "/asset/AL30D",
  "/asset/AL30C",
  "/asset/GD30",
  "/asset/GD30D",
  "/asset/GD30C",
  "/asset/TX26",
  "/asset/AMZN",
  "/asset/PAMP",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return demoRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date("2026-05-11"),
    changeFrequency: "weekly",
    priority: route === "" ? 1 : 0.7,
  }));
}
