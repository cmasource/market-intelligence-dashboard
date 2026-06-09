"use client";

import { getAssetLogoMetadata } from "@/lib/assets/logo-map";
import type { AssetType } from "@/types/asset";
import Image from "next/image";
import { useState } from "react";

type AssetLogoProps = {
  symbol: string;
  name?: string;
  type?: AssetType | string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClasses = {
  sm: "h-9 w-9 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-16 w-16 text-lg",
};

const accentClasses = {
  cyan: "border-cyan-300/35 bg-cyan-300/12 text-cyan-50 shadow-cyan-950/30",
  blue: "border-blue-300/35 bg-blue-300/12 text-blue-50 shadow-blue-950/30",
  violet: "border-violet-300/35 bg-violet-300/12 text-violet-50 shadow-violet-950/30",
  emerald: "border-emerald-300/35 bg-emerald-300/12 text-emerald-50 shadow-emerald-950/30",
  amber: "border-amber-300/40 bg-amber-300/12 text-amber-50 shadow-amber-950/30",
  rose: "border-rose-300/35 bg-rose-300/12 text-rose-50 shadow-rose-950/30",
  slate: "border-slate-300/30 bg-slate-300/10 text-slate-50 shadow-slate-950/30",
};

function getExternalLogoUrl(logo: ReturnType<typeof getAssetLogoMetadata>) {
  const provider = process.env.NEXT_PUBLIC_ASSET_LOGO_PROVIDER?.toLowerCase();
  if (provider !== "logo-dev") return null;

  const token = process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN;
  if (!token) return null;

  if (logo.logoDomain) {
    return `https://img.logo.dev/${encodeURIComponent(logo.logoDomain)}?token=${encodeURIComponent(token)}&format=png&retina=true`;
  }

  if (logo.cryptoLogoId) {
    return `https://img.logo.dev/crypto/${encodeURIComponent(logo.cryptoLogoId)}?token=${encodeURIComponent(token)}&format=png&retina=true`;
  }

  return null;
}

function AssetLogoMark({ logo }: { logo: ReturnType<typeof getAssetLogoMetadata> }) {
  if (logo.variant === "apple") {
    return (
      <span className="relative grid place-items-center leading-none">
        <span className="text-[1.18em] font-black">A</span>
        <span className="absolute -right-1 -top-1 h-2 w-3 rotate-[-28deg] rounded-full bg-slate-200/80" />
      </span>
    );
  }

  if (logo.variant === "microsoft") {
    return (
      <span className="relative grid h-[58%] w-[58%] grid-cols-2 gap-0.5">
        <span className="bg-[#f25022]" />
        <span className="bg-[#7fba00]" />
        <span className="bg-[#00a4ef]" />
        <span className="bg-[#ffb900]" />
      </span>
    );
  }

  if (logo.variant === "tesla") {
    return <span className="relative text-[1.55em] font-black leading-none tracking-[0.02em]">T</span>;
  }

  if (logo.variant === "cocaCola") {
    return <span className="relative font-serif text-[1.08em] font-black italic leading-none tracking-tight">KO</span>;
  }

  if (logo.variant === "amazon") {
    return (
      <span className="relative flex flex-col items-center leading-none">
        <span className="text-[1.18em] font-black">A</span>
        <span className="mt-0.5 h-1 w-5 rounded-full bg-amber-300" />
      </span>
    );
  }

  if (logo.variant === "etf") {
    return (
      <span className="relative flex flex-col items-center leading-none">
        <span className="text-[0.95em] font-black">{logo.initials}</span>
        <span className="mt-1 text-[0.42em] font-bold tracking-[0.18em] opacity-80">ETF</span>
      </span>
    );
  }

  return <span className="relative cma-metric">{logo.initials}</span>;
}

export function AssetLogo({ symbol, name, type, size = "md", className = "" }: AssetLogoProps) {
  const logo = getAssetLogoMetadata(symbol, type, name);
  const candidateExternalLogoUrl = getExternalLogoUrl(logo);
  const [failedExternalLogoUrl, setFailedExternalLogoUrl] = useState<string | null>(null);
  const [loadedExternalLogoUrl, setLoadedExternalLogoUrl] = useState<string | null>(null);
  const externalLogoUrl = candidateExternalLogoUrl !== failedExternalLogoUrl ? candidateExternalLogoUrl : null;
  const isExternalLoaded = externalLogoUrl !== null && loadedExternalLogoUrl === externalLogoUrl;

  return (
    <div
      aria-label={`${logo.label} logo`}
      data-testid="asset-logo"
      className={[
        "relative grid shrink-0 place-items-center overflow-hidden rounded-2xl border font-semibold shadow-xl",
        "before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_25%_15%,rgba(255,255,255,0.22),transparent_35%)]",
        sizeClasses[size],
        accentClasses[logo.accent],
        className,
      ].join(" ")}
    >
      <AssetLogoMark logo={logo} />
      {externalLogoUrl ? (
        <Image
          src={externalLogoUrl}
          alt=""
          width={96}
          height={96}
          className={`absolute inset-[18%] h-[64%] w-[64%] object-contain transition-opacity ${isExternalLoaded ? "opacity-100" : "opacity-0"}`}
          loading="lazy"
          onLoad={() => setLoadedExternalLogoUrl(externalLogoUrl)}
          onError={() => setFailedExternalLogoUrl(externalLogoUrl)}
        />
      ) : null}
    </div>
  );
}

