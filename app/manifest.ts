import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CMA Markets",
    short_name: "CMA Markets",
    description: "Inteligencia financiera, mercados y analisis de activos.",
    start_url: "/",
    scope: "/",
    id: "/",
    display: "standalone",
    orientation: "any",
    lang: "es-AR",
    dir: "ltr",
    background_color: "#0b0f14",
    theme_color: "#0b0f14",
    categories: ["finance", "business"],
    icons: [
      {
        src: "/brand/cma-app-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/brand/cma-app-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
