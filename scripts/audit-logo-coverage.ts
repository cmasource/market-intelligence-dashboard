import { getLogoLookups } from "../lib/assets/logo-sources";
import { assetLogoDomains, cryptoLogoIds } from "../lib/assets/logo-domains";
import { instrumentMasterSeed } from "../lib/instruments/instrument-master.seed";

const eligibleClasses = new Set(["stock", "etf", "adr", "cedear", "cedear_etf", "crypto"]);
const eligible = instrumentMasterSeed.filter((instrument) => instrument.enabled && eligibleClasses.has(instrument.assetClass));
const covered = eligible.filter((instrument) => getLogoLookups({
  symbol: instrument.symbol,
  name: instrument.name,
  type: instrument.market === "argentina" && instrument.assetClass === "stock"
    ? "argentine_equity"
    : instrument.assetClass,
  domain: assetLogoDomains[instrument.symbol.toUpperCase()],
  cryptoId: cryptoLogoIds[instrument.symbol.toUpperCase()],
}).length > 0);

const percent = eligible.length === 0 ? 100 : (covered.length / eligible.length) * 100;
const missing = eligible.filter((instrument) => !covered.includes(instrument));

console.log(`Logo candidates: ${covered.length}/${eligible.length} (${percent.toFixed(1)}%)`);
if (missing.length > 0) {
  console.log(`Missing candidates: ${missing.map((instrument) => instrument.id).join(", ")}`);
}

if (percent < 90) {
  process.exitCode = 1;
}

