# Gig Bridge

Gig Bridge is a student gig marketplace for Pakistani students and businesses. The app uses React, Vite, and Supabase, with a bank-transfer + screenshot escrow flow administered manually by the platform owner. (Shopify is no longer used.)

## Local Development

```bash
npm install
npm run dev
```

Required frontend env vars (Vite):

```bash
VITE_SUPABASE_PROJECT_ID=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_URL=
```

## Database

Schema, RLS, the bank-transfer payments columns, the admin email auto-promote trigger, and the `payment-proofs` storage bucket all live in `supabase/migrations/`. Apply with the Supabase CLI:

```bash
supabase db push
```

## Edge functions

Two functions live in `supabase/functions/`:

- `initiate-payment` — creates the `payments` row when a business hires a student and returns the active platform bank account + a deterministic transfer reference (`GB-<hireId>`). No external APIs.
- `reset-demo` — admin-only. Wipes prior demo accounts and re-creates 12 student accounts, 6 business accounts, 18 gigs across categories, ~30 applications, 6 hires across every workflow stage, plus matching payments + submissions + a dispute. Uses a single shared password for demo users and emits it in the response.

Deploy them once:

```bash
supabase functions deploy initiate-payment
supabase functions deploy reset-demo
```

## Bank-transfer escrow flow

1. Business hires a student → `hire` is created with `status='awaiting_payment'`.
2. Frontend calls `initiate-payment`, then routes to `/business/payments/:hireId/transfer` showing the platform bank account + the `GB-XXXXXXXX` reference.
3. Business uploads a transfer screenshot to the `payment-proofs` bucket. Payment record gets `business_proof_url`.
4. Admin opens **Verify transfers** in the admin dashboard, reviews the screenshot, and clicks **Confirm received**. A trigger flips the hire to `in_progress`.
5. Student submits work via the existing `submissions` flow.
6. Business approves → payment becomes `payout_pending`.
7. Admin opens **Pending payouts**, transfers the gig amount to the student via Bank/Easypaisa/JazzCash, uploads a payout screenshot, and confirms. Payment becomes `paid`; the student sees the proof in their payments page.
8. Disputes can be raised by the business; admin resolves them in the **Disputes** tab (release to student or refund).

## Admin access

- Visit `/admin/login` for the admin sign-in page (linked discreetly from the landing page footer).
- The address `saboor12124@gmail.com` is auto-promoted to admin on signup via a Postgres trigger; if the account already existed when migrations ran, the same migration retro-promotes it.
- To promote any other email, sign that account up first, then run:

```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/promote-admin.mjs you@example.com
```

The service role key lives under Supabase → Settings → API. Never commit it.

## Seeding demo content

After migrations + functions are deployed:

1. Sign in as admin at `/admin/login`.
2. Click **Reset demo data** (top-right of the admin dashboard).
3. The function creates 18 demo accounts with the password `DemoPass123!` and emails like `ayesha.khan@gigbridge.test`. You can sign in as any of them to see the student / business experiences with realistic data.

## Verification

```bash
npm run lint
npm run test
npm run build
```
