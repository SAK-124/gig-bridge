-- Keep signup working for normal email accounts even when Supabase requires
-- email confirmation. The trigger runs server-side, so the role is created
-- without relying on a client session.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  signup_role text;
begin
  insert into public.profiles (user_id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));

  signup_role := lower(coalesce(new.raw_user_meta_data->>'role', 'student'));
  if signup_role not in ('student', 'business') then
    signup_role := 'student';
  end if;

  insert into public.user_roles (user_id, role)
  values (new.id, signup_role::public.app_role)
  on conflict (user_id) do nothing;

  return new;
end;
$$;
