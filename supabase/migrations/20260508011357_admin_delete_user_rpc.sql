create or replace function public.admin_delete_user(target_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'Admin only' using errcode = '42501';
  end if;

  if target_user_id = auth.uid() then
    raise exception 'Admins cannot delete their own account from the dashboard' using errcode = '42501';
  end if;

  delete from auth.users
  where id = target_user_id;

  return found;
end;
$$;

revoke all on function public.admin_delete_user(uuid) from public;
grant execute on function public.admin_delete_user(uuid) to authenticated;
