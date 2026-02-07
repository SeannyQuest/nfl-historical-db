import { describe, it, expect } from "vitest";
import {
  hashPassword,
  verifyPassword,
  generateToken,
  validateEmail,
  validatePassword,
  isAccountLocked,
} from "@/lib/auth-utils";

describe("auth-utils", () => {
  describe("hashPassword and verifyPassword", () => {
    it("should hash a password and verify it correctly", async () => {
      const password = "SecurePass123!";
      const hash = await hashPassword(password);

      expect(hash).toBeTruthy();
      expect(hash).not.toEqual(password);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it("should reject an incorrect password", async () => {
      const password = "SecurePass123!";
      const wrongPassword = "WrongPassword456!";
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(wrongPassword, hash);
      expect(isValid).toBe(false);
    });
  });

  describe("generateToken", () => {
    it("should generate a valid UUID token", () => {
      const token = generateToken();

      expect(token).toBeTruthy();
      expect(token.length).toBeGreaterThan(0);

      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(uuidRegex.test(token)).toBe(true);
    });

    it("should generate unique tokens", () => {
      const token1 = generateToken();
      const token2 = generateToken();

      expect(token1).not.toEqual(token2);
    });
  });

  describe("validateEmail", () => {
    it("should accept valid email addresses", () => {
      expect(validateEmail("user@example.com")).toBe(true);
      expect(validateEmail("test.user@domain.co.uk")).toBe(true);
      expect(validateEmail("name+tag@example.org")).toBe(true);
    });

    it("should reject invalid email addresses", () => {
      expect(validateEmail("not-an-email")).toBe(false);
      expect(validateEmail("@example.com")).toBe(false);
      expect(validateEmail("user@")).toBe(false);
      expect(validateEmail("")).toBe(false);
    });
  });

  describe("validatePassword", () => {
    it("should accept a valid password", () => {
      const result = validatePassword("SecurePass123!");

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should require at least 8 characters", () => {
      const result = validatePassword("Short1!");

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Password must be at least 8 characters long");
    });

    it("should require at least one uppercase letter", () => {
      const result = validatePassword("lowercase123!");

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Password must contain at least one uppercase letter");
    });

    it("should require at least one number", () => {
      const result = validatePassword("NoNumbers!");

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Password must contain at least one number");
    });

    it("should require at least one special character", () => {
      const result = validatePassword("NoSpecial123");

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Password must contain at least one special character");
    });

    it("should return multiple errors for weak passwords", () => {
      const result = validatePassword("weak");

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe("isAccountLocked", () => {
    it("should return false when lockedUntil is null", () => {
      expect(isAccountLocked(null)).toBe(false);
    });

    it("should return true when account is currently locked", () => {
      const futureDate = new Date(Date.now() + 60 * 60 * 1000);
      expect(isAccountLocked(futureDate)).toBe(true);
    });

    it("should return false when lockout has expired", () => {
      const pastDate = new Date(Date.now() - 60 * 60 * 1000);
      expect(isAccountLocked(pastDate)).toBe(false);
    });
  });
});
