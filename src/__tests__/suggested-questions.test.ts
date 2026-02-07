import { describe, it, expect } from "vitest";
import { getSuggestedQuestions, type PageContext } from "@/lib/suggested-questions";

describe("getSuggestedQuestions", () => {
  it("returns default suggestions for unknown pages", () => {
    const context: PageContext = { page: "unknown" };
    const suggestions = getSuggestedQuestions(context);
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions).toContain("Which NFL team has the best home record?");
  });

  it("returns team-specific suggestions when team is provided", () => {
    const context: PageContext = { page: "teams", team: "Kansas City Chiefs" };
    const suggestions = getSuggestedQuestions(context);
    expect(suggestions.length).toBeGreaterThan(0);
    // Should contain team name substitution
    expect(suggestions[0]).toContain("Kansas City Chiefs");
  });

  it("returns CFB suggestions for cfb sport", () => {
    const context: PageContext = { page: "home", sport: "cfb" };
    const suggestions = getSuggestedQuestions(context);
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0]).toContain("conference");
  });

  it("returns CBB suggestions for cbb sport", () => {
    const context: PageContext = { page: "home", sport: "cbb" };
    const suggestions = getSuggestedQuestions(context);
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0]).toContain("March Madness");
  });

  it("returns playoff suggestions for playoff pages", () => {
    const context: PageContext = { page: "playoffs" };
    const suggestions = getSuggestedQuestions(context);
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0]).toContain("wild card");
  });

  it("returns schedule suggestions for schedule pages", () => {
    const context: PageContext = { page: "schedule" };
    const suggestions = getSuggestedQuestions(context);
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0]).toContain("week");
  });

  it("substitutes team name in suggestions", () => {
    const context: PageContext = { page: "teams", team: "Dallas" };
    const suggestions = getSuggestedQuestions(context);
    expect(suggestions.every(q => q.includes("Dallas") || q.includes("this team") === false)).toBe(true);
  });
});
