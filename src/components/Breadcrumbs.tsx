"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ROUTE_LABELS: Record<string, string> = {
  "": "Home",
  teams: "Teams",
  schedule: "Schedule",
  standings: "Standings",
  games: "Games",
  playoffs: "Playoffs",
  "super-bowl": "Super Bowl",
  "game-finder": "Game Finder",
  trends: "Trends",
  rivalries: "Rivalries",
  "home-advantage": "Home Advantage",
  "weather-impact": "Weather Impact",
  streaks: "Streaks",
  login: "Login",
  signup: "Sign Up",
  account: "Account",
  cfb: "College Football",
  cbb: "College Basketball",
  admin: "Admin",
};

export default function Breadcrumbs() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  const segments = pathname.split("/").filter(Boolean);
  const crumbs = segments.map((seg, i) => ({
    label:
      ROUTE_LABELS[seg] ||
      seg
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase()),
    href: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
  }));

  return (
    <nav className="px-6 py-2 text-xs text-[#8899aa]" aria-label="Breadcrumb">
      <ol className="flex items-center gap-1">
        <li>
          <Link href="/" className="transition-colors hover:text-[#d4af37]">
            Home
          </Link>
        </li>
        {crumbs.map((crumb) => (
          <li key={crumb.href} className="flex items-center gap-1">
            <span className="text-[#2a3a55]">/</span>
            {crumb.isLast ? (
              <span className="text-[#e0e0e0]">{crumb.label}</span>
            ) : (
              <Link
                href={crumb.href}
                className="transition-colors hover:text-[#d4af37]"
              >
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
