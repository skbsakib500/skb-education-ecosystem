drop policy if exists "own profile" on public.profiles;
drop policy if exists "insert own profile" on public.profiles;
drop policy if exists "member institutions" on public.institutions;
drop policy if exists "anyone can create institution" on public.institutions;
drop policy if exists "own memberships" on public.memberships;
drop policy if exists "join institution" on public.memberships;
drop policy if exists "institution classes" on public.classes;
drop policy if exists "institution students" on public.students;

create policy "own profile" on public.profiles for select using (auth.uid() = id);
create policy "insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "anyone can create institution" on public.institutions for insert with check (auth.role() = 'authenticated');
create policy "member institutions" on public.institutions for select using (public.is_member_of(id));
create policy "own memberships" on public.memberships for select using (user_id = auth.uid() or public.is_admin_of(institution_id));
create policy "join institution" on public.memberships for insert with check (user_id = auth.uid());
create policy "institution classes" on public.classes for all using (public.is_member_of(institution_id));
create policy "institution students" on public.students for all using (public.is_member_of(institution_id));
