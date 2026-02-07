import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import WeatherPage from "@/app/weather/page";

vi.mock("@/hooks/use-games", () => ({
  useWeatherImpact: () => ({
    data: {
      data: {
        totalGames: 256,
        conditionStats: [],
        coldWeatherAnalysis: {
          games: 60,
          avgTotal: "39.2",
          homeWinPct: "0.550",
          overPct: "0.450",
          homeCoverPct: "0.540",
        },
        windImpact: {
          lowWind: { games: 180, avgTotal: "44.8", homeWinPct: "0.540" },
          moderateWind: { games: 50, avgTotal: "42.1", homeWinPct: "0.520" },
          highWind: { games: 26, avgTotal: "38.5", homeWinPct: "0.500" },
        },
        domeAdvantage: "61.5%",
        outdoorAdvantage: "54.2%",
      },
    },
    isLoading: false,
    isError: false,
  }),
}));

vi.mock("@/components/weather-impact-dashboard", () => ({
  default: () => <div>Weather Impact Dashboard</div>,
}));

describe("WeatherPage", () => {
  it("renders page title", () => {
    render(<WeatherPage />);
    expect(screen.getByText("Weather Impact Analysis")).toBeInTheDocument();
  });

  it("renders page description", () => {
    render(<WeatherPage />);
    expect(screen.getAllByText(/Comprehensive analysis of how weather conditions/i).length).toBeGreaterThan(0);
  });

  it("renders weather dashboard component", () => {
    render(<WeatherPage />);
    expect(screen.getAllByText("Weather Impact Dashboard").length).toBeGreaterThan(0);
  });
});
