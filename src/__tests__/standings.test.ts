import { describe, it, expect } from "vitest";
import { computeStandings, type StandingsGame, type TeamInfo } from "@/lib/standings";

const afcEastTeams: TeamInfo[] = [
  { name: "Buffalo Bills", abbreviation: "BUF", city: "Buffalo", nickname: "Bills", conference: "AFC", division: "EAST" },
  { name: "Miami Dolphins", abbreviation: "MIA", city: "Miami", nickname: "Dolphins", conference: "AFC", division: "EAST" },
  { name: "New England Patriots", abbreviation: "NE", city: "New England", nickname: "Patriots", conference: "AFC", division: "EAST" },
  { name: "New York Jets", abbreviation: "NYJ", city: "New York", nickname: "Jets", conference: "AFC", division: "EAST" },
];

const nfcEastTeams: TeamInfo[] = [
  { name: "Dallas Cowboys", abbreviation: "DAL", city: "Dallas", nickname: "Cowboys", conference: "NFC", division: "EAST" },
  { name: "Philadelphia Eagles", abbreviation: "PHI", city: "Philadelphia", nickname: "Eagles", conference: "NFC", division: "EAST" },
  { name: "New York Giants", abbreviation: "NYG", city: "New York", nickname: "Giants", conference: "NFC", division: "EAST" },
  { name: "Washington Commanders", abbreviation: "WAS", city: "Washington", nickname: "Commanders", conference: "NFC", division: "EAST" },
];

const allTeams = [...afcEastTeams, ...nfcEastTeams];

function makeGame(overrides: Partial<StandingsGame> & { homeTeamName: string; awayTeamName: string }): StandingsGame {
  return {
    homeScore: 27,
    awayScore: 20,
    winnerName: overrides.homeTeamName,
    isPlayoff: false,
    ...overrides,
  };
}

// ─── Empty ──────────────────────────────────────────────

describe("computeStandings — empty", () => {
  it("returns all teams with zero records when no games", () => {
    const r = computeStandings([], allTeams);
    expect(r.divisions.length).toBeGreaterThan(0);
    for (const div of r.divisions) {
      for (const team of div.teams) {
        expect(team.wins).toBe(0);
        expect(team.losses).toBe(0);
        expect(team.ties).toBe(0);
        expect(team.pct).toBe(".000");
      }
    }
  });

  it("returns null season by default", () => {
    const r = computeStandings([], allTeams);
    expect(r.season).toBeNull();
  });

  it("returns provided season", () => {
    const r = computeStandings([], allTeams, 2024);
    expect(r.season).toBe(2024);
  });
});

// ─── Basic Records ──────────────────────────────────────

describe("computeStandings — basic records", () => {
  it("counts home wins", () => {
    const games = [
      makeGame({ homeTeamName: "Buffalo Bills", awayTeamName: "Miami Dolphins", homeScore: 30, awayScore: 20, winnerName: "Buffalo Bills" }),
    ];
    const r = computeStandings(games, allTeams);
    const buf = r.divisions.flatMap((d) => d.teams).find((t) => t.team.name === "Buffalo Bills")!;
    expect(buf.wins).toBe(1);
    expect(buf.losses).toBe(0);
    expect(buf.pointsFor).toBe(30);
    expect(buf.pointsAgainst).toBe(20);
  });

  it("counts away wins", () => {
    const games = [
      makeGame({ homeTeamName: "Buffalo Bills", awayTeamName: "Miami Dolphins", homeScore: 10, awayScore: 24, winnerName: "Miami Dolphins" }),
    ];
    const r = computeStandings(games, allTeams);
    const mia = r.divisions.flatMap((d) => d.teams).find((t) => t.team.name === "Miami Dolphins")!;
    expect(mia.wins).toBe(1);
    expect(mia.losses).toBe(0);
    expect(mia.awayRecord).toBe("1-0");
  });

  it("counts ties", () => {
    const games = [
      makeGame({ homeTeamName: "Buffalo Bills", awayTeamName: "Miami Dolphins", homeScore: 20, awayScore: 20, winnerName: null }),
    ];
    const r = computeStandings(games, allTeams);
    const buf = r.divisions.flatMap((d) => d.teams).find((t) => t.team.name === "Buffalo Bills")!;
    const mia = r.divisions.flatMap((d) => d.teams).find((t) => t.team.name === "Miami Dolphins")!;
    expect(buf.ties).toBe(1);
    expect(mia.ties).toBe(1);
    expect(buf.pct).toBe("0.000");
  });

  it("computes win percentage", () => {
    const games = [
      makeGame({ homeTeamName: "Buffalo Bills", awayTeamName: "Miami Dolphins", winnerName: "Buffalo Bills" }),
      makeGame({ homeTeamName: "New England Patriots", awayTeamName: "Buffalo Bills", winnerName: "New England Patriots" }),
      makeGame({ homeTeamName: "Buffalo Bills", awayTeamName: "New York Jets", winnerName: "Buffalo Bills" }),
    ];
    const r = computeStandings(games, allTeams);
    const buf = r.divisions.flatMap((d) => d.teams).find((t) => t.team.name === "Buffalo Bills")!;
    expect(buf.wins).toBe(2);
    expect(buf.losses).toBe(1);
    expect(buf.pct).toBe("0.667");
  });

  it("computes point differential", () => {
    const games = [
      makeGame({ homeTeamName: "Buffalo Bills", awayTeamName: "Miami Dolphins", homeScore: 30, awayScore: 17, winnerName: "Buffalo Bills" }),
      makeGame({ homeTeamName: "New England Patriots", awayTeamName: "Buffalo Bills", homeScore: 28, awayScore: 21, winnerName: "New England Patriots" }),
    ];
    const r = computeStandings(games, allTeams);
    const buf = r.divisions.flatMap((d) => d.teams).find((t) => t.team.name === "Buffalo Bills")!;
    // PF: 30 + 21 = 51, PA: 17 + 28 = 45, diff = +6
    expect(buf.pointsFor).toBe(51);
    expect(buf.pointsAgainst).toBe(45);
    expect(buf.pointDiff).toBe(6);
  });
});

