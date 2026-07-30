"use client";

import { AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { CaucionAlert } from "@/lib/argentina/cauciones";
import { useLanguage } from "@/lib/i18n/useLanguage";

type CaucionAlertResponse = {
  alert?: CaucionAlert | null;
};

export function CaucionSpikeAlert() {
  const { language } = useLanguage();
  const [alert, setAlert] = useState<CaucionAlert | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const load = () => {
      fetch(`/api/research/cauciones?t=${Date.now()}`, { cache: "no-store", signal: controller.signal })
        .then((response) => response.json() as Promise<CaucionAlertResponse>)
        .then((payload) => setAlert(payload.alert ?? null))
        .catch(() => undefined);
    };

    load();
    const refreshId = window.setInterval(load, 30_000);
    return () => {
      window.clearInterval(refreshId);
      controller.abort();
    };
  }, []);

  if (!alert) return null;

  return (
    <section
      className="flex flex-col gap-4 rounded-lg border border-amber-300/25 bg-amber-300/[0.08] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
      role="alert"
      data-testid="dashboard-caucion-alert"
    >
      <div className="flex min-w-0 gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-amber-300/15 text-amber-200">
          <AlertTriangle size={20} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-amber-100">
            {language === "es" ? "Movimiento inusual en caucion 1D" : "Unusual move in the 1D repo rate"}
          </p>
          <p className="mt-1 text-sm leading-6 text-amber-50/80">{alert.message}</p>
        </div>
      </div>
      <Link
        href="/argentina"
        className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-amber-200/25 px-3 text-sm font-semibold text-amber-100 transition hover:bg-amber-200/10"
      >
        {language === "es" ? "Ver cauciones" : "View repo rates"}
        <ArrowRight size={15} aria-hidden="true" />
      </Link>
    </section>
  );
}
