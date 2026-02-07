import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AdminPage from "@/app/admin/page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

afterEach(cleanup);

function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>
  );
}

describe("AdminPage", () => {
  it("renders page title", () => {
    renderWithQuery(<AdminPage />);
    expect(screen.getByText("Admin Panel")).toBeInTheDocument();
  });

  it("renders page description", () => {
    renderWithQuery(<AdminPage />);
    expect(
      screen.getByText(/Manage Sportsradar API sync/)
    ).toBeInTheDocument();
  });
});