// ─── Home/Away Records ──────────────────────────────────

describe("computeStandings — home/away records", () => {
  it("tracks home record", () => {
    const games = [
      makeGame({ homeTeamName: "Buffalo Bills", awayTeamName: "Miami Dolphins", winnerName: "Buffalo Bills" }),
      makeGame({ homeTeamName: "Buffalo Bills", awayTeamName: "New England Patriots", winnerName: "New England Patriots" }),
    ];
    const r = computeStandings(games, allTeams);
    const buf = r.divisions.flatMap((d) => d.teams).find((t) => t.team.name === "Buffalo Bills")!;
    expect(buf.homeRecord).toBe("1-1");
  });

  it("tracks away record", () => {
    const games = [
      makeGame({ homeTeamName: "Miami Dolphins", awayTeamName: "Buffalo Bills", winnerName: "Buffalo Bills" }),
      makeGame({ homeTeamName: "New England Patriots", awayTeamName: "Buffalo Bills", winnerName: "New England Patriots" }),
    ];
    const r = computeStandings(games, allTeams);
    const buf = r.divisions.flatMap((d) => d.teams).find((t) => t.team.name === "Buffalo Bills")!;
    expect(buf.awayRecord).toBe("1-1");
  });

  it("includes ties in split records", () => {
    const games = [
      makeGame({ homeTeamName: "Buffalo Bills", awayTeamName: "Miami Dolphins", homeScore: 20, awayScore: 20, winnerName: null }),
    ];
    const r = computeStandings(games, allTeams);
    const buf = r.divisions.flatMap((d) => d.teams).find((t) => t.team.name === "Buffalo Bills")!;
    expect(buf.homeRecord).toBe("0-0-1");
  });
});

// ─── Division & Conference Records ──────────────────────

describe("computeStandings — division/conference records", () => {
  it("tracks division record for same-division games", () => {
    const games = [
      makeGame({ homeTeamName: "Buffalo Bills", awayTeamName: "Miami Dolphins", winnerName: "Buffalo Bills" }),
      makeGame({ homeTeamName: "Buffalo Bills", awayTeamName: "New England Patriots", winnerName: "New England Patriots" }),
    ];
    const r = computeStandings(games, allTeams);
    const buf = r.divisions.flatMap((d) => d.teams).find((t) => t.team.name === "Buffalo Bills")!;
    expect(buf.divRecord).toBe("1-1");
  });

  it("tracks conference record for same-conference games", () => {
    const games = [
      makeGame({ homeTeamName: "Buffalo Bills", awayTeamName: "Miami Dolphins", winnerName: "Buffalo Bills" }),
    ];
    const r = computeStandings(games, allTeams);
    const buf = r.divisions.flatMap((d) => d.teams).find((t) => t.team.name === "Buffalo Bills")!;
    // Same conference (AFC) game counts as both div and conf record
    expect(buf.confRecord).toBe("1-0");
  });

  it("does not count cross-conference games in conf record", () => {
    const games = [
      makeGame({ homeTeamName: "Buffalo Bills", awayTeamName: "Dallas Cowboys", winnerName: "Buffalo Bills" }),
    ];
    const r = computeStandings(games, allTeams);
    const buf = r.divisions.flatMap((d) => d.teams).find((t) => t.team.name === "Buffalo Bills")!;
    expect(buf.confRecord).toBe("0-0");
    expect(buf.divRecord).toBe("0-0");
    expect(buf.wins).toBe(1); // Overall record still counts
  });

  it("does not count cross-division same-conference games in div record", () => {
    // If we had AFC North teams, this would be cross-division
    // With our test data, all AFC teams are in EAST, so all AFC games are div games
    // Test with cross-conference instead
    const games = [
      makeGame({ homeTeamName: "Buffalo Bills", awayTeamName: "Dallas Cowboys", winnerName: "Buffalo Bills" }),
    ];
    const r = computeStandings(games, allTeams);
    const buf = r.divisions.flatMap((d) => d.teams).find((t) => t.team.name === "Buffalo Bills")!;
    expect(buf.divRecord).toBe("0-0");
  });
});

