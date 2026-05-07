-- Make destructive actions explicit in RLS:
-- admins can manage platform records, owners can delete records they own.

create or replace function public.delete_own_account()
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  delete from auth.users
  where id = current_user_id;

  return found;
end;
$$;

revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;

-- Profiles and bank details: users may delete their own non-auth profile data.
drop policy if exists "users delete own profile" on public.profiles;
create policy "users delete own profile" on public.profiles
  for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "owner deletes bank" on public.bank_details;
create policy "owner deletes bank" on public.bank_details
  for delete to authenticated using (auth.uid() = user_id);

-- Applications: students can withdraw their own applications; businesses/admins can remove applications on their gigs.
drop policy if exists "owners delete applications" on public.applications;
create policy "owners delete applications" on public.applications
  for delete to authenticated using (
    public.has_role(auth.uid(), 'admin')
    or auth.uid() = student_id
    or auth.uid() in (select business_id from public.gigs where id = gig_id)
  );

drop policy if exists "admins manage applications" on public.applications;
create policy "admins manage applications" on public.applications
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Hires and payments: admins can clean up any record; businesses can delete their own unpaid setup records.
drop policy if exists "admin manages hires" on public.hires;
create policy "admin manages hires" on public.hires
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "business deletes own unpaid hires" on public.hires;
create policy "business deletes own unpaid hires" on public.hires
  for delete to authenticated using (
    auth.uid() = business_id
    and status = 'awaiting_payment'
  );

drop policy if exists "business deletes own unpaid payments" on public.payments;
create policy "business deletes own unpaid payments" on public.payments
  for delete to authenticated using (
    exists (
      select 1
      from public.hires h
      where h.id = hire_id
        and h.business_id = auth.uid()
        and h.status = 'awaiting_payment'
    )
    and status = 'awaiting'
    and business_proof_url is null
  );

-- Submissions: admins can manage all; students can delete their own submission while the hire is still submitted/revision flow.
drop policy if exists "admin manages submissions" on public.submissions;
create policy "admin manages submissions" on public.submissions
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "student deletes own submission" on public.submissions;
create policy "student deletes own submission" on public.submissions
  for delete to authenticated using (
    exists (
      select 1
      from public.hires h
      where h.id = hire_id
        and h.student_id = auth.uid()
        and h.status in ('submitted', 'revision_requested')
    )
  );

-- Messages, disputes, and reviews: admins can remove moderation/problem records; authors can remove their own messages/reviews.
drop policy if exists "admin manages messages" on public.messages;
create policy "admin manages messages" on public.messages
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "sender deletes own messages" on public.messages;
create policy "sender deletes own messages" on public.messages
  for delete to authenticated using (sender_id = auth.uid());

drop policy if exists "admin manages disputes" on public.disputes;
create policy "admin manages disputes" on public.disputes
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "raiser deletes open disputes" on public.disputes;
create policy "raiser deletes open disputes" on public.disputes
  for delete to authenticated using (
    raised_by_id = auth.uid()
    and status = 'open'
  );

drop policy if exists "admin manages reviews" on public.reviews;
create policy "admin manages reviews" on public.reviews
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "reviewer deletes own reviews" on public.reviews;
create policy "reviewer deletes own reviews" on public.reviews
  for delete to authenticated using (reviewer_id = auth.uid());

-- Private storage objects: owners/participants can delete their own workflow files; admins can remove any platform file.
drop policy if exists "admin deletes platform storage" on storage.objects;
create policy "admin deletes platform storage" on storage.objects
  for delete to authenticated using (
    bucket_id in ('resumes', 'payment-proofs', 'dispute-evidence', 'chat-attachments', 'submission-files')
    and public.has_role(auth.uid(), 'admin')
  );

drop policy if exists "users delete own resume" on storage.objects;
create policy "users delete own resume" on storage.objects
  for delete to authenticated using (
    bucket_id = 'resumes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "business deletes own payment proof" on storage.objects;
create policy "business deletes own payment proof" on storage.objects
  for delete to authenticated using (
    bucket_id = 'payment-proofs'
    and exists (
      select 1
      from public.hires h
      where h.id::text = (storage.foldername(name))[1]
        and h.business_id = auth.uid()
        and h.status = 'awaiting_payment'
    )
  );

drop policy if exists "participants delete workflow files" on storage.objects;
create policy "participants delete workflow files" on storage.objects
  for delete to authenticated using (
    bucket_id in ('dispute-evidence', 'chat-attachments', 'submission-files')
    and exists (
      select 1
      from public.hires h
      where h.id::text = (storage.foldername(name))[1]
        and (h.business_id = auth.uid() or h.student_id = auth.uid())
    )
  );
