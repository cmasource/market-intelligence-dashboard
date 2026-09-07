import assert from "node:assert/strict";
import test from "node:test";
import { isArgentinaMarketRelevant } from "@/lib/news/news-service";

test("Argentina market news filter keeps financial signals and removes payment-calendar noise", () => {
  assert.equal(isArgentinaMarketRelevant({ title: "El dólar MEP sube y los bonos argentinos operan mixtos", summary: "" }), true);
  assert.equal(isArgentinaMarketRelevant({ title: "ANSES confirmó el calendario de pagos para jubilados", summary: "Economía" }), false);
});
