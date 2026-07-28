type SignalGaugeProps = {
  score: number | null;
  confidenceLabel: string;
  language: "en" | "es";
};

type SignalZone = {
  max: number;
  color: string;
  en: string;
  es: string;
};

const zones: SignalZone[] = [
  { max: 20, color: "#fb7185", en: "Strong sell", es: "Venta fuerte" },
  { max: 40, color: "#f59e0b", en: "Sell", es: "Venta" },
  { max: 60, color: "#94a3b8", en: "Wait", es: "Esperar" },
  { max: 80, color: "#22d3ee", en: "Buy", es: "Compra" },
  { max: 100, color: "#34d399", en: "Strong buy", es: "Compra fuerte" },
];

function normalizeScore(score: number | null) {
  if (typeof score !== "number" || !Number.isFinite(score)) return null;
  return Math.max(0, Math.min(100, score));
}

function pointOnArc(angle: number, radius: number) {
  const radians = (angle * Math.PI) / 180;
  return {
    x: 140 + radius * Math.cos(radians),
    y: 130 + radius * Math.sin(radians),
  };
}

function arcPath(startAngle: number, endAngle: number) {
  const start = pointOnArc(startAngle, 100);
  const end = pointOnArc(endAngle, 100);
  return `M ${start.x} ${start.y} A 100 100 0 0 1 ${end.x} ${end.y}`;
}

function zoneForScore(score: number | null) {
  if (score === null) return null;
  return zones.find((zone) => score <= zone.max) ?? zones[zones.length - 1];
}

export function SignalGauge({ score, confidenceLabel, language }: SignalGaugeProps) {
  const safeScore = normalizeScore(score);
  const activeZone = zoneForScore(safeScore);
  const decisionLabel = activeZone?.[language] ?? (language === "es" ? "Sin senal" : "No signal");
  const needleAngle = 180 + (safeScore ?? 50) * 1.8;
  const needleTip = pointOnArc(needleAngle, 75);
  const confidenceText = language === "es" ? `Confianza: ${confidenceLabel}` : `Confidence: ${confidenceLabel}`;
  const accessibleLabel = `${language === "es" ? "Sesgo integrado" : "Integrated bias"}: ${decisionLabel}, ${safeScore ?? "N/A"} ${language === "es" ? "de" : "out of"} 100. ${confidenceText}.`;

  return (
    <div className="mx-auto w-full max-w-72 text-center" role="img" aria-label={accessibleLabel}>
      <div className="flex items-center justify-center gap-3">
        <p className="text-xs font-semibold uppercase text-slate-400">
          {language === "es" ? "Indicador compra / venta" : "Buy / sell indicator"}
        </p>
      </div>

      <svg className="mt-2 h-auto w-full" viewBox="0 0 280 164" aria-hidden="true">
        {zones.map((zone, index) => {
          const startAngle = 180 + index * 36 + 1.5;
          const endAngle = 180 + (index + 1) * 36 - 1.5;
          return (
            <path
              key={zone.max}
              d={arcPath(startAngle, endAngle)}
              fill="none"
              stroke={zone.color}
              strokeLinecap="round"
              strokeWidth="18"
            />
          );
        })}

        {safeScore !== null ? (
          <>
            <line
              x1="140"
              y1="130"
              x2={needleTip.x}
              y2={needleTip.y}
              stroke="#f8fafc"
              strokeLinecap="round"
              strokeWidth="4"
            />
            <circle cx="140" cy="130" r="10" fill="#0f172a" stroke="#f8fafc" strokeWidth="4" />
          </>
        ) : null}

      </svg>

      <div className="-mt-5 grid grid-cols-3 text-[11px] font-medium">
        <span className="text-left text-rose-300">{language === "es" ? "Venta" : "Sell"}</span>
        <span className="text-slate-400">{language === "es" ? "Esperar" : "Wait"}</span>
        <span className="text-right text-emerald-300">{language === "es" ? "Compra" : "Buy"}</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/10 pt-3 text-left">
        <div>
          <p className="text-[11px] uppercase text-slate-500">
            {language === "es" ? "Puntaje integrado" : "Integrated score"}
          </p>
          <p className="mt-1 text-sm font-semibold text-white">
            {safeScore === null ? "N/D" : `${Math.round(safeScore)}/100`}
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase text-slate-500">
            {language === "es" ? "Confianza del analisis" : "Analysis confidence"}
          </p>
          <p className="mt-1 text-sm font-semibold text-white">{confidenceLabel}</p>
        </div>
      </div>
      <p className="mt-1 text-[11px] text-slate-500">
        {language === "es" ? "Senal informativa, no es una orden." : "Informational signal, not an order."}
      </p>
    </div>
  );
}
