"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import LiveList from "../_components/LiveList";
import SheetPanel from "../../../_components/SheetPanel";
import LyricPanel from "../../../_components/LyricPanel";
import NoteDialog from "../_components/NoteDialog";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LiveDashboard() {
  const { sessionId } = useParams<{ sessionId: string }>();

  const [queue, setQueue] = useState<any[]>([]);
  const [currentSongId, setCurrentSongId] = useState<string | null>(null);
  const [noteDialog, setNoteDialog] = useState({ isOpen: false, queueId: '', tone: '', note: '', rating: 5 });

  const fetchQueue = async () => {
    const { data } = await supabase
      .from("queue_registrations")
      .select(`id, singer_name, booker_phone, table_position, status, actual_tone, note, rating, created_at,
        songs ( id, title, author, song_sheets ( id, sheet_drive_url, tone_male, tone_female, verified_at ), song_lyrics ( id, slide_drive_url, source_lyric, verified_at ) )`)
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    setQueue(data || []);

    const playingSong = (data as any[])?.find(item => item.status === "playing");
    if (playingSong && !currentSongId) setCurrentSongId(playingSong.songs.id);
  };

  useEffect(() => {
    if (!sessionId) return;
    fetchQueue();
    const channel = supabase
      .channel(`queue_${sessionId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "queue_registrations", filter: `session_id=eq.${sessionId}` }, fetchQueue)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [sessionId]);

  const handlePlay = async (queueId: string, songId: string) => {
    await supabase.from("queue_registrations").update({ status: "done" }).eq("status", "playing").eq("session_id", sessionId);
    await supabase.from("queue_registrations").update({ status: "playing", actual_start: new Date().toISOString() }).eq("id", queueId);
    setCurrentSongId(songId);
  };

  const handleStop = async (queueId: string) => {
    await supabase.from("queue_registrations").update({ status: "done", actual_end: new Date().toISOString() }).eq("id", queueId);
    const next = queue.find(item => item.status === "waiting" && item.id !== queueId);
    if (next) setCurrentSongId(next.songs.id);
  };

  const handleViewSong = (songId: string) => {
    setCurrentSongId(songId);
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
    await supabase.from("queue_registrations")
      .update({ actual_tone: noteDialog.tone, note: noteDialog.note, rating: noteDialog.rating })
      .eq("id", noteDialog.queueId);
    setNoteDialog({ ...noteDialog, isOpen: false });
    fetchQueue();
  };

  const [queueOpen, setQueueOpen] = useState(false);

  const currentSong = queue.find(q => q.songs?.id === currentSongId)?.songs;
  const sheets = currentSong?.song_sheets ?? [];
  const lyrics = currentSong?.song_lyrics ?? [];
  const waitingCount = queue.filter(q => q.status === "waiting").length;

  const handleViewSongAndCollapse = (songId: string) => {
    handleViewSong(songId);
    setQueueOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-6 font-sans">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8">

        {/* Desktop sidebar — always visible on md+ */}
        <div className="hidden md:block md:w-1/3 shrink-0">
          <LiveList
            queue={queue}
            onPlay={handlePlay}
            onStop={handleStop}
            onViewSong={handleViewSong}
            onOpenNote={setNoteDialog}
            onPresent={handlePresent}
          />
        </div>

        {/* Mobile drawer — slide in from left as overlay */}
        {queueOpen && (
          <div className="md:hidden fixed inset-0 z-40 flex">
            <div className="w-80 max-w-[85vw] h-full overflow-y-auto bg-white dark:bg-gray-900 shadow-2xl">
              <LiveList
                queue={queue}
                onPlay={handlePlay}
                onStop={handleStop}
                onViewSong={handleViewSongAndCollapse}
                onOpenNote={setNoteDialog}
              />
            </div>
            {/* Backdrop */}
            <div className="flex-1 bg-black/50" onClick={() => setQueueOpen(false)} />
          </div>
        )}

        <div className="w-full md:w-2/3 flex flex-col gap-4">
          <SheetPanel
            key={`sheet-${currentSongId ?? "none"}`}
            sheets={sheets}
            hasSong={!!currentSongId}
          />
          <LyricPanel
            key={`lyric-${currentSongId ?? "none"}`}
            lyrics={lyrics}
            onPresent={handlePresent}
            hasSong={!!currentSongId}
          />
        </div>
      </div>

      {/* Mobile queue toggle FAB */}
      <button
        className="md:hidden fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-xl font-medium text-sm transition-colors"
        onClick={() => setQueueOpen(v => !v)}
      >
        🎤 {waitingCount} chờ / {queue.length} tổng
      </button>

      <NoteDialog
        state={noteDialog}
        onChange={setNoteDialog}
        onSave={saveNote}
      />
    </div>
  );
}
