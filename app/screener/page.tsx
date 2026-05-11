import { InstrumentScreener } from "@/components/screener/InstrumentScreener";
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
        <section className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm leading-6 text-cyan-50">
          The screener lets users explore the current instrument universe. Some assets already have real/provider data
          while others are marked as future coverage.
          <span className="mt-2 block text-cyan-100/80">
            El screener permite explorar el universo actual de instrumentos. Algunos ya cuentan con datos reales/proveedor
            y otros estan marcados como cobertura futura.
          </span>
        </section>
        <DataCoverageLegend />
        <InstrumentScreener initialFilters={params} />
        <InstrumentUniverseGroups />
      </div>
    </AppShell>
  );
}
