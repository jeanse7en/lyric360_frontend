"use client";

import { useState, useEffect, useRef } from "react";

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

const searchInputCls = (disabled: boolean) =>
  `w-full px-4 py-2 border rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors ${
    disabled
      ? "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 cursor-not-allowed opacity-60"
      : "bg-white dark:bg-gray-700 border-blue-400 dark:border-blue-500"
  }`;

export default function SongSearch({
  selectedSong,
  onSelect,
  onInputChange,
  disabled,
  bookedSongIds = [],
  recentSongs = [],
}: Props) {
  const [inputValue, setInputValue] = useState("");
  const [results, setResults] = useState<Song[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [allowFreeText, setAllowFreeText] = useState(false);
  const [freeTextValue, setFreeTextValue] = useState("");
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLUListElement>(null);

  const fetchSongs = async (q: string, currentOffset: number, append = false) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/songs/search?q=${encodeURIComponent(q)}&offset=${currentOffset}&limit=20`);
      if (!res.ok) return;
      const data: Song[] = await res.json();
      setHasMore(data.length === 20);
      setResults(prev => (append ? [...prev, ...data] : data));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!isOpen || disabled || allowFreeText) return;
    const id = setTimeout(() => { setOffset(0); fetchSongs(inputValue, 0); }, 300);
    return () => clearTimeout(id);
  }, [inputValue, isOpen, disabled, allowFreeText]);

  useEffect(() => {
    if (!sentinelRef.current || !scrollRef.current || !hasMore) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !loading) {
          const next = offset + 20;
          setOffset(next);
          fetchSongs(inputValue, next, true);
        }
      },
      { root: scrollRef.current, threshold: 0.1 },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, offset, loading, inputValue, isOpen]);

  const handleSelect = (song: Song) => {
    if (bookedSongIds.includes(song.id)) return;
    onSelect(song);
    setInputValue(song.title);
    setIsOpen(false);
  };

  const handleFreeTextToggle = (checked: boolean) => {
    setAllowFreeText(checked);
    if (checked) {
      onSelect(null);
      setInputValue("");
      setIsOpen(false);
    } else {
      setFreeTextValue("");
      onInputChange?.("");
    }
  };

  const handleFreeTextChange = (v: string) => {
    setFreeTextValue(v);
    onInputChange?.(v);
  };

  const recentSongIds = new Set(recentSongs.map(s => s.id));
  const showRecent = !inputValue && recentSongs.length > 0;
  const listItems = showRecent ? recentSongs : results;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Chọn Bài Hát *</label>

      <div className="relative">
          <input
            suppressHydrationWarning
            required={!selectedSong && !allowFreeText}
            type="text"
            value={inputValue}
            disabled={disabled || allowFreeText}
            onFocus={() => !disabled && !allowFreeText && setIsOpen(true)}
            onBlur={() => setTimeout(() => setIsOpen(false), 150)}
            onChange={e => { setInputValue(e.target.value); onSelect(null); }}
            className={searchInputCls(!!(disabled || allowFreeText))}
            placeholder={disabled ? "Chọn tên và buổi diễn trước..." : "Gõ tìm hoặc lướt chọn..."}
          />

          {isOpen && !selectedSong && !disabled && !allowFreeText && (
            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-2xl">
              {showRecent && (
                <div className="px-4 pt-2 pb-1">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Bài hát được thể hiện gần đây</span>
                </div>
              )}
              <ul ref={scrollRef} className="max-h-60 overflow-y-auto">
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
                {!showRecent && hasMore && <div ref={sentinelRef} className="h-4" />}
                {!showRecent && loading && (
                  <li className="px-4 py-2 text-xs text-gray-400 text-center">Đang tải...</li>
                )}
              </ul>
            </div>
          )}
        </div>

      {allowFreeText && (
        <input
          suppressHydrationWarning
          required
          type="text"
          value={freeTextValue}
          disabled={disabled}
          onChange={e => handleFreeTextChange(e.target.value)}
          className={`mt-2 ${searchInputCls(!!disabled)}`}
          placeholder="Nhập tên bài hát..."
          autoFocus
        />
      )}

      {!disabled && (
        <div className="mt-2 space-y-1">
          <label className="inline-flex items-start gap-2 cursor-pointer select-none text-sm text-gray-600 dark:text-gray-300">
            <input
              type="checkbox"
              checked={allowFreeText}
              onChange={e => handleFreeTextToggle(e.target.checked)}
              className="w-4 h-4 rounded accent-blue-500 mt-0.5 shrink-0"
            />
            Không tìm thấy bài hát trong hệ thống, nhập bài hát khác
          </label>
          <p className="text-xs text-gray-400 dark:text-gray-500 pl-6">
            Vui lòng kiểm tra kỹ lại thông tin tìm kiếm trước khi nhập bài hát không có trong hệ thống
          </p>
        </div>
      )}
    </div>
);
}