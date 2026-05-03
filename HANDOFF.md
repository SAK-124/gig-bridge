# Gig Bridge — Handoff & Deployment Guide

This document is the complete brief for taking commit `7af1777` (or later on `main`) and bringing it up on a fresh machine so it can be tested end-to-end.

---

## 1. What this branch does

The repo is a React/Vite + Supabase student gig marketplace for Pakistan. Recent work replaced the old Shopify checkout with a **bank-transfer + screenshot escrow flow** administered by the platform owner, added a dedicated **admin login**, seeded a working pile of **demo content**, and reskinned the dashboards/landing so students and businesses get visually distinct experiences.

### High-level changes since the previous commit

| Area | What changed |
|---|---|
| Auth bug | `src/pages/Auth.tsx` no longer drops every user on `/student` — role lookup now filters by `user_id` and fails closed |
| Payments | Shopify removed. New `initiate-payment` edge function + `PaymentTransfer` page + screenshot uploader/viewer. Admin verifies transfers and uploads payout proofs |
| Admin | New `/admin/login` page + Postgres trigger that auto-promotes `saboor12124@gmail.com`. `scripts/promote-admin.mjs` for any other email |
| Demo data | New `reset-demo` edge function creates 12 student accounts + 6 business accounts + 18 gigs + ~30 applications + 6 hires across every workflow stage. Idempotent |
| UI | Distinct dashboards (StudentHome illustration-led, BusinessHome data-dense with chart), redesigned landing page (real featured gigs, stats counter, university wall, testimonials), new GigCard / EmptyState / 4 SVG illustrations, themed inline-SVG logo, university dropdown + skill chip picker on profile |

---

## 2. Prerequisites

On the target machine you'll need:

- **Node 18+** and **npm** (the repo was built with Node ≥18, npm ≥9).
- **Git** with the GitHub CLI (`gh`) optional but useful.
- **Supabase CLI** for `db push` and `functions deploy`. Install one of:
  - macOS: `brew install supabase/tap/supabase`
  - Windows: `scoop bucket add supabase https://github.com/supabase/scoop-bucket.git && scoop install supabase`
  - Linux / direct: see https://github.com/supabase/cli#install-the-cli
- **Access to the Supabase project** `ecctqyumgokrhupuvvee` (the project_id baked into `supabase/config.toml`). You'll need:
  - The dashboard login that owns that project, OR
  - An access token from Settings → Access Tokens, OR
  - A different project ref + the matching keys (see "If you need a different Supabase project" below)

---

## 3. Get the code

```bash
git clone https://github.com/SAK-124/gig-bridge.git
cd gig-bridge
git pull origin main          # make sure you have 7af1777 or later
npm install
```

---

## 4. Frontend env vars

