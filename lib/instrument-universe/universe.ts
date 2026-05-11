import { ARGENTINA_INSTRUMENT_UNIVERSE } from "./argentina-universe";
import { CRYPTO_INSTRUMENT_UNIVERSE } from "./crypto-universe";
import { US_INSTRUMENT_UNIVERSE } from "./us-universe";

export const instrumentUniverse = [
  ...ARGENTINA_INSTRUMENT_UNIVERSE,
  ...US_INSTRUMENT_UNIVERSE,
  ...CRYPTO_INSTRUMENT_UNIVERSE,
];
