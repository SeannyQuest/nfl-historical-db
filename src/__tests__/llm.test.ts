import { describe, it, expect } from "vitest";
import {
  parseSimpleQuery,
  checkUsageLimit,
  detectSport,
} from "@/lib/llm";

describe("parseSimpleQuery", () => {
  it("returns correct QueryPlan for team record queries", () => {
    const result = parseSimpleQuery("What is the Chiefs record");
    expect(result).not.toBeNull();
    expect(result?.queryType).toBe("team_stats");
    expect(result?.parameters.team).toBe("chiefs");
    expect(result?.parameters.stat).toBe("record");
  });

  it("returns correct QueryPlan for comparison queries", () => {
    const result = parseSimpleQuery("Chiefs vs Eagles");
    expect(result).not.toBeNull();
    expect(result?.queryType).toBe("comparison");
    expect(result?.parameters.team1).toBe("chiefs");
    expect(result?.parameters.team2).toBe("eagles");
  });

  it("returns correct QueryPlan for ranking queries", () => {
    const result = parseSimpleQuery("Top 10 NFL teams by wins");
    expect(result).not.toBeNull();
    expect(result?.queryType).toBe("ranking");
    expect(result?.parameters.count).toBe(10);
  });

  it("returns null for unrecognized queries", () => {
    const result = parseSimpleQuery("Tell me a joke about football");
    expect(result).toBeNull();
  });

  it("detects CFB queries correctly", () => {
    const result = parseSimpleQuery("Top 10 college football teams");
    expect(result?.sport).toBe("cfb");
  });

  it("detects CBB queries correctly", () => {
    const result = parseSimpleQuery("Top 10 March Madness teams");
    expect(result?.sport).toBe("cbb");
  });

  it("defaults to NFL for unspecified sport", () => {
    const result = parseSimpleQuery("Top 5 teams");
    expect(result?.sport).toBe("nfl");
  });
});

describe("detectSport", () => {
  it("identifies CFB queries", () => {
    expect(detectSport("college football rules")).toBe("cfb");
    expect(detectSport("CFB standings")).toBe("cfb");
    expect(detectSport("NCAAF scores")).toBe("cfb");
  });

  it("identifies CBB queries", () => {
    expect(detectSport("college basketball games")).toBe("cbb");
    expect(detectSport("March Madness bracket")).toBe("cbb");
    expect(detectSport("NCAAB tournament")).toBe("cbb");
  });

  it("defaults to NFL", () => {
    expect(detectSport("random sports question")).toBe("nfl");
  });
});

describe("checkUsageLimit", () => {
  it("enforces FREE tier limit (5)", () => {
    const result = checkUsageLimit(5, "FREE");
    expect(result.dailyLimit).toBe(5);
    expect(result.canQuery).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("allows PRO tier higher limit (100)", () => {
    const result = checkUsageLimit(50, "PRO");
    expect(result.dailyLimit).toBe(100);
    expect(result.canQuery).toBe(true);
    expect(result.remaining).toBe(50);
  });

  it("allows ADMIN tier highest limit (1000)", () => {
    const result = checkUsageLimit(500, "ADMIN");
    expect(result.dailyLimit).toBe(1000);
    expect(result.canQuery).toBe(true);
    expect(result.remaining).toBe(500);
  });

  it("returns canQuery=false when over limit", () => {
    const result = checkUsageLimit(101, "PRO");
    expect(result.canQuery).toBe(false);
    expect(result.remaining).toBe(0);
  });
});
