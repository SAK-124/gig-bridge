-- Bank-transfer escrow flow: replaces Shopify checkout with admin-mediated bank transfers + screenshot proof.

-- 1) New columns on payments for proof tracking.
alter table public.payments
  add column if not exists business_proof_url text,
  add column if not exists business_proof_uploaded_at timestamptz,
  add column if not exists business_proof_reference text,
  add column if not exists admin_payout_proof_url text,
  add column if not exists admin_payout_proof_uploaded_at timestamptz,
  add column if not exists admin_verified_at timestamptz,
  add column if not exists admin_verified_by uuid references auth.users(id) on delete set null,
  add column if not exists payout_method_label text;

-- shopify_* columns stay nullable but stop being written by the app (legacy data tolerated).

-- 2) Platform bank accounts the business will transfer money to.
create table if not exists public.platform_bank_accounts (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  bank_name text,
  account_title text,
  iban text,
  account_number text,
  easypaisa_number text,
  jazzcash_number text,
  instructions text,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.platform_bank_accounts enable row level security;

drop policy if exists "everyone reads active bank accounts" on public.platform_bank_accounts;
create policy "everyone reads active bank accounts" on public.platform_bank_accounts
  for select to authenticated using (is_active = true or public.has_role(auth.uid(), 'admin'));

drop policy if exists "admins manage bank accounts" on public.platform_bank_accounts;
create policy "admins manage bank accounts" on public.platform_bank_accounts
  for all using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

drop trigger if exists t_platform_bank_updated on public.platform_bank_accounts;
create trigger t_platform_bank_updated before update on public.platform_bank_accounts
  for each row execute function public.touch_updated_at();

-- 3) Seed one default platform account so the flow works end-to-end immediately.
insert into public.platform_bank_accounts (id, label, bank_name, account_title, iban, account_number, easypaisa_number, jazzcash_number, instructions, is_active, sort_order)
values (
  '00000000-0000-4000-8000-000000000001',
  'Gig Bridge Escrow — primary',
  'Meezan Bank',
  'Gig Bridge (Pvt) Ltd',
  'PK00MEZN0000000000000001',
  '01234567890',
  '03001234567',
  '03012345678',
  'Use the hire ID as the transfer reference / remarks so we can match it instantly.',
  true,
  0
) on conflict (id) do nothing;

-- 4) Storage bucket for transfer screenshots and payout proofs.
insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
on conflict do nothing;

-- Path convention: <hire_id>/business-<timestamp>.<ext>  or  <hire_id>/admin-<timestamp>.<ext>

drop policy if exists "business uploads transfer proof" on storage.objects;
create policy "business uploads transfer proof" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'payment-proofs'
    and exists (
      select 1 from public.hires h
      where h.id::text = (storage.foldername(name))[1]
        and h.business_id = auth.uid()
    )
  );

drop policy if exists "admin uploads payout proof" on storage.objects;
create policy "admin uploads payout proof" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'payment-proofs' and public.has_role(auth.uid(), 'admin')
  );

drop policy if exists "involved parties read proofs" on storage.objects;
create policy "involved parties read proofs" on storage.objects
  for select to authenticated using (
    bucket_id = 'payment-proofs'
    and (
      public.has_role(auth.uid(), 'admin')
      or exists (
        select 1 from public.hires h
        where h.id::text = (storage.foldername(name))[1]
          and (h.business_id = auth.uid() or h.student_id = auth.uid())
      )
    )
  );

drop policy if exists "admin manages proofs" on storage.objects;
create policy "admin manages proofs" on storage.objects
  for all to authenticated using (
    bucket_id = 'payment-proofs' and public.has_role(auth.uid(), 'admin')
  ) with check (
    bucket_id = 'payment-proofs' and public.has_role(auth.uid(), 'admin')
  );

-- 5) Helper to flip hire to in_progress when payment is verified received.
create or replace function public.handle_payment_received()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'received' and (old.status is distinct from 'received') then
    update public.hires
       set status = 'in_progress'
     where id = new.hire_id and status in ('awaiting_payment', 'payment_received');
  end if;
  return new;
end;
$$;

drop trigger if exists t_payment_received on public.payments;
create trigger t_payment_received after update on public.payments
  for each row execute function public.handle_payment_received();
