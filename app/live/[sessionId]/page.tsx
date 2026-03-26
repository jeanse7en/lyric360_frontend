"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import LiveList from "../_components/LiveList";
import SheetPanel from "../_components/SheetPanel";
import LyricPanel from "../_components/LyricPanel";
import NoteDialog from "../_components/NoteDialog";
import FullscreenOverlay from "../_components/FullscreenOverlay";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LiveDashboard() {
  const { sessionId } = useParams<{ sessionId: string }>();

  const [queue, setQueue] = useState<any[]>([]);
  const [currentSongId, setCurrentSongId] = useState<string | null>(null);
  const [selectedSheetUrl, setSelectedSheetUrl] = useState<string | null>(null);
  const [selectedLyricUrl, setSelectedLyricUrl] = useState<string | null>(null);
  const [fullScreenMode, setFullScreenMode] = useState<'none' | 'sheet' | 'lyric'>('none');
  const [noteDialog, setNoteDialog] = useState({ isOpen: false, queueId: '', tone: '', note: '', rating: 5 });

  const fetchQueue = async () => {
    const { data } = await supabase
      .from("queue_registrations")
      .select(`id, singer_name, booker_phone, table_position, status, actual_tone, note, rating, created_at,
        songs ( id, title, author, song_sheets ( sheet_drive_url, tone_male, tone_female ), song_lyrics ( slide_drive_url ) )`)
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
    setSelectedSheetUrl(null);
    setSelectedLyricUrl(null);
  };

  const handleStop = async (queueId: string) => {
    await supabase.from("queue_registrations").update({ status: "done", actual_end: new Date().toISOString() }).eq("id", queueId);
    const next = queue.find(item => item.status === "waiting" && item.id !== queueId);
    if (next) setCurrentSongId(next.songs.id);
  };

  const handleViewSong = (songId: string) => {
    setCurrentSongId(songId);
    const song = queue.find(q => q.songs?.id === songId)?.songs;
    const firstSheet = song?.song_sheets?.[0];
    const firstLyric = song?.song_lyrics?.[0];
    setSelectedSheetUrl(firstSheet?.sheet_drive_url?.replace('/view', '/preview') ?? null);
    setSelectedLyricUrl(firstLyric?.slide_drive_url?.replace(/\/edit.*/, "/embed?rm=minimal") ?? null);
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

  const currentSong = queue.find(q => q.songs?.id === currentSongId)?.songs;
  const sheets = currentSong?.song_sheets ?? [];
  const lyrics = currentSong?.song_lyrics ?? [];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 font-sans">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8">

        <LiveList
          queue={queue}
          onPlay={handlePlay}
          onStop={handleStop}
          onViewSong={handleViewSong}
          onOpenNote={setNoteDialog}
        />

        <div className="w-full md:w-2/3 flex flex-col gap-4">
          <SheetPanel
            sheets={sheets}
            selectedUrl={selectedSheetUrl}
            onSelect={setSelectedSheetUrl}
            onFullscreen={() => setFullScreenMode('sheet')}
            hasSong={!!currentSongId}
          />
          <LyricPanel
            lyrics={lyrics}
            selectedUrl={selectedLyricUrl}
            onSelect={setSelectedLyricUrl}
            onFullscreen={() => setFullScreenMode('lyric')}
            onPresent={handlePresent}
            hasSong={!!currentSongId}
          />
        </div>
      </div>

      {fullScreenMode !== 'none' && (
        <FullscreenOverlay
          mode={fullScreenMode}
          sheetUrl={selectedSheetUrl}
          lyricUrl={selectedLyricUrl}
          onClose={() => setFullScreenMode('none')}
        />
      )}

      <NoteDialog
        state={noteDialog}
        onChange={setNoteDialog}
        onSave={saveNote}
      />
    </div>
  );
}
