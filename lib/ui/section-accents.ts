export type SectionAccent = "default" | "argentina" | "cedears" | "fixedIncome" | "crypto" | "usa" | "ai" | "reports" | "screener";

export const sectionAccents: Record<SectionAccent, { card: string; badge: string; strip: string }> = {
  default: {
    card: "border-white/10 bg-white/[0.045]",
    badge: "border-slate-300/20 bg-slate-300/10 text-slate-100",
    strip: "from-slate-300/30 to-transparent",
  },
  argentina: {
    card: "border-cyan-300/25 bg-cyan-300/10",
    badge: "border-cyan-300/25 bg-cyan-300/10 text-cyan-100",
    strip: "from-cyan-300/60 to-transparent",
  },
  cedears: {
    card: "border-violet-300/35 bg-violet-300/10 ring-1 ring-violet-300/15",
    badge: "border-violet-300/25 bg-violet-300/10 text-violet-100",
    strip: "from-violet-300/70 to-transparent",
  },
  fixedIncome: {
    card: "border-emerald-300/25 bg-emerald-300/10",
    badge: "border-emerald-300/25 bg-emerald-300/10 text-emerald-100",
    strip: "from-emerald-300/60 to-transparent",
  },
  crypto: {
    card: "border-amber-300/25 bg-amber-300/10",
    badge: "border-amber-300/25 bg-amber-300/10 text-amber-100",
    strip: "from-amber-300/70 to-transparent",
  },
  usa: {
    card: "border-blue-300/25 bg-blue-300/10",
    badge: "border-blue-300/25 bg-blue-300/10 text-blue-100",
    strip: "from-blue-300/60 to-transparent",
  },
  ai: {
    card: "border-purple-300/25 bg-purple-300/10",
    badge: "border-purple-300/25 bg-purple-300/10 text-purple-100",
    strip: "from-purple-300/60 to-transparent",
  },
  reports: {
    card: "border-fuchsia-300/25 bg-fuchsia-300/10",
    badge: "border-fuchsia-300/25 bg-fuchsia-300/10 text-fuchsia-100",
    strip: "from-fuchsia-300/60 to-transparent",
  },
  screener: {
    card: "border-indigo-300/25 bg-indigo-300/10",
    badge: "border-indigo-300/25 bg-indigo-300/10 text-indigo-100",
    strip: "from-indigo-300/60 to-transparent",
  },
};
