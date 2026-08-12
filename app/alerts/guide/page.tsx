import type { Metadata } from "next";
import { AlertsGuide } from "@/components/alerts/AlertsGuide";

export const metadata: Metadata = {
  title: "Guía de alertas | CMA Markets",
  description: "Definiciones, fórmulas, alcance y limitaciones de las alertas de CMA Market Intelligence.",
};

export default function AlertsGuidePage() {
  return <AlertsGuide />;
}
