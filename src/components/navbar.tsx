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
