import { describe, expect, it } from "vitest";
import { resolvePrimaryRole } from "./auth";

describe("resolvePrimaryRole", () => {
  it("prioritizes admin when an account has multiple roles", () => {
    expect(resolvePrimaryRole([{ role: "student" }, { role: "admin" }])).toBe("admin");
  });

  it("falls back to business before student", () => {
    expect(resolvePrimaryRole([{ role: "student" }, { role: "business" }])).toBe("business");
  });

  it("returns null when no app role is present", () => {
    expect(resolvePrimaryRole([{ role: "viewer" }, null])).toBeNull();
  });
});
