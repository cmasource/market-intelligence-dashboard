"use client";

import { getAssetLogoMetadata } from "@/lib/assets/logo-map";
import { getLogoLookups, logoLookupPath } from "@/lib/assets/logo-sources";
import type { AssetType } from "@/types/asset";
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

const wideLogoSizeClasses = {
  sm: "h-9 w-14 text-xs",
  md: "h-12 w-[4.5rem] text-sm",
  lg: "h-16 w-24 text-lg",
};

const accentClasses = {
  cyan: "border-cyan-300/35 bg-cyan-300/12 text-cyan-50",
  blue: "border-blue-300/35 bg-blue-300/12 text-blue-50",
  violet: "border-violet-300/35 bg-violet-300/12 text-violet-50",
  emerald: "border-emerald-300/35 bg-emerald-300/12 text-emerald-50",
  amber: "border-amber-300/40 bg-amber-300/12 text-amber-50",
  rose: "border-rose-300/35 bg-rose-300/12 text-rose-50",
  slate: "border-slate-300/30 bg-slate-300/10 text-slate-50",
};

// Some providers return compact brandmarks with generous transparent padding.
// Keep these exceptions centralized so every surface renders them consistently.
const compactLogoScaleBySymbol: Record<string, string> = {
  CVX: "scale-[1.8]",
  YPF: "scale-[2.6]",
  YPFD: "scale-[2.6]",
};

const wideLogoSymbols = new Set(["YPF", "YPFD"]);

function isWideLogo(symbol: string) {
  return wideLogoSymbols.has(symbol.trim().toUpperCase());
}

function getExternalLogoScale(symbol: string) {
  return compactLogoScaleBySymbol[symbol.trim().toUpperCase()] ?? "scale-100";
}

function getExternalLogoUrls(
  logo: ReturnType<typeof getAssetLogoMetadata>,
  input: Pick<AssetLogoProps, "symbol" | "name" | "type">,
) {
  const provider = process.env.NEXT_PUBLIC_ASSET_LOGO_PROVIDER?.toLowerCase();
  if (provider !== "logo-dev") return [];

  const token = process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN;
  if (!token) return [];

  return getLogoLookups({
    ...input,
    domain: logo.logoDomain,
    cryptoId: logo.cryptoLogoId,
  }).map((lookup) =>
    `https://img.logo.dev/${logoLookupPath(lookup)}?token=${encodeURIComponent(token)}&size=64&format=png&theme=dark&retina=true&fallback=404`,
  );
}

function getTradingViewLogoUrl(logo: ReturnType<typeof getAssetLogoMetadata>) {
  if (!logo.tradingViewLogoSlug) return null;
  return `https://s3-symbol-logo.tradingview.com/${encodeURIComponent(logo.tradingViewLogoSlug)}--big.svg`;
}

function getCryptoLogoUrl(logo: ReturnType<typeof getAssetLogoMetadata>) {
  if (!logo.cryptoLogoId) return null;
  const iconById: Record<string, string> = {
    bitcoin: "btc",
    ethereum: "eth",
    solana: "sol",
    bnb: "bnb",
    xrp: "xrp",
    cardano: "ada",
    dogecoin: "doge",
    avalanche: "avax",
    chainlink: "link",
    polkadot: "dot",
    tether: "usdt",
    "usd-coin": "usdc",
    polygon: "matic",
    litecoin: "ltc",
    "bitcoin-cash": "bch",
  };
  const icon = iconById[logo.cryptoLogoId];
  return icon ? `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/${icon}.png` : null;
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
  const externalLogoUrls = [
    ...getExternalLogoUrls(logo, { symbol, name, type }),
    getTradingViewLogoUrl(logo),
    getCryptoLogoUrl(logo),
  ].filter((url): url is string => Boolean(url));
  const [failedExternalLogoUrls, setFailedExternalLogoUrls] = useState<string[]>([]);
  const externalLogoUrl = externalLogoUrls.find((url) => !failedExternalLogoUrls.includes(url)) ?? null;

  return (
    <div
      aria-label={`${logo.label} logo`}
      data-testid="asset-logo"
      data-external-logo={externalLogoUrl ? "true" : "false"}
      className={[
        "cma-asset-logo relative grid shrink-0 place-items-center overflow-hidden rounded-lg border font-semibold",
        isWideLogo(symbol) ? wideLogoSizeClasses[size] : sizeClasses[size],
        accentClasses[logo.accent],
        className,
      ].join(" ")}
    >
      <AssetLogoMark logo={logo} />
      {externalLogoUrl ? (
        // TradingView exposes these marks as SVGs. A plain img keeps them lightweight
        // and avoids Next image optimization restrictions for remote SVG assets.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={externalLogoUrl}
          alt=""
          className={[
            "cma-asset-logo__image absolute inset-0 h-full w-full object-contain transition-transform",
            getExternalLogoScale(symbol),
          ].join(" ")}
          loading="lazy"
          onError={() => setFailedExternalLogoUrls((failed) =>
            failed.includes(externalLogoUrl) ? failed : [...failed, externalLogoUrl]
          )}
        />
      ) : null}
    </div>
  );
}
