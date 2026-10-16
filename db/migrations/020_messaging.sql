-- ============================================================
-- Migration 020: Direct Messaging + Groups
-- ============================================================

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'direct' check (type in ('direct','group','class','institution')),
  name text,
  institution_id uuid references public.institutions(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  last_message_at timestamptz default now(),
  created_at timestamptz default now()
);
create index if not exists idx_conv_last on public.conversations(last_message_at desc);

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text default 'member' check (role in ('member','admin')),
  joined_at timestamptz default now(),
  last_read_at timestamptz default now(),
  primary key (conversation_id, user_id)
);
create index if not exists idx_conv_members_user on public.conversation_members(user_id);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  attachment_url text,
  attachment_type text,
  created_at timestamptz default now()
);
create index if not exists idx_messages_conv on public.messages(conversation_id, created_at desc);

alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;

-- Membership helper
create or replace function public.is_conversation_member(p_conv_id uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists(select 1 from public.conversation_members where conversation_id = p_conv_id and user_id = auth.uid());
$$;
grant execute on function public.is_conversation_member to authenticated;

drop policy if exists "conv_read_member" on public.conversations;
drop policy if exists "conv_insert_auth" on public.conversations;
create policy "conv_read_member" on public.conversations for select to authenticated using (public.is_conversation_member(id));
create policy "conv_insert_auth" on public.conversations for insert to authenticated with check (created_by = auth.uid());

drop policy if exists "cm_read_own" on public.conversation_members;
drop policy if exists "cm_insert_self" on public.conversation_members;
create policy "cm_read_own" on public.conversation_members for select to authenticated
  using (user_id = auth.uid() or public.is_conversation_member(conversation_id));
create policy "cm_insert_self" on public.conversation_members for insert to authenticated with check (true);

drop policy if exists "msg_read_member" on public.messages;
drop policy if exists "msg_insert_member" on public.messages;
create policy "msg_read_member" on public.messages for select to authenticated using (public.is_conversation_member(conversation_id));
create policy "msg_insert_member" on public.messages for insert to authenticated
  with check (sender_id = auth.uid() and public.is_conversation_member(conversation_id));

-- Start/get direct conversation
create or replace function public.start_direct_conversation(p_other_user_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_conv_id uuid;
begin
  if v_me is null then raise exception 'Auth required'; end if;
  if v_me = p_other_user_id then raise exception 'Cannot message yourself'; end if;

  select c.id into v_conv_id
  from public.conversations c
  where c.type = 'direct'
    and exists (select 1 from public.conversation_members where conversation_id = c.id and user_id = v_me)
    and exists (select 1 from public.conversation_members where conversation_id = c.id and user_id = p_other_user_id)
    and (select count(*) from public.conversation_members where conversation_id = c.id) = 2
  limit 1;

  if v_conv_id is not null then return v_conv_id; end if;

  insert into public.conversations (type, created_by) values ('direct', v_me) returning id into v_conv_id;
  insert into public.conversation_members (conversation_id, user_id) values (v_conv_id, v_me), (v_conv_id, p_other_user_id);
  return v_conv_id;
end;
$$;
grant execute on function public.start_direct_conversation to authenticated;

-- Inbox list
create or replace function public.my_conversations()
returns table (
  conversation_id uuid, type text, name text,
  other_user_id uuid, other_name text, other_username text, other_avatar text,
  last_message text, last_message_at timestamptz, unread_count bigint
)
language sql security definer stable set search_path = public as $$
  with my_members as (
    select cm.conversation_id, cm.last_read_at from public.conversation_members cm where cm.user_id = auth.uid()
  )
  select
    c.id, c.type, c.name,
    (select cm2.user_id from public.conversation_members cm2 where cm2.conversation_id = c.id and cm2.user_id <> auth.uid() limit 1) as other_user_id,
    (select p.full_name from public.profiles p join public.conversation_members cm2 on cm2.user_id = p.id where cm2.conversation_id = c.id and cm2.user_id <> auth.uid() limit 1) as other_name,
    (select p.username from public.profiles p join public.conversation_members cm2 on cm2.user_id = p.id where cm2.conversation_id = c.id and cm2.user_id <> auth.uid() limit 1) as other_username,
    (select p.avatar_url from public.profiles p join public.conversation_members cm2 on cm2.user_id = p.id where cm2.conversation_id = c.id and cm2.user_id <> auth.uid() limit 1) as other_avatar,
    (select m.content from public.messages m where m.conversation_id = c.id order by m.created_at desc limit 1) as last_message,
    c.last_message_at,
    (select count(*) from public.messages m where m.conversation_id = c.id and m.created_at > coalesce((select last_read_at from my_members where conversation_id = c.id), c.created_at) and m.sender_id <> auth.uid()) as unread_count
  from public.conversations c
  where c.id in (select conversation_id from my_members)
  order by c.last_message_at desc;
$$;
grant execute on function public.my_conversations to authenticated;

-- Update last read
create or replace function public.mark_conversation_read(p_conv_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.conversation_members set last_read_at = now() where conversation_id = p_conv_id and user_id = auth.uid();
$$;
grant execute on function public.mark_conversation_read to authenticated;

-- Auto-update conversation last_message_at
create or replace function public.update_conv_last_message()
returns trigger language plpgsql security definer as $$
begin
  update public.conversations set last_message_at = new.created_at where id = new.conversation_id;
  return new;
end;
$$;
drop trigger if exists trg_conv_last on public.messages;
create trigger trg_conv_last after insert on public.messages
  for each row execute function public.update_conv_last_message();

-- Unread total
create or replace function public.my_unread_messages()
returns int language sql security definer stable set search_path = public as $$
  select coalesce(sum(uc), 0)::int from (
    select (
      select count(*) from public.messages m
      where m.conversation_id = c.id
        and m.created_at > coalesce(cm.last_read_at, c.created_at)
        and m.sender_id <> auth.uid()
    ) as uc
    from public.conversations c
    join public.conversation_members cm on cm.conversation_id = c.id
    where cm.user_id = auth.uid()
  ) t;
$$;
grant execute on function public.my_unread_messages to authenticated;
