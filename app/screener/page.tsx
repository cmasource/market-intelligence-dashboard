import { InstrumentScreener } from "@/components/screener/InstrumentScreener";
import { ScreenerInfoBanner } from "@/components/screener/ScreenerInfoBanner";
import { InstrumentUniverseGroups } from "@/components/screener/InstrumentUniverseGroups";
import { HeatmapCta } from "@/components/screener/HeatmapCta";
import { ScreenerHero } from "@/components/screener/ScreenerHero";
import { DataCoverageLegend } from "@/components/data-coverage/DataCoverageLegend";
import { DataAuditLinkPanel } from "@/components/data-coverage/DataAuditLinkPanel";
import { AppShell } from "@/components/layout/AppShell";

type ScreenerSearchParams = {
  query?: string;
  category?: string;
  market?: string;
  country?: string;
  currency?: string;
  sourceStatus?: string;
  coverageGroup?: string;
  analysisCoverage?: string;
};

export default async function ScreenerPage({
  searchParams,
}: {
  searchParams: Promise<ScreenerSearchParams>;
}) {
  const params = await searchParams;

  return (
    <AppShell>
      <div className="space-y-8 py-6">
        <ScreenerHero />
        <div className="grid gap-5 xl:grid-cols-[1fr_0.95fr]">
          <ScreenerInfoBanner />
          <DataCoverageLegend />
        </div>
        <HeatmapCta />
        <DataAuditLinkPanel />
        <div className="cma-panel p-5">
          <InstrumentScreener initialFilters={params} />
        </div>
        <InstrumentUniverseGroups />
      </div>
    </AppShell>
  );
}
