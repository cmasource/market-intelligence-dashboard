import { getAllManualArgentinaQuotes, getArgentinaInstrument } from "../lib/argentina";

const invalidCurrencyStrings = ["ARS SAR", "ARS/USD", "USD MEP", "ARS CER"];
const allowedCurrencies = new Set(["ARS", "USD"]);

let failures = 0;

function fail(message: string) {
  failures += 1;
  console.error(`FAIL: ${message}`);
}

function pass(message: string) {
  console.log(`PASS: ${message}`);
}

const quotes = getAllManualArgentinaQuotes();

if (!quotes.length) {
  fail("manual Argentina data contains at least one quote");
}

for (const quote of quotes) {
  const instrument = getArgentinaInstrument(quote.symbol);
  if (!instrument) fail(`${quote.symbol} exists in Argentina instrument registry`);
  else pass(`${quote.symbol} exists in Argentina instrument registry`);

  if (typeof quote.price !== "number" || !Number.isFinite(quote.price) || quote.price <= 0) {
    fail(`${quote.symbol} has a positive numeric price`);
  } else {
    pass(`${quote.symbol} has a positive numeric price`);
  }

  if (!allowedCurrencies.has(quote.currency)) {
    fail(`${quote.symbol} has valid quote currency (${quote.currency})`);
  } else {
    pass(`${quote.symbol} has valid quote currency (${quote.currency})`);
  }

  for (const invalid of invalidCurrencyStrings) {
    if (quote.currency.toUpperCase().includes(invalid)) fail(`${quote.symbol} currency must not contain ${invalid}`);
  }

  if (instrument?.speciesType && quote.currency !== instrument.quoteCurrency) {
    fail(`${quote.symbol} keeps species context separate from quote currency`);
  }
}

if (failures > 0) {
  console.error(`Argentina data validation failed with ${failures} issue(s).`);
  process.exit(1);
}

console.log("Argentina data validation passed.");
