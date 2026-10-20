-- MB International Traders: catalog, quotations and operations schema (spec §10–12).
-- Run once in the Supabase SQL editor or with `supabase db push`.

create extension if not exists pgcrypto;

-- ───────────────────────── Owner allowlist and MFA check ─────────────────────────
create table public.owners (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Owner = allowlisted identity AND an aal2 (TOTP-verified) session. Never derived from user metadata.
create or replace function public.is_owner() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((auth.jwt() ->> 'aal') = 'aal2', false)
     and exists (select 1 from public.owners o where o.user_id = auth.uid());
$$;

-- ───────────────────────── Catalog ─────────────────────────
create type public.publish_status as enum ('draft', 'published', 'archived');

create table public.industries (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{1,80}$'),
  name text not null check (char_length(name) <= 80),
  headline text not null default '',
  intro text not null default '',
  guidance jsonb not null default '[]'::jsonb,
  sort int not null default 0,
  status public.publish_status not null default 'published'
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{1,100}$'),
  family text not null check (char_length(family) <= 80),
  name text not null check (char_length(name) <= 120),
  model text check (char_length(model) <= 60),
  model_note text not null default '',
  summary text not null default '' check (char_length(summary) <= 300),
  description text not null default '' check (char_length(description) <= 4000),
  card_specs jsonb not null default '[]'::jsonb,
  specs jsonb not null default '[]'::jsonb,
  spec_note text,
  reveal text not null default 'explode' check (reveal in ('explode', 'section', 'feature')),
  view jsonb,
  sort int not null default 0,
  status public.publish_status not null default 'draft',
  updated_at timestamptz not null default now()
);

create table public.product_industries (
  product_id uuid not null references public.products (id) on delete cascade,
  industry_id uuid not null references public.industries (id) on delete cascade,
  primary key (product_id, industry_id)
);

create table public.variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  sku text not null unique check (sku ~ '^[A-Za-z0-9._-]{1,60}$'),
  name text not null check (char_length(name) <= 120),
  units text[] not null default '{pcs}' check (units <@ array['pcs', 'kg', 'm'] and cardinality(units) > 0),
  min_qty numeric check (min_qty > 0),
  sort int not null default 0,
  status public.publish_status not null default 'published'
);

create table public.components (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  key text not null check (key ~ '^[a-z0-9-]{1,40}$'),
  label text not null check (char_length(label) <= 80),
  description text not null default '' check (char_length(description) <= 400),
  material text not null,
  base_position jsonb not null,
  explode_vector jsonb not null,
  geometry jsonb not null,
  shell boolean not null default false,
  mesh_name text,
  sellable_sku text,
  sort int not null default 0,
  asset_revision text,
  unique (product_id, key)
);

create table public.product_media (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  variant_id uuid references public.variants (id) on delete cascade,
  kind text not null check (kind in ('photo', 'poster', 'exploded', 'card', 'model')),
  url text not null check (url ~ '^https://'),
  alt text not null default '',
  width int,
  height int,
  revision text,
  sort int not null default 0,
  approved boolean not null default false
);

-- ───────────────────────── Quotes and operations ─────────────────────────
create type public.lead_status as enum ('new', 'contacted', 'quoted', 'won', 'lost');
create sequence public.lead_reference_seq;

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  idempotency_key uuid not null unique,
  kind text not null check (kind in ('quote', 'contact')),
  name text not null check (char_length(name) between 1 and 100),
  company text check (char_length(company) <= 160),
  phone text check (char_length(phone) <= 20),
  email text check (char_length(email) <= 254),
  preferred_contact text not null check (preferred_contact in ('whatsapp', 'phone', 'email')),
  industry text check (char_length(industry) <= 80),
  delivery_city text check (char_length(delivery_city) <= 100),
  message text check (char_length(message) <= 1000),
  status public.lead_status not null default 'new',
  created_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  check (phone is not null or email is not null)
);
create index leads_created_idx on public.leads (created_at desc);
create index leads_status_idx on public.leads (status);

create table public.lead_items (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  variant_id uuid references public.variants (id) on delete set null,
  -- immutable snapshot so later catalog edits never rewrite what the customer asked for
  sku_snapshot text not null,
  product_name_snapshot text not null,
  variant_name_snapshot text not null,
  quantity numeric not null check (quantity > 0 and quantity <= 10000000),
  unit text not null check (unit in ('pcs', 'kg', 'm')),
  note text check (char_length(note) <= 400),
  check (unit <> 'pcs' or quantity = trunc(quantity))
);

create table public.lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  author uuid references auth.users (id) on delete set null,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create table public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  kind text not null check (kind in ('owner', 'customer')),
  status text not null default 'queued' check (status in ('queued', 'sending', 'sent', 'failed')),
  attempts int not null default 0,
  next_attempt_at timestamptz not null default now(),
  locked_until timestamptz,
  last_error text,
  provider_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lead_id, kind)
);
create index email_outbox_due_idx on public.email_outbox (status, next_attempt_at);

