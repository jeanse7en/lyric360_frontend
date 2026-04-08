"use client";

import { useState, useEffect } from "react";

type Song = { id: string; title: string; author?: string };

type Props = {
  selectedSong: Song | null;
  onSelect: (song: Song | null) => void;
  onInputChange?: (value: string) => void;
  disabled?: boolean;
  bookedSongIds?: string[];
  recentSongs?: Song[];
};

const API = process.env.NEXT_PUBLIC_API_URL;

export default function SongSearch({ selectedSong, onSelect, onInputChange, disabled, bookedSongIds = [], recentSongs = [] }: Props) {
  const [inputValue, setInputValue] = useState("");
  const [results, setResults] = useState<Song[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchSongs = async (q: string, currentOffset: number, append = false) => {
    try {
      const res = await fetch(`${API}/api/songs/search?q=${q}&offset=${currentOffset}&limit=20`);
      if (!res.ok) return;
      const data: Song[] = await res.json();
      setHasMore(data.length === 20);
      setResults(prev => append ? [...prev, ...data] : data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (!isOpen || disabled) return;
    const id = setTimeout(() => { setOffset(0); fetchSongs(inputValue, 0); }, 300);
    return () => clearTimeout(id);
  }, [inputValue, isOpen, disabled]);

  const loadMore = (e: React.MouseEvent) => {
    e.preventDefault();
    const next = offset + 20;
    setOffset(next);
    fetchSongs(inputValue, next, true);
  };

  const handleSelect = (song: Song) => {
    if (bookedSongIds.includes(song.id)) return;
    onSelect(song);
    setInputValue(song.title);
    setIsOpen(false);
  };

  const recentSongIds = new Set(recentSongs.map(s => s.id));

  // Items shown in dropdown
  const showRecent = !inputValue && recentSongs.length > 0;
  const listItems = showRecent ? recentSongs : results;

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Chọn Bài Hát *</label>
      <input
        suppressHydrationWarning
        required={!selectedSong}
        type="text"
        value={inputValue}
        disabled={disabled}
        onFocus={() => !disabled && setIsOpen(true)}
        onChange={e => { setInputValue(e.target.value); onSelect(null); onInputChange?.(e.target.value); }}
        className={`w-full px-4 py-2 border rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors ${
          disabled
            ? "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 cursor-not-allowed opacity-60"
            : "bg-white dark:bg-gray-700 border-blue-400 dark:border-blue-500"
        }`}
        placeholder={disabled ? "Chọn tên và buổi diễn trước..." : "Gõ tìm hoặc lướt chọn..."}
      />

      {isOpen && !selectedSong && !disabled && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-2xl">
          {showRecent && (
            <div className="px-4 pt-2 pb-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Bài hát được thể hiện gần đây</span>
            </div>
          )}
          <ul className="max-h-60 overflow-y-auto">
            {listItems.map(song => {
              const booked = bookedSongIds.includes(song.id);
              const recent = recentSongIds.has(song.id);
              return (
                <li
                  key={song.id}
                  onClick={() => handleSelect(song)}
                  className={`px-4 py-3 border-b border-gray-100 dark:border-gray-700 ${
                    booked
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900 dark:text-white truncate">{song.title}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {song.author && <span className="text-xs text-gray-500 dark:text-gray-400">{song.author}</span>}
                        {!showRecent && recent && (
                          <span className="text-xs text-blue-500 dark:text-blue-400">gần đây</span>
                        )}
                      </div>
                    </div>
                    {booked && (
                      <span className="text-xs text-red-500 dark:text-red-400 shrink-0 font-medium">Đã được đặt trước</span>
                    )}
                  </div>
                </li>
              );
            })}
            {listItems.length === 0 && (
              <li className="px-4 py-3 text-sm text-gray-400 italic">Không tìm thấy bài hát nào</li>
            )}
          </ul>
          {!showRecent && hasMore && (
            <button onClick={loadMore} className="w-full text-center py-2 text-sm text-blue-600 dark:text-blue-400 font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              ⬇ Tải thêm bài hát...
            </button>
          )}
        </div>
      )}
    </div>
  );
}
