import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

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
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-b hover:bg-gray-50 transition-colors">
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

      {/* Three-dot menu */}
      <div className="relative ml-4" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(v => !v)}
          className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
        >
          ⋯
        </button>
        {menuOpen && (
          <div className="absolute right-0 mt-1 w-40 bg-white border rounded-lg shadow-xl z-10 overflow-hidden">
            <button
              onClick={() => { router.push(`/songs/${song.id}/lyric?q=${encodeURIComponent(q)}`); setMenuOpen(false); }}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
            >
              🎵 Mở Lyric
            </button>
            <button
              onClick={() => { router.push(`/songs/${song.id}/sheet?q=${encodeURIComponent(q)}`); setMenuOpen(false); }}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
            >
              🎼 Mở Sheet
            </button>
          </div>
        )}
      </div>
    </div>
  );
}