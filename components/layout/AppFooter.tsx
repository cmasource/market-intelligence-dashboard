"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/useLanguage";

const footerLinks = [
  { href: "/markets", en: "Markets", es: "Mercados" },
  { href: "/screener", en: "Screener", es: "Screener" },
  { href: "/argentina", en: "Argentina", es: "Argentina" },
  { href: "/crypto", en: "Crypto", es: "Cripto" },
  { href: "/data-audit", en: "Data Audit", es: "Auditoría" },
  { href: "/methodology", en: "Methodology", es: "Metodología" },
  { href: "/glossary", en: "Glossary", es: "Glosario" },
  { href: "/status", en: "Status", es: "Estado" },
];

export function AppFooter() {
  const { language } = useLanguage();
  const isSpanish = language === "es";

  return (
    <footer className="border-t border-[var(--cma-border-soft)] bg-[var(--cma-bg-panel)] text-[var(--cma-text-muted)]">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-4 py-5 text-xs sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="https://cma-consulting.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="CMA Consulting"
            className="relative h-7 w-28 overflow-hidden rounded border border-[var(--cma-border-soft)] bg-white px-2 py-1 transition hover:border-[var(--cma-accent)]"
          >
            <Image src="/brand/cma-consulting-header-transparent.png" alt="CMA Consulting" width={622} height={144} className="h-full w-full object-contain" />
          </Link>
          <div className="relative h-6 w-24 overflow-hidden rounded border border-[var(--cma-border-soft)] bg-white px-1.5 py-1">
            <Image src="/brand/cma-source-horizontal-transparent.png" alt="cma_source" width={622} height={144} className="h-full w-full object-contain" />
          </div>
          <p className="leading-5">
            {isSpanish
              ? "Analisis informativo, no constituye asesoramiento financiero personalizado."
              : "Informational analysis only, not personalized financial advice."}
          </p>
        </div>
        <nav aria-label={isSpanish ? "Navegacion secundaria" : "Secondary navigation"} className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {footerLinks.map((item) => (
            <Link key={item.href} href={item.href} className="text-[var(--cma-text-secondary)] transition hover:text-[var(--cma-text-primary)]">
              {isSpanish ? item.es : item.en}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
