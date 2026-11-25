import test from "node:test";
import assert from "node:assert/strict";
import { leadStats, cleanSearch, waNumber, hoursLabel, followUps, groupCustomers, monthReport, pkr, type LeadRow } from "../lib/admin/stats";
import { imageType } from "../lib/admin/files";
import { demoLeads } from "../lib/admin/demo";
import { jsonLd } from "../lib/seo";

const NOW = Date.parse("2026-10-26T12:00:00Z");
const H = 3_600_000;
const lead = (hoursAgo: number, status: LeadRow["status"], replyAfterH: number | null, products: string[] = [], extra: Partial<LeadRow> = {}): LeadRow => ({
  id: String(Math.random()), reference: "MB", name: "A", company: null, kind: "quote", status, preferred_contact: "whatsapp",
  delivery_city: null, created_at: new Date(NOW - hoursAgo * H).toISOString(),
  first_response_at: replyAfterH === null ? null : new Date(NOW - hoursAgo * H + replyAfterH * H).toISOString(),
  items: products.map((p) => ({ product_name_snapshot: p, quantity: 1, unit: "pcs" })),
  deal_value: null, follow_up_at: null, source: "website", phone: null, email: null,
  ...extra,
});

test("dashboard KPIs: waiting, overdue, median reply, win rate, change and top products", () => {
  const rows = [
    lead(2, "new", null, ["Pump"]), lead(30, "new", null, ["Pump", "Pump"]), // one overdue; duplicate item counts once
    lead(10, "contacted", 1, ["Timer"]), lead(50, "won", 3, ["Pump"]), lead(60, "lost", 5),
    lead(24 * 40, "won", 2), // previous 30-day window
  ];
  const s = leadStats(rows, NOW);
  assert.equal(s.received, 5);
  assert.equal(s.receivedChange, 400);
  assert.equal(s.waiting, 2);
  assert.equal(s.overdue, 1);
  assert.equal(s.medianReplyHours, 3);
  assert.equal(s.winRate, 67);
  assert.deepEqual(s.topProducts[0], { name: "Pump", leads: 3 });
  assert.equal(s.daily.length, 14);
  assert.equal(leadStats([], NOW).winRate, null, "no decided leads gives no rate, not 0%");
});

test("dashboard search input cannot inject PostgREST filter syntax", () => {
  assert.equal(cleanSearch("Raza Appliances"), "Raza Appliances");
  assert.equal(cleanSearch("MB-2610-0001"), "MB-2610-0001");
  for (const evil of ["a,status.eq.won", "x)or(id.neq.0", "%", "*", "name.ilike.*"])
    assert.ok(!/[,()%*]/.test(cleanSearch(evil)), evil);
  assert.equal(cleanSearch(["array"]), "");
  assert.equal(cleanSearch("x".repeat(500)).length, 60);
});

test("WhatsApp numbers convert local Pakistani format and reject junk", () => {
  assert.equal(waNumber("0300 1234567"), "923001234567");
  assert.equal(waNumber("+92 300 1234567"), "923001234567");
  assert.equal(waNumber("0092 300 1234567"), "923001234567");
  assert.equal(waNumber("12"), null);
  assert.equal(waNumber(null), null);
  assert.equal(hoursLabel(0.5), "30 min");
});

test("structured data cannot close its script tag", () => {
  const out = jsonLd({ name: '</script><script>alert(1)</script>' });
  assert.ok(!out.includes("<"), out);
  assert.deepEqual(JSON.parse(out), { name: '</script><script>alert(1)</script>' });
});

test("demo leads are well-formed and cover every status", () => {
  const d = demoLeads(NOW);
  assert.ok(d.length > 20);
  for (const s of ["new", "contacted", "quoted", "won", "lost"]) assert.ok(d.some((l) => l.status === s), s);
  assert.ok(d.every((l) => l.status !== "new" || l.first_response_at === null));
});

test("money, follow-ups and sources", () => {
  const rows = [
    lead(5, "quoted", 1, [], { deal_value: 200_000, follow_up_at: new Date(NOW - H).toISOString(), source: "google" }),
    lead(9, "contacted", 1, [], { deal_value: 50_000, follow_up_at: new Date(NOW + 48 * H).toISOString() }),
    lead(20, "won", 1, [], { deal_value: 300_000, source: "google", follow_up_at: new Date(NOW - H).toISOString() }),
  ];
  const s = leadStats(rows, NOW);
  assert.equal(s.pipelineValue, 250_000);
  assert.equal(s.wonValue, 300_000);
  assert.deepEqual(s.sources.find((x) => x.source === "google"), { source: "google", leads: 2, won: 1 });
  const f = followUps(rows, NOW);
  assert.equal(f.length, 2, "won deals drop off the reminder list");
  assert.deepEqual(f.map((x) => x.due), [true, false]);
  assert.equal(pkr(1150000), "Rs 1,150,000");
});

test("customers group by phone across formats, then email, then company", () => {
  const c = groupCustomers([
    lead(1, "won", 1, [], { phone: "0300 1234567", deal_value: 100 }),
    lead(50, "lost", 1, [], { phone: "+92 300 1234567" }),
    lead(2, "new", null, [], { email: "A@x.com" }),
    lead(3, "new", null, [], { email: "a@x.com" }),
    lead(4, "new", null, [], { company: "Raza Co" }),
  ]);
  assert.equal(c.length, 3);
  assert.equal(c[0].enquiries, 2);
  assert.equal(c.find((x) => x.won === 1)?.wonValue, 100);
});

test("monthly report counts only that month", () => {
  const r = monthReport([
    lead(24 * 3, "won", 2, ["Pump"], { deal_value: 1000 }),
    lead(24 * 40, "won", 2, ["Pump"], { deal_value: 999 }),
  ], new Date(NOW - 24 * 3 * H).toISOString().slice(0, 7));
  assert.equal(r.enquiries, 1);
  assert.equal(r.wonValue, 1000);
  assert.equal(r.medianReplyHours, 2);
});

test("uploads are typed by their bytes, not their name", () => {
  assert.equal(imageType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))?.mime, "image/jpeg");
  assert.equal(imageType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]))?.mime, "image/png");
  assert.equal(imageType(new TextEncoder().encode("RIFF0000WEBPVP8 "))?.mime, "image/webp");
  assert.equal(imageType(new TextEncoder().encode("<svg onload=alert(1)>")), null, "SVG/HTML disguised as an image is refused");
  assert.equal(imageType(new TextEncoder().encode("%PDF-1.7")), null);
});
