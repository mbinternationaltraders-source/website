-- Owner portal: deal value, follow-up reminders, lead source and staff accounts.
-- Owner  = allowlisted with role 'owner' + MFA: everything, including export, deletion, products and team.
-- Staff  = allowlisted with role 'staff' + MFA: read and work enquiries (status, notes, value, follow-up) only.

alter table public.owners add column if not exists role text not null default 'owner' check (role in ('owner', 'staff'));
alter table public.owners add column if not exists email text check (char_length(email) <= 254);

alter table public.leads add column if not exists deal_value numeric(14, 2) check (deal_value is null or (deal_value >= 0 and deal_value <= 1000000000));
alter table public.leads add column if not exists follow_up_at timestamptz;
alter table public.leads add column if not exists source text not null default 'website'
  check (source in ('website', 'google', 'whatsapp', 'facebook', 'referral', 'repeat', 'walk_in', 'other'));
create index if not exists leads_follow_up_idx on public.leads (follow_up_at) where follow_up_at is not null;

-- Owner checks now also require the owner role; is_team accepts owner or staff. Both require MFA (aal2).
create or replace function public.is_owner() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((auth.jwt() ->> 'aal') = 'aal2', false)
     and exists (select 1 from public.owners o where o.user_id = auth.uid() and o.role = 'owner');
$$;

create or replace function public.is_team() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((auth.jwt() ->> 'aal') = 'aal2', false)
     and exists (select 1 from public.owners o where o.user_id = auth.uid());
$$;
grant execute on function public.is_team() to anon, authenticated;

-- Enquiry work is shared with staff; deletion stays owner-only.
drop policy if exists "owner reads leads" on public.leads;
drop policy if exists "owner updates leads" on public.leads;
create policy "team reads leads" on public.leads for select using (public.is_team());
create policy "team updates leads" on public.leads for update using (public.is_team()) with check (public.is_team());

drop policy if exists "owner reads lead items" on public.lead_items;
create policy "team reads lead items" on public.lead_items for select using (public.is_team());

drop policy if exists "owner reads notes" on public.lead_notes;
drop policy if exists "owner adds notes" on public.lead_notes;
create policy "team reads notes" on public.lead_notes for select using (public.is_team());
create policy "team adds notes" on public.lead_notes for insert with check (public.is_team() and author = auth.uid());

drop policy if exists "owner reads outbox" on public.email_outbox;
create policy "team reads outbox" on public.email_outbox for select using (public.is_team());

drop policy if exists "owner reads audit" on public.audit_events;
drop policy if exists "owner writes audit" on public.audit_events;
create policy "team reads audit" on public.audit_events for select using (public.is_team());
create policy "team writes audit" on public.audit_events for insert with check (public.is_team() and actor = auth.uid());

-- The owner sees the whole team list; everyone sees their own row (used at sign-in).
create policy "owner reads team" on public.owners for select using (public.is_owner());

-- Only these lead columns are writable by a signed-in user; first_response_at stays database-controlled.
revoke update on public.leads from authenticated;
grant update (status, last_activity_at, deal_value, follow_up_at, source) on public.leads to authenticated;
