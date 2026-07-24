import { redirect } from "next/navigation";

export default async function LegacyClaudeAssetRoute({
  params,
}: {
  params: Promise<{ categoria: string; ticker: string }>;
}) {
  const { ticker } = await params;
  redirect(`/asset/${encodeURIComponent(decodeURIComponent(ticker ?? ""))}`);
}
