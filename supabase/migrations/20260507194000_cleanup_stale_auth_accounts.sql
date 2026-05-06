-- Remove a stale admin test account and any dependent public rows.
-- This keeps the auth tables and public role/profile rows aligned.

delete from public.user_roles
where user_id in (
  select id from auth.users where lower(email) = 'saboorpsp12124@gmail.com'
);

delete from public.profiles
where user_id in (
  select id from auth.users where lower(email) = 'saboorpsp12124@gmail.com'
);

delete from auth.users
where lower(email) = 'saboorpsp12124@gmail.com';
