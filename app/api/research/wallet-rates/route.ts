type WalletRate = {
  fondo: string;
  tna: number;
  tea: number;
  tope: number | null;
  fecha: string;
  condiciones: string | null;
  condicionesCorto: string | null;
};

export const revalidate = 3600;

export async function GET() {
  const response = await fetch("https://api.argentinadatos.com/v1/finanzas/fci/otros/ultimo", {
    next: { revalidate: 3600 },
  });
  if (!response.ok) {
    return Response.json({ rates: [], error: "Wallet rates unavailable." }, { status: 502 });
  }

  const payload = (await response.json()) as WalletRate[];
  const freshnessLimit = new Date();
  freshnessLimit.setDate(freshnessLimit.getDate() - 120);

  const rates = payload
    .filter((item) => item.tna > 0 && new Date(`${item.fecha}T12:00:00`) >= freshnessLimit)
    .sort((left, right) => right.tna - left.tna)
    .slice(0, 10)
    .map((item) => ({
      name: item.fondo,
      tna: item.tna * 100,
      tea: item.tea * 100,
      cap: item.tope,
      date: item.fecha,
      conditions: item.condicionesCorto ?? item.condiciones,
    }));

  return Response.json(
    { updatedAt: new Date().toISOString(), rates },
    { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400" } },
  );
}
