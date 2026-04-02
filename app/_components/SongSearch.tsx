"use client";

import { useState, useEffect } from "react";

type Song = { id: string; title: string; author?: string };

type Props = {
  selectedSong: Song | null;
  onSelect: (song: Song | null) => void;
};

export default function SongSearch({ selectedSong, onSelect }: Props) {
  const [inputValue, setInputValue] = useState("");
  const [results, setResults] = useState<Song[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchSongs = async (q: string, currentOffset: number, append = false) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/songs/search?q=${q}&offset=${currentOffset}&limit=20`);
      if (!res.ok) return;
      const data: Song[] = await res.json();
      setHasMore(data.length === 20);
      setResults(prev => append ? [...prev, ...data] : data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (!isOpen) return;
    const id = setTimeout(() => { setOffset(0); fetchSongs(inputValue, 0); }, 300);
    return () => clearTimeout(id);
  }, [inputValue, isOpen]);

  const loadMore = (e: React.MouseEvent) => {
    e.preventDefault();
    const next = offset + 20;
    setOffset(next);
    fetchSongs(inputValue, next, true);
  };

  const handleSelect = (song: Song) => {
    onSelect(song);
    setInputValue(song.title);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Chọn Bài Hát *</label>
      <input
        required={!selectedSong}
        type="text"
        value={inputValue}
        onFocus={() => setIsOpen(true)}
        onChange={e => { setInputValue(e.target.value); onSelect(null); }}
        className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-blue-400 dark:border-blue-500 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        placeholder="Gõ tìm hoặc lướt chọn..."
      />

      {isOpen && !selectedSong && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-2xl">
          <ul className="max-h-60 overflow-y-auto">
            {results.map(song => (
              <li
                key={song.id}
                onClick={() => handleSelect(song)}
                className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700"
              >
                <div className="font-medium text-gray-900 dark:text-white">{song.title}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{song.author}</div>
              </li>
            ))}
          </ul>
          {hasMore && (
            <button onClick={loadMore} className="w-full text-center py-2 text-sm text-blue-600 dark:text-blue-400 font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              ⬇ Tải thêm bài hát...
            </button>
          )}
        </div>
      )}
    </div>
  );
}
