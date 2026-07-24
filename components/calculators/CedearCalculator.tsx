"use client";

import { useMemo, useState } from "react";
import { calculateImpliedCcl } from "@/lib/cedears/ccl";
import type { CedearAnalytics } from "@/lib/cedears/types";
import { useLanguage } from "@/lib/i18n/useLanguage";

function positiveNumber(value: string) {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function CedearCalculator() {
  const { language } = useLanguage();
  const isSpanish = language === "es";
  const [symbol, setSymbol] = useState("AAPL");
  const [ratio, setRatio] = useState("20");
  const [underlying, setUnderlying] = useState("");
  const [localPrice, setLocalPrice] = useState("");
  const [referenceCcl, setReferenceCcl] = useState("1500");
  const [loading, setLoading] = useState(false);

  const result = useMemo(() => {
    const ratioValue = positiveNumber(ratio);
    const underlyingValue = positiveNumber(underlying);
    const cclValue = positiveNumber(referenceCcl);
    const localValue = positiveNumber(localPrice);
    return {
      fairPrice: ratioValue && underlyingValue && cclValue ? (underlyingValue / ratioValue) * cclValue : null,
      impliedCcl: ratioValue && underlyingValue && localValue ? calculateImpliedCcl(localValue, underlyingValue, ratioValue) : null,
    };
  }, [localPrice, ratio, referenceCcl, underlying]);

  async function loadSymbol() {
    setLoading(true);
    try {
      const response = await fetch(`/api/cedears/${encodeURIComponent(symbol.trim().toUpperCase())}`);
      if (!response.ok) return;
      const data = (await response.json()) as CedearAnalytics;
      if (typeof data.ratio === "number") setRatio(String(data.ratio));
      if (typeof data.underlyingPrice === "number") setUnderlying(String(data.underlyingPrice));
      if (typeof data.localPrice === "number") setLocalPrice(String(data.localPrice));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-lg border border-violet-300/20 bg-slate-950/55 p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="cma-kicker">CEDEAR</p>
          <h2 className="mt-2 text-xl font-semibold text-white">{isSpanish ? "Calculadora de precio de referencia" : "Reference price calculator"}</h2>
        </div>
        <p className="text-xs text-slate-500">(USD / ratio) x CCL</p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <label className="text-xs font-semibold text-slate-400">
          {isSpanish ? "Especie" : "Symbol"}
          <div className="mt-2 flex">
            <input value={symbol} onChange={(event) => setSymbol(event.target.value.toUpperCase())} className="min-w-0 flex-1 rounded-l-md border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/50" />
            <button type="button" onClick={loadSymbol} className="rounded-r-md border border-l-0 border-cyan-300/25 bg-cyan-300/10 px-3 text-sm font-semibold text-cyan-100">
              {loading ? "..." : isSpanish ? "Cargar" : "Load"}
            </button>
          </div>
        </label>
        <NumberField label="Ratio" value={ratio} onChange={setRatio} />
        <NumberField label={isSpanish ? "Accion USA (USD)" : "US stock (USD)"} value={underlying} onChange={setUnderlying} />
        <NumberField label={isSpanish ? "CEDEAR local (ARS)" : "Local CEDEAR (ARS)"} value={localPrice} onChange={setLocalPrice} />
        <NumberField label="CCL (ARS/USD)" value={referenceCcl} onChange={setReferenceCcl} />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Result label={isSpanish ? "Precio de referencia CEDEAR" : "CEDEAR reference price"} value={result.fairPrice} suffix="ARS" />
        <Result label={isSpanish ? "CCL implicito del precio local" : "Local price implied CCL"} value={result.impliedCcl} suffix="ARS/USD" />
      </div>
    </section>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="text-xs font-semibold text-slate-400">
      {label}
      <input inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/50" />
    </label>
  );
}

function Result({ label, value, suffix }: { label: string; value: number | null; suffix: string }) {
  return (
    <div className="rounded-lg border border-cyan-300/15 bg-cyan-300/[0.055] p-4">
      <p className="text-xs uppercase text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">
        {value === null ? "-" : Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 }).format(value)} <span className="text-sm text-slate-400">{suffix}</span>
      </p>
    </div>
  );
}
