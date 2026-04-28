"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Header from "../../_components/Header";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type QueueRow = {
  id: string;
  singer_name: string;
  booker_phone?: string;
  status: string;
  created_at: string;
  songs?: { id: string; title: string; author?: string }[] | null;
  free_text_song_name?: string;
};

const STATUS_LABEL: Record<string, string> = {
  waiting: "Chờ",
  playing: "Đang hát",
  done: "Đã hát",
};

export default function SchedulePage() {
  const [queue, setQueue] = useState<QueueRow[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Find today's session (live first, else planned, pick first by date)
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    supabase
      .from("live_sessions")
      .select("id, status, session_date")
      .eq("session_date", today)
      .order("status", { ascending: true }) // "live" < "planned" alphabetically — fine
      .limit(2)
      .then(({ data, error: err }) => {
        if (err || !data?.length) {
          setError("Không có buổi diễn nào hôm nay.");
          setLoading(false);
          return;
        }
        // Prefer live session, else first one
        const live = data.find(s => s.status === "live") ?? data[0];
        setSessionId(live.id);
      });
  }, []);

  // Fetch queue once session is known, then subscribe to realtime updates
  useEffect(() => {
    if (!sessionId) return;

    const fetchQueue = async () => {
      const { data } = await supabase
        .from("queue_registrations")
        .select("id, singer_name, booker_phone, status, created_at, free_text_song_name, songs ( id, title, author )")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });
      setQueue((data as unknown as QueueRow[]) || []);
      setLoading(false);
    };

    fetchQueue();

    const channel = supabase
      .channel(`user_list_${sessionId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "queue_registrations", filter: `session_id=eq.${sessionId}` }, fetchQueue)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="w-full px-2 sm:px-4 py-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-4 px-2">🎵 Lịch diễn hôm nay</h1>

        {loading && (
          <p className="text-center text-gray-400 py-16">Đang tải...</p>
        )}
        {error && (
          <p className="text-center text-gray-400 py-16">{error}</p>
        )}

        {!loading && !error && (
          <div className="w-full overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  <th className="px-3 py-3 w-10 text-center">#</th>
                  <th className="px-3 py-3">Bài hát</th>
                  <th className="px-3 py-3 hidden sm:table-cell">Tác giả</th>
                  <th className="px-3 py-3">Khách hát</th>
                  <th className="px-3 py-3 hidden md:table-cell">Số điện thoại</th>
                  <th className="px-3 py-3 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {queue.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-gray-400 py-10">Chưa có ai đăng ký</td>
                  </tr>
                )}
                {queue.map((item, i) => {
                  const isDone = item.status === "done";
                  const isPlaying = item.status === "playing";
                  const song = item.songs?.[0];
                  const songTitle = song?.title ?? item.free_text_song_name ?? "—";
                  const songAuthor = song?.author ?? "";

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors ${
                        isDone
                          ? "opacity-40 bg-white dark:bg-gray-900"
                          : isPlaying
                          ? "bg-blue-50 dark:bg-blue-950"
                          : "bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/60"
                      }`}
                    >
                      <td className="px-3 py-3 text-center text-gray-400 tabular-nums text-xs">{i + 1}</td>
                      <td className="px-3 py-3 font-medium text-gray-900 dark:text-white">
                        {songTitle}
                        {/* Show author inline on mobile where the column is hidden */}
                        {songAuthor && (
                          <span className="sm:hidden block text-xs text-gray-400 font-normal">{songAuthor}</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-gray-500 dark:text-gray-400 hidden sm:table-cell">{songAuthor}</td>
                      <td className="px-3 py-3 text-gray-700 dark:text-gray-300">{item.singer_name}</td>
                      <td className="px-3 py-3 text-gray-500 dark:text-gray-400 font-mono text-xs hidden md:table-cell">
                        {item.booker_phone ?? "—"}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {isPlaying ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-500 text-white">
                            ● LIVE
                          </span>
                        ) : (
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                            isDone
                              ? "bg-gray-100 dark:bg-gray-800 text-gray-400"
                              : "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                          }`}>
                            {STATUS_LABEL[item.status] ?? item.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}