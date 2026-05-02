import { supabase } from "@/integrations/supabase/client";

export const PLATFORM_FEE_RATE = 0.1;

export function computeFees(gigAmount: number) {
  const platformFee = Math.round(gigAmount * PLATFORM_FEE_RATE);
  const total = gigAmount + platformFee;
  return { gigAmount, platformFee, total };
}

export function formatPKR(amount: number | string) {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(n);
}

export type PlatformBankAccount = {
  id: string;
  label: string;
  bank_name: string | null;
  account_title: string | null;
  iban: string | null;
  account_number: string | null;
  easypaisa_number: string | null;
  jazzcash_number: string | null;
  instructions: string | null;
};

export async function fetchActivePlatformBankAccount(): Promise<PlatformBankAccount | null> {
  const { data } = await supabase
    .from("platform_bank_accounts" as any)
    .select("id, label, bank_name, account_title, iban, account_number, easypaisa_number, jazzcash_number, instructions")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();
  return (data as PlatformBankAccount | null) ?? null;
}

export function transferReferenceForHire(hireId: string): string {
  return `GB-${hireId.slice(0, 8).toUpperCase()}`;
}

export type PaymentDisplayStatus =
  | "awaiting_proof"
  | "awaiting_verification"
  | "received"
  | "payout_pending"
  | "paid"
  | "disputed"
  | "refunded";

// Maps the backend payment_status + business_proof_url presence to a UI-friendly status.
export function paymentDisplayStatus(status: string | null | undefined, hasBusinessProof: boolean): PaymentDisplayStatus {
  if (status === "received") return "received";
  if (status === "payout_pending") return "payout_pending";
  if (status === "paid") return "paid";
  if (status === "disputed") return "disputed";
  if (status === "refunded") return "refunded";
  return hasBusinessProof ? "awaiting_verification" : "awaiting_proof";
}
