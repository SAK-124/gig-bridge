-- Gig Bridge feature additions:
-- messages, disputes, reviews, gig/profile columns, and storage buckets/policies.
-- Safe to re-run.

-- 1) In-hire chat messages
create table if not exists public.messages (
  id              uuid        primary key default gen_random_uuid(),
  hire_id         uuid        not null references public.hires(id) on delete cascade,
  sender_id       uuid        not null references auth.users(id),
  message_text    text        not null,
  attachment_urls text[],
  created_at      timestamptz not null default now()
);

alter table public.messages enable row level security;

drop policy if exists "hire participants read messages" on public.messages;
create policy "hire participants read messages" on public.messages
  for select to authenticated using (
    public.has_role(auth.uid(), 'admin')
    or exists (
      select 1 from public.hires h
      where h.id = hire_id
        and (h.business_id = auth.uid() or h.student_id = auth.uid())
    )
  );

drop policy if exists "hire participants send messages" on public.messages;
create policy "hire participants send messages" on public.messages
  for insert to authenticated with check (
    sender_id = auth.uid()
    and (
      public.has_role(auth.uid(), 'admin')
      or exists (
        select 1 from public.hires h
        where h.id = hire_id
          and (h.business_id = auth.uid() or h.student_id = auth.uid())
      )
    )
  );

-- 2) Disputes
create table if not exists public.disputes (
  id             uuid        primary key default gen_random_uuid(),
  hire_id        uuid        not null references public.hires(id) on delete cascade,
  raised_by_id   uuid        not null references auth.users(id),
  raised_by_role text        not null check (raised_by_role in ('student', 'business')),
  reason         text        not null,
  evidence_urls  text[],
  status         text        not null default 'open'
                            check (status in ('open', 'reviewing', 'resolved')),
  admin_notes    text,
  resolution     text        check (resolution in ('release', 'refund', 'revision')),
  created_at     timestamptz not null default now(),
  resolved_at    timestamptz
);

alter table public.disputes enable row level security;

drop policy if exists "involved parties read disputes" on public.disputes;
create policy "involved parties read disputes" on public.disputes
  for select to authenticated using (
    public.has_role(auth.uid(), 'admin')
    or raised_by_id = auth.uid()
    or exists (
      select 1 from public.hires h
      where h.id = hire_id
        and (h.business_id = auth.uid() or h.student_id = auth.uid())
    )
  );

drop policy if exists "hire participants create disputes" on public.disputes;
create policy "hire participants create disputes" on public.disputes
  for insert to authenticated with check (
    raised_by_id = auth.uid()
    and exists (
      select 1 from public.hires h
      where h.id = hire_id
        and (h.business_id = auth.uid() or h.student_id = auth.uid())
    )
  );

drop policy if exists "participants update own disputes" on public.disputes;
create policy "participants update own disputes" on public.disputes
  for update to authenticated using (
    public.has_role(auth.uid(), 'admin')
    or exists (
      select 1 from public.hires h
      where h.id = hire_id
        and (h.business_id = auth.uid() or h.student_id = auth.uid())
    )
  );

-- 3) Reviews
create table if not exists public.reviews (
  id            uuid        primary key default gen_random_uuid(),
  hire_id       uuid        not null references public.hires(id) on delete cascade,
  reviewer_id   uuid        not null references auth.users(id),
  reviewee_id   uuid        not null references auth.users(id),
  reviewer_role text        not null check (reviewer_role in ('student', 'business')),
  rating        integer     not null check (rating between 1 and 5),
  review_text   text,
  created_at    timestamptz not null default now(),
  unique (hire_id, reviewer_id)
);

alter table public.reviews enable row level security;

drop policy if exists "anyone reads reviews" on public.reviews;
create policy "anyone reads reviews" on public.reviews
  for select to authenticated using (true);

drop policy if exists "hire participants write reviews" on public.reviews;
create policy "hire participants write reviews" on public.reviews
  for insert to authenticated with check (
    reviewer_id = auth.uid()
    and exists (
      select 1 from public.hires h
      where h.id = hire_id
        and h.status = 'paid'
        and (h.business_id = auth.uid() or h.student_id = auth.uid())
    )
  );

-- 4) New gig columns
alter table public.gigs
  add column if not exists deliverables text,
  add column if not exists acceptance_criteria text,
  add column if not exists brief jsonb;

-- 5) New profile columns
alter table public.profiles
  add column if not exists certifications text[],
  add column if not exists is_student_verified boolean not null default false,
  add column if not exists is_business_verified boolean not null default false,
  add column if not exists linkedin_url text,
  add column if not exists instagram_url text,
  add column if not exists contact_number text,
  add column if not exists contact_email text;

-- 6) Storage buckets
insert into storage.buckets (id, name, public)
values ('dispute-evidence', 'dispute-evidence', false)
on conflict do nothing;

insert into storage.buckets (id, name, public)
values ('chat-attachments', 'chat-attachments', false)
on conflict do nothing;

drop policy if exists "hire participants upload dispute evidence" on storage.objects;
create policy "hire participants upload dispute evidence" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'dispute-evidence'
    and exists (
      select 1 from public.hires h
      where h.id::text = (storage.foldername(name))[1]
        and (h.business_id = auth.uid() or h.student_id = auth.uid())
    )
  );

drop policy if exists "hire parties read dispute evidence" on storage.objects;
create policy "hire parties read dispute evidence" on storage.objects
  for select to authenticated using (
    bucket_id = 'dispute-evidence'
    and (
      public.has_role(auth.uid(), 'admin')
      or exists (
        select 1 from public.hires h
        where h.id::text = (storage.foldername(name))[1]
          and (h.business_id = auth.uid() or h.student_id = auth.uid())
      )
    )
  );

drop policy if exists "hire participants upload chat attachments" on storage.objects;
create policy "hire participants upload chat attachments" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'chat-attachments'
    and exists (
      select 1 from public.hires h
      where h.id::text = (storage.foldername(name))[1]
        and (h.business_id = auth.uid() or h.student_id = auth.uid())
    )
  );

drop policy if exists "hire parties read chat attachments" on storage.objects;
create policy "hire parties read chat attachments" on storage.objects
  for select to authenticated using (
    bucket_id = 'chat-attachments'
    and (
      public.has_role(auth.uid(), 'admin')
      or exists (
        select 1 from public.hires h
        where h.id::text = (storage.foldername(name))[1]
          and (h.business_id = auth.uid() or h.student_id = auth.uid())
      )
    )
  );
