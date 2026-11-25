-- Product photo uploads (Supabase Storage). Public read so product pages can show them;
-- only the owner (role owner + MFA) can upload or delete. Size and type are also limited by the bucket.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-media', 'product-media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "owner uploads product media" on storage.objects for insert to authenticated
  with check (bucket_id = 'product-media' and public.is_owner());
create policy "owner deletes product media" on storage.objects for delete to authenticated
  using (bucket_id = 'product-media' and public.is_owner());
