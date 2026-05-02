-- Auto-promote a designated email to admin on signup. Failsafe so saboor12124@gmail.com
-- can hit /admin/login the moment the account exists, without manual SQL.

create or replace function public.handle_admin_email()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  admin_emails text[] := array['saboor12124@gmail.com'];
begin
  if new.email is not null and lower(new.email) = any(admin_emails) then
    insert into public.user_roles (user_id, role)
    values (new.id, 'admin')
    on conflict (user_id, role) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_admin on auth.users;
create trigger on_auth_user_created_admin
  after insert on auth.users
  for each row execute function public.handle_admin_email();

-- If saboor12124@gmail.com already signed up before this trigger existed, retro-promote.
insert into public.user_roles (user_id, role)
select u.id, 'admin'
  from auth.users u
 where lower(u.email) = 'saboor12124@gmail.com'
on conflict (user_id, role) do nothing;
