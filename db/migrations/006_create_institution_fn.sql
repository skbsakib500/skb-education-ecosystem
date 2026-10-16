create or replace function public.create_institution_with_admin(
  p_name text,
  p_slug text,
  p_type text,
  p_emoji text,
  p_division text,
  p_city text,
  p_education_board text,
  p_contact_phone text,
  p_contact_email text,
  p_description text,
  p_motto text,
  p_established_year int
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_user_email text;
  v_inst_id uuid;
  v_inst jsonb;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_name is null or length(trim(p_name)) < 2 then
    raise exception 'Institution name is required';
  end if;

  if p_slug is null or length(trim(p_slug)) < 3 then
    raise exception 'Slug must be at least 3 characters';
  end if;

  -- Check slug uniqueness
  if exists (select 1 from public.institutions where slug = p_slug) then
    raise exception 'Slug "%" already taken', p_slug;
  end if;

  select email into v_user_email from auth.users where id = v_user_id;

  -- Insert institution
  insert into public.institutions (
    name, slug, type, owner_email, emoji, division, city,
    education_board, contact_phone, contact_email,
    description, motto, established_year
  ) values (
    trim(p_name), p_slug, p_type, v_user_email, p_emoji, p_division, p_city,
    p_education_board, p_contact_phone, p_contact_email,
    p_description, p_motto, p_established_year
  ) returning id into v_inst_id;

  -- Insert membership (admin)
  insert into public.memberships (institution_id, user_id, role)
  values (v_inst_id, v_user_id, 'admin');

  -- Return full row
  select to_jsonb(i.*) into v_inst from public.institutions i where i.id = v_inst_id;

  return v_inst;
end;
$$;

-- Allow authenticated users to call this function
grant execute on function public.create_institution_with_admin to authenticated;
