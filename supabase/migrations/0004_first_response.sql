-- Records when each lead first left "new", so the owner dashboard can report real reply times.
-- Set by the database, not the app: the owner cannot write this column (no column grant), so it cannot be backdated.

alter table public.leads add column if not exists first_response_at timestamptz;

create or replace function public.stamp_first_response() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.first_response_at is null and old.status = 'new' and new.status <> 'new' then
    new.first_response_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists leads_first_response on public.leads;
create trigger leads_first_response
  before update of status on public.leads
  for each row execute function public.stamp_first_response();

revoke execute on function public.stamp_first_response() from public, anon, authenticated;

create index if not exists leads_first_response_idx on public.leads (first_response_at);
