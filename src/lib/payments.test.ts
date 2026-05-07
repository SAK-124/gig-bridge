import { describe, expect, it } from "vitest";
import { isConfirmedTransfer } from "./payments";

describe("isConfirmedTransfer", () => {
  it("ignores payment records that only represent an unpaid hire", () => {
    expect(isConfirmedTransfer({ status: "awaiting" })).toBe(false);
    expect(isConfirmedTransfer({ status: "received" })).toBe(false);
    expect(isConfirmedTransfer({ status: "payout_pending" })).toBe(false);
  });

  it("counts payments after an admin verification or payout timestamp exists", () => {
    expect(isConfirmedTransfer({ status: "received", admin_verified_at: "2026-05-08T01:00:00Z" })).toBe(true);
    expect(isConfirmedTransfer({ status: "payout_pending", admin_verified_at: "2026-05-08T01:00:00Z" })).toBe(true);
    expect(isConfirmedTransfer({ status: "paid", paid_to_student_at: "2026-05-08T01:00:00Z" })).toBe(true);
  });
});
