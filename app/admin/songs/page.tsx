"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import SongListItem from "./_components/SongListItem";
import vi from "../../../lib/vi";
import SongFilter, {
  type VerifyStatus,
  type LyricCharsPreset,
  type CountPreset,
  type SongFilters,
  DEFAULT_FILTERS,
} from "./_components/SongFilter";
import Header from "../../_components/Header";
import Footer from "../../_components/Footer";
import CreateSongModal from "./_components/CreateSongModal";
import DeleteConfirmModal from "../../_components/DeleteConfirmModal";

type Song = {
  id: string;
  title: string;
  author?: string;
  lyric_count: number;
  sheet_count: number;
  unverified_count: number;
  max_lyric_chars: number;
};

const API = process.env.NEXT_PUBLIC_API_URL;

// Map preset string → { min?, max? } for the API
function lyricCharsToParams(preset: LyricCharsPreset): Record<string, string> {
  if (preset === "0-499") return { max_lyric_chars: "499" };
  if (preset === "500-999") return { min_lyric_chars: "500", max_lyric_chars: "999" };
  if (preset === "1000-1999") return { min_lyric_chars: "1000", max_lyric_chars: "1999" };
  if (preset === ">=2000") return { min_lyric_chars: "2000" };
  return {};
}

function countToParams(
  preset: CountPreset,
  minKey: string,
  maxKey: string,
): Record<string, string> {
  if (preset === "0") return { [minKey]: "0", [maxKey]: "0" };
  if (preset === "1") return { [minKey]: "1", [maxKey]: "1" };
  if (preset === "2-4") return { [minKey]: "2", [maxKey]: "4" };
  if (preset === ">=5") return { [minKey]: "5" };
  return {};
}

function buildUrl(query: string, filters: SongFilters) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (filters.verifyStatus) params.set("verifyStatus", filters.verifyStatus);
  if (filters.lyricChars) params.set("lyricChars", filters.lyricChars);
  if (filters.lyricCount) params.set("lyricCount", filters.lyricCount);
  if (filters.sheetCount) params.set("sheetCount", filters.sheetCount);
  if (filters.searchInLyric) params.set("searchInLyric", "1");
  const qs = params.toString();
  return `/admin/songs${qs ? `?${qs}` : ""}`;
}

function filtersFromParams(searchParams: ReturnType<typeof useSearchParams>): SongFilters {
  return {
    verifyStatus: (searchParams.get("verifyStatus") as VerifyStatus) ?? "",
    lyricChars: (searchParams.get("lyricChars") as LyricCharsPreset) ?? "",
    lyricCount: (searchParams.get("lyricCount") as CountPreset) ?? "",
    sheetCount: (searchParams.get("sheetCount") as CountPreset) ?? "",
    searchInLyric: searchParams.get("searchInLyric") === "1",
  };
}

function SongsPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [songs, setSongs] = useState<Song[]>([]);
  const [unverifiedCount, setUnverifiedCount] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [filters, setFilters] = useState<SongFilters>(() => filtersFromParams(searchParams));
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchSongs = async (search: string, f: SongFilters, currentOffset: number, append = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ offset: String(currentOffset), limit: "20" });
      if (search) params.set("q", search);
      if (f.verifyStatus) params.set("verify_status", f.verifyStatus);
      Object.entries(lyricCharsToParams(f.lyricChars)).forEach(([k, v]) => params.set(k, v));
      Object.entries(countToParams(f.lyricCount, "min_lyric_count", "max_lyric_count")).forEach(([k, v]) => params.set(k, v));
      Object.entries(countToParams(f.sheetCount, "min_sheet_count", "max_sheet_count")).forEach(([k, v]) => params.set(k, v));
      if (f.searchInLyric) params.set("search_lyric", "1");
      const res = await fetch(`${API}/api/songs/manage?${params}`);
      if (!res.ok) return;
      const data: Song[] = await res.json();
      setHasMore(data.length === 20);
      setSongs(prev => append ? [...prev, ...data] : data);
    } finally { setLoading(false); }
  };

  const fetchUnverifiedCount = async () => {
    const res = await fetch(`${API}/api/songs/unverified-count`);
    if (res.ok) setUnverifiedCount((await res.json()).count);
  };

  useEffect(() => {
    fetchUnverifiedCount();
    fetchSongs(query, filters, 0);
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      router.replace(buildUrl(query, filters));
      setOffset(0);
      fetchSongs(query, filters, 0);
    }, 300);
    return () => clearTimeout(id);
  }, [query, filters]);

  const handleDelete = async () => {
    if (!deleteId) return;
    await fetch(`${API}/api/songs/${deleteId}`, { method: "DELETE" });
    setSongs(prev => prev.filter(s => s.id !== deleteId));
    setDeleteId(null);
  };

  const loadMore = () => {
    const next = offset + 20;
    setOffset(next);
    fetchSongs(query, filters, next, true);
  };

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting && hasMore && !loading) loadMore(); },
      { threshold: 0.1 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, offset, query, filters]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header />
      <div className="flex-1 max-w-2xl w-full mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{vi.songsPage.title}</h1>
          <div className="flex items-center gap-2">
            {unverifiedCount > 0 && (
              <button
                onClick={() => { setQuery(""); setFilters({ ...DEFAULT_FILTERS, verifyStatus: "UNVERIFIED_ALL" }); }}
                className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 hover:bg-amber-100 transition-colors text-sm"
              >
                <span className="text-amber-600 font-medium">🔔 {unverifiedCount} bài cần đánh giá</span>
              </button>
            )}
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors"
            >
              + Thêm
            </button>
          </div>
        </div>

        <SongFilter
          query={query}
          filters={filters}
          onQueryChange={setQuery}
          onFiltersChange={setFilters}
        />

        {/* List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          {songs.map(song => <SongListItem key={song.id} song={song} q={query} onDelete={setDeleteId} />)}
          {!loading && songs.length === 0 && (
            <p className="text-center text-gray-400 py-8">Không tìm thấy bài hát nào</p>
          )}
        </div>

        <div ref={sentinelRef} className="py-2 text-center text-sm text-gray-400">
          {loading && "Đang tải..."}
        </div>
      </div>
      <Footer />
      <CreateSongModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
      {deleteId && (
        <DeleteConfirmModal
          title="Xoá bài hát"
          message="Bạn có chắc muốn xoá bài hát này không? Hành động này không thể hoàn tác."
          confirmLabel="Xoá"
          cancelLabel="Huỷ"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}

export default function SongsPage() {
  return (
    <Suspense>
      <SongsPageInner />
    </Suspense>
  );
}
