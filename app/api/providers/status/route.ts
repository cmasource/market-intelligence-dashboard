import { getProviderStatus } from "@/lib/providers";

export async function GET() {
  return Response.json(getProviderStatus(), {
    headers: {
      "Cache-Control": "s-maxage=60, stale-while-revalidate=300",
    },
  });
}
