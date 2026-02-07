import { describe, it, expect, beforeEach, vi } from "vitest";
import { sendVerificationEmail, sendPasswordResetEmail } from "@/lib/email-service";

describe("email-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("sendVerificationEmail", () => {
    it("should resolve without error", async () => {
      await expect(
        sendVerificationEmail("test@example.com", "token-123")
      ).resolves.toBeUndefined();
    });

    it("should accept valid email and token", async () => {
      const email = "user@example.com";
      const token = "verification-token-uuid";

      await expect(
        sendVerificationEmail(email, token)
      ).resolves.toBeUndefined();
    });
  });

  describe("sendPasswordResetEmail", () => {
    it("should resolve without error", async () => {
      await expect(
        sendPasswordResetEmail("test@example.com", "token-456")
      ).resolves.toBeUndefined();
    });

    it("should accept valid email and token", async () => {
      const email = "user@example.com";
      const token = "reset-token-uuid";

      await expect(
        sendPasswordResetEmail(email, token)
      ).resolves.toBeUndefined();
    });
  });

  describe("email service in development", () => {
    it("should handle verification emails in development mode", async () => {
      const consoleSpy = vi.spyOn(console, "log");

      await sendVerificationEmail("dev@example.com", "dev-token");

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should handle reset emails in development mode", async () => {
      const consoleSpy = vi.spyOn(console, "log");

      await sendPasswordResetEmail("dev@example.com", "dev-token");

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
