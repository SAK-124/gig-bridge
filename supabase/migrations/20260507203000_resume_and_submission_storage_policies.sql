-- Allow businesses to review applicant resumes and add a dedicated bucket for work submissions.

drop policy if exists "users read own resume" on storage.objects;
create policy "resume readers" on storage.objects for select
  using (
    bucket_id = 'resumes'
    and (
      auth.uid()::text = (storage.foldername(name))[1]
      or public.has_role(auth.uid(), 'admin')
      or exists (
        select 1
        from public.applications a
        join public.gigs g on g.id = a.gig_id
        where a.student_id::text = (storage.foldername(name))[1]
          and g.business_id = auth.uid()
      )
      or exists (
        select 1
        from public.hires h
        where h.student_id::text = (storage.foldername(name))[1]
          and h.business_id = auth.uid()
      )
    )
  );

insert into storage.buckets (id, name, public)
values ('submission-files', 'submission-files', false)
on conflict do nothing;

drop policy if exists "students upload own submission files" on storage.objects;
create policy "students upload own submission files" on storage.objects for insert
  with check (
    bucket_id = 'submission-files'
    and exists (
      select 1
      from public.hires h
      where h.id::text = (storage.foldername(name))[1]
        and h.student_id = auth.uid()
    )
  );

drop policy if exists "participants read submission files" on storage.objects;
create policy "participants read submission files" on storage.objects for select
  using (
    bucket_id = 'submission-files'
    and (
      public.has_role(auth.uid(), 'admin')
      or exists (
        select 1
        from public.hires h
        where h.id::text = (storage.foldername(name))[1]
          and (h.student_id = auth.uid() or h.business_id = auth.uid())
      )
    )
  );
