import test from "node:test";
import assert from "node:assert/strict";
import { products } from "../lib/catalog/seed";
import { quantityError, quoteMessage } from "../lib/quote-list";
import { matchesSearch } from "../lib/catalog/search";

const find = (q: string) => products.filter((p) => matchesSearch(p, q)).map((p) => p.slug);

test("quantity validation rejects empty, zero, fractional pieces and below-minimum values", () => {
  assert.equal(quantityError("1", "pcs", 1), "");
  assert.equal(quantityError("2.5", "kg", 0.001), "");
  for (const bad of ["", " ", "0", "-3", "1.5", "10000001"]) assert.notEqual(quantityError(bad, "pcs", 1), "", bad);
  assert.notEqual(quantityError("50", "pcs", 100), "", "below the variant minimum");
});

test("WhatsApp draft keeps variant, model, SKU, quantity, singular unit and note", () => {
  const msg = quoteMessage(
    [
      { sku: "SW3-TBC", quantity: 250, unit: "pcs", note: "black housing" },
      { sku: "LH1020", quantity: 1, unit: "pcs" },
    ],
    products,
  );
  assert.match(msg, /Washer buttons and switches, 3-position \(SKU SW3-TBC\): 250 Pieces/);
  assert.match(msg, /Note: black housing/);
  assert.match(msg, /model LH1020 \(SKU LH1020\): 1 Piece\b/);
});

test("search matches plurals, spacing variants, visible specs and industry names", () => {
  assert.ok(find("pumps").includes("water-cooler-pump-lh1020"));
  assert.ok(find("timers").includes("washing-machine-timer"));
  assert.ok(find("motors").includes("mini-fan-motor-dc-geared"));
  for (const q of ["12 V", "12V", "12-v"]) assert.ok(find(q).includes("mini-fan-motor-dc-geared"), q);
  assert.ok(find("heater").includes("geyser-element"), "industry name");
  assert.equal(find("voltage to confirm").length, 0, "placeholder specs are not searchable");
});
