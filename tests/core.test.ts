import test from "node:test";
import assert from "node:assert/strict";
import { products } from "../lib/catalog/seed";
import { existsSync } from "node:fs";
import { getPhotos, photoSrc, photoWidths } from "../lib/catalog/media";
import {
  submissionSchema,
  contactFields,
  itemSchema,
} from "../lib/quote-schema";
import { csvCell, csvDocument } from "../lib/csv";
import { POST } from "../app/api/enquiries/route";
import { GET as emailJob } from "../app/api/jobs/email/route";
import { verifyTurnstile } from "../lib/server/turnstile";
import { readBoundedJson } from "../lib/server/request";
const fields = {
  name: "QA Buyer",
  company: "Test only",
  deliveryCity: "Gujranwala",
  phone: "+92 300 1234567",
  email: "",
  preferredContact: "whatsapp" as const,
};
const submission = {
  kind: "quote",
  idempotencyKey: "df95ec32-2da3-4c0c-8a69-5c0f8a53d702",
  turnstileToken: "local-test",
  fields,
  items: [{ sku: "LH1020", quantity: 12, unit: "pcs" }],
};
function request(body: unknown, origin = "http://localhost:3000") {
  return new Request("http://localhost:3000/api/enquiries", {
    method: "POST",
    headers: { origin, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}
test("an enquiry needs a usable contact for the selected reply channel", () => {
  assert.equal(contactFields.safeParse(fields).success, true);
  assert.equal(
    contactFields.safeParse({ ...fields, phone: "" }).success,
    false,
  );
  assert.equal(
    contactFields.safeParse({ ...fields, preferredContact: "email" }).success,
    false,
  );
  assert.equal(
    contactFields.safeParse({
      ...fields,
      preferredContact: "email",
      email: "buyer@example.com",
      phone: "",
    }).success,
    true,
  );
});
test("fractional pieces, nonpositive quantities, oversized baskets and empty quotes fail", () => {
  for (const n of [0, -1, 1.5, Infinity, 10000001])
    assert.equal(
      itemSchema.safeParse({ sku: "LH1020", quantity: n, unit: "pcs" }).success,
      false,
    );
  assert.equal(
    itemSchema.safeParse({ sku: "AL", quantity: 1.5, unit: "kg" }).success,
    true,
  );
  assert.equal(
    submissionSchema.safeParse({ ...submission, items: [] }).success,
    false,
  );
  assert.equal(
    submissionSchema.safeParse({
      ...submission,
      items: Array(51).fill(submission.items[0]),
    }).success,
    false,
  );
  assert.equal(submissionSchema.safeParse(submission).success, true);
});
test("every product has photos and every photo file exists", () => {
  assert.equal(products.length, 10);
  assert.equal(new Set(products.map((p) => p.family)).size, 9);
  const skus = products.flatMap((p) => p.variants.map((v) => v.sku));
  assert.equal(new Set(skus).size, skus.length);
  for (const product of products) {
    const photos = getPhotos(product.slug);
    assert.ok(photos.length >= 3, `${product.slug} needs at least 3 photos`);
    for (const photo of photos) {
      assert.ok(photo.alt.length > 0, product.slug);
      for (const w of photoWidths)
        assert.ok(existsSync(`public${photoSrc(photo, w).split("?")[0]}`), photoSrc(photo, w));
    }
  }
});
test("CSV export protects formula injection and escapes quotes and newlines", () => {
  for (const value of [
    "=1+1",
    "+cmd",
    "-2+4",
    "@SUM(1,1)",
    ' \t=HYPERLINK("bad")',
  ])
    assert.ok(csvCell(value).startsWith("\"'"));
  assert.equal(csvCell('a"b'), '"a""b"');
  assert.equal(
    csvDocument(["A"], [["line\nbreak"]]),
    '\uFEFF"A"\r\n"line\nbreak"',
  );
});
test("API rejects foreign origins and invalid fields before touching the database", async () => {
  assert.equal(
    (await POST(request(submission, "https://attacker.example"))).status,
    403,
  );
  assert.equal((await POST(request({ ...submission, items: [] }))).status, 400);
  assert.equal(
    (await POST(request({ ...submission, website: "spam.example" }))).status,
    400,
  );
});
test("unconfigured submission never returns a false success or reference", async () => {
  assert.equal(
    process.env.SUPABASE_SECRET_KEY,
    undefined,
    "Tests must not load live credentials",
  );
  const response = await POST(request(submission));
  assert.equal(response.status, 503);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal((await response.json()).reference, undefined);
  assert.equal(
    (await POST(request(submission, "http://127.0.0.1:3000"))).status,
    503,
    "The numeric loopback preview must pass the local origin check",
  );
  assert.equal(
    (await POST(request(submission, "http://127.0.0.1:9000"))).status,
    403,
    "A different local port is still a different origin",
  );
});
test("body limit checks actual stream bytes, not just Content-Length", async () => {
  const req = new Request("http://localhost", {
    method: "POST",
    body: "1234567890",
  });
  await assert.rejects(readBoundedJson(req, 5), /BODY_TOO_LARGE/);
});
test("scheduled jobs refuse unauthenticated requests", async () => {
  assert.equal(
    (await emailJob(new Request("http://localhost:3000/api/jobs/email")))
      .status,
    401,
  );
});
test("Turnstile rejects hostname mismatch and production test secrets", async () => {
  const original = globalThis.fetch;
  const env = { ...process.env };
  try {
    Object.assign(process.env, {
      NODE_ENV: "production",
      TURNSTILE_SECRET_KEY: "test-private-secret",
    });
    globalThis.fetch = async () =>
      Response.json({
        success: true,
        hostname: "foreign.example",
        action: "quote",
      });
    assert.equal(
      (await verifyTurnstile("token", null, "quote", "mb.example")).ok,
      false,
    );
    Object.assign(process.env, {
      TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
    });
    assert.equal(
      (await verifyTurnstile("token", null, "quote", "mb.example")).ok,
      false,
    );
  } finally {
    globalThis.fetch = original;
    for (const key of ["NODE_ENV", "TURNSTILE_SECRET_KEY"]) {
      if (env[key] === undefined) delete process.env[key];
      else process.env[key] = env[key];
    }
  }
});
