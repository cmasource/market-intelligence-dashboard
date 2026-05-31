import { getAssetLogoMetadata } from "@/lib/assets/logo-map";
import type { AssetType } from "@/types/asset";

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

export function AssetLogo({ symbol, name, type, size = "md", className = "" }: AssetLogoProps) {
  const logo = getAssetLogoMetadata(symbol, type, name);

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
      <span className="relative cma-metric">{logo.initials}</span>
    </div>
  );
}

