import type { CnvSourceStatusEntry } from "./cnv-types";

export const cnvSourceStatus: CnvSourceStatusEntry[] = [
  {
    source: "structured_demo",
    enabled: true,
    mode: "structured_demo",
    label: "Structured demo document",
    notes: "Structured placeholders are used to model CNV document intelligence without claiming official data.",
  },
  {
    source: "manual",
    enabled: false,
    mode: "manual",
    label: "Manual document load",
    notes: "Manual document metadata can be added later when validated and safe to publish.",
  },
  {
    source: "cnv_future",
    enabled: false,
    mode: "future",
    label: "Future CNV integration",
    notes: "Future versions may connect official or public CNV sources if available and compliant.",
  },
  {
    source: "unavailable",
    enabled: true,
    mode: "unavailable",
    label: "Unavailable",
    notes: "Unknown symbols return controlled empty results instead of stack traces.",
  },
];
