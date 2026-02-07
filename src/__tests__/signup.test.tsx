import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import SignupPage from "@/app/signup/page";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(() => null),
  }),
}));

describe("SignupPage", () => {
  it("renders signup form with all fields", () => {
    render(<SignupPage />);

    expect(screen.getByText(/create an account/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it("renders submit button", () => {
    render(<SignupPage />);

    const submitButton = screen.getByRole("button", { name: /create account/i });
    expect(submitButton).toBeInTheDocument();
  });

  it("has a link to login page for existing users", () => {
    render(<SignupPage />);

    const loginLink = screen.getByRole("link", { name: /sign in/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute("href", "/login");
  });

  it("has all required input fields", () => {
    render(<SignupPage />);

    const usernameInput = screen.getByLabelText(/username/i) as HTMLInputElement;
    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/^password$/i) as HTMLInputElement;
    const confirmInput = screen.getByLabelText(/confirm password/i) as HTMLInputElement;

    expect(usernameInput.required).toBe(true);
    expect(emailInput.required).toBe(true);
    expect(passwordInput.required).toBe(true);
    expect(confirmInput.required).toBe(true);
  });

  it("has correct input types", () => {
    render(<SignupPage />);

    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/^password$/i) as HTMLInputElement;
    const confirmInput = screen.getByLabelText(/confirm password/i) as HTMLInputElement;

    expect(emailInput.type).toBe("email");
    expect(passwordInput.type).toBe("password");
    expect(confirmInput.type).toBe("password");
  });

  it("displays GridIron Intel branding", () => {
    render(<SignupPage />);

    expect(screen.getByText("GridIron Intel")).toBeInTheDocument();
  });
});
