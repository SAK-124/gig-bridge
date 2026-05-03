-- Allow signup-time role inserts to evaluate RLS policies that call has_role().
grant execute on function public.has_role(uuid, public.app_role) to anon;