create table public.audit_events (
  id bigint generated always as identity primary key,
  actor uuid,
  action text not null,
  entity text not null,
  entity_id text,
  created_at timestamptz not null default now()
);

create table public.rate_buckets (
  key text primary key, -- keyed hash, never a raw IP or contact
  window_start timestamptz not null,
  count int not null
);

-- ───────────────────────── Row level security ─────────────────────────
alter table public.owners enable row level security;
alter table public.industries enable row level security;
alter table public.products enable row level security;
alter table public.product_industries enable row level security;
alter table public.variants enable row level security;
alter table public.components enable row level security;
alter table public.product_media enable row level security;
alter table public.leads enable row level security;
alter table public.lead_items enable row level security;
alter table public.lead_notes enable row level security;
alter table public.email_outbox enable row level security;
alter table public.audit_events enable row level security;
alter table public.rate_buckets enable row level security;

-- Least privilege: anon can only read catalog tables; private tables get no anon grants at all.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
grant select on public.industries, public.products, public.product_industries, public.variants,
  public.components, public.product_media to anon, authenticated;
grant insert, update, delete on public.industries, public.products, public.product_industries,
  public.variants, public.components, public.product_media to authenticated;
grant select, delete on public.leads to authenticated;
grant update (status, last_activity_at) on public.leads to authenticated;
grant select on public.lead_items, public.email_outbox, public.audit_events, public.owners to authenticated;
grant select, insert on public.lead_notes to authenticated;
grant update (status, attempts, next_attempt_at, last_error) on public.email_outbox to authenticated;
grant insert on public.audit_events to authenticated;

-- Public catalog: published rows only.
create policy "public reads published industries" on public.industries for select
  using (status = 'published' or public.is_owner());
create policy "public reads published products" on public.products for select
  using (status = 'published' or public.is_owner());
create policy "public reads links of published products" on public.product_industries for select
  using (public.is_owner() or exists (select 1 from public.products p where p.id = product_id and p.status = 'published'));
create policy "public reads published variants" on public.variants for select
  using (public.is_owner() or (status = 'published' and exists (select 1 from public.products p where p.id = product_id and p.status = 'published')));
create policy "public reads components of published products" on public.components for select
  using (public.is_owner() or exists (select 1 from public.products p where p.id = product_id and p.status = 'published'));
create policy "public reads approved media" on public.product_media for select
  using (public.is_owner() or (approved and exists (select 1 from public.products p where p.id = product_id and p.status = 'published')));

-- Owner (allowlisted + MFA) administration.
create policy "owner writes industries" on public.industries for all using (public.is_owner()) with check (public.is_owner());
create policy "owner writes products" on public.products for all using (public.is_owner()) with check (public.is_owner());
create policy "owner writes product links" on public.product_industries for all using (public.is_owner()) with check (public.is_owner());
create policy "owner writes variants" on public.variants for all using (public.is_owner()) with check (public.is_owner());
create policy "owner writes components" on public.components for all using (public.is_owner()) with check (public.is_owner());
create policy "owner writes media" on public.product_media for all using (public.is_owner()) with check (public.is_owner());
create policy "owner reads leads" on public.leads for select using (public.is_owner());
create policy "owner updates leads" on public.leads for update using (public.is_owner()) with check (public.is_owner());
create policy "owner deletes leads" on public.leads for delete using (public.is_owner());
create policy "owner reads lead items" on public.lead_items for select using (public.is_owner());
create policy "owner reads notes" on public.lead_notes for select using (public.is_owner());
create policy "owner adds notes" on public.lead_notes for insert with check (public.is_owner() and author = auth.uid());
create policy "owner reads outbox" on public.email_outbox for select using (public.is_owner());
create policy "owner retries outbox" on public.email_outbox for update using (public.is_owner()) with check (public.is_owner());
create policy "owner reads audit" on public.audit_events for select using (public.is_owner());
create policy "owner writes audit" on public.audit_events for insert with check (public.is_owner() and actor = auth.uid());
create policy "owner reads own allowlist row" on public.owners for select using (user_id = auth.uid());
-- rate_buckets: no policies; only the server-side secret key reaches it.

-- ───────────────────────── Quote ingestion (server-only) ─────────────────────────
-- One transaction: lead + snapshot items + outbox. Idempotent on idempotency_key.
create or replace function public.create_lead(p jsonb) returns table (reference text, created boolean)
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
declare
  v_existing text;
  v_lead uuid;
  v_ref text;
  v_item jsonb;
  v_variant record;
  v_kind text := p ->> 'kind';
