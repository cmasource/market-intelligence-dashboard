import type { Metadata } from "next";
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
    icon: "/icon.png",
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <body className="min-h-full">
        <ThemeProvider>
          <LanguageProvider>{children}</LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
