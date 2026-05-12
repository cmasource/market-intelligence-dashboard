import { InstrumentScreener } from "@/components/screener/InstrumentScreener";
import { ScreenerInfoBanner } from "@/components/screener/ScreenerInfoBanner";
import { InstrumentUniverseGroups } from "@/components/screener/InstrumentUniverseGroups";
import { ScreenerHero } from "@/components/screener/ScreenerHero";
import { DataCoverageLegend } from "@/components/data-coverage/DataCoverageLegend";
import { AppShell } from "@/components/layout/AppShell";

type ScreenerSearchParams = {
  query?: string;
  category?: string;
  market?: string;
  country?: string;
  currency?: string;
  sourceStatus?: string;
  coverageGroup?: string;
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
        <ScreenerInfoBanner />
        <DataCoverageLegend />
        <InstrumentScreener initialFilters={params} />
        <InstrumentUniverseGroups />
      </div>
    </AppShell>
  );
}
