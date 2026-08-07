"use client";

import Image from "next/image";
import { useState } from "react";

const PROVIDER_LOGO_DOMAINS: Record<string, string> = {
  plus: "plus.com.ar",
  bna: "bna.com.ar",
  belo: "belo.app",
  dolarapp: "dolarapp.com",
  fiwind: "fiwind.io",
  satoshitango: "satoshitango.com",
  "banco-ciudad": "bancociudad.com.ar",
  "banco-hipotecario": "hipotecario.com.ar",
  "banco-provincia": "bancoprovincia.com.ar",
  "banco-supervielle": "supervielle.com.ar",
  uala: "uala.com.ar",
  reba: "reba.com.ar",
  balanz: "balanz.com",
  galicia: "galicia.ar",
  santander: "santander.com.ar",
  bbva: "bbva.com.ar",
};

const PROVIDER_ACCENTS: Record<string, string> = {
  plus: "bg-white text-slate-950",
  bna: "bg-sky-600 text-white",
  belo: "bg-fuchsia-600 text-white",
  dolarapp: "bg-violet-600 text-white",
  fiwind: "bg-indigo-600 text-white",
  satoshitango: "bg-amber-500 text-slate-950",
  "banco-ciudad": "bg-sky-700 text-white",
  "banco-hipotecario": "bg-rose-700 text-white",
  "banco-provincia": "bg-emerald-700 text-white",
  "banco-supervielle": "bg-red-700 text-white",
  uala: "bg-violet-700 text-white",
  reba: "bg-cyan-700 text-white",
  balanz: "bg-slate-700 text-white",
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function externalLogoUrl(providerId: string) {
  if (process.env.NEXT_PUBLIC_ASSET_LOGO_PROVIDER?.toLowerCase() !== "logo-dev") return null;
  if (process.env.NEXT_PUBLIC_ENABLE_EXTERNAL_LOGOS !== "1") return null;
  const token = process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN;
  const domain = PROVIDER_LOGO_DOMAINS[providerId];
  if (!token || !domain) return null;
  return `https://img.logo.dev/${encodeURIComponent(domain)}?token=${encodeURIComponent(token)}&format=png&retina=true`;
}

export function ProviderLogo({ providerId, providerName, size = "md" }: { providerId: string; providerName: string; size?: "sm" | "md" }) {
  const candidateUrl = externalLogoUrl(providerId);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const logoUrl = candidateUrl && candidateUrl !== failedUrl ? candidateUrl : null;
  const sizeClass = size === "sm" ? "h-9 w-9 rounded-lg text-[10px]" : "h-11 w-11 rounded-xl text-xs";

  return (
    <span
      aria-label={`${providerName} logo`}
      className={`relative grid shrink-0 place-items-center overflow-hidden border border-[var(--cma-border-soft)] font-extrabold tracking-tight ${sizeClass} ${PROVIDER_ACCENTS[providerId] ?? "bg-[var(--cma-bg-elevated)] text-[var(--cma-text-primary)]"}`}
    >
      {initials(providerName)}
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt=""
          fill
          sizes={size === "sm" ? "36px" : "44px"}
          className="bg-white object-contain p-1.5"
          onError={() => setFailedUrl(logoUrl)}
        />
      ) : null}
    </span>
  );
}
