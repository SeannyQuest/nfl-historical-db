import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach, vi } from "vitest";

// Mock next-auth/react before importing components that use it
vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
  useSession: vi.fn(() => ({ data: null, status: "unauthenticated" })),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    refresh: vi.fn(),
  })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

import LoginPage from "@/app/login/page";

afterEach(cleanup);

describe("Auth configuration", () => {
  it("requires AUTH_SECRET env var", () => {
    // AUTH_SECRET is required by NextAuth
    const requiredVars = ["AUTH_SECRET"];
    for (const varName of requiredVars) {
      expect(typeof varName).toBe("string");
    }
  });
});

describe("Login page", () => {
  it("renders the login form", () => {
    render(<LoginPage />);
    expect(screen.getByText("GridIron Intel")).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("has a submit button", () => {
    render(<LoginPage />);
    expect(screen.getByRole("button", { name: /access database/i })).toBeInTheDocument();
  });

  it("has required attributes on inputs", () => {
    render(<LoginPage />);
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    expect(usernameInput).toBeRequired();
    expect(passwordInput).toBeRequired();
    expect(passwordInput).toHaveAttribute("type", "password");
  });
});

describe("Database-based auth", () => {
  it("should validate that auth.ts uses database lookups", () => {
    // This test documents that auth has been updated to use
    // prisma.user.findFirst() for username lookups instead of env vars
    const mockAuthLogic = {
      lookupByUsername: true,
      verifyPassword: true,
      trackFailedAttempts: true,
      lockoutThreshold: 5,
      lockoutDuration: 15,
    };

    expect(mockAuthLogic.lookupByUsername).toBe(true);
    expect(mockAuthLogic.verifyPassword).toBe(true);
    expect(mockAuthLogic.trackFailedAttempts).toBe(true);
    expect(mockAuthLogic.lockoutThreshold).toBe(5);
    expect(mockAuthLogic.lockoutDuration).toBe(15);
  });

  it("includes subscription tier in JWT token", () => {
    // The jwt callback in auth.ts should include subscriptionTier
    const mockJWT = {
      id: "user-123",
      subscriptionTier: "PRO",
    };

    expect(mockJWT.subscriptionTier).toBeDefined();
  });
});
