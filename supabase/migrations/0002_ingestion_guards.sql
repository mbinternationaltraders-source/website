-- Bind retry keys to request content, enforce MOQ, and cap worker retries.
-- Apply after 0001_init.sql. No keys, customer data or owner IDs belong in migrations.
alter table public.leads add column request_hash text;
alter function public.create_lead(jsonb) rename to create_lead_unchecked;
revoke execute on function public.create_lead_unchecked(jsonb) from public, anon, authenticated, service_role;
create function public.create_lead(p jsonb) returns table(reference text, created boolean)
language plpgsql security definer set search_path = '' as $$
declare
  existing public.leads%rowtype;
  fingerprint text := encode(sha256(convert_to((p - 'idempotency_key')::text, 'UTF8')), 'hex');
  item jsonb;
  variant record;
begin
  perform pg_advisory_xact_lock(hashtextextended(p ->> 'idempotency_key', 0));
  select * into existing from public.leads l where l.idempotency_key = (p ->> 'idempotency_key')::uuid;
  if found then
    if existing.request_hash is distinct from fingerprint then
      raise exception 'idempotency key content mismatch' using errcode = '22023';
    end if;
    return query select existing.reference, false;
    return;
  end if;
  for item in select * from jsonb_array_elements(coalesce(p -> 'items', '[]'::jsonb)) loop
    select v.min_qty, v.units into variant from public.variants v
      join public.products pr on pr.id = v.product_id
      where v.sku = item ->> 'sku' and v.status = 'published' and pr.status = 'published';
    if not found or (variant.min_qty is not null and (item ->> 'quantity')::numeric < variant.min_qty) then
      raise exception 'invalid item or minimum quantity' using errcode = '22023';
    end if;
  end loop;
  return query select * from public.create_lead_unchecked(p);
  update public.leads set request_hash = fingerprint where idempotency_key = (p ->> 'idempotency_key')::uuid;
end;
$$;
revoke all on function public.create_lead(jsonb) from public, anon, authenticated;
grant execute on function public.create_lead(jsonb) to service_role;

create or replace function public.claim_outbox(p_batch int) returns setof public.email_outbox
language plpgsql security definer set search_path = '' as $$
begin
  update public.email_outbox set status = 'failed', last_error = 'retry_limit', locked_until = null
    where attempts >= 5 and (status = 'queued' or (status = 'sending' and locked_until < now()));
  return query update public.email_outbox o set status = 'sending', locked_until = now() + interval '2 minutes',
    attempts = o.attempts + 1, updated_at = now()
  where o.id in (
    select id from public.email_outbox
    where attempts < 5 and ((status = 'queued' and next_attempt_at <= now()) or (status = 'sending' and locked_until < now()))
    order by next_attempt_at limit greatest(0, least(p_batch, 5)) for update skip locked
  ) returning o.*;
end;
$$;
revoke all on function public.claim_outbox(int) from public, anon, authenticated;
grant execute on function public.claim_outbox(int) to service_role;
