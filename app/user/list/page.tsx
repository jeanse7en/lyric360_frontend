"use client";

import { useEffect, useState } from "react";
import Header from "../../_components/Header";
import DataTable, { type Column } from "../../_components/DataTable";

const API = process.env.NEXT_PUBLIC_API_URL;

type Song = { id: string; title: string; author?: string | null };

type QueueRow = {
  id: string;
  singer_name: string;
  booker_phone?: string | null;
  status: string;
  created_at: string;
  free_text_song_name?: string | null;
  songs?: Song | null;
};

const STATUS_LABEL: Record<string, string> = {
  waiting: "Chờ",
  playing: "Đang hát",
  done: "Đã hát",
};

const columns: Column<QueueRow>[] = [
  {
    key: "index",
    header: "#",
    headerClassName: "w-10 text-center",
    cellClassName: "text-center text-gray-400 tabular-nums text-xs",
    cell: (_, i) => i + 1,
  },
  {
    key: "song",
    header: "Bài hát",
    cellClassName: "font-medium text-gray-900 dark:text-white",
    cell: row => {
      const title = row.songs?.title ?? row.free_text_song_name ?? "—";
      const author = row.songs?.author ?? "";
      return (
        <>
          {title}
          {author && <span className="sm:hidden block text-xs text-gray-400 font-normal">{author}</span>}
        </>
      );
    },
  },
  {
    key: "author",
    header: "Tác giả",
    headerClassName: "hidden sm:table-cell",
    cellClassName: "hidden sm:table-cell text-gray-500 dark:text-gray-400",
    cell: row => row.songs?.author ?? "",
  },
  {
    key: "singer",
    header: "Khách hát",
    cellClassName: "text-gray-700 dark:text-gray-300",
    cell: row => row.singer_name,
  },
  {
    key: "phone",
    header: "Số điện thoại",
    headerClassName: "hidden md:table-cell",
    cellClassName: "hidden md:table-cell text-gray-500 dark:text-gray-400 font-mono text-xs",
    cell: row => row.booker_phone ?? "—",
  },
  {
    key: "status",
    header: "Trạng thái",
    headerClassName: "text-center",
    cellClassName: "text-center",
    cell: row => {
      const isPlaying = row.status === "playing";
      const isDone = row.status === "done";
      return isPlaying ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-500 text-white">
          ● LIVE
        </span>
      ) : (
        <span
          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
            isDone
              ? "bg-gray-100 dark:bg-gray-800 text-gray-400"
              : "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
          }`}
        >
          {STATUS_LABEL[row.status] ?? row.status}
        </span>
      );
    },
  },
];

export default function SchedulePage() {
  const [queue, setQueue] = useState<QueueRow[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API}/api/sessions/today`)
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (!data) { setError("Không có buổi diễn nào hôm nay."); setLoading(false); return; }
        setSessionId(data.id);
      })
      .catch(() => { setError("Không thể tải dữ liệu."); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    const fetchQueue = () =>
      fetch(`${API}/api/sessions/${sessionId}/queue`)
        .then(r => (r.ok ? r.json() : []))
        .then((data: QueueRow[]) => { setQueue(data); setLoading(false); })
        .catch(() => setLoading(false));
    fetchQueue();
    const interval = setInterval(fetchQueue, 15000);
    return () => clearInterval(interval);
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header hideNav />
      <main className="w-full px-2 sm:px-4 py-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-4 px-2">🎵 Lịch diễn hôm nay</h1>

        {loading && <p className="text-center text-gray-400 py-16">Đang tải...</p>}
        {error && <p className="text-center text-gray-400 py-16">{error}</p>}

        {!loading && !error && (
          <DataTable
            columns={columns}
            rows={queue}
            keyFn={r => r.id}
            emptyMessage="Chưa có ai đăng ký"
            getRowClassName={row => {
              if (row.status === "playing") return "!bg-blue-50 dark:!bg-blue-950";
              if (row.status === "done") return "opacity-40";
              return "";
            }}
          />
        )}
      </main>
    </div>
  );
}
