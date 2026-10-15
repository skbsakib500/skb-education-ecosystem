insert into storage.buckets (id, name, public)
values ('institution-logos', 'institution-logos', true)
on conflict (id) do nothing;

drop policy if exists "public read logos" on storage.objects;
drop policy if exists "auth users upload" on storage.objects;
drop policy if exists "owner delete" on storage.objects;

create policy "public read logos" on storage.objects
  for select using (bucket_id = 'institution-logos');
create policy "auth users upload" on storage.objects
  for insert with check (bucket_id = 'institution-logos' and auth.role() = 'authenticated');
create policy "owner delete" on storage.objects
  for delete using (bucket_id = 'institution-logos' and auth.uid() = owner);
