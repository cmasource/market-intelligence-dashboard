import { ShareableAssetReportPage } from "@/components/intelligence/ShareableAssetReportPage";

export default async function AssetReportPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;
  const decodedSymbol = decodeURIComponent(symbol);

  return <ShareableAssetReportPage symbol={decodedSymbol} />;
}
