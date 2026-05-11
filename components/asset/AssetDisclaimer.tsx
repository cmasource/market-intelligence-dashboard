"use client";

import { useLanguage } from "@/lib/i18n/useLanguage";

export function AssetDisclaimer() {
  const { t } = useLanguage();

  return (
    <p className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-3 text-sm leading-6 text-amber-100">
      {t("disclaimer")}
    </p>
  );
}
