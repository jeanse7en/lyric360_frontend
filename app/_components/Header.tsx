"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { label: "Live", href: "/live" },
  { label: "Bài hát", href: "/songs" },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="bg-gray-900 border-b border-gray-700 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-white font-bold text-lg tracking-tight">
          🎵 Lyric360
        </Link>
        <nav className="flex items-center gap-1">
          {NAV.map(({ label, href }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
