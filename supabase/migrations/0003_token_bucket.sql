-- Replenishing distributed token buckets. Apply after 0002_ingestion_guards.sql.
-- Existing counters are conservatively drained during migration.
alter table public.rate_buckets add column tokens numeric not null default 0;
alter table public.rate_buckets add column last_refill timestamptz not null default now();
create or replace function public.rate_limit_hit(p_key text, p_limit int, p_window_seconds int) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  v_tokens numeric;
  v_refill timestamptz;
  v_now timestamptz;
  v_allowed boolean;
begin
  if p_limit < 1 or p_limit > 100000 or p_window_seconds < 1 or p_window_seconds > 86400 then
    raise exception 'Invalid rate limit';
  end if;
  insert into public.rate_buckets(key,window_start,count,tokens,last_refill)
  values(p_key,now(),0,p_limit,now()) on conflict(key) do nothing;
  select tokens,last_refill into v_tokens,v_refill from public.rate_buckets where key=p_key for update;
  v_now := clock_timestamp();
  v_tokens := least(p_limit, v_tokens + greatest(0,extract(epoch from (v_now-v_refill))) * p_limit / p_window_seconds);
  v_allowed := v_tokens >= 1;
  update public.rate_buckets set tokens=v_tokens-case when v_allowed then 1 else 0 end,
    last_refill=v_now,window_start=v_now,count=least(count+1,1000000000)
    where key=p_key;
  return v_allowed;
end;
$$;
revoke all on function public.rate_limit_hit(text,int,int) from public,anon,authenticated;
grant execute on function public.rate_limit_hit(text,int,int) to service_role;
