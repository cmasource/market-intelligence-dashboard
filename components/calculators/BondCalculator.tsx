"use client";

import { useMemo, useState } from "react";
import { calculateBondAnalytics } from "@/lib/finance";
import { useLanguage } from "@/lib/i18n/useLanguage";

export function BondCalculator() {
  const { language } = useLanguage();
  const isSpanish = language === "es";
  const [faceValue, setFaceValue] = useState(100);
  const [marketPrice, setMarketPrice] = useState(85);
  const [coupon, setCoupon] = useState(4);
  const [years, setYears] = useState(4);
  const [frequency, setFrequency] = useState(2);
  const analytics = useMemo(() => calculateBondAnalytics({
    faceValue,
    marketPrice,
    annualCouponRate: coupon / 100,
    yearsToMaturity: years,
    paymentsPerYear: frequency,
  }), [coupon, faceValue, frequency, marketPrice, years]);

  return (
    <section className="rounded-lg border border-amber-300/20 bg-slate-950/55 p-5">
      <p className="cma-kicker">{isSpanish ? "Renta fija" : "Fixed income"}</p>
      <h2 className="mt-2 text-xl font-semibold text-white">{isSpanish ? "Calculadora de bonos bullet" : "Bullet bond calculator"}</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <BondField label={isSpanish ? "Valor nominal" : "Face value"} value={faceValue} onChange={setFaceValue} />
        <BondField label={isSpanish ? "Precio" : "Price"} value={marketPrice} onChange={setMarketPrice} />
        <BondField label={isSpanish ? "Cupon anual %" : "Annual coupon %"} value={coupon} onChange={setCoupon} />
        <BondField label={isSpanish ? "Anos al vencimiento" : "Years to maturity"} value={years} onChange={setYears} />
        <BondField label={isSpanish ? "Pagos por ano" : "Payments per year"} value={frequency} onChange={setFrequency} />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <BondResult label="TIR / YTM" value={analytics.estimatedYTM === null ? null : `${(analytics.estimatedYTM * 100).toFixed(2)}%`} />
        <BondResult label={isSpanish ? "Paridad" : "Parity"} value={analytics.parity === null ? null : `${(analytics.parity * 100).toFixed(2)}%`} />
        <BondResult label={isSpanish ? "Duration" : "Duration"} value={analytics.macaulayDuration === null ? null : analytics.macaulayDuration.toFixed(2)} />
        <BondResult label={isSpanish ? "Rendimiento corriente" : "Current yield"} value={analytics.currentYield === null ? null : `${(analytics.currentYield * 100).toFixed(2)}%`} />
      </div>
      <p className="mt-4 text-xs leading-5 text-slate-500">
        {isSpanish
          ? "Modelo bullet con cupon constante. Para bonos CER, amortizables o con cashflows irregulares debe usarse el flujo contractual completo."
          : "Bullet model with a constant coupon. CER-linked, amortizing or irregular cash-flow bonds require the full contractual schedule."}
      </p>
    </section>
  );
}

function BondField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="text-xs font-semibold text-slate-400">
      {label}
      <input type="number" min="0" step="0.01" value={value} onChange={(event) => onChange(Number(event.target.value))} className="mt-2 w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-300/50" />
    </label>
  );
}

function BondResult({ label, value }: { label: string; value: string | null }) {
  return <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4"><p className="text-xs uppercase text-slate-500">{label}</p><p className="mt-2 text-xl font-semibold text-white">{value ?? "-"}</p></div>;
}
