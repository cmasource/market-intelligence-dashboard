import type { MetadataRoute } from "next";

const demoRoutes = [
  "",
  "/today",
  "/markets",
  "/screener",
  "/data-audit",
  "/glossary",
  "/alerts/guide",
  "/methodology",
  "/argentina",
  "/crypto",
  "/reports",
  "/status",
  "/asset/AAPL",
  "/asset/MSFT",
  "/asset/NVDA",
  "/asset/TSLA",
  "/asset/AMZN",
  "/asset/META",
  "/asset/GOOGL",
  "/asset/KO",
  "/asset/SPY",
  "/asset/QQQ",
  "/asset/BTC-USD",
  "/asset/ETH-USD",
  "/asset/BNB-USD",
  "/asset/SOL-USD",
  "/asset/XRP-USD",
  "/asset/ADA-USD",
  "/asset/DOGE-USD",
  "/asset/AVAX-USD",
  "/asset/LINK-USD",
  "/asset/DOT-USD",
  "/asset/AL30",
  "/asset/AL30D",
  "/asset/AL30C",
  "/asset/GD30",
  "/asset/GD30D",
  "/asset/GD30C",
  "/asset/TX26",
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
