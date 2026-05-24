"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import LiveList from "../_components/LiveList";
import { styleToParams, DEFAULT_STYLE, type LyricHtmlStyle } from "../../../_components/LyricHtmlPanel";
import SheetPanel from "../../../_components/SheetPanel";
import LyricPanel from "../../../_components/LyricPanel";
import NoteDialog from "../_components/NoteDialog";
import {
  fetchSessionInfo,
  fetchSessionQueue,
  playQueueItem,
  updateSessionPresenting,
  fetchSongDetail,
  stopQueueRegistration,
  saveRegistrationNote,
  broadcastPresent,
  type QueueItem,
  type SongDetail,
} from "../../../_lib";

export default function LiveDashboard() {
  const { sessionId } = useParams<{ sessionId: string }>();

  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentSongId, setCurrentSongId] = useState<string | null>(null);
  const [currentSongDetail, setCurrentSongDetail] = useState<SongDetail | null>(null);
  const [noteDialog, setNoteDialog] = useState({ isOpen: false, queueId: "", tone: "", note: "", rating: 5 });
  const [sessionStartedAt, setSessionStartedAt] = useState<string | null>(null);
  const [sessionDate, setSessionDate] = useState<string | null>(null);
  const [queueOpen, setQueueOpen] = useState(false);
  const currentSongIdRef = useRef<string | null>(null);
  useEffect(() => { currentSongIdRef.current = currentSongId; });

  const fetchQueue = async () => {
    const data = await fetchSessionQueue(sessionId);
    setQueue(data);
    const playingSong = data.find((item) => item.status === "playing");
    if (playingSong && !currentSongIdRef.current) setCurrentSongId(playingSong.songs?.id ?? null);
  };

  useEffect(() => {
    if (!sessionId) return;
    const load = async () => {
      const data = await fetchSessionInfo(sessionId);
      if (data?.started_at) setSessionStartedAt(data.started_at);
      if (data?.session_date) setSessionDate(data.session_date);
    };
    void load();
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    const poll = async () => {
      const data = await fetchSessionQueue(sessionId);
      setQueue(data);
      const playingSong = data.find((item) => item.status === "playing");
      if (playingSong && !currentSongIdRef.current) setCurrentSongId(playingSong.songs?.id ?? null);
    };
    void poll();
    const interval = setInterval(() => void poll(), 4000);
    return () => clearInterval(interval);
  }, [sessionId]);

  useEffect(() => {
    const load = async () => {
      if (!currentSongId) {
        setCurrentSongDetail(null);
        return;
      }
      const data = await fetchSongDetail(currentSongId);
      setCurrentSongDetail(data);
    };
    void load();
  }, [currentSongId]);

  const handlePlay = async (queueId: string, songId: string) => {
    await playQueueItem(sessionId, queueId);
    setCurrentSongId(songId);
  };

  const handleStop = async (queueId: string) => {
    await stopQueueRegistration(queueId);
    const next = queue.find((item) => item.status === "waiting" && item.id !== queueId);
    if (next) setCurrentSongId(next.songs?.id ?? null);
  };

  const handleViewSong = (songId: string) => setCurrentSongId(songId);

  const handlePresent = async (url: string) => {
    await updateSessionPresenting(sessionId, url);
    broadcastPresent(sessionId, url);
  };

  const handlePresentHtml = (lyricId: string) => handlePresentConfig(lyricId, DEFAULT_STYLE);

  const handlePresentConfig = async (lyricId: string, style: LyricHtmlStyle) => {
    const url = `/live/lyric?lyric_id=${lyricId}&${styleToParams(style)}`;
    await updateSessionPresenting(sessionId, url);
    broadcastPresent(sessionId, url);
  };

  const saveNote = async () => {
    await saveRegistrationNote(noteDialog.queueId, {
      actual_tone: noteDialog.tone,
      note: noteDialog.note,
      rating: noteDialog.rating,
    });
    setNoteDialog({ ...noteDialog, isOpen: false });
    fetchQueue();
  };

  const handleViewSongAndCollapse = (songId: string) => {
    handleViewSong(songId);
    setQueueOpen(false);
  };

  const sheets = currentSongDetail?.sheets ?? [];
  const lyrics = currentSongDetail?.lyrics ?? [];
  const waitingCount = queue.filter((q) => q.status === "waiting").length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-6 font-sans">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8">

        {/* Desktop sidebar — always visible on md+ */}
        <div className="hidden md:block md:w-1/3 shrink-0">
          <LiveList
            sessionId={sessionId}
            queue={queue}
            currentSongId={currentSongId}
            sessionStartedAt={sessionStartedAt}
            sessionDate={sessionDate}
            onPlay={handlePlay}
            onStop={handleStop}
            onViewSong={handleViewSong}
            onOpenNote={setNoteDialog}
            onPresent={handlePresent}
            onPresentHtml={handlePresentHtml}
            onRefresh={fetchQueue}
          />
        </div>

        {/* Mobile drawer — slide in from left as overlay */}
        {queueOpen && (
          <div className="md:hidden fixed inset-0 z-40 flex">
            <div className="w-80 max-w-[85vw] h-full overflow-y-auto bg-white dark:bg-gray-900 shadow-2xl">
              <LiveList
                sessionId={sessionId}
                queue={queue}
                currentSongId={currentSongId}
                sessionStartedAt={sessionStartedAt}
                sessionDate={sessionDate}
                onPlay={handlePlay}
                onStop={handleStop}
                onViewSong={handleViewSongAndCollapse}
                onOpenNote={setNoteDialog}
                onPresentHtml={handlePresentHtml}
                onRefresh={fetchQueue}
              />
            </div>
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
            onPresentConfig={handlePresentConfig}
            hasSong={!!currentSongId}
          />
        </div>
      </div>

      <button
        className="md:hidden fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-xl font-medium text-sm transition-colors"
        onClick={() => setQueueOpen((v) => !v)}
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
