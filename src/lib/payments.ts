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
