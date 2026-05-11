"use client";

import { useLanguage } from "@/lib/i18n/useLanguage";
import { SectionHeader } from "../ui/SectionHeader";

export function ReportsPlaceholder() {
  const { t } = useLanguage();
  const reports = [
    t("reportDailyBriefings"),
    t("reportAssetReports"),
    t("reportArgentinaReports"),
    t("reportCryptoReports"),
    t("reportPdfReports"),
  ];

  return (
    <section id="reports">
      <SectionHeader eyebrow={t("reportsEyebrow")} title={t("reportsTitle")} description={t("reportsDescription")} />
      <div className="grid gap-3 md:grid-cols-5">
        {reports.map((report) => (
          <div key={report} className="rounded-lg border border-white/10 bg-white/[0.045] p-4 backdrop-blur">
            <p className="text-sm font-semibold text-white">{report}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
