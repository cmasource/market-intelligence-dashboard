"use client";

import type { RiskLevel } from "@/types/asset";
import { formatScore } from "@/lib/formatters";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { getRiskTone, getScoreTone } from "@/lib/scoring";

type ScoreBadgeProps = {
  score?: number;
  riskLevel?: RiskLevel;
  label?: string;
};

export function ScoreBadge({ score, riskLevel, label }: ScoreBadgeProps) {
  const { t } = useLanguage();

  if (riskLevel) {
    const riskLabels: Record<RiskLevel, string> = {
      low: t("riskLow"),
      medium: t("riskMedium"),
      high: t("riskHigh"),
      very_high: t("riskVeryHigh"),
    };

    return (
      <span className={`rounded-md border px-2.5 py-1 text-xs font-medium ${getRiskTone(riskLevel)}`}>
        {label ?? riskLabels[riskLevel]}
      </span>
    );
  }

  if (score === undefined) return null;

  const scoreLabel =
    score >= 80
      ? t("scoreStrong")
      : score >= 65
        ? t("scoreConstructive")
        : score >= 45
          ? t("scoreNeutral")
          : score >= 30
            ? t("scoreWeak")
            : t("scoreDefensive");

  return (
    <span className={`rounded-md border px-2.5 py-1 text-xs font-medium ${getScoreTone(score)}`}>
      {label ?? scoreLabel} | {formatScore(score)}
    </span>
  );
}
