import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
let db: PGlite;
const owner = "10000000-0000-4000-8000-000000000001";
const outsider = "10000000-0000-4000-8000-000000000002";
const staff = "10000000-0000-4000-8000-000000000003";
const product = "20000000-0000-4000-8000-000000000001";
const draft = "20000000-0000-4000-8000-000000000002";
const requestId = "30000000-0000-4000-8000-000000000001";
const payload = {
  idempotency_key: requestId,
  kind: "quote",
  name: "Local test buyer",
  company: "Test only",
  phone: "+923001234567",
  email: "qa@example.com",
  preferred_contact: "email",
  items: [{ sku: "TEST-PUBLISHED", quantity: 10, unit: "pcs" }],
};
async function identity(id: string, aal: string) {
  await db.query(
    "select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claims',$2,false)",
    [id, JSON.stringify({ sub: id, aal })],
  );
}
async function count(table: string) {
  const r = await db.query<{ n: number }>(
    `select count(*)::int n from public.${table}`,
  );
  return r.rows[0].n;
}
before(async () => {
  db = new PGlite();
  await db.waitReady;
  await db.exec(`
 create role anon; create role authenticated; create role service_role bypassrls;
 create schema auth; create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
 grant usage on schema public,auth to anon,authenticated,service_role;
 grant execute on all functions in schema auth to anon,authenticated,service_role;
 `);
  // PGlite does not bundle pgcrypto. PostgreSQL's built-in gen_random_uuid and sha256 cover this schema.
  const first = (
    await readFile("supabase/migrations/0001_init.sql", "utf8")
  ).replace("create extension if not exists pgcrypto;", "");
  await db.exec(first);
  await db.exec(
    await readFile("supabase/migrations/0002_ingestion_guards.sql", "utf8"),
  );
  await db.exec(
    await readFile("supabase/migrations/0003_token_bucket.sql", "utf8"),
  );
  await db.exec(
    await readFile("supabase/migrations/0004_first_response.sql", "utf8"),
  );
  await db.exec(
    await readFile("supabase/migrations/0005_portal.sql", "utf8"),
  );
  await db.exec(`insert into auth.users values ('${owner}'),('${outsider}'); insert into public.owners(user_id) values ('${owner}');
 insert into public.products(id,slug,family,name,status) values ('${product}','test-published','Test','Published component','published'),('${draft}','test-draft','Test','Private draft','draft');
 insert into public.variants(product_id,sku,name,units,min_qty,status) values ('${product}','TEST-PUBLISHED','Standard','{pcs}',10,'published'),('${draft}','TEST-DRAFT','Private','{pcs}',1,'published');`);
});
after(async () => {
  await db?.close();
});
test("database: anonymous visitors only see published catalog rows and cannot read leads", async () => {
  await db.exec("set role anon");
  try {
    assert.equal(await count("products"), 1);
    assert.equal(await count("variants"), 1);
    await assert.rejects(
      db.query("select * from public.leads"),
      /permission denied/,
    );
    await assert.rejects(
      db.query("select * from public.create_lead('{}'::jsonb)"),
      /permission denied/,
    );
  } finally {
    await db.exec("reset role");
  }
});
test("database: quote ingestion is atomic and content-bound idempotent", async () => {
  const first = await db.query<{ reference: string; created: boolean }>(
    "select * from public.create_lead($1::jsonb)",
    [JSON.stringify(payload)],
  );
  assert.equal(first.rows[0].created, true);
  assert.equal(await count("leads"), 1);
  assert.equal(await count("lead_items"), 1);
  assert.equal(await count("email_outbox"), 2);
  const retry = await db.query<{ reference: string; created: boolean }>(
    "select * from public.create_lead($1::jsonb)",
    [JSON.stringify(payload)],
  );
  assert.deepEqual(retry.rows[0], {
    reference: first.rows[0].reference,
    created: false,
  });
  assert.equal(await count("leads"), 1);
  await assert.rejects(
    db.query("select * from public.create_lead($1::jsonb)", [
      JSON.stringify({ ...payload, name: "Changed payload" }),
    ]),
    /idempotency key content mismatch/,
  );
});
test("database: invalid SKU, unit and minimum quantity roll back the entire request", async () => {
  for (const items of [
    [{ sku: "MISSING", quantity: 10, unit: "pcs" }],
    [{ sku: "TEST-PUBLISHED", quantity: 10, unit: "kg" }],
    [{ sku: "TEST-PUBLISHED", quantity: 9, unit: "pcs" }],
    [{ sku: "TEST-DRAFT", quantity: 10, unit: "pcs" }],
  ]) {
    await assert.rejects(
      db.query("select * from public.create_lead($1::jsonb)", [
        JSON.stringify({
          ...payload,
          idempotency_key: crypto.randomUUID(),
          items,
        }),
      ]),
    );
  }
  assert.equal(await count("leads"), 1);
  assert.equal(await count("lead_items"), 1);
  assert.equal(await count("email_outbox"), 2);
});
test("database: owner allowlist and AAL2 are both required for private records", async () => {
  await db.exec("set role authenticated");
  try {
    await identity(owner, "aal1");
    assert.equal(await count("leads"), 0);
    await identity(outsider, "aal2");
    assert.equal(await count("leads"), 0);
    await identity(owner, "aal2");
    assert.equal(await count("leads"), 1);
    assert.equal(await count("products"), 2);
    await identity(outsider, "aal2");
    const r = await db.query(
      "update public.leads set status='won' returning id",
    );
    assert.equal(r.rows.length, 0);
  } finally {
    await db.exec("reset role");
    await identity("", "");
  }
});
test("database: first reply time is stamped once by the database and cannot be written by the owner", async () => {
  await db.exec("set role authenticated");
  try {
    await identity(owner, "aal2");
    await assert.rejects(
      db.query("update public.leads set first_response_at = now() - interval '9 days'"),
      /permission denied/,
      "owner cannot backdate the reply time",
    );
    await db.query("update public.leads set status='new'");
    const none = await db.query<{ t: string | null }>("select first_response_at t from public.leads");
    assert.equal(none.rows[0].t, null);
    await db.query("update public.leads set status='contacted'");
    const first = await db.query<{ t: string }>("select first_response_at::text t from public.leads");
    assert.ok(first.rows[0].t, "stamped on leaving new");
    await db.query("update public.leads set status='quoted'");
    const again = await db.query<{ t: string }>("select first_response_at::text t from public.leads");
    assert.equal(again.rows[0].t, first.rows[0].t, "later changes keep the first reply time");
  } finally {
    await db.exec("reset role");
    await identity("", "");
  }
});
test("database: staff work enquiries but cannot delete them, edit products or see the team list", async () => {
  await db.exec(`insert into auth.users values ('${staff}'); insert into public.owners(user_id, role) values ('${staff}', 'staff');`);
  await db.exec("set role authenticated");
  try {
    await identity(staff, "aal1");
    assert.equal(await count("leads"), 0, "staff still need two-step verification");
    await identity(staff, "aal2");
    assert.equal(await count("leads"), 1, "staff can read enquiries");
    const upd = await db.query("update public.leads set deal_value = 125000, follow_up_at = now(), source = 'google' returning id");
    assert.equal(upd.rows.length, 1, "staff can update value, follow-up and source");
    const del = await db.query("delete from public.leads returning id");
    assert.equal(del.rows.length, 0, "staff cannot delete enquiries");
    const prod = await db.query("update public.products set name = 'Hacked' returning id");
    assert.equal(prod.rows.length, 0, "staff cannot edit the catalogue");
    assert.equal((await db.query("select 1 from public.owners")).rows.length, 1, "staff only see their own team row");
    await identity(owner, "aal2");
    assert.equal((await db.query("select 1 from public.owners")).rows.length, 2, "owner sees the whole team");
    await assert.rejects(db.query("update public.leads set first_response_at = now()"), /permission denied/);
  } finally {
    await db.exec("reset role");
    await identity("", "");
  }
});
test("database: quote snapshot survives product edits", async () => {
  await db.query(
    "update public.products set name='New catalog title' where id=$1",
    [product],
  );
  const saved = await db.query<{ name: string }>(
    "select product_name_snapshot name from public.lead_items",
  );
  assert.equal(saved.rows[0].name, "Published component");
});
test("database: token buckets reject bursts and replenish over time", async () => {
  for (let n = 0; n < 3; n++) {
    const r = await db.query<{ allowed: boolean }>(
      "select public.rate_limit_hit('test-bucket',2,60) allowed",
    );
    assert.equal(r.rows[0].allowed, n < 2);
  }
  await db.query(
    "update public.rate_buckets set tokens=0,last_refill=now()-interval '31 seconds' where key='test-bucket'",
  );
  assert.equal(
    (
      await db.query<{ allowed: boolean }>(
        "select public.rate_limit_hit('test-bucket',2,60) allowed",
      )
    ).rows[0].allowed,
    true,
  );
  assert.equal(
    (
      await db.query<{ allowed: boolean }>(
        "select public.rate_limit_hit('test-bucket',2,60) allowed",
      )
    ).rows[0].allowed,
    false,
  );
});
test("database: email leases prevent reclaim and exhausted jobs stop", async () => {
  const first = await db.query("select * from public.claim_outbox(100)");
  assert.equal(first.rows.length, 2);
  assert.equal(
    (await db.query("select * from public.claim_outbox(100)")).rows.length,
    0,
  );
  await db.exec(
    "update public.email_outbox set attempts=5,locked_until=now()-interval '1 minute'",
  );
  assert.equal(
    (await db.query("select * from public.claim_outbox(5)")).rows.length,
    0,
  );
  const final = await db.query<{ status: string }>(
    "select status from public.email_outbox",
  );
  assert.ok(final.rows.every((j) => j.status === "failed"));
});
