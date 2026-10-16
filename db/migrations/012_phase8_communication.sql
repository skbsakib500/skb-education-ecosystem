-- ============================================================
-- Phase 8: Communication Center (IDEMPOTENT)
-- ============================================================

-- Notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  recipient_user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text,
  category text not null default 'general'
    check (category in ('general','exam','fee','attendance','notice','result','urgent')),
  link text,
  is_read boolean default false,
  read_at timestamptz,
  created_at timestamptz default now()
);
create index if not exists idx_notif_recipient on public.notifications(recipient_user_id, is_read);
create index if not exists idx_notif_inst on public.notifications(institution_id, created_at desc);

-- Broadcasts
create table if not exists public.broadcasts (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  sender_id uuid references auth.users(id) on delete set null,
  subject text not null,
  body text not null,
  audience text not null default 'all'
    check (audience in ('all','teachers','students','parents','class')),
  class_id uuid references public.classes(id) on delete set null,
  channel text not null default 'in_app'
    check (channel in ('in_app','email','sms','all')),
  recipients_count int default 0,
  status text not null default 'sent'
    check (status in ('draft','queued','sent','failed')),
  created_at timestamptz default now()
);
create index if not exists idx_broadcast_inst on public.broadcasts(institution_id, created_at desc);

-- Message templates
create table if not exists public.message_templates (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  name text not null,
  subject text not null,
  body text not null,
  category text default 'general',
  created_at timestamptz default now()
);
create index if not exists idx_templates_inst on public.message_templates(institution_id);

-- RLS
alter table public.notifications enable row level security;
alter table public.broadcasts enable row level security;
alter table public.message_templates enable row level security;

-- Notifications policies (IDEMPOTENT)
drop policy if exists "notif_own" on public.notifications;
drop policy if exists "notif_update_own" on public.notifications;
drop policy if exists "notif_admin_insert" on public.notifications;
drop policy if exists "notifications_read_own" on public.notifications;
drop policy if exists "notifications_update_own" on public.notifications;
drop policy if exists "notifications_admin_insert" on public.notifications;

create policy "notifications_read_own" on public.notifications
  for select to authenticated using (recipient_user_id = auth.uid());
create policy "notifications_update_own" on public.notifications
  for update to authenticated
  using (recipient_user_id = auth.uid())
  with check (recipient_user_id = auth.uid());
create policy "notifications_admin_insert" on public.notifications
  for insert to authenticated with check (public.is_admin_of(institution_id));

-- Broadcasts policies
drop policy if exists "broadcasts_read" on public.broadcasts;
drop policy if exists "broadcasts_admin" on public.broadcasts;
create policy "broadcasts_read" on public.broadcasts
  for select to authenticated using (public.is_member_of(institution_id));
create policy "broadcasts_admin" on public.broadcasts
  for all to authenticated
  using (public.is_admin_of(institution_id))
  with check (public.is_admin_of(institution_id));

-- Templates policies
drop policy if exists "templates_read" on public.message_templates;
drop policy if exists "templates_admin" on public.message_templates;
create policy "templates_read" on public.message_templates
  for select to authenticated using (public.is_member_of(institution_id));
create policy "templates_admin" on public.message_templates
  for all to authenticated
  using (public.is_admin_of(institution_id))
  with check (public.is_admin_of(institution_id));

