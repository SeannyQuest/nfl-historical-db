import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import WeatherImpactDashboard from "@/components/weather-impact-dashboard";
import type { WeatherImpactResult } from "@/lib/weather-impact";

vi.mock("@/lib/weather-impact");

describe("WeatherImpactDashboard", () => {
  const mockData: WeatherImpactResult = {
    totalGames: 256,
    conditionStats: [
      {
        condition: "Clear",
        games: 150,
        avgTotal: "44.5",
        avgHomeScore: "23.2",
        avgAwayScore: "21.3",
        homeWinPct: "0.545",
        overPct: "0.520",
        homeCoverPct: "0.515",
      },
      {
        condition: "Rain",
        games: 50,
        avgTotal: "40.2",
        avgHomeScore: "20.1",
        avgAwayScore: "20.1",
        homeWinPct: "0.520",
        overPct: "0.480",
        homeCoverPct: "0.490",
      },
      {
        condition: "Snow",
        games: 30,
        avgTotal: "38.5",
        avgHomeScore: "19.8",
        avgAwayScore: "18.7",
        homeWinPct: "0.580",
        overPct: "0.420",
        homeCoverPct: "0.560",
      },
      {
        condition: "Dome",
        games: 26,
        avgTotal: "46.8",
        avgHomeScore: "24.5",
        avgAwayScore: "22.3",
        homeWinPct: "0.615",
        overPct: "0.580",
        homeCoverPct: "0.620",
      },
    ],
    coldWeatherAnalysis: {
      games: 60,
      avgTotal: "39.2",
      homeWinPct: "0.550",
      overPct: "0.450",
      homeCoverPct: "0.540",
    },
    windImpact: {
      lowWind: {
        games: 180,
        avgTotal: "44.8",
        homeWinPct: "0.540",
      },
      moderateWind: {
        games: 50,
        avgTotal: "42.1",
        homeWinPct: "0.520",
      },
      highWind: {
        games: 26,
        avgTotal: "38.5",
        homeWinPct: "0.500",
      },
    },
    domeAdvantage: "61.5%",
    outdoorAdvantage: "54.2%",
  };

  it("renders loading state", () => {
    render(
      <WeatherImpactDashboard data={null} isLoading={true} isError={false} />
    );
    expect(screen.queryAllByText(/Loading weather impact data/i).length > 0).toBeTruthy();
  });

  it("renders error state", () => {
    render(
      <WeatherImpactDashboard data={null} isLoading={false} isError={true} />
    );
    expect(screen.queryAllByText(/Failed to load weather impact data/i).length > 0).toBeTruthy();
  });

  it("returns null when no data", () => {
    const { container } = render(
      <WeatherImpactDashboard data={null} isLoading={false} isError={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders total games stat", () => {
    render(
      <WeatherImpactDashboard data={mockData} isLoading={false} isError={false} />
    );
    expect(screen.queryAllByText("Total Games").length > 0).toBeTruthy();
    expect(screen.queryAllByText("256").length > 0).toBeTruthy();
  });

  it("renders dome advantage stat", () => {
    render(
      <WeatherImpactDashboard data={mockData} isLoading={false} isError={false} />
    );
    expect(screen.queryAllByText("Dome Advantage").length > 0).toBeTruthy();
    expect(screen.queryAllByText("61.5%").length > 0).toBeTruthy();
  });

  it("renders outdoor advantage stat", () => {
    render(
      <WeatherImpactDashboard data={mockData} isLoading={false} isError={false} />
    );
    expect(screen.queryAllByText("Outdoor Advantage").length > 0).toBeTruthy();
    expect(screen.queryAllByText("54.2%").length > 0).toBeTruthy();
  });

  it("renders cold weather games stat", () => {
    render(
      <WeatherImpactDashboard data={mockData} isLoading={false} isError={false} />
    );
    expect(screen.queryAllByText("Cold Weather Games").length > 0).toBeTruthy();
    expect(screen.queryAllByText("60").length > 0).toBeTruthy();
  });

  it("renders weather condition table", () => {
    render(
      <WeatherImpactDashboard data={mockData} isLoading={false} isError={false} />
    );
    expect(screen.queryAllByText("Weather Condition Breakdown").length > 0).toBeTruthy();
    expect(screen.queryAllByText("Clear").length > 0).toBeTruthy();
    expect(screen.queryAllByText("Rain").length > 0).toBeTruthy();
    expect(screen.queryAllByText("Snow").length > 0).toBeTruthy();
  });

  it("renders cold weather section", () => {
    render(
      <WeatherImpactDashboard data={mockData} isLoading={false} isError={false} />
    );
    expect(screen.getByText("Cold Weather Analysis (< 32°F)")).toBeInTheDocument();
  });

  it("renders wind impact section", () => {
    render(
      <WeatherImpactDashboard data={mockData} isLoading={false} isError={false} />
    );
    expect(screen.queryAllByText("Wind Impact Analysis").length > 0).toBeTruthy();
  });

  it("renders wind speed breakdown table", () => {
    render(
      <WeatherImpactDashboard data={mockData} isLoading={false} isError={false} />
    );
    expect(screen.queryAllByText("Wind Speed Breakdown").length > 0).toBeTruthy();
    expect(screen.queryAllByText(/Low Wind/).length > 0).toBeTruthy();
    expect(screen.queryAllByText(/Moderate Wind/).length > 0).toBeTruthy();
    expect(screen.queryAllByText(/High Wind/).length > 0).toBeTruthy();
  });

  it("renders condition stats correctly", () => {
    render(
      <WeatherImpactDashboard data={mockData} isLoading={false} isError={false} />
    );
    const rows = screen.getAllByRole("row");
    expect(rows.length).toBeGreaterThan(0);
  });

  it("displays cold weather home win percentage", () => {
    render(
      <WeatherImpactDashboard data={mockData} isLoading={false} isError={false} />
    );
    expect(screen.queryAllByText("0.550").length > 0).toBeTruthy();
  });

  it("displays wind categories with game counts", () => {
    render(
      <WeatherImpactDashboard data={mockData} isLoading={false} isError={false} />
    );
    expect(screen.queryAllByText("180").length > 0).toBeTruthy(); // lowWind games
    expect(screen.queryAllByText("50").length > 0).toBeTruthy();   // moderateWind games
  });
});
