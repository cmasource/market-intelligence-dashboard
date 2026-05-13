function isPositiveFinite(value: number) {
  return Number.isFinite(value) && value > 0;
}

export function calculateImpliedCcl(localPriceArs: number, underlyingPriceUsd: number, ratio: number): number | null {
  // Convención elegida: el ratio indica cuántos CEDEARs equivalen a una acción subyacente.
  // CCL implícito = precio local ARS del CEDEAR * ratio / precio USD del subyacente.
  if (!isPositiveFinite(localPriceArs) || !isPositiveFinite(underlyingPriceUsd) || !isPositiveFinite(ratio)) {
    return null;
  }

  return localPriceArs * ratio / underlyingPriceUsd;
}

export function calculateCclSpread(impliedCcl: number | null | undefined, referenceCcl: number | null | undefined): number | null {
  // Spread = CCL implícito / CCL de referencia - 1.
  if (typeof impliedCcl !== "number" || typeof referenceCcl !== "number") return null;
  if (!isPositiveFinite(impliedCcl) || !isPositiveFinite(referenceCcl)) return null;
  return impliedCcl / referenceCcl - 1;
}