-- BROADCAST FUNCTION
create or replace function public.send_broadcast(
  p_institution_id uuid,
  p_subject text,
  p_body text,
  p_audience text,
  p_class_id uuid default null,
  p_channel text default 'in_app'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sender uuid := auth.uid();
  v_broadcast_id uuid;
  v_count int := 0;
begin
  if v_sender is null then raise exception 'Auth required'; end if;
  if not public.is_admin_of(p_institution_id) then
    raise exception 'Admin access required';
  end if;

  insert into public.broadcasts
    (institution_id, sender_id, subject, body, audience, class_id, channel, status)
  values
    (p_institution_id, v_sender, p_subject, p_body, p_audience, p_class_id, p_channel, 'sent')
  returning id into v_broadcast_id;

  if p_audience = 'teachers' then
    insert into public.notifications
      (institution_id, recipient_user_id, title, body, category)
    select p_institution_id, m.user_id, p_subject, p_body, 'general'
    from public.memberships m
    where m.institution_id = p_institution_id and m.role = 'teacher';
    get diagnostics v_count = row_count;

  elsif p_audience = 'students' then
    insert into public.notifications
      (institution_id, recipient_user_id, title, body, category)
    select p_institution_id, s.linked_user_id, p_subject, p_body, 'general'
    from public.students s
    where s.institution_id = p_institution_id
      and s.linked_user_id is not null
      and (p_class_id is null or s.class_id = p_class_id);
    get diagnostics v_count = row_count;

  elsif p_audience = 'parents' then
    insert into public.notifications
      (institution_id, recipient_user_id, title, body, category)
    select p_institution_id, psl.parent_user_id, p_subject, p_body, 'general'
    from public.parent_student_links psl
    join public.students s on s.id = psl.student_id
    where psl.institution_id = p_institution_id
      and (p_class_id is null or s.class_id = p_class_id);
    get diagnostics v_count = row_count;

  elsif p_audience = 'class' then
    if p_class_id is null then
      raise exception 'Class required for class-audience';
    end if;
    insert into public.notifications
      (institution_id, recipient_user_id, title, body, category)
    select p_institution_id, s.linked_user_id, p_subject, p_body, 'general'
    from public.students s
    where s.institution_id = p_institution_id
      and s.class_id = p_class_id
      and s.linked_user_id is not null;
    get diagnostics v_count = row_count;

    insert into public.notifications
      (institution_id, recipient_user_id, title, body, category)
    select p_institution_id, psl.parent_user_id, p_subject, p_body, 'general'
    from public.parent_student_links psl
    join public.students s on s.id = psl.student_id
    where s.class_id = p_class_id;

  else
    insert into public.notifications
      (institution_id, recipient_user_id, title, body, category)
    select p_institution_id, m.user_id, p_subject, p_body, 'general'
    from public.memberships m
    where m.institution_id = p_institution_id;
    get diagnostics v_count = row_count;
  end if;

  update public.broadcasts set recipients_count = v_count where id = v_broadcast_id;

  return jsonb_build_object(
    'broadcast_id', v_broadcast_id,
    'recipients_count', v_count,
    'audience', p_audience
  );
end;
$$;

grant execute on function public.send_broadcast to authenticated;

-- UNREAD COUNT
create or replace function public.my_unread_notifications()
returns int
language sql security definer stable set search_path = public as $$
  select coalesce(count(*), 0)::int
  from public.notifications
  where recipient_user_id = auth.uid() and is_read = false;
$$;

grant execute on function public.my_unread_notifications to authenticated;

-- TRIGGERS
create or replace function public.notify_absence()
returns trigger language plpgsql security definer as $$
declare
  v_parent_id uuid;
  v_student_name text;
begin
  if new.status <> 'absent' then return new; end if;

  select s.full_name into v_student_name
  from public.students s where s.id = new.student_id;

  select psl.parent_user_id into v_parent_id
  from public.parent_student_links psl
  where psl.student_id = new.student_id
  limit 1;

  if v_parent_id is not null then
    insert into public.notifications
      (institution_id, recipient_user_id, title, body, category)
    values (
      new.institution_id, v_parent_id,
      'Child absent today',
      coalesce(v_student_name,'Your child') || ' was marked absent on ' || new.date,
      'attendance'
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notify_absence on public.attendance;
create trigger trg_notify_absence
  after insert or update on public.attendance
  for each row execute function public.notify_absence();

create or replace function public.notify_result()
returns trigger language plpgsql security definer as $$
declare
  v_student record;
  v_exam_title text;
  v_parent_id uuid;
begin
  if new.status <> 'graded' or old.status = 'graded' then return new; end if;

  select s.linked_user_id, s.full_name, s.institution_id into v_student
  from public.students s where s.id = new.student_id;

  select e.title into v_exam_title from public.exams e where e.id = new.exam_id;

  if v_student.linked_user_id is not null then
    insert into public.notifications
      (institution_id, recipient_user_id, title, body, category)
    values (
      v_student.institution_id, v_student.linked_user_id,
      'Exam result published',
      coalesce(v_exam_title,'Exam') || ' — Score: ' || new.score || '/' || new.total_marks,
      'result'
    );
  end if;

  select psl.parent_user_id into v_parent_id
  from public.parent_student_links psl
  where psl.student_id = new.student_id limit 1;

  if v_parent_id is not null then
    insert into public.notifications
      (institution_id, recipient_user_id, title, body, category)
    values (
      v_student.institution_id, v_parent_id,
      'Child result published',
      coalesce(v_student.full_name,'Your child') || ' scored ' || new.score || '/' || new.total_marks || ' in ' || coalesce(v_exam_title,'exam'),
      'result'
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notify_result on public.exam_attempts;
create trigger trg_notify_result
  after update on public.exam_attempts
  for each row execute function public.notify_result();
