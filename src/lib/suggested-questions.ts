export interface PageContext {
  page: string;
  sport?: string;
  team?: string;
  season?: string;
}

const SUGGESTIONS: Record<string, string[]> = {
  default: [
    "Which NFL team has the best home record?",
    "Compare AFC vs NFC win percentages",
    "Top 10 highest scoring games this season",
    "Which college football conference is strongest?",
  ],
  teams: [
    "What is this team's record in primetime games?",
    "How does this team perform against divisional rivals?",
    "Show me this team's scoring trends by season",
    "What is this team's biggest win?",
  ],
  schedule: [
    "Which week had the most upsets?",
    "Show me all overtime games this season",
    "What are the biggest blowouts this week?",
    "Which games were decided by 3 points or less?",
  ],
  playoffs: [
    "Which wild card teams have won the Super Bowl?",
    "What's the average margin in playoff games?",
    "How do home teams perform in the playoffs?",
    "Which division produces the most playoff teams?",
  ],
  cfb: [
    "Which conference has the most bowl wins?",
    "Top 10 CFB teams by winning percentage",
    "Biggest upsets in college football this season",
    "Compare SEC vs Big Ten overall records",
  ],
  cbb: [
    "Which conference dominates March Madness?",
    "Biggest tournament upsets by seed differential",
    "Which team has the best home court advantage?",
    "Compare scoring averages across conferences",
  ],
};

export function getSuggestedQuestions(context: PageContext): string[] {
  const { page, sport, team } = context;

  if (team) {
    return SUGGESTIONS.teams.map(q => q.replace("this team", team));
  }

  if (sport === "cfb") return SUGGESTIONS.cfb;
  if (sport === "cbb") return SUGGESTIONS.cbb;

  if (page.includes("playoff")) return SUGGESTIONS.playoffs;
  if (page.includes("schedule")) return SUGGESTIONS.schedule;
  if (page.includes("team")) return SUGGESTIONS.teams;

  return SUGGESTIONS.default;
}
