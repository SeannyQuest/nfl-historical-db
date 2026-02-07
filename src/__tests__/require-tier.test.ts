import { describe, it, expect } from "vitest";
import { requireTier } from "@/lib/require-tier";

describe("requireTier", () => {
  it("should allow access when user tier matches minimum tier", () => {
    expect(requireTier("FREE", "FREE")).toBe(true);
    expect(requireTier("PRO", "PRO")).toBe(true);
    expect(requireTier("ADMIN", "ADMIN")).toBe(true);
  });

  it("should deny FREE users PRO access", () => {
    expect(requireTier("FREE", "PRO")).toBe(false);
  });

  it("should deny FREE users ADMIN access", () => {
    expect(requireTier("FREE", "ADMIN")).toBe(false);
  });

  it("should deny PRO users ADMIN access", () => {
    expect(requireTier("PRO", "ADMIN")).toBe(false);
  });

  it("should allow PRO users FREE access", () => {
    expect(requireTier("PRO", "FREE")).toBe(true);
  });

  it("should allow ADMIN users FREE access", () => {
    expect(requireTier("ADMIN", "FREE")).toBe(true);
  });

  it("should allow ADMIN users PRO access", () => {
    expect(requireTier("ADMIN", "PRO")).toBe(true);
  });

  it("should handle invalid tier gracefully", () => {
    expect(requireTier("INVALID", "FREE")).toBe(false);
    expect(requireTier("FREE", "FREE")).toBe(true);
  });
});
