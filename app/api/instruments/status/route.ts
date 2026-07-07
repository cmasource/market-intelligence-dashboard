import { instrumentMasterSeed } from "@/lib/instruments/instrument-master.seed";

export const dynamic = "force-dynamic";

export async function GET() {
  const byAssetClass = instrumentMasterSeed.reduce<Record<string, number>>((acc, instrument) => {
    acc[instrument.assetClass] = (acc[instrument.assetClass] ?? 0) + 1;
    return acc;
  }, {});

  return Response.json({
    total: instrumentMasterSeed.length,
    enabled: instrumentMasterSeed.filter((instrument) => instrument.enabled).length,
    byAssetClass,
    source: "seed",
  });
}
