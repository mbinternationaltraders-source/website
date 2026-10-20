import test from "node:test";
import assert from "node:assert/strict";
import {
  quoteFields,
  contactFields,
  submissionSchema,
} from "../lib/quote-schema";
import { POST } from "../app/api/quote/submit/route";
const fields = {
  name: "QA buyer",
  company: "QA manufacturer",
  deliveryCity: "Gujranwala",
  phone: "+923001234567",
  email: "buyer@example.com",
  preferredContact: "email" as const,
};
test("RFQs need company, delivery city and phone even when email is preferred", () => {
  assert.equal(quoteFields.safeParse(fields).success, true);
  for (const key of ["company", "deliveryCity", "phone"] as const) {
    const incomplete = { ...fields, [key]: " " };
    assert.equal(quoteFields.safeParse(incomplete).success, false);
    assert.equal(
      submissionSchema.safeParse({
        kind: "quote",
        fields: incomplete,
        items: [{ sku: "LH1020", unit: "pcs", quantity: 1 }],
        turnstileToken: "test",
        idempotencyKey: "df95ec32-2da3-4c0c-8a69-5c0f8a53d702",
      }).success,
      false,
    );
  }
  assert.equal(
    contactFields.safeParse({
      ...fields,
      company: "",
      phone: "",
      deliveryCity: "",
    }).success,
    true,
    "General email enquiries keep their simpler contact requirements",
  );
});
test("new quote URL preserves the origin guard and required-field rejection", async () => {
  const req = (origin: string) =>
    new Request("http://localhost:3000/api/quote/submit", {
      method: "POST",
      headers: { origin, "content-type": "application/json" },
      body: JSON.stringify({}),
    });
  assert.equal((await POST(req("https://foreign.example"))).status, 403);
  assert.equal((await POST(req("http://localhost:3000"))).status, 400);
});
