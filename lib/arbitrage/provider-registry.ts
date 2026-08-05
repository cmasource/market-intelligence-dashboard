import type { FxProvider, TransferAsset } from "./types";

export const ARBITRAGE_PROVIDERS: FxProvider[] = [
  {
    id: "plus",
    name: "Plus",
    legalName: "Global Fintech S.A.",
    providerType: "exchange_agency",
    websiteUrl: "https://plus.com.ar/operar/",
    operates24x7: true,
    supportsArsDeposit: true,
    supportsArsWithdrawal: true,
    supportsUsdDeposit: true,
    supportsUsdWithdrawal: true,
    requiresSameHolderAccount: true,
    sourceType: "public_endpoint",
    status: "active",
    verification: { deposit: "partially_verified", withdrawal: "partially_verified", sameHolder: "partially_verified", transferAsset: "partially_verified", availability24x7: "verified" },
  },
  {
    id: "bna",
    name: "Banco Nación",
    legalName: "Banco de la Nación Argentina",
    providerType: "bank",
    websiteUrl: "https://www.bna.com.ar/Empresas",
    operates24x7: false,
    supportsArsDeposit: true,
    supportsArsWithdrawal: true,
    supportsUsdDeposit: true,
    supportsUsdWithdrawal: true,
    requiresSameHolderAccount: true,
    sourceType: "public_page",
    status: "active",
    verification: { deposit: "partially_verified", withdrawal: "partially_verified", sameHolder: "partially_verified", transferAsset: "partially_verified", availability24x7: "verified" },
  },
  {
    id: "belo",
    name: "Belo",
    providerType: "wallet",
    websiteUrl: "https://www.belo.app/",
    operates24x7: true,
    sourceType: "aggregator",
    status: "active",
    verification: { deposit: "unverified", withdrawal: "unverified", sameHolder: "unverified", transferAsset: "unverified", availability24x7: "reference_only" },
  },
  {
    id: "dolarapp",
    name: "DolarApp",
    providerType: "wallet",
    websiteUrl: "https://www.dolarapp.com/",
    operates24x7: true,
    sourceType: "aggregator",
    status: "active",
    verification: { deposit: "unverified", withdrawal: "unverified", sameHolder: "unverified", transferAsset: "unverified", availability24x7: "reference_only" },
  },
  {
    id: "satoshitango",
    name: "Satoshi Tango",
    providerType: "exchange",
    websiteUrl: "https://www.satoshitango.com/",
    operates24x7: true,
    sourceType: "aggregator",
    status: "active",
    verification: { deposit: "unverified", withdrawal: "unverified", sameHolder: "unverified", transferAsset: "unverified", availability24x7: "reference_only" },
  },
  {
    id: "fiwind",
    name: "Fiwind",
    providerType: "wallet",
    websiteUrl: "https://www.fiwind.io/",
    operates24x7: true,
    sourceType: "unavailable",
    status: "temporarily_unavailable",
    supportsUsdDeposit: true,
    supportsUsdWithdrawal: true,
    requiresSameHolderAccount: true,
    verification: { deposit: "verified", withdrawal: "verified", sameHolder: "verified", transferAsset: "verified", availability24x7: "partially_verified" },
  },
  {
    id: "galicia",
    name: "Banco Galicia",
    providerType: "bank",
    websiteUrl: "https://www.galicia.ar/personas",
    sourceType: "unavailable",
    status: "unsupported",
    verification: { deposit: "unverified", withdrawal: "unverified", sameHolder: "unverified", transferAsset: "unverified", availability24x7: "unverified" },
  },
  {
    id: "santander",
    name: "Santander Argentina",
    providerType: "bank",
    websiteUrl: "https://www.santander.com.ar/",
    sourceType: "unavailable",
    status: "unsupported",
    verification: { deposit: "unverified", withdrawal: "unverified", sameHolder: "unverified", transferAsset: "unverified", availability24x7: "unverified" },
  },
  {
    id: "bbva",
    name: "BBVA Argentina",
    providerType: "bank",
    websiteUrl: "https://www.bbva.com.ar/",
    sourceType: "unavailable",
    status: "unsupported",
    verification: { deposit: "unverified", withdrawal: "unverified", sameHolder: "unverified", transferAsset: "unverified", availability24x7: "unverified" },
  },
];

export function getArbitrageProvider(id: string) {
  return ARBITRAGE_PROVIDERS.find((provider) => provider.id === id);
}

export function supportsDeposit(provider: FxProvider, asset: TransferAsset) {
  if (asset === "USD_BANK") return provider.supportsUsdDeposit;
  if (asset === "USDT") return provider.supportsUsdtDeposit;
  return provider.supportsUsdcDeposit;
}

export function supportsWithdrawal(provider: FxProvider, asset: TransferAsset) {
  if (asset === "USD_BANK") return provider.supportsUsdWithdrawal;
  if (asset === "USDT") return provider.supportsUsdtWithdrawal;
  return provider.supportsUsdcWithdrawal;
}
