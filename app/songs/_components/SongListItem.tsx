"use client";

import { useState, useRef } from "react";
import SongActionMenu from "./SongActionMenu";

type Song = {
  id: string;
  title: string;
  author?: string;
  lyric_count: number;
  sheet_count: number;
  unverified_count: number;
};

type Props = { song: Song; q: string };

export default function SongListItem({ song, q }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => {
    if (rowRef.current) {
      const rect = rowRef.current.getBoundingClientRect();
      setOpenUpward(rect.bottom + 90 > window.innerHeight);
    }
    setMenuOpen(v => !v);
  };

  return (
    <div
      ref={rowRef}
      onClick={toggleMenu}
      className="relative flex items-center justify-between px-4 py-3 bg-white border-b hover:bg-gray-50 transition-colors cursor-pointer"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 truncate">{song.title}</span>
          {song.unverified_count > 0 && (
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium shrink-0">
              {song.unverified_count} chưa xác nhận
            </span>
          )}
        </div>
        <div className="text-sm text-gray-500 mt-0.5 flex gap-3">
          <span>{song.author || "—"}</span>
          <span className="text-gray-300">|</span>
          <span>🎵 {song.lyric_count} lời</span>
          <span>🎼 {song.sheet_count} sheet</span>
        </div>
      </div>

      <span className="ml-4 p-2 rounded-full text-gray-400">⋯</span>

      <SongActionMenu
        songId={song.id}
        query={q}
        open={menuOpen}
        openUpward={openUpward}
        onClose={() => setMenuOpen(false)}
      />
    </div>
  );
}
