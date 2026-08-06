import { BnaQuoteAdapter } from "../lib/arbitrage/adapters/bna";
import { CriptoYaStablecoinAdapter } from "../lib/arbitrage/adapters/criptoya";
import { PlusQuoteAdapter } from "../lib/arbitrage/adapters/plus";
import { getFreshnessStatus } from "../lib/arbitrage/freshness";

const adapters = [new PlusQuoteAdapter(), new BnaQuoteAdapter(), new CriptoYaStablecoinAdapter()];

async function main() {
  const results = await Promise.all(adapters.map(async (adapter) => {
    try {
      const result = await adapter.fetchQuotes();
      return {
        provider: adapter.id,
        reachable: true,
        result: result.status,
        quoteCount: result.quotes.length,
        freshness: result.quotes.map((quote) => getFreshnessStatus(quote)),
        observedAtReported: result.quotes.map((quote) => Boolean(quote.observedAt)),
      };
    } catch {
      return { provider: adapter.id, reachable: false, result: "external_failure", quoteCount: 0 };
    }
  }));

  console.table(results);
  console.log("External source smoke is informational and never gates the deterministic suite.");
}

void main();
