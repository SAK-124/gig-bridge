
-- Roles enum + table
create type public.app_role as enum ('student', 'business', 'admin');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "users read own roles" on public.user_roles for select using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "admins manage roles" on public.user_roles for all using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "users insert own role" on public.user_roles for insert with check (auth.uid() = user_id and role in ('student','business'));

-- Profiles
create type public.work_type as enum ('remote', 'onsite', 'either');

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  bio text,
  -- student fields
  university text,
  degree text,
  graduation_year int,
  skills text[],
  resume_url text,
  portfolio_links text[],
  availability text,
  preferred_work_type work_type,
  -- business fields
  company_name text,
  company_website text,
  company_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "profiles readable by authenticated" on public.profiles for select to authenticated using (true);
create policy "users insert own profile" on public.profiles for insert with check (auth.uid() = user_id);
create policy "users update own profile" on public.profiles for update using (auth.uid() = user_id);
create policy "admins manage profiles" on public.profiles for all using (public.has_role(auth.uid(), 'admin'));

-- Bank details (PRIVATE - only owner + admin)
create table public.bank_details (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  account_title text,
  bank_name text,
  iban text,
  easypaisa text,
  jazzcash text,
  cnic text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.bank_details enable row level security;

create policy "owner reads bank" on public.bank_details for select using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "owner upserts bank" on public.bank_details for insert with check (auth.uid() = user_id);
create policy "owner updates bank" on public.bank_details for update using (auth.uid() = user_id);
create policy "admin manages bank" on public.bank_details for all using (public.has_role(auth.uid(), 'admin'));

-- Gigs
create type public.gig_status as enum ('open', 'in_progress', 'completed', 'closed');
create type public.location_type as enum ('remote', 'onsite', 'hybrid');

create table public.gigs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text,
  description text not null,
  required_skills text[],
  budget numeric(10,2) not null,
  deadline date,
  location location_type not null default 'remote',
  slots int not null default 1,
  status gig_status not null default 'open',
  attachments text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.gigs enable row level security;

create policy "gigs readable by authenticated" on public.gigs for select to authenticated using (true);
create policy "business creates own gigs" on public.gigs for insert with check (auth.uid() = business_id and public.has_role(auth.uid(), 'business'));
create policy "business updates own gigs" on public.gigs for update using (auth.uid() = business_id);
create policy "business deletes own gigs" on public.gigs for delete using (auth.uid() = business_id);
create policy "admin manages gigs" on public.gigs for all using (public.has_role(auth.uid(), 'admin'));

-- Applications
create type public.application_status as enum ('pending', 'shortlisted', 'rejected', 'hired');

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  gig_id uuid not null references public.gigs(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  cover_letter text,
  status application_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (gig_id, student_id)
);
alter table public.applications enable row level security;

create policy "student reads own apps" on public.applications for select using (
  auth.uid() = student_id
  or auth.uid() in (select business_id from public.gigs where id = gig_id)
  or public.has_role(auth.uid(), 'admin')
);
create policy "student creates app" on public.applications for insert with check (auth.uid() = student_id and public.has_role(auth.uid(), 'student'));
create policy "student updates own app" on public.applications for update using (auth.uid() = student_id or auth.uid() in (select business_id from public.gigs where id = gig_id));

-- Hires
create type public.hire_status as enum ('awaiting_payment','payment_received','in_progress','submitted','revision_requested','approved','payout_pending','paid','disputed');

create table public.hires (
  id uuid primary key default gen_random_uuid(),
  gig_id uuid not null references public.gigs(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid references public.applications(id) on delete set null,
  status hire_status not null default 'awaiting_payment',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.hires enable row level security;

create policy "involved parties read hires" on public.hires for select using (
  auth.uid() = student_id or auth.uid() = business_id or public.has_role(auth.uid(), 'admin')
);
create policy "business creates hire" on public.hires for insert with check (auth.uid() = business_id);
create policy "involved parties update hires" on public.hires for update using (
  auth.uid() = student_id or auth.uid() = business_id or public.has_role(auth.uid(), 'admin')
);

-- Payments
create type public.payment_status as enum ('awaiting','received','refunded','payout_pending','paid','disputed');

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  hire_id uuid not null unique references public.hires(id) on delete cascade,
  gig_amount numeric(10,2) not null,
  platform_fee numeric(10,2) not null,
  total_amount numeric(10,2) not null,
  currency text not null default 'PKR',
  shopify_checkout_url text,
  shopify_order_id text,
  status payment_status not null default 'awaiting',
  payout_method text,
  payout_reference text,
  paid_to_student_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.payments enable row level security;

create policy "involved parties read payments" on public.payments for select using (
  exists (select 1 from public.hires h where h.id = hire_id and (h.student_id = auth.uid() or h.business_id = auth.uid()))
  or public.has_role(auth.uid(), 'admin')
);
create policy "business creates payment" on public.payments for insert with check (
  exists (select 1 from public.hires h where h.id = hire_id and h.business_id = auth.uid())
);
create policy "admin manages payments" on public.payments for all using (public.has_role(auth.uid(), 'admin'));
create policy "involved parties update payments" on public.payments for update using (
  exists (select 1 from public.hires h where h.id = hire_id and (h.student_id = auth.uid() or h.business_id = auth.uid()))
  or public.has_role(auth.uid(), 'admin')
);

-- Submissions
create type public.submission_status as enum ('submitted','revision_requested','approved');

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  hire_id uuid not null references public.hires(id) on delete cascade,
  message text,
  file_url text,
  link_url text,
  status submission_status not null default 'submitted',
  created_at timestamptz not null default now()
);
alter table public.submissions enable row level security;

create policy "involved parties read submissions" on public.submissions for select using (
  exists (select 1 from public.hires h where h.id = hire_id and (h.student_id = auth.uid() or h.business_id = auth.uid()))
  or public.has_role(auth.uid(), 'admin')
);
create policy "student creates submission" on public.submissions for insert with check (
  exists (select 1 from public.hires h where h.id = hire_id and h.student_id = auth.uid())
);
create policy "involved parties update submission" on public.submissions for update using (
  exists (select 1 from public.hires h where h.id = hire_id and (h.student_id = auth.uid() or h.business_id = auth.uid()))
  or public.has_role(auth.uid(), 'admin')
);

-- Timestamp trigger
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger t_profiles_updated before update on public.profiles for each row execute function public.touch_updated_at();
create trigger t_bank_updated before update on public.bank_details for each row execute function public.touch_updated_at();
create trigger t_gigs_updated before update on public.gigs for each row execute function public.touch_updated_at();
create trigger t_apps_updated before update on public.applications for each row execute function public.touch_updated_at();
create trigger t_hires_updated before update on public.hires for each row execute function public.touch_updated_at();
create trigger t_payments_updated before update on public.payments for each row execute function public.touch_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Resume storage bucket
insert into storage.buckets (id, name, public) values ('resumes', 'resumes', false) on conflict do nothing;

create policy "users upload own resume" on storage.objects for insert
  with check (bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "users read own resume" on storage.objects for select
  using (bucket_id = 'resumes' and (auth.uid()::text = (storage.foldername(name))[1] or public.has_role(auth.uid(), 'admin')));
