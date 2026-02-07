"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SPORTS = [
  { id: "nfl", label: "NFL", href: "/" },
  { id: "cfb", label: "CFB", href: "/cfb" },
  { id: "cbb", label: "CBB", href: "/cbb" },
];

export default function SportSwitcher() {
  const pathname = usePathname();
  const currentSport = pathname.startsWith("/cfb")
    ? "cfb"
    : pathname.startsWith("/cbb")
      ? "cbb"
      : "nfl";

  return (
    <div className="flex gap-1 rounded-lg border border-[#1e2a45] bg-[#0d1321] p-1">
      {SPORTS.map((sport) => (
        <Link
          key={sport.id}
          href={sport.href}
          className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
            currentSport === sport.id
              ? "bg-[#d4af37] text-[#0a0f1a]"
              : "text-[#8899aa] hover:text-white"
          }`}
        >
          {sport.label}
        </Link>
      ))}
    </div>
  );
}