Create `.env.local` in the repo root (it's gitignored):

```bash
VITE_SUPABASE_URL=https://ecctqyumgokrhupuvvee.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon/publishable key from Supabase dashboard → Settings → API>
VITE_SUPABASE_PROJECT_ID=ecctqyumgokrhupuvvee
```

The publishable key is the **anon public** key, not the service role key. It's safe to ship to the browser.

Smoke-check:

```bash
npm run dev      # opens http://localhost:8080
```

You should see the landing page render even before the rest of the steps below — but signing in / browsing gigs will be empty until the migrations + seed run.

---

## 5. Apply the Supabase migrations

The two new migrations add the bank-transfer columns + storage bucket + admin email trigger.

```bash
supabase login
supabase link --project-ref ecctqyumgokrhupuvvee
supabase db push
```

Migrations applied (in order):

- `20260501172314_*.sql` — base schema (already on the project, no-op)
- `20260501172352_*.sql` — security tweaks (already on the project, no-op)
- `20260502090000_bank_transfer_payments.sql` — adds proof columns to `payments`, `platform_bank_accounts` table (with one seeded row), `payment-proofs` storage bucket + RLS, `handle_payment_received` trigger
- `20260502090100_admin_email_trigger.sql` — adds the auto-promote-on-signup trigger for `saboor12124@gmail.com` and retro-promotes the row if the user already exists

If `db push` complains about already-applied migrations, that's fine — it skips them.

---

## 6. Deploy the edge functions

```bash
supabase functions deploy initiate-payment
supabase functions deploy reset-demo
```

`reset-demo` requires the **service role key** to be available to the function. By default Supabase exposes it as `SUPABASE_SERVICE_ROLE_KEY` inside deployed functions — no extra config needed. If for some reason it's not set, do:

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<service role key>
```

You can verify both deployed:

```bash
supabase functions list
```

`create-checkout` was deleted in this commit — if it shows up as still deployed, remove it:

```bash
supabase functions delete create-checkout
```

---

## 7. Make the admin account work

There are three independent ways to get an admin user, depending on what's already in the system:

### a) `saboor12124@gmail.com` — automatic

The migration in step 5 added a Postgres trigger that auto-promotes this email on signup, AND retro-promotes if the account already exists. Just sign up (or sign in if already signed up) at `/auth?mode=signup`, then go to `/admin/login` to enter the operations console.

### b) Any other email — promote-admin script

```bash
SUPABASE_URL=https://ecctqyumgokrhupuvvee.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=<service role key> \
node scripts/promote-admin.mjs admin-to-be@example.com
```

The user must have signed up first. The service role key lives at Supabase → Settings → API. Treat it like a database password — don't paste it into the browser, don't commit it.

### c) Manual SQL (escape hatch)

```sql
insert into public.user_roles (user_id, role)
select id, 'admin' from auth.users where email = 'admin-to-be@example.com'
on conflict (user_id, role) do nothing;
```

---

## 8. Seed the marketplace with demo content

Once you have an admin login working:

1. Sign in at `/admin/login`.
2. Top-right of the admin dashboard, click **Reset demo data**.
3. The function returns a JSON summary in a toast (e.g. `Demo data reset · 18 users · 18 gigs · password DemoPass123!`).
4. After it finishes you can sign in to the regular `/auth` page as any of:
   - **Students**: `ayesha.khan@gigbridge.test`, `hassan.ahmed@gigbridge.test`, `fatima.raza@gigbridge.test`, `ali.shah@gigbridge.test`, `zara.malik@gigbridge.test`, `usman.tariq@gigbridge.test`, `mariam.iqbal@gigbridge.test`, `bilal.qureshi@gigbridge.test`, `noor.fatima@gigbridge.test`, `danish.malik@gigbridge.test`, `iman.shaikh@gigbridge.test`, `rohail.akhtar@gigbridge.test`
   - **Businesses**: `founder@kashmiriqahwa.gigbridge.test`, `ops@dehleez.gigbridge.test`, `hello@chaiwala.gigbridge.test`, `team@bytebazaar.gigbridge.test`, `founder@padosi.gigbridge.test`, `support@minarstack.gigbridge.test`
   - All of them use password `DemoPass123!`.
5. The seeded hires already cover every status so the badge variants and dashboard cards aren't empty.

You can re-run **Reset demo data** anytime — it wipes prior demo records (filtered by demo user IDs only) and re-creates them.

---

## 9. End-to-end test plan

Use multiple browser profiles (or incognito windows) so you can keep three sessions open at once: business / student / admin.

| # | Actor | Action | Expected result |
|---|---|---|---|
| 1 | Visitor | Open `/` | Landing page renders with bridge SVG hero, **live featured gigs strip pulling 6 real seeded gigs**, real stats counter (paid out, students, completed) |
| 2 | New student | Sign up at `/auth?mode=signup&role=student` | Lands on `/student` (NOT `/business`) — illustration-led greeting, recommended gigs visible |
| 3 | New business | Sign up at `/auth?mode=signup&role=business` | Lands on `/business` (NOT `/student`) — KPI row + payment donut |
| 4 | Student demo | Sign in as `ayesha.khan@gigbridge.test` / `DemoPass123!`, visit `/student/gigs` | ≥12 open gigs render with category chips, company avatars, deadline countdowns, skill pills |
| 5 | Business demo | Sign in as `team@bytebazaar.gigbridge.test`, hire someone from Applicants | Routed to `/business/payments/<hireId>/transfer` showing platform bank account + `GB-XXXXXXXX` reference |
| 6 | Business demo | Upload any test screenshot on the transfer page | Status flips to **Awaiting Verification**, screenshot viewable via "My proof" |
| 7 | Admin | Visit `/admin` → **Verify transfers** tab | The transfer just uploaded shows up; click **Confirm received** → hire flips to **Work In Progress** |
| 8 | Student demo | Visit `/student/active`, click **Submit work** | Status flips to **Submitted** |
| 9 | Business demo | Visit `/business/gigs`, click **Approve work** on the submission | Payment becomes **Payout Pending** |
| 10 | Admin | Visit `/admin` → **Pending payouts** tab → **Mark paid** dialog → upload payout screenshot → confirm | Payment becomes **Paid**; student sees the payout proof in `/student/payments` |
| 11 | Admin | Visit **Disputes** tab — for the seeded disputed hire, click **Release to student** or **Refund business** | Hire moves to `approved`, payment moves to `payout_pending` or `refunded` |
| 12 | Business demo | Try to view a student's bank details (e.g. via DevTools query) | RLS denies — only owner + admin can see `bank_details` |

---

## 10. Troubleshooting

**`supabase db push` fails with permission errors on `auth.users`**
The new admin trigger has to attach to `auth.users`. The Supabase CLI should be allowed to do this on linked projects; if it isn't, run the migration manually in the Supabase SQL editor.

**Reset demo data returns 403 / "Admin only"**
You're not signed in as admin. Re-check step 7. Use DevTools → Application → Cookies to confirm the access token is from the admin account.

**Reset demo data returns 500 with "service_role" message**
The function can't find `SUPABASE_SERVICE_ROLE_KEY`. Run `supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<key>` and redeploy.

**Business uploads proof but admin can't see it in "Verify transfers"**
Check that `payment-proofs` bucket exists (Storage tab in Supabase dashboard) and that the migration's RLS policies are present. Re-running `supabase db push` fixes most cases.

**Logging in as student or business takes me to the same page**
Was the original bug. Should be impossible after this commit. If you see it, check that `user_roles` has a row for the user (Supabase Table Editor) and that the row's `role` is correct.

**Bundle build warning about >500 kB chunks**
Cosmetic, ignore. The app builds and runs fine.

**`npm install` fails on Windows with `node-gyp` errors**
Try `npm install --no-optional`. The project doesn't actually need any native deps.

---

## 11. Quick reference

| Thing | Where |
|---|---|
| Repo | https://github.com/SAK-124/gig-bridge |
| Supabase project ref | `ecctqyumgokrhupuvvee` (in `supabase/config.toml`) |
| Admin login URL | `/admin/login` |
| Admin email | `saboor12124@gmail.com` (auto-promoted by trigger) |
| Demo user password | `DemoPass123!` |
| Demo email pattern | `*@gigbridge.test` |
| Transfer reference format | `GB-<first 8 chars of hire UUID, uppercased>` |
| Default platform bank account label | `Gig Bridge Escrow — primary` (id `00000000-0000-4000-8000-000000000001`, edit in admin Supabase Table Editor) |

---

## 12. If you need a different Supabase project

If you want to test against a fresh Supabase project instead of `ecctqyumgokrhupuvvee`:

1. Create the project at supabase.com.
2. Edit `supabase/config.toml` and replace the `project_id`.
3. Run `supabase link --project-ref <new ref>`.
4. Replace `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env.local`.
5. Continue from step 5 above.

The migrations are self-contained and will set up the entire schema from scratch on a fresh project.

---

## 13. Files to skim if anything looks off

| File | What it does |
|---|---|
| [src/pages/Auth.tsx](src/pages/Auth.tsx) | Login/signup; role lookup that was the bug source |
| [src/pages/admin/AdminLogin.tsx](src/pages/admin/AdminLogin.tsx) | The new admin sign-in page |
| [src/pages/admin/AdminDashboard.tsx](src/pages/admin/AdminDashboard.tsx) | Verify transfers / pending payouts / disputes / reset-demo |
| [src/pages/business/PaymentTransfer.tsx](src/pages/business/PaymentTransfer.tsx) | Where business uploads proof |
| [src/components/PaymentProofUploader.tsx](src/components/PaymentProofUploader.tsx) | Storage upload component |
| [src/lib/payments.ts](src/lib/payments.ts) | `paymentDisplayStatus`, `fetchActivePlatformBankAccount`, `transferReferenceForHire`, `formatPKR`, `computeFees` |
| [supabase/functions/initiate-payment/index.ts](supabase/functions/initiate-payment/index.ts) | Creates payment row + returns bank account |
| [supabase/functions/reset-demo/index.ts](supabase/functions/reset-demo/index.ts) | All seed data + demo user creation logic |
| [supabase/migrations/20260502090000_bank_transfer_payments.sql](supabase/migrations/20260502090000_bank_transfer_payments.sql) | Bank-transfer schema, storage, RLS |
| [supabase/migrations/20260502090100_admin_email_trigger.sql](supabase/migrations/20260502090100_admin_email_trigger.sql) | Admin email auto-promote trigger |

---

That's it. Hand this file to the agent on the other machine and they should be able to take the repo from clone to fully-populated, fully-tested marketplace.