begin
  select l.reference into v_existing from public.leads l where l.idempotency_key = (p ->> 'idempotency_key')::uuid;
  if found then
    return query select v_existing, false;
    return;
  end if;

  if v_kind = 'quote' and coalesce(jsonb_array_length(p -> 'items'), 0) = 0 then
    raise exception 'quote requires items' using errcode = '22023';
  end if;
  if coalesce(jsonb_array_length(p -> 'items'), 0) > 50 then
    raise exception 'too many items' using errcode = '22023';
  end if;

  v_ref := 'MB-' || to_char(now() at time zone 'Asia/Karachi', 'YYMM') || '-' ||
           lpad(nextval('public.lead_reference_seq')::text, 4, '0');

  insert into public.leads (reference, idempotency_key, kind, name, company, phone, email,
    preferred_contact, industry, delivery_city, message)
  values (v_ref, (p ->> 'idempotency_key')::uuid, v_kind, p ->> 'name', nullif(p ->> 'company', ''),
    nullif(p ->> 'phone', ''), nullif(p ->> 'email', ''), p ->> 'preferred_contact',
    nullif(p ->> 'industry', ''), nullif(p ->> 'delivery_city', ''), nullif(p ->> 'message', ''))
  on conflict (idempotency_key) do nothing
  returning id into v_lead;

  if v_lead is null then -- concurrent duplicate won the race
    return query select l.reference, false from public.leads l where l.idempotency_key = (p ->> 'idempotency_key')::uuid;
    return;
  end if;

  for v_item in select * from jsonb_array_elements(coalesce(p -> 'items', '[]'::jsonb)) loop
    -- trusted catalog data, never the client's display names
    select v.id, v.name as vname, v.units, pr.name as pname into v_variant
    from public.variants v join public.products pr on pr.id = v.product_id
    where v.sku = v_item ->> 'sku' and v.status = 'published' and pr.status = 'published';
    if not found then
      raise exception 'unknown or unpublished sku: %', v_item ->> 'sku' using errcode = '22023';
    end if;
    if not ((v_item ->> 'unit') = any (v_variant.units)) then
      raise exception 'unsupported unit for %', v_item ->> 'sku' using errcode = '22023';
    end if;
    insert into public.lead_items (lead_id, variant_id, sku_snapshot, product_name_snapshot, variant_name_snapshot, quantity, unit, note)
    values (v_lead, v_variant.id, v_item ->> 'sku', v_variant.pname, v_variant.vname,
      (v_item ->> 'quantity')::numeric, v_item ->> 'unit', nullif(v_item ->> 'note', ''));
  end loop;

  insert into public.email_outbox (lead_id, kind) values (v_lead, 'owner');
  if nullif(p ->> 'email', '') is not null then
    insert into public.email_outbox (lead_id, kind) values (v_lead, 'customer');
  end if;

  return query select v_ref, true;
end;
$$;

-- Fixed-window distributed rate limit. Returns true when the request is allowed.
create or replace function public.rate_limit_hit(p_key text, p_limit int, p_window_seconds int) returns boolean
language plpgsql security definer set search_path = '' as $$
declare v_count int;
begin
  insert into public.rate_buckets as b (key, window_start, count) values (p_key, now(), 1)
  on conflict (key) do update set
    count = case when b.window_start < now() - make_interval(secs => p_window_seconds) then 1 else b.count + 1 end,
    window_start = case when b.window_start < now() - make_interval(secs => p_window_seconds) then now() else b.window_start end
  returning count into v_count;
  return v_count <= p_limit;
end;
$$;

-- Claims a bounded batch of due emails; SKIP LOCKED + lease prevents two workers sending the same job.
create or replace function public.claim_outbox(p_batch int) returns setof public.email_outbox
language sql security definer set search_path = '' as $$
  update public.email_outbox o set status = 'sending', locked_until = now() + interval '2 minutes',
    attempts = o.attempts + 1, updated_at = now()
  where o.id in (
    select id from public.email_outbox
    where (status = 'queued' and next_attempt_at <= now())
       or (status = 'sending' and locked_until < now())
    order by next_attempt_at
    limit least(p_batch, 25)
    for update skip locked
  )
  returning o.*;
$$;

-- Retention (spec §13, owner to confirm): unresolved enquiries 12 months, buckets after use.
create or replace function public.purge_expired() returns void
language sql security definer set search_path = '' as $$
  delete from public.rate_buckets where window_start < now() - interval '1 day';
  delete from public.leads where status in ('new', 'contacted', 'lost') and last_activity_at < now() - interval '12 months';
  delete from public.audit_events where created_at < now() - interval '12 months';
$$;

revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.is_owner() to anon, authenticated;
grant execute on function public.create_lead(jsonb), public.rate_limit_hit(text, int, int),
  public.claim_outbox(int), public.purge_expired() to service_role;
