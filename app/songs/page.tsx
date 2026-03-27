"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import SongListItem from "./_components/SongListItem";
import Header from "../_components/Header";
import Footer from "../_components/Footer";

type Song = {
  id: string;
  title: string;
  author?: string;
  lyric_count: number;
  sheet_count: number;
  unverified_count: number;
};

const API = process.env.NEXT_PUBLIC_API_URL;

function SongsPageInner() {
  const searchParams = useSearchParams();
  const [songs, setSongs] = useState<Song[]>([]);
  const [unverifiedCount, setUnverifiedCount] = useState(0);
  const [q, setQ] = useState(searchParams.get('q') ?? "");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const fetchSongs = async (search: string, currentOffset: number, append = false) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/songs/manage?q=${search}&offset=${currentOffset}&limit=20`);
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
    fetchSongs(q, 0);
  }, []);

  useEffect(() => {
    const id = setTimeout(() => { setOffset(0); fetchSongs(q, 0); }, 300);
    return () => clearTimeout(id);
  }, [q]);

  const loadMore = () => {
    const next = offset + 20;
    setOffset(next);
    fetchSongs(q, next, true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex-1 max-w-2xl w-full mx-auto py-6 px-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Quản Lý Bài Hát</h1>

        {/* Unverified banner */}
        {unverifiedCount > 0 && (
          <div className="mb-4 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            <span className="text-amber-600 font-medium">
              🔔 Có {unverifiedCount} bài mới cần bạn đánh giá
            </span>
          </div>
        )}

        {/* Search */}
        <input
          type="text"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Tìm kiếm bài hát..."
          className="w-full px-4 py-2 border rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 bg-white"
        />

        {/* List */}
        <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
          {songs.map(song => <SongListItem key={song.id} song={song} q={q} />)}
          {!loading && songs.length === 0 && (
            <p className="text-center text-gray-400 py-8">Không tìm thấy bài hát nào</p>
          )}
        </div>

        {hasMore && (
          <button onClick={loadMore} disabled={loading} className="mt-4 w-full py-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
            {loading ? "Đang tải..." : "⬇ Tải thêm"}
          </button>
        )}
      </div>
      <Footer />
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