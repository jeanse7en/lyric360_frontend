"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import SongListItem from "./_components/SongListItem";
import vi from "../../../lib/vi";
import SongFilter, { type VerifyStatus } from "./_components/SongFilter";
import Header from "../../_components/Header";
import Footer from "../../_components/Footer";
import CreateSongModal from "./_components/CreateSongModal";

type Song = {
  id: string;
  title: string;
  author?: string;
  lyric_count: number;
  sheet_count: number;
  unverified_count: number;
};

const API = process.env.NEXT_PUBLIC_API_URL;

function buildUrl(query: string, verifyStatus: VerifyStatus) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (verifyStatus) params.set("verifyStatus", verifyStatus);
  const qs = params.toString();
  return `/admin/songs${qs ? `?${qs}` : ""}`;
}

function SongsPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [songs, setSongs] = useState<Song[]>([]);
  const [unverifiedCount, setUnverifiedCount] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [verifyStatus, setVerifyStatus] = useState<VerifyStatus>(
    (searchParams.get("verifyStatus") as VerifyStatus) ?? ""
  );
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchSongs = async (search: string, status: VerifyStatus, currentOffset: number, append = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ offset: String(currentOffset), limit: "20" });
      if (search) params.set("q", search);
      if (status) params.set("verify_status", status);
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
    fetchSongs(query, verifyStatus, 0);
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      router.replace(buildUrl(query, verifyStatus));
      setOffset(0);
      fetchSongs(query, verifyStatus, 0);
    }, 300);
    return () => clearTimeout(id);
  }, [query, verifyStatus]);

  const loadMore = () => {
    const next = offset + 20;
    setOffset(next);
    fetchSongs(query, verifyStatus, next, true);
  };

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting && hasMore && !loading) loadMore(); },
      { threshold: 0.1 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, offset, query, verifyStatus]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header />
      <div className="flex-1 max-w-2xl w-full mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{vi.songsPage.title}</h1>
          <div className="flex items-center gap-2">
          {unverifiedCount > 0 && (
            <button
              onClick={() => { setQuery(""); setVerifyStatus("UNVERIFIED_ALL"); }}
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
          verifyStatus={verifyStatus}
          onQueryChange={setQuery}
          onVerifyStatusChange={setVerifyStatus}
        />

        {/* List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          {songs.map(song => <SongListItem key={song.id} song={song} q={query} />)}
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
