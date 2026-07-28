"use client";

import { useMemo, useState } from "react";
import type { FundamentalsResponse } from "@/lib/fundamentals-data/types";
import { useLanguage } from "@/lib/i18n/useLanguage";

function parsePositive(value: string) {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function formatMoney(value: number | null, currency: string) {
  if (value === null) return "-";
  return `${Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 }).format(value)} ${currency}`;
}

function formatPercent(value: number | null) {
  if (value === null) return "-";
  return `${Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 }).format(value)}%`;
}

export function EquityValuationCalculator() {
  const { language } = useLanguage();
  const isSpanish = language === "es";
  const [symbol, setSymbol] = useState("AAPL");
  const [price, setPrice] = useState("");
  const [eps, setEps] = useState("");
  const [targetPe, setTargetPe] = useState("25");
  const [marginOfSafety, setMarginOfSafety] = useState("15");
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState(false);

  const result = useMemo(() => {
    const priceValue = parsePositive(price);
    const epsValue = parsePositive(eps);
    const peValue = parsePositive(targetPe);
    const marginValue = parsePositive(marginOfSafety) ?? 0;
    const fairValue = epsValue && peValue ? epsValue * peValue : null;
    const entryValue = fairValue === null ? null : fairValue * (1 - marginValue / 100);
    const upside = fairValue !== null && priceValue ? ((fairValue / priceValue) - 1) * 100 : null;
    const entryGap = entryValue !== null && priceValue ? ((entryValue / priceValue) - 1) * 100 : null;

    return { fairValue, entryValue, upside, entryGap };
  }, [eps, marginOfSafety, price, targetPe]);

  async function loadFundamentals() {
    const normalized = symbol.trim().toUpperCase();
    if (!normalized) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/fundamentals/${encodeURIComponent(normalized)}`);
      if (!response.ok) return;
      const data = (await response.json()) as FundamentalsResponse;
      const snapshot = data.snapshot;
      if (typeof snapshot.marketPrice === "number") setPrice(String(snapshot.marketPrice));
      if (typeof snapshot.eps === "number") setEps(String(snapshot.eps));
      if (typeof snapshot.forwardPE === "number") setTargetPe(String(Math.round(snapshot.forwardPE)));
      else if (typeof snapshot.trailingPE === "number") setTargetPe(String(Math.round(snapshot.trailingPE)));
      if (snapshot.currency) setCurrency(snapshot.currency);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-lg border border-emerald-300/20 bg-slate-950/55 p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="cma-kicker">{isSpanish ? "Valuacion" : "Valuation"}</p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            {isSpanish ? "Calculadora rapida por P/E" : "Quick P/E valuation calculator"}
          </h2>
        </div>
        <p className="text-xs text-slate-500">EPS x P/E objetivo</p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <label className="text-xs font-semibold text-slate-400 xl:col-span-2">
          {isSpanish ? "Especie" : "Symbol"}
          <div className="mt-2 flex">
            <input value={symbol} onChange={(event) => setSymbol(event.target.value.toUpperCase())} className="min-w-0 flex-1 rounded-l-md border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-300/50" />
            <button type="button" onClick={loadFundamentals} className="rounded-r-md border border-l-0 border-emerald-300/25 bg-emerald-300/10 px-3 text-sm font-semibold text-emerald-100">
              {loading ? "..." : isSpanish ? "Cargar" : "Load"}
            </button>
          </div>
        </label>
        <TextField label={isSpanish ? "Precio actual" : "Current price"} value={price} onChange={setPrice} />
        <TextField label="EPS" value={eps} onChange={setEps} />
        <TextField label={isSpanish ? "P/E objetivo" : "Target P/E"} value={targetPe} onChange={setTargetPe} />
        <TextField label={isSpanish ? "Margen seguridad %" : "Safety margin %"} value={marginOfSafety} onChange={setMarginOfSafety} />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Result label={isSpanish ? "Valor razonable" : "Fair value"} value={formatMoney(result.fairValue, currency)} />
        <Result label={isSpanish ? "Entrada con margen" : "Entry with margin"} value={formatMoney(result.entryValue, currency)} />
        <Result label={isSpanish ? "Upside a valor razonable" : "Upside to fair value"} value={formatPercent(result.upside)} />
        <Result label={isSpanish ? "Brecha a entrada" : "Gap to entry"} value={formatPercent(result.entryGap)} />
      </div>

      <p className="mt-4 text-xs leading-5 text-slate-500">
        {isSpanish
          ? "Modelo simplificado para sensibilidad de multiples. No reemplaza un DCF, comparables sectoriales ni revision de estados financieros."
          : "Simplified multiple-sensitivity model. It does not replace a DCF, sector comps or financial statement review."}
      </p>
    </section>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="text-xs font-semibold text-slate-400">
      {label}
      <input inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-300/50" />
    </label>
  );
}

function Result({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
      <p className="text-xs uppercase text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}
