export function percentagePointsToRatio(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value / 100 : undefined;
}

