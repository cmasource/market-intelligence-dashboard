"use client";

import { getGlossaryTerm, type GlossaryTermKey } from "@/lib/glossary";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { InfoTooltip } from "@/components/ui/InfoTooltip";

type GlossaryLabelProps = {
  termKey: GlossaryTermKey;
  fallbackLabel?: string;
  className?: string;
};

export function GlossaryLabel({ termKey, fallbackLabel, className }: GlossaryLabelProps) {
  const { language } = useLanguage();
  const term = getGlossaryTerm(termKey);

  if (!term) return <span className={className}>{fallbackLabel ?? termKey}</span>;

  const title = language === "es" ? term.labelEs : term.labelEn;
  const description = language === "es" ? term.shortDefinitionEs : term.shortDefinitionEn;
  const caution = language === "es" ? term.cautionEs : term.cautionEn;

  return (
    <span className={className}>
      <InfoTooltip title={title} description={description} formula={term.formula} caution={caution}>
        <span>{fallbackLabel ?? title}</span>
      </InfoTooltip>
    </span>
  );
}