// ─── Playoff Exclusion ──────────────────────────────────

describe("computeStandings — playoff exclusion", () => {
  it("excludes playoff games from standings", () => {
    const games = [
      makeGame({ homeTeamName: "Buffalo Bills", awayTeamName: "Miami Dolphins", winnerName: "Buffalo Bills", isPlayoff: false }),
      makeGame({ homeTeamName: "Buffalo Bills", awayTeamName: "Miami Dolphins", winnerName: "Buffalo Bills", isPlayoff: true }),
    ];
    const r = computeStandings(games, allTeams);
    const buf = r.divisions.flatMap((d) => d.teams).find((t) => t.team.name === "Buffalo Bills")!;
    expect(buf.wins).toBe(1); // Only regular season game counts
  });
});

// ─── Sorting ────────────────────────────────────────────

describe("computeStandings — sorting", () => {
  it("sorts teams by win pct descending", () => {
    const games = [
      makeGame({ homeTeamName: "Miami Dolphins", awayTeamName: "New York Jets", winnerName: "Miami Dolphins" }),
      makeGame({ homeTeamName: "Buffalo Bills", awayTeamName: "New England Patriots", winnerName: "Buffalo Bills" }),
      makeGame({ homeTeamName: "Buffalo Bills", awayTeamName: "New York Jets", winnerName: "Buffalo Bills" }),
      makeGame({ homeTeamName: "Miami Dolphins", awayTeamName: "New England Patriots", winnerName: "New England Patriots" }),
    ];
    const r = computeStandings(games, allTeams);
    const afcEast = r.divisions.find((d) => d.conference === "AFC" && d.division === "EAST")!;
    // BUF: 2-0, MIA: 1-1, NE: 1-1 (but lower point diff), NYJ: 0-2
    expect(afcEast.teams[0].team.abbreviation).toBe("BUF");
    expect(afcEast.teams[afcEast.teams.length - 1].team.abbreviation).toBe("NYJ");
  });

  it("uses point diff as tiebreaker", () => {
    const games = [
      makeGame({ homeTeamName: "Buffalo Bills", awayTeamName: "Dallas Cowboys", homeScore: 30, awayScore: 10, winnerName: "Buffalo Bills" }),
      makeGame({ homeTeamName: "Miami Dolphins", awayTeamName: "Dallas Cowboys", homeScore: 21, awayScore: 20, winnerName: "Miami Dolphins" }),
    ];
    const r = computeStandings(games, allTeams);
    const afcEast = r.divisions.find((d) => d.conference === "AFC" && d.division === "EAST")!;
    // Both BUF and MIA are 1-0, BUF has +20 diff, MIA has +1 diff
    expect(afcEast.teams[0].team.abbreviation).toBe("BUF");
    expect(afcEast.teams[1].team.abbreviation).toBe("MIA");
  });
});

// ─── Division Ordering ──────────────────────────────────

describe("computeStandings — division ordering", () => {
  it("orders divisions: AFC EAST, NFC EAST", () => {
    const r = computeStandings([], allTeams);
    expect(r.divisions[0].conference).toBe("AFC");
    expect(r.divisions[0].division).toBe("EAST");
    expect(r.divisions[1].conference).toBe("NFC");
    expect(r.divisions[1].division).toBe("EAST");
  });
});

// ─── Streak ─────────────────────────────────────────────

