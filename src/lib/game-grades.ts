/**
 * Pure game grades system — no DB dependency.
 */

export interface GradeGame {
  season: number;
  week: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  homeTeamAbbr: string;
  awayTeamAbbr: string;
  overtimeIndicator?: boolean;
}

export interface GameGrade {
  season: number;
  week: string;
  matchup: string;
  score: string;
  grade: string;
  scoreValue: number;
  margin: number;
  total: number;
  overtimeBonus: boolean;
}

export interface GradeStats {
  totalGames: number;
  gradedGames: GameGrade[];
  bestGames: GameGrade[];
  averageGrade: string;
}

export interface GameGradesResult {
  stats: GradeStats;
}

type Grade = "A+" | "A" | "B" | "C" | "D" | "F";

function gradeGame(
  season: number,
  week: string,
  home: string,
  away: string,
  homeScore: number,
  awayScore: number,
  overtime: boolean = false
): GameGrade {
  const margin = Math.abs(homeScore - awayScore);
  const total = homeScore + awayScore;
  let score = 0;

  // Competitiveness (margin): 40 points
  if (margin === 0) score += 40; // Tie
  else if (margin <= 3) score += 40 - margin * 8;
  else if (margin <= 7) score += 35 - margin * 2;
  else if (margin <= 14) score += 30 - margin;
  else score += 20 - Math.floor(margin / 5);

  // Combined scoring (high-scoring): 30 points
  if (total >= 60) score += 30;
  else if (total >= 50) score += 25;
  else if (total >= 40) score += 20;
  else if (total >= 30) score += 15;
  else if (total >= 20) score += 10;
  else score += 5;

  // Comeback factor: 20 points (if close and high scoring)
  if (margin <= 7 && total >= 50) score += 20;
  else if (margin <= 10 && total >= 45) score += 15;

  // Overtime bonus: 10 points
  if (overtime) score += 10;

  // Cap at 100
  score = Math.min(score, 100);

  let grade: Grade;
  if (score >= 90) grade = "A+";
  else if (score >= 80) grade = "A";
  else if (score >= 70) grade = "B";
  else if (score >= 60) grade = "C";
  else if (score >= 50) grade = "D";
  else grade = "F";

  return {
    season,
    week,
    matchup: `${home} vs ${away}`,
    score: `${homeScore}-${awayScore}`,
    grade,
    scoreValue: score,
    margin,
    total,
    overtimeBonus: overtime,
  };
}

export function gradeAllGames(games: GradeGame[]): GameGradesResult {
  if (games.length === 0) {
    return {
      stats: {
        totalGames: 0,
        gradedGames: [],
        bestGames: [],
        averageGrade: "N/A",
      },
    };
  }

  const graded = games
    .map((g) => gradeGame(g.season, g.week, g.homeTeamName, g.awayTeamName, g.homeScore, g.awayScore, g.overtimeIndicator ?? false));

  const bestGames = graded.sort((a, b) => b.scoreValue - a.scoreValue).slice(0, 10);

  const avgScore = graded.reduce((a, b) => a + b.scoreValue, 0) / graded.length;
  let avgGrade: Grade;
  if (avgScore >= 90) avgGrade = "A+";
  else if (avgScore >= 80) avgGrade = "A";
  else if (avgScore >= 70) avgGrade = "B";
  else if (avgScore >= 60) avgGrade = "C";
  else if (avgScore >= 50) avgGrade = "D";
  else avgGrade = "F";

  return {
    stats: {
      totalGames: games.length,
      gradedGames: graded,
      bestGames,
      averageGrade: avgGrade,
    },
  };
}
