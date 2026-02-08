import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Conference, Division } from "@prisma/client";

interface TeamSeed {
  name: string;
  abbreviation: string;
  city: string;
  nickname: string;
  conference: Conference;
  division: Division;
  franchiseKey: string;
  isActive: boolean;
}

const ALL_TEAMS: TeamSeed[] = [
  // AFC East
  { name: "Buffalo Bills", abbreviation: "BUF", city: "Buffalo", nickname: "Bills", conference: "AFC", division: "EAST", franchiseKey: "Bills", isActive: true },
  { name: "Miami Dolphins", abbreviation: "MIA", city: "Miami", nickname: "Dolphins", conference: "AFC", division: "EAST", franchiseKey: "Dolphins", isActive: true },
  { name: "New England Patriots", abbreviation: "NE", city: "Foxborough", nickname: "Patriots", conference: "AFC", division: "EAST", franchiseKey: "Patriots", isActive: true },
  { name: "New York Jets", abbreviation: "NYJ", city: "East Rutherford", nickname: "Jets", conference: "AFC", division: "EAST", franchiseKey: "Jets", isActive: true },
  // AFC North
  { name: "Baltimore Ravens", abbreviation: "BAL", city: "Baltimore", nickname: "Ravens", conference: "AFC", division: "NORTH", franchiseKey: "Ravens", isActive: true },
  { name: "Cincinnati Bengals", abbreviation: "CIN", city: "Cincinnati", nickname: "Bengals", conference: "AFC", division: "NORTH", franchiseKey: "Bengals", isActive: true },
  { name: "Cleveland Browns", abbreviation: "CLE", city: "Cleveland", nickname: "Browns", conference: "AFC", division: "NORTH", franchiseKey: "Browns", isActive: true },
  { name: "Pittsburgh Steelers", abbreviation: "PIT", city: "Pittsburgh", nickname: "Steelers", conference: "AFC", division: "NORTH", franchiseKey: "Steelers", isActive: true },
  // AFC South
  { name: "Houston Texans", abbreviation: "HOU", city: "Houston", nickname: "Texans", conference: "AFC", division: "SOUTH", franchiseKey: "Texans", isActive: true },
  { name: "Indianapolis Colts", abbreviation: "IND", city: "Indianapolis", nickname: "Colts", conference: "AFC", division: "SOUTH", franchiseKey: "Colts", isActive: true },
  { name: "Jacksonville Jaguars", abbreviation: "JAC", city: "Jacksonville", nickname: "Jaguars", conference: "AFC", division: "SOUTH", franchiseKey: "Jaguars", isActive: true },
  { name: "Tennessee Titans", abbreviation: "TEN", city: "Nashville", nickname: "Titans", conference: "AFC", division: "SOUTH", franchiseKey: "Titans", isActive: true },
  // AFC West
  { name: "Denver Broncos", abbreviation: "DEN", city: "Denver", nickname: "Broncos", conference: "AFC", division: "WEST", franchiseKey: "Broncos", isActive: true },
  { name: "Kansas City Chiefs", abbreviation: "KC", city: "Kansas City", nickname: "Chiefs", conference: "AFC", division: "WEST", franchiseKey: "Chiefs", isActive: true },
  { name: "Las Vegas Raiders", abbreviation: "LV", city: "Las Vegas", nickname: "Raiders", conference: "AFC", division: "WEST", franchiseKey: "Raiders", isActive: true },
  { name: "Los Angeles Chargers", abbreviation: "LAC", city: "Los Angeles", nickname: "Chargers", conference: "AFC", division: "WEST", franchiseKey: "Chargers", isActive: true },
  // NFC East
  { name: "Dallas Cowboys", abbreviation: "DAL", city: "Arlington", nickname: "Cowboys", conference: "NFC", division: "EAST", franchiseKey: "Cowboys", isActive: true },
  { name: "New York Giants", abbreviation: "NYG", city: "East Rutherford", nickname: "Giants", conference: "NFC", division: "EAST", franchiseKey: "Giants", isActive: true },
  { name: "Philadelphia Eagles", abbreviation: "PHI", city: "Philadelphia", nickname: "Eagles", conference: "NFC", division: "EAST", franchiseKey: "Eagles", isActive: true },
  { name: "Washington Commanders", abbreviation: "WAS", city: "Landover", nickname: "Commanders", conference: "NFC", division: "EAST", franchiseKey: "Washington", isActive: true },
  // NFC North
  { name: "Chicago Bears", abbreviation: "CHI", city: "Chicago", nickname: "Bears", conference: "NFC", division: "NORTH", franchiseKey: "Bears", isActive: true },
  { name: "Detroit Lions", abbreviation: "DET", city: "Detroit", nickname: "Lions", conference: "NFC", division: "NORTH", franchiseKey: "Lions", isActive: true },
  { name: "Green Bay Packers", abbreviation: "GB", city: "Green Bay", nickname: "Packers", conference: "NFC", division: "NORTH", franchiseKey: "Packers", isActive: true },
  { name: "Minnesota Vikings", abbreviation: "MIN", city: "Minneapolis", nickname: "Vikings", conference: "NFC", division: "NORTH", franchiseKey: "Vikings", isActive: true },
  // NFC South
  { name: "Atlanta Falcons", abbreviation: "ATL", city: "Atlanta", nickname: "Falcons", conference: "NFC", division: "SOUTH", franchiseKey: "Falcons", isActive: true },
  { name: "Carolina Panthers", abbreviation: "CAR", city: "Charlotte", nickname: "Panthers", conference: "NFC", division: "SOUTH", franchiseKey: "Panthers", isActive: true },
  { name: "New Orleans Saints", abbreviation: "NO", city: "New Orleans", nickname: "Saints", conference: "NFC", division: "SOUTH", franchiseKey: "Saints", isActive: true },
  { name: "Tampa Bay Buccaneers", abbreviation: "TB", city: "Tampa", nickname: "Buccaneers", conference: "NFC", division: "SOUTH", franchiseKey: "Buccaneers", isActive: true },
  // NFC West
  { name: "Arizona Cardinals", abbreviation: "ARI", city: "Glendale", nickname: "Cardinals", conference: "NFC", division: "WEST", franchiseKey: "Cardinals", isActive: true },
  { name: "Los Angeles Rams", abbreviation: "LA", city: "Inglewood", nickname: "Rams", conference: "NFC", division: "WEST", franchiseKey: "Rams", isActive: true },
  { name: "San Francisco 49ers", abbreviation: "SF", city: "Santa Clara", nickname: "49ers", conference: "NFC", division: "WEST", franchiseKey: "49ers", isActive: true },
  { name: "Seattle Seahawks", abbreviation: "SEA", city: "Seattle", nickname: "Seahawks", conference: "NFC", division: "WEST", franchiseKey: "Seahawks", isActive: true },
  // Historical teams
  { name: "Baltimore Colts", abbreviation: "BLC", city: "Baltimore", nickname: "Colts", conference: "AFC", division: "SOUTH", franchiseKey: "Colts", isActive: false },
  { name: "Oakland Raiders", abbreviation: "OAK", city: "Oakland", nickname: "Raiders", conference: "AFC", division: "WEST", franchiseKey: "Raiders", isActive: false },
  { name: "Los Angeles Raiders", abbreviation: "RAI", city: "Los Angeles", nickname: "Raiders", conference: "AFC", division: "WEST", franchiseKey: "Raiders", isActive: false },
  { name: "San Diego Chargers", abbreviation: "SD", city: "San Diego", nickname: "Chargers", conference: "AFC", division: "WEST", franchiseKey: "Chargers", isActive: false },
  { name: "St. Louis Rams", abbreviation: "STL", city: "St. Louis", nickname: "Rams", conference: "NFC", division: "WEST", franchiseKey: "Rams", isActive: false },
  { name: "Cleveland Rams", abbreviation: "CLR", city: "Cleveland", nickname: "Rams", conference: "NFC", division: "WEST", franchiseKey: "Rams", isActive: false },
  { name: "Tennessee Oilers", abbreviation: "TNO", city: "Memphis", nickname: "Oilers", conference: "AFC", division: "SOUTH", franchiseKey: "Titans", isActive: false },
  { name: "Houston Oilers", abbreviation: "HSO", city: "Houston", nickname: "Oilers", conference: "AFC", division: "SOUTH", franchiseKey: "Titans", isActive: false },
  { name: "Phoenix Cardinals", abbreviation: "PHX", city: "Phoenix", nickname: "Cardinals", conference: "NFC", division: "WEST", franchiseKey: "Cardinals", isActive: false },
  { name: "St. Louis Cardinals", abbreviation: "SLC", city: "St. Louis", nickname: "Cardinals", conference: "NFC", division: "WEST", franchiseKey: "Cardinals", isActive: false },
  { name: "Chicago Cardinals", abbreviation: "CHC", city: "Chicago", nickname: "Cardinals", conference: "NFC", division: "WEST", franchiseKey: "Cardinals", isActive: false },
  { name: "Washington Football Team", abbreviation: "WFT", city: "Landover", nickname: "Football Team", conference: "NFC", division: "EAST", franchiseKey: "Washington", isActive: false },
  { name: "Washington Redskins", abbreviation: "WRS", city: "Landover", nickname: "Redskins", conference: "NFC", division: "EAST", franchiseKey: "Washington", isActive: false },
  { name: "Boston Patriots", abbreviation: "BOS", city: "Boston", nickname: "Patriots", conference: "AFC", division: "EAST", franchiseKey: "Patriots", isActive: false },
];

export async function POST() {
  try {
    let seeded = 0;

    for (const team of ALL_TEAMS) {
      await prisma.team.upsert({
        where: { name: team.name },
        update: {
          abbreviation: team.abbreviation,
          city: team.city,
          nickname: team.nickname,
          conference: team.conference,
          division: team.division,
          franchiseKey: team.franchiseKey,
          isActive: team.isActive,
        },
        create: team,
      });
      seeded++;
    }

    const activeCount = await prisma.team.count({ where: { isActive: true } });
    const totalCount = await prisma.team.count();

    return NextResponse.json({
      success: true,
      seeded,
      active: activeCount,
      historical: totalCount - activeCount,
      total: totalCount,
    });
  } catch (err) {
    console.error("Seed error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Seed failed" },
      { status: 500 }
    );
  }
}
