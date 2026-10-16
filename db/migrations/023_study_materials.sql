-- ============================================================
-- Migration 023: Study Materials + Bookmarks + Downloads
-- ============================================================

create table if not exists public.study_materials (
  id uuid primary key default gen_random_uuid(),
  uploader_id uuid not null references auth.users(id) on delete cascade,
  institution_id uuid references public.institutions(id) on delete cascade,
  class_id uuid references public.classes(id) on delete set null,
  subject text,
  title text not null,
  description text,
  type text not null default 'pdf'
    check (type in ('pdf','video','note','link','audio','image','doc','ppt')),
  file_url text,
  file_size bigint,
  external_url text,
  thumbnail_url text,
  tags jsonb default '[]'::jsonb,
  downloads int default 0,
  views int default 0,
  is_public boolean default true,
  created_at timestamptz default now()
);
create index if not exists idx_materials_inst on public.study_materials(institution_id, created_at desc);
create index if not exists idx_materials_subject on public.study_materials(subject);
create index if not exists idx_materials_type on public.study_materials(type);

create table if not exists public.material_bookmarks (
  user_id uuid not null references auth.users(id) on delete cascade,
  material_id uuid not null references public.study_materials(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, material_id)
);

create table if not exists public.material_downloads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  material_id uuid not null references public.study_materials(id) on delete cascade,
  created_at timestamptz default now()
);
create index if not exists idx_downloads_material on public.material_downloads(material_id);

alter table public.study_materials enable row level security;
alter table public.material_bookmarks enable row level security;
alter table public.material_downloads enable row level security;

drop policy if exists "materials_read" on public.study_materials;
drop policy if exists "materials_own" on public.study_materials;
create policy "materials_read" on public.study_materials
  for select to authenticated
  using (
    is_public = true
    or uploader_id = auth.uid()
    or (institution_id is not null and public.is_member_of(institution_id))
  );
create policy "materials_own" on public.study_materials
  for all to authenticated
  using (uploader_id = auth.uid() or (institution_id is not null and public.is_admin_of(institution_id)))
  with check (uploader_id = auth.uid() or (institution_id is not null and public.is_admin_of(institution_id)));

drop policy if exists "bookmarks_own" on public.material_bookmarks;
create policy "bookmarks_own" on public.material_bookmarks
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "downloads_own" on public.material_downloads;
drop policy if exists "downloads_read" on public.material_downloads;
create policy "downloads_own" on public.material_downloads
  for insert to authenticated with check (user_id = auth.uid());
create policy "downloads_read" on public.material_downloads
  for select to authenticated using (user_id = auth.uid());

-- Storage bucket
insert into storage.buckets (id, name, public, file_size_limit)
values ('study-materials', 'study-materials', true, 26214400)
on conflict (id) do nothing;

drop policy if exists "sm_public_read" on storage.objects;
drop policy if exists "sm_auth_upload" on storage.objects;
drop policy if exists "sm_own_delete" on storage.objects;

create policy "sm_public_read" on storage.objects
  for select using (bucket_id = 'study-materials');

create policy "sm_auth_upload" on storage.objects
  for insert with check (
    bucket_id = 'study-materials' and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "sm_own_delete" on storage.objects
  for delete using (
    bucket_id = 'study-materials' and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Search materials
create or replace function public.search_materials(
  p_query text default '',
  p_type text default null,
  p_subject text default null,
  p_institution_id uuid default null,
  p_limit int default 30
)
returns table (
  id uuid, title text, description text, type text, subject text,
  file_url text, external_url text, thumbnail_url text, tags jsonb,
  downloads int, views int, created_at timestamptz,
  uploader_name text, uploader_username text, uploader_avatar text,
  institution_name text, institution_emoji text,
  is_bookmarked boolean
)
language sql security definer stable set search_path = public as $$
  select
    m.id, m.title, m.description, m.type, m.subject,
    m.file_url, m.external_url, m.thumbnail_url, m.tags,
    m.downloads, m.views, m.created_at,
    p.full_name, p.username, p.avatar_url,
    i.name, i.emoji,
    exists (select 1 from public.material_bookmarks where user_id = auth.uid() and material_id = m.id)
  from public.study_materials m
  left join public.profiles p on p.id = m.uploader_id
  left join public.institutions i on i.id = m.institution_id
  where
    (m.is_public = true or m.uploader_id = auth.uid() or (m.institution_id is not null and public.is_member_of(m.institution_id)))
    and (p_type is null or m.type = p_type)
    and (p_subject is null or m.subject = p_subject)
    and (p_institution_id is null or m.institution_id = p_institution_id)
    and (p_query = '' or lower(m.title) like '%' || lower(p_query) || '%' or lower(coalesce(m.description,'')) like '%' || lower(p_query) || '%')
  order by m.created_at desc
  limit p_limit;
$$;
grant execute on function public.search_materials to authenticated;

-- Increment views
create or replace function public.increment_material_views(p_material_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.study_materials set views = views + 1 where id = p_material_id;
end;
$$;
grant execute on function public.increment_material_views to authenticated;

-- Record download
create or replace function public.record_material_download(p_material_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Auth required'; end if;
  insert into public.material_downloads (user_id, material_id) values (auth.uid(), p_material_id);
  update public.study_materials set downloads = downloads + 1 where id = p_material_id;
end;
$$;
grant execute on function public.record_material_download to authenticated;

-- Enable realtime on messages and notifications
do $$
begin
  begin
    alter publication supabase_realtime add table public.messages;
  exception when others then null; end;
  begin
    alter publication supabase_realtime add table public.notifications;
  exception when others then null; end;
  begin
    alter publication supabase_realtime add table public.conversation_members;
  exception when others then null; end;
end $$;