describe("computeStandings — streak", () => {
  it("computes winning streak", () => {
    const games = [
      makeGame({ homeTeamName: "Buffalo Bills", awayTeamName: "Miami Dolphins", winnerName: "Miami Dolphins" }),
      makeGame({ homeTeamName: "Buffalo Bills", awayTeamName: "New England Patriots", winnerName: "Buffalo Bills" }),
      makeGame({ homeTeamName: "New York Jets", awayTeamName: "Buffalo Bills", winnerName: "Buffalo Bills" }),
    ];
    const r = computeStandings(games, allTeams);
    const buf = r.divisions.flatMap((d) => d.teams).find((t) => t.team.name === "Buffalo Bills")!;
    expect(buf.streak).toBe("W2");
  });

  it("computes losing streak", () => {
    const games = [
      makeGame({ homeTeamName: "Buffalo Bills", awayTeamName: "Miami Dolphins", winnerName: "Buffalo Bills" }),
      makeGame({ homeTeamName: "New England Patriots", awayTeamName: "Buffalo Bills", winnerName: "New England Patriots" }),
      makeGame({ homeTeamName: "New York Jets", awayTeamName: "Buffalo Bills", winnerName: "New York Jets" }),
    ];
    const r = computeStandings(games, allTeams);
    const buf = r.divisions.flatMap((d) => d.teams).find((t) => t.team.name === "Buffalo Bills")!;
    expect(buf.streak).toBe("L2");
  });

  it("returns -- for no games", () => {
    const r = computeStandings([], allTeams);
    const buf = r.divisions.flatMap((d) => d.teams).find((t) => t.team.name === "Buffalo Bills")!;
    expect(buf.streak).toBe("--");
  });
});

// ─── Integration ────────────────────────────────────────

describe("computeStandings — integration", () => {
  it("computes full standings for a mini season", () => {
    const games: StandingsGame[] = [
      // AFC EAST games
      makeGame({ homeTeamName: "Buffalo Bills", awayTeamName: "Miami Dolphins", homeScore: 31, awayScore: 17, winnerName: "Buffalo Bills" }),
      makeGame({ homeTeamName: "New England Patriots", awayTeamName: "New York Jets", homeScore: 24, awayScore: 10, winnerName: "New England Patriots" }),
      makeGame({ homeTeamName: "Miami Dolphins", awayTeamName: "New England Patriots", homeScore: 28, awayScore: 24, winnerName: "Miami Dolphins" }),
      makeGame({ homeTeamName: "New York Jets", awayTeamName: "Buffalo Bills", homeScore: 14, awayScore: 27, winnerName: "Buffalo Bills" }),
      // Cross-conference
      makeGame({ homeTeamName: "Buffalo Bills", awayTeamName: "Dallas Cowboys", homeScore: 35, awayScore: 10, winnerName: "Buffalo Bills" }),
      // NFC game
      makeGame({ homeTeamName: "Dallas Cowboys", awayTeamName: "Philadelphia Eagles", homeScore: 21, awayScore: 24, winnerName: "Philadelphia Eagles" }),
      // Playoff (should be excluded)
      makeGame({ homeTeamName: "Buffalo Bills", awayTeamName: "Miami Dolphins", homeScore: 28, awayScore: 21, winnerName: "Buffalo Bills", isPlayoff: true }),
    ];

    const r = computeStandings(games, allTeams, 2024);

    expect(r.season).toBe(2024);
    expect(r.divisions).toHaveLength(2); // AFC EAST + NFC EAST

    // AFC EAST standings
    const afcEast = r.divisions.find((d) => d.conference === "AFC" && d.division === "EAST")!;
    expect(afcEast.teams).toHaveLength(4);

    // BUF: 3-0 (best)
    const buf = afcEast.teams[0];
    expect(buf.team.abbreviation).toBe("BUF");
    expect(buf.wins).toBe(3);
    expect(buf.losses).toBe(0);
    expect(buf.pct).toBe("1.000");
    expect(buf.divRecord).toBe("2-0"); // Beat MIA and NYJ (both AFC EAST)
    expect(buf.confRecord).toBe("2-0"); // Only div games are conf, cross-conf doesn't count
    expect(buf.streak).toBe("W3");

    // NE: 1-1
    const ne = afcEast.teams.find((t) => t.team.abbreviation === "NE")!;
    expect(ne.wins).toBe(1);
    expect(ne.losses).toBe(1);

    // NYJ: 0-2
    const nyj = afcEast.teams[afcEast.teams.length - 1];
    expect(nyj.team.abbreviation).toBe("NYJ");
    expect(nyj.wins).toBe(0);
    expect(nyj.losses).toBe(2);

    // NFC EAST
    const nfcEast = r.divisions.find((d) => d.conference === "NFC" && d.division === "EAST")!;
    const phi = nfcEast.teams[0];
    expect(phi.team.abbreviation).toBe("PHI");
    expect(phi.wins).toBe(1);
    expect(phi.divRecord).toBe("1-0");
  });
});
