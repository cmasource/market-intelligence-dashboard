import type { Metadata } from "next";
import { ArbitrageRadarPage } from "@/components/arbitrage/ArbitrageRadarPage";

export const metadata: Metadata = {
  title: "Radar de Arbitraje | CMA Markets",
  description: "Comparador informativo de cotizaciones y compatibilidad operativa entre proveedores de dólares en Argentina.",
};

export default function Page() {
  return <ArbitrageRadarPage />;
}
