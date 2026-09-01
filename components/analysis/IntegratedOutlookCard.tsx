import type { IntegratedOutlook } from "@/lib/intelligence/integrated-outlook";
import { Badge } from "@/components/ui/Badge";

export function IntegratedOutlookCard({
  outlook,
  language,
}: {
  outlook: IntegratedOutlook;
  language: "en" | "es";
}) {
  const isSpanish = language === "es";

  return (
    <div className="mt-5 border-t border-white/10 pt-5" data-testid="integrated-outlook">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">
            {isSpanish ? "Perspectiva integrada" : "Integrated outlook"}
          </p>
          <h3 className="mt-2 text-lg font-semibold text-white">{outlook.title}</h3>
        </div>
        <Badge tone="neutral">{isSpanish ? `Confianza ${outlook.confidenceLabel}` : `${outlook.confidenceLabel} confidence`}</Badge>
      </div>

      <p className="mt-3 max-w-5xl text-sm leading-6 text-slate-200">{outlook.summary}</p>
      <p className="mt-2 max-w-5xl text-sm leading-6 text-slate-300">{outlook.scenario}</p>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-lg border border-cyan-300/15 bg-cyan-300/[0.06] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-200">
            {isSpanish ? "Evidencia técnica" : "Technical evidence"}
          </p>
          <ul className="mt-3 space-y-2 text-sm leading-5 text-slate-300">
            {outlook.technicalEvidence.map((item) => <li key={item}>• {item}</li>)}
          </ul>
        </div>
        <div className="rounded-lg border border-violet-300/15 bg-violet-300/[0.06] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-200">
            {isSpanish ? "Evidencia fundamental" : "Fundamental evidence"}
          </p>
          <ul className="mt-3 space-y-2 text-sm leading-5 text-slate-300">
            {outlook.fundamentalEvidence.map((item) => <li key={item}>• {item}</li>)}
          </ul>
        </div>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <p className="rounded-lg border border-emerald-300/15 bg-emerald-300/[0.06] p-3 text-sm leading-5 text-emerald-50">
          {outlook.confirmation}
        </p>
        <p className="rounded-lg border border-rose-300/15 bg-rose-300/[0.06] p-3 text-sm leading-5 text-rose-50">
          {outlook.risk}
        </p>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">{outlook.horizon}</p>
    </div>
  );
}
