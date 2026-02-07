import Link from "next/link";
import { auth, signOut } from "@/auth";

export default async function Navbar() {
  const session = await auth();

  if (!session?.user) return null;

  return (
    <nav className="flex items-center justify-between border-b border-[#1e2a45] bg-[#141b2d] px-6 py-3">
      <div className="flex items-center gap-4">
        <Link href="/" className="text-lg font-bold text-white transition-colors hover:text-[#d4af37]">
          GridIron Intel
        </Link>
        <span className="hidden text-sm text-[#8899aa] sm:inline">
          NFL Historical Database
        </span>
        <div className="hidden items-center gap-3 border-l border-[#1e2a45] pl-4 sm:flex">
          <Link
            href="/"
            className="text-sm text-[#8899aa] transition-colors hover:text-[#d4af37]"
          >
            Games
          </Link>
          <Link
            href="/matchups"
            className="text-sm text-[#8899aa] transition-colors hover:text-[#d4af37]"
          >
            Matchups
          </Link>
          <Link
            href="/trends"
            className="text-sm text-[#8899aa] transition-colors hover:text-[#d4af37]"
          >
            Trends
          </Link>
          <Link
            href="/standings"
            className="text-sm text-[#8899aa] transition-colors hover:text-[#d4af37]"
          >
            Standings
          </Link>
          <Link
            href="/records"
            className="text-sm text-[#8899aa] transition-colors hover:text-[#d4af37]"
          >
            Records
          </Link>
          <Link
            href="/schedule"
            className="text-sm text-[#8899aa] transition-colors hover:text-[#d4af37]"
          >
            Schedule
          </Link>
          <Link
            href="/playoffs"
            className="text-sm text-[#8899aa] transition-colors hover:text-[#d4af37]"
          >
            Playoffs
          </Link>
          <Link
            href="/scoring"
            className="text-sm text-[#8899aa] transition-colors hover:text-[#d4af37]"
          >
            Scoring
          </Link>
          <Link
            href="/home-advantage"
            className="text-sm text-[#8899aa] transition-colors hover:text-[#d4af37]"
          >
            Home Advantage
          </Link>
          <Link
            href="/upsets"
            className="text-sm text-[#8899aa] transition-colors hover:text-[#d4af37]"
          >
            Upsets
          </Link>
          <Link
            href="/rivalries"
            className="text-sm text-[#8899aa] transition-colors hover:text-[#d4af37]"
          >
            Rivalries
          </Link>
          <Link
            href="/weather"
            className="text-sm text-[#8899aa] transition-colors hover:text-[#d4af37]"
          >
            Weather
          </Link>
          <Link
            href="/franchise-history"
            className="text-sm text-[#8899aa] transition-colors hover:text-[#d4af37]"
          >
            Franchises
          </Link>
          <Link
            href="/bye-week"
            className="text-sm text-[#8899aa] transition-colors hover:text-[#d4af37]"
          >
            Bye Week
          </Link>
          <Link
            href="/conference-comparison"
            className="text-sm text-[#8899aa] transition-colors hover:text-[#d4af37]"
          >
            Conferences
          </Link>
          <Link
            href="/game-finder"
            className="text-sm text-[#8899aa] transition-colors hover:text-[#d4af37]"
          >
            Game Finder
          </Link>
          <Link
            href="/eras"
            className="text-sm text-[#8899aa] transition-colors hover:text-[#d4af37]"
          >
            Eras
          </Link>
          <Link
            href="/primetime"
            className="text-sm text-[#8899aa] transition-colors hover:text-[#d4af37]"
          >
            Primetime
          </Link>
          <Link
            href="/streaks"
            className="text-sm text-[#8899aa] transition-colors hover:text-[#d4af37]"
          >
            Streaks
          </Link>
          <Link
            href="/division-history"
            className="text-sm text-[#8899aa] transition-colors hover:text-[#d4af37]"
          >
            Divisions
          </Link>
          <Link
            href="/close-games"
            className="text-sm text-[#8899aa] transition-colors hover:text-[#d4af37]"
          >
            Close Games
          </Link>
          <Link
            href="/power-rankings"
            className="text-sm text-[#8899aa] transition-colors hover:text-[#d4af37]"
          >
            Power Rankings
          </Link>
          <Link
            href="/betting-value"
            className="text-sm text-[#8899aa] transition-colors hover:text-[#d4af37]"
          >
            Betting Value
          </Link>
          <Link
            href="/ats-leaderboard"
            className="text-sm text-[#8899aa] transition-colors hover:text-[#d4af37]"
          >
            ATS Leaderboard
          </Link>
          <Link
            href="/schedule-strength"
            className="text-sm text-[#8899aa] transition-colors hover:text-[#d4af37]"
          >
            Schedule Strength
          </Link>
          <Link
            href="/coaching"
            className="text-sm text-[#8899aa] transition-colors hover:text-[#d4af37]"
          >
            Coaching
          </Link>
          <Link
            href="/admin"
            className="text-sm text-[#8899aa] transition-colors hover:text-[#d4af37]"
          >
            Admin
          </Link>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-[#8899aa]">{session.user.name}</span>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button
            type="submit"
            className="rounded border border-[#2a3a55] px-3 py-1 text-sm text-[#ccc] transition-colors hover:border-[#d4af37] hover:text-[#d4af37]"
          >
            Sign out
          </button>
        </form>
      </div>
    </nav>
  );
}
