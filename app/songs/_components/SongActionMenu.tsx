"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type Props = {
  songId: string;
  query: string;
  open: boolean;
  openUpward: boolean;
  onClose: () => void;
};

export default function SongActionMenu({ songId, query, open, openUpward, onClose }: Props) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  if (!open) return null;

  return (
    <div
      ref={menuRef}
      className={`absolute right-0 w-40 bg-white border rounded-lg shadow-xl z-50 overflow-hidden ${openUpward ? "bottom-full mb-1" : "mt-1"}`}
    >
      <button
        onClick={() => { router.push(`/songs/${songId}/lyric?q=${encodeURIComponent(query)}`); onClose(); }}
        className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
      >
        🎵 Mở Lyric
      </button>
      <button
        onClick={() => { router.push(`/songs/${songId}/sheet?q=${encodeURIComponent(query)}`); onClose(); }}
        className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
      >
        🎼 Mở Sheet
      </button>
    </div>
  );
}
