"use client";

import { useEffect, useRef, useState } from "react";

type VerifyStatus = "UNVERIFIED_ALL" | "UNVERIFIED_LYRIC" | "UNVERIFIED_SHEET" | "VERIFIED" | "";
type LyricCharsPreset = "" | "0-500" | "500-1000" | "1000-2000" | ">2000";
type CountPreset = "" | "0-1" | "1-5" | ">5";

const VERIFY_FILTERS: { label: string; value: VerifyStatus }[] = [
  { label: "Tất cả", value: "" },
  { label: "Chưa xác nhận", value: "UNVERIFIED_ALL" },
  { label: "Lời chưa xác nhận", value: "UNVERIFIED_LYRIC" },
  { label: "Sheet chưa xác nhận", value: "UNVERIFIED_SHEET" },
  { label: "Đã xác nhận", value: "VERIFIED" },
];

const LYRIC_CHARS_OPTIONS: { label: string; value: LyricCharsPreset }[] = [
  { label: "Tất cả", value: "" },
  { label: "0 – 500", value: "0-500" },
  { label: "500 – 1000", value: "500-1000" },
  { label: "1000 - 2000", value: "1000-2000" },
  { label: "> 2000", value: ">2000" }
];

const COUNT_OPTIONS: { label: string; value: CountPreset }[] = [
  { label: "Tất cả", value: "" },
  { label: "0 – 1", value: "0-1" },
  { label: "1 – 5", value: "1-5" },
  { label: "> 5", value: ">5" },
];

export type SongFilters = {
  verifyStatus: VerifyStatus;
  lyricChars: LyricCharsPreset;
  lyricCount: CountPreset;
  sheetCount: CountPreset;
};

export const DEFAULT_FILTERS: SongFilters = {
  verifyStatus: "",
  lyricChars: "",
  lyricCount: "",
  sheetCount: "",
};

function countActiveFilters(f: SongFilters): number {
  return (
    (f.verifyStatus !== "" ? 1 : 0) +
    (f.lyricChars !== "" ? 1 : 0) +
    (f.lyricCount !== "" ? 1 : 0) +
    (f.sheetCount !== "" ? 1 : 0)
  );
}

function ChipGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="space-y-1.5">
      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
              value === opt.value
                ? "bg-blue-600 border-blue-600 text-white"
                : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-blue-400"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

type Props = {
  query: string;
  filters: SongFilters;
  onQueryChange: (query: string) => void;
  onFiltersChange: (filters: SongFilters) => void;
};

export type { VerifyStatus, LyricCharsPreset, CountPreset };

export default function SongFilter({ query, filters, onQueryChange, onFiltersChange }: Props) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const activeCount = countActiveFilters(filters);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const update = (partial: Partial<SongFilters>) =>
    onFiltersChange({ ...filters, ...partial });

  const reset = () => onFiltersChange({ ...DEFAULT_FILTERS });

  return (
    <div className="mb-4 space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={e => onQueryChange(e.target.value)}
          placeholder="Tìm kiếm bài hát..."
          className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <div className="relative" ref={panelRef}>
          <button
            onClick={() => setOpen(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
              activeCount > 0
                ? "bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-600 dark:text-blue-300"
                : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            Lọc
            {activeCount > 0 && (
              <span className="flex items-center justify-center w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                {activeCount}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-1 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-4 space-y-4 z-50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-800 dark:text-white">Bộ lọc</span>
                {activeCount > 0 && (
                  <button onClick={reset} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                    Xoá bộ lọc
                  </button>
                )}
              </div>

              <ChipGroup
                label="Trạng thái xác nhận"
                options={VERIFY_FILTERS}
                value={filters.verifyStatus}
                onChange={v => update({ verifyStatus: v })}
              />

              <ChipGroup
                label="Độ dài lời (ký tự)"
                options={LYRIC_CHARS_OPTIONS}
                value={filters.lyricChars}
                onChange={v => update({ lyricChars: v })}
              />

              <ChipGroup
                label="Số phiên bản lời"
                options={COUNT_OPTIONS}
                value={filters.lyricCount}
                onChange={v => update({ lyricCount: v })}
              />

              <ChipGroup
                label="Số sheet nhạc"
                options={COUNT_OPTIONS}
                value={filters.sheetCount}
                onChange={v => update({ sheetCount: v })}
              />
            </div>
          )}
        </div>
      </div>

      {/* Active filter chips */}
      {activeCount > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {filters.verifyStatus && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs">
              {VERIFY_FILTERS.find(f => f.value === filters.verifyStatus)?.label}
              <button onClick={() => update({ verifyStatus: "" })} className="hover:text-blue-900 dark:hover:text-blue-100">×</button>
            </span>
          )}
          {filters.lyricChars && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs">
              Lời: {LYRIC_CHARS_OPTIONS.find(o => o.value === filters.lyricChars)?.label} ký tự
              <button onClick={() => update({ lyricChars: "" })} className="hover:text-blue-900 dark:hover:text-blue-100">×</button>
            </span>
          )}
          {filters.lyricCount && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs">
              Phiên bản lời: {COUNT_OPTIONS.find(o => o.value === filters.lyricCount)?.label}
              <button onClick={() => update({ lyricCount: "" })} className="hover:text-blue-900 dark:hover:text-blue-100">×</button>
            </span>
          )}
          {filters.sheetCount && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs">
              Sheet: {COUNT_OPTIONS.find(o => o.value === filters.sheetCount)?.label}
              <button onClick={() => update({ sheetCount: "" })} className="hover:text-blue-900 dark:hover:text-blue-100">×</button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
