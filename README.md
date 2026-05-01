# Gig Bridge

Gig Bridge is a student gig marketplace for Pakistani students and businesses. The app uses React, Vite, Supabase, and a Shopify checkout handoff for MVP payment collection.

## Local Development

```bash
npm install
npm run dev
```

Required frontend environment variables:

```bash
VITE_SUPABASE_PROJECT_ID=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_URL=
```

## Payments

Shopify is used only as the checkout/payment layer. Marketplace records, applications, work approvals, payout status, bank details, disputes, and manual student payouts stay in Supabase.

Supabase function environment variables for checkout creation:

```bash
SHOPIFY_DOMAIN=
SHOPIFY_STOREFRONT_TOKEN=
SHOPIFY_ADMIN_TOKEN=
SHOPIFY_API_VERSION=2025-07
```

If Shopify credentials are not configured, the app still creates a payment record so an admin can manually mark payment as received.

## Verification

```bash
npm run lint
npm run test
npm run build
```
