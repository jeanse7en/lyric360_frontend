"use client";

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

export default function SongListItem({ song }: Props) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/songs/${song.id}`)}
      className="relative flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 dark:text-white truncate">{song.title}</span>
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
    </div>
  );
}
