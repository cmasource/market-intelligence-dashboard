import type { Metadata, Viewport } from "next";
import { PwaInstallPrompt } from "@/components/layout/PwaInstallPrompt";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { ThemeProvider } from "@/lib/theme/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "CMA Markets",
  applicationName: "CMA Markets",
  description:
    "Dashboard de inteligencia financiera con análisis técnico, fundamentos, renta fija, cripto, CEDEARs y cobertura de instrumentos argentinos.",
  authors: [{ name: "CMA Consulting" }],
  creator: "CMA Consulting",
  publisher: "CMA Consulting",
  icons: {
    icon: "/brand/cma-app-icon-192.png",
    shortcut: "/favicon.ico",
    apple: "/brand/cma-app-icon-apple-v2-180.png",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "CMA Markets",
    statusBarStyle: "black",
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
  openGraph: {
    title: "CMA Markets",
    description:
      "Dashboard de inteligencia financiera con análisis técnico, fundamentos, renta fija, cripto, CEDEARs y cobertura de instrumentos argentinos.",
    siteName: "CMA Markets",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "CMA Markets",
    description:
      "Dashboard de inteligencia financiera con análisis técnico, fundamentos, renta fija, cripto, CEDEARs y cobertura de instrumentos argentinos.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#0b0f14",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <body className="min-h-full">
        <ThemeProvider>
          <LanguageProvider>
            <PwaInstallPrompt />
            {children}
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
