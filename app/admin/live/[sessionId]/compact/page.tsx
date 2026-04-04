"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import SongDrawer from "./_components/SongDrawer";
import NoteDialog from "../../_components/NoteDialog";
import FullscreenOverlay from "../../../../_components/FullscreenOverlay";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function CompactLivePage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();

  const [queue, setQueue] = useState<any[]>([]);
  const [drawerItem, setDrawerItem] = useState<any | null>(null);
  const [fullscreenUrl, setFullscreenUrl] = useState<string | null>(null);
  const [noteDialog, setNoteDialog] = useState({ isOpen: false, queueId: "", tone: "", note: "", rating: 5 });

  const fetchQueue = async () => {
    const { data } = await supabase
      .from("queue_registrations")
      .select(`id, singer_name, booker_phone, table_position, status, actual_tone, note, rating, created_at,
        songs ( id, title, author,
          song_sheets ( id, sheet_drive_url, tone_male, tone_female, verified_at ),
          song_lyrics ( id, slide_drive_url, source_lyric, verified_at )
        )`)
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    setQueue(data || []);
  };

  useEffect(() => {
    if (!sessionId) return;
    fetchQueue();
    const channel = supabase
      .channel(`queue_compact_${sessionId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "queue_registrations", filter: `session_id=eq.${sessionId}` }, fetchQueue)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [sessionId]);

  const handlePlay = async (queueId: string, songId: string) => {
    await supabase.from("queue_registrations").update({ status: "done" }).eq("status", "playing").eq("session_id", sessionId);
    await supabase.from("queue_registrations").update({ status: "playing", actual_start: new Date().toISOString() }).eq("id", queueId);
    fetchQueue();
  };

  const handleStop = async (queueId: string) => {
    await supabase.from("queue_registrations").update({ status: "done", actual_end: new Date().toISOString() }).eq("id", queueId);
    fetchQueue();
  };

  const handlePresent = async (url: string) => {
    await supabase.from("live_sessions").update({ presenting_lyric_url: url }).eq("id", sessionId);
    await supabase.channel(`lyric_present_${sessionId}`).send({
      type: "broadcast",
      event: "present",
      payload: { url },
    });
  };

  const saveNote = async () => {
    await supabase
      .from("queue_registrations")
      .update({ actual_tone: noteDialog.tone, note: noteDialog.note, rating: noteDialog.rating })
      .eq("id", noteDialog.queueId);
    setNoteDialog({ ...noteDialog, isOpen: false });
    fetchQueue();
  };

  const waitingCount = queue.filter((q) => q.status === "waiting").length;

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      {/* ── Header ── */}
      <div className="sticky top-0 z-10 bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <a href="/admin/live" className="text-gray-400 hover:text-white text-sm transition-colors">← Quay lại</a>
        <h1 className="text-base font-bold text-blue-400">Hàng Đợi Hát</h1>
        <span className="text-xs text-gray-400">{waitingCount} chờ / {queue.length} tổng</span>
      </div>

      {/* ── Queue list ── */}
      <div className="p-3 space-y-2">
        {queue.map((item, index) => (
          <div
            key={item.id}
            onClick={() => setDrawerItem(item)}
            className={`p-3 rounded-xl border cursor-pointer transition-all select-none ${
              item.status === "playing"
                ? "bg-blue-900/60 border-blue-500"
                : item.status === "done"
                ? "bg-gray-800/40 border-gray-700 opacity-50"
                : "bg-gray-800 border-gray-700 hover:border-gray-500 active:bg-gray-700"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-mono text-gray-500 w-5 shrink-0">{index + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{item.songs?.title ?? "—"}</p>
                <p className="text-xs text-gray-400 truncate">
                  {item.singer_name}
                  {item.booker_phone && <span className="ml-2 font-mono">{item.booker_phone}</span>}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {item.status === "playing" && (
                  <span className="flex items-center gap-1.5 text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-medium">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                    </span>
                    LIVE
                  </span>
                )}
                {item.status === "waiting" && (
                  <span className="text-xs text-gray-500">Chờ</span>
                )}
                <span className="text-gray-600 text-sm">›</span>
              </div>
            </div>
          </div>
        ))}

        {queue.length === 0 && (
          <p className="text-gray-500 italic text-center py-12">Chưa có ai đăng ký</p>
        )}
      </div>

      {/* ── Song drawer ── */}
      {drawerItem && (
        <SongDrawer
          item={drawerItem}
          onPlay={handlePlay}
          onStop={handleStop}
          onPresent={handlePresent}
          onOpenNote={setNoteDialog}
          onShowSheetFullscreen={(url) => setFullscreenUrl(url)}
          onClose={() => setDrawerItem(null)}
        />
      )}

      {/* ── Sheet fullscreen (shown after Play) ── */}
      {fullscreenUrl && (
        <FullscreenOverlay
          url={fullscreenUrl}
          title="Bản Nhạc"
          onClose={() => setFullscreenUrl(null)}
          onStopLive={async () => {
            const playing = queue.find((q) => q.status === "playing");
            if (playing) await handleStop(playing.id);
            router.push(`/admin/live/${sessionId}`);
          }}
        />
      )}

      {/* ── Note dialog ── */}
      <NoteDialog state={noteDialog} onChange={setNoteDialog} onSave={saveNote} />
    </div>
  );
}
