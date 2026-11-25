import type { Product } from "./catalog/types";
import { unitLabel } from "./catalog/units";
import type { BasketItem } from "./basket";

// Returns an error message, or "" when the typed quantity is acceptable for this unit.
export function quantityError(value: string, unit: BasketItem["unit"], minimum: number) {
  const n = Number(value);
  return value.trim() !== "" && n > 0 && n >= minimum && n <= 10000000 && (unit !== "pcs" || Number.isInteger(n))
    ? ""
    : `Enter a valid quantity of at least ${minimum}.`;
}

// WhatsApp draft carries everything needed to identify the part; the buyer still reviews and sends it.
export function quoteMessage(items: BasketItem[], products: Product[]) {
  const lines = items.map((i) => {
    const p = products.find((p) => p.variants.some((v) => v.sku === i.sku));
    const v = p?.variants.find((v) => v.sku === i.sku);
    const variant = v && v.name !== "To confirm" && v.name !== p?.name && v.name !== p?.model ? `, ${v.name}` : "";
    const note = i.note?.trim() ? `\n  Note: ${i.note.trim()}` : "";
    const model = p?.model ? `, model ${p.model}` : "";
    const unit = i.quantity === 1 ? unitLabel[i.unit].replace(/s$/, "") : unitLabel[i.unit]; // "1 Piece", "2 Pieces"
    return `• ${p?.name ?? "Item"}${variant}${model} (SKU ${i.sku}): ${i.quantity} ${unit}${note}`;
  });
  return `Hello MB International Traders, I would like a quotation for:\n${lines.join("\n")}\nPlease help me confirm the specifications and delivery.`;
}
