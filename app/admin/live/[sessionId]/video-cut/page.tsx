"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { SegmentState, formatTime } from "./_components/VideoTimeline";
import SegmentPreview from "./_components/SegmentPreview";
import { useFFmpeg } from "./_components/useFFmpeg";
import { getMp4CreationTime } from "./_components/parseMp4Time";
import vi from "@/lib/vi";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type RawSegment = {
  registration_id: string;
  song_title: string;
  singer_name: string;
  actual_start_iso: string;
  actual_end_iso: string;
  video_url?: string | null;
};

function computeOffsets(raws: RawSegment[], videoStartIso: string): SegmentState[] {
  const videoStart = new Date(videoStartIso).getTime();
  return raws.map((s) => {
    const actualStart = new Date(s.actual_start_iso).getTime();
    const actualEnd = new Date(s.actual_end_iso).getTime();
    const effectiveStart = Math.max(actualStart, videoStart);
    return {
      registrationId: s.registration_id,
      songTitle: s.song_title,
      singerName: s.singer_name,
      actualStartIso: s.actual_start_iso,
      actualEndIso: s.actual_end_iso,
      startSeconds: Math.max(0, (effectiveStart - videoStart) / 1000),
      durationSeconds: Math.max(0, (actualEnd - effectiveStart) / 1000),
      videoUrl: s.video_url ?? null,
      status: s.video_url ? ("done" as const) : ("idle" as const),
    };
  });
}

function isoToDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const STATUS_BADGE = vi.videoCut.statusBadge;
const STATUS_LABEL = vi.videoCut.statusLabel;

export default function VideoCutPage() {
  const { sessionId } = useParams<{ sessionId: string }>();

  const [rawSegments, setRawSegments] = useState<RawSegment[]>([]);
  const [segments, setSegments] = useState<SegmentState[]>([]);
  const [loadingSegments, setLoadingSegments] = useState(true);
  const [segmentsError, setSegmentsError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const [videoStartInput, setVideoStartInput] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoSaveTime, setVideoSaveTime] = useState<number | null>(null); // ms, from mp4 metadata or lastModified
  const [videoObjectUrl, setVideoObjectUrl] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { loaded: ffmpegLoaded, loading: ffmpegLoading, load: loadFFmpeg, cut } = useFFmpeg();

  // Fetch segments
  useEffect(() => {
    fetch(`${API}/api/sessions/${sessionId}/video-segments`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((data) => {
        const raws: RawSegment[] = data.segments ?? [];
        setRawSegments(raws);
        const firstStart = raws[0]?.actual_start_iso ?? new Date().toISOString();
        setVideoStartInput(isoToDatetimeLocal(firstStart));
        setSegments(computeOffsets(raws, new Date(firstStart).toISOString()));
      })
      .catch((e) => setSegmentsError(String(e)))
      .finally(() => setLoadingSegments(false));
  }, [sessionId]);

  // Seek video when selecting a song
  useEffect(() => {
    if (selectedIndex === null || !videoRef.current) return;
    const seg = segments[selectedIndex];
    if (seg) videoRef.current.currentTime = seg.startSeconds;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex]);

  const handleVideoStartChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setVideoStartInput(val);
    if (!val) return;
    const iso = new Date(val).toISOString();
    setSegments((prev) =>
      computeOffsets(rawSegments, iso).map((s, i) => ({
        ...s, status: prev[i]?.status ?? s.status, videoUrl: prev[i]?.videoUrl ?? s.videoUrl,
      }))
    );
  }, [rawSegments]);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (videoObjectUrl) URL.revokeObjectURL(videoObjectUrl);
    setVideoFile(file);
    setVideoObjectUrl(URL.createObjectURL(file));
    setError(null);

    // Prefer MP4 embedded creation_time (survives file transfer), fall back to lastModified
    const mp4Date = await getMp4CreationTime(file);
    setVideoSaveTime(mp4Date ? mp4Date.getTime() : file.lastModified);

    if (!ffmpegLoaded) await loadFFmpeg();
  }, [videoObjectUrl, ffmpegLoaded, loadFFmpeg]);

  const updateSegment = useCallback((index: number, partial: Partial<SegmentState>) => {
    setSegments((prev) => prev.map((s, i) => (i === index ? { ...s, ...partial } : s)));
  }, []);

  const handleAdjust = useCallback((field: "startSeconds" | "durationSeconds", delta: number) => {
    if (selectedIndex === null) return;
    setSegments((prev) => {
      const seg = prev[selectedIndex];
      if (!seg) return prev;
      let newStart = seg.startSeconds;
      let newDur = seg.durationSeconds;
      if (field === "startSeconds") {
        newStart = Math.max(0, seg.startSeconds + delta);
        newDur = seg.durationSeconds - delta; // keep end fixed
      } else {
        newDur = Math.max(1, seg.durationSeconds + delta);
      }
      const updated = { ...seg, startSeconds: newStart, durationSeconds: newDur };
      // Seek video to new start if adjusting start
      if (field === "startSeconds" && videoRef.current) {
        videoRef.current.currentTime = newStart;
      }
      return prev.map((s, i) => (i === selectedIndex ? updated : s));
    });
  }, [selectedIndex]);

  const handleEdit = useCallback((index: number) => {
    updateSegment(index, { status: "idle" });
  }, [updateSegment]);

  const processSegment = useCallback(async (index: number) => {
    if (!videoFile || !ffmpegLoaded) return;
    const seg = segments[index];
    updateSegment(index, { status: "cutting" });
    try {
      const blob = await cut(videoFile, seg.startSeconds, seg.durationSeconds);
      updateSegment(index, { status: "uploading" });
      const form = new FormData();
      form.append("file", blob, "clip.mp4");
      const res = await fetch(`${API}/api/queue/registrations/${seg.registrationId}/video-url`, {
        method: "POST", body: form,
      });
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      const { video_url } = await res.json();
      updateSegment(index, { status: "done", videoUrl: video_url });
    } catch (err) {
      updateSegment(index, { status: "error" });
      setError(String(err));
    }
  }, [videoFile, ffmpegLoaded, segments, cut, updateSegment]);

  const handleCutSelected = useCallback(async () => {
    if (selectedIndex === null) return;
    setProcessing(true);
    setError(null);
    await processSegment(selectedIndex);
    setProcessing(false);
  }, [selectedIndex, processSegment]);

  const handleCutAll = useCallback(async () => {
    setProcessing(true);
    setError(null);
    for (let i = 0; i < segments.length; i++) {
      // Skip already-done segments; user must click "Sửa lại" individually to re-cut
      if (segments[i].status !== "done") await processSegment(i);
    }
    setProcessing(false);
  }, [segments, processSegment]);

  const selected = selectedIndex !== null ? segments[selectedIndex] : null;
  const doneCount = segments.filter(s => s.status === "done").length;

  return (
    <div className="min-h-screen md:h-screen bg-gray-900 text-white flex flex-col md:overflow-hidden">
      {/* Top bar */}
      <div className="flex flex-col gap-2 px-4 py-2 border-b border-gray-700 shrink-0 sm:flex-row sm:items-center sm:flex-wrap">
        <div className="flex items-center gap-2">
          <a href={`/admin/live/${sessionId}`} className="text-gray-400 hover:text-white text-sm">← Live</a>
          <span className="text-gray-600">/</span>
          <h1 className="text-sm font-semibold">✂ Cắt video</h1>
          {segments.length > 0 && (
            <span className="text-xs text-gray-500">{doneCount}/{segments.length} xong</span>
          )}
        </div>

        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2 sm:ml-4">
          <label className="text-xs text-gray-400">{vi.videoCut.videoStartLabel}</label>
          <input
            type="datetime-local"
            value={videoStartInput}
            onChange={handleVideoStartChange}
            className="text-xs bg-gray-800 border border-gray-600 text-white rounded px-2 py-1 w-full sm:w-auto"
          />
        </div>

        <div className="flex items-center gap-2 sm:ml-auto">
          {ffmpegLoading && <span className="text-xs text-yellow-400">{vi.videoCut.loadingFFmpeg}</span>}
          {error && <span className="text-xs text-red-400 truncate max-w-xs">{error}</span>}
          <button
            onClick={handleCutAll}
            disabled={!videoFile || !ffmpegLoaded || processing || segments.length === 0}
            className="text-xs px-3 py-1.5 rounded bg-green-600 hover:bg-green-500 text-white disabled:opacity-40"
          >
            {processing ? vi.videoCut.processingBtn : vi.videoCut.cutAllBtn}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col md:flex-row md:flex-1 md:overflow-hidden">

        {/* Left: Song list */}
        <div className="md:w-72 shrink-0 flex flex-col border-b md:border-b-0 md:border-r border-gray-700 md:overflow-y-auto">
          {/* File picker */}
          <label className="flex items-center gap-2 px-4 py-3 border-b border-gray-700 cursor-pointer hover:bg-gray-800/50 transition-colors">
            <span className="text-lg">🎬</span>
            <div className="flex-1 min-w-0">
              {videoFile ? (
                <span className="text-xs text-gray-300 truncate block">{videoFile.name}</span>
              ) : (
                <span className="text-xs text-gray-400">{vi.videoCut.pickVideo}</span>
              )}
            </div>
            <input type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
          </label>

          {/* Song list */}
          <div className="flex-1 overflow-y-auto">
            {loadingSegments ? (
              <p className="text-xs text-gray-500 text-center py-8">Đang tải...</p>
            ) : segmentsError ? (
              <p className="text-xs text-red-400 text-center py-8">{segmentsError}</p>
            ) : segments.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-8">Chưa có dữ liệu thời gian</p>
            ) : (
              <ul>
                {segments.map((seg, i) => (
                  <li
                    key={seg.registrationId}
                    onClick={() => setSelectedIndex(i)}
                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer border-b border-gray-800 transition-colors ${
                      selectedIndex === i
                        ? "bg-blue-900/40 border-l-2 border-l-blue-500"
                        : "hover:bg-gray-800/50"
                    }`}
                  >
                    <span className="text-xs text-gray-500 mt-0.5 w-5 shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{seg.songTitle}</p>
                      <p className="text-xs text-gray-400 truncate">{seg.singerName}</p>
                      <p className="text-xs text-gray-500">{formatTime(seg.durationSeconds)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${STATUS_BADGE[seg.status]}`}>
                        {STATUS_LABEL[seg.status]}
                      </span>
                      {seg.videoUrl && (
                        <a
                          href={seg.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[10px] text-green-400 hover:text-green-300 underline"
                        >
                          {vi.videoCut.driveLink}
                        </a>
                      )}
                      {seg.status === "done" && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEdit(i); }}
                          className="text-[10px] text-gray-400 hover:text-white"
                        >
                          {vi.videoCut.editBtn}
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right: Video preview for selected song */}
        <div className="flex-1 flex flex-col md:overflow-hidden">
          {!videoFile ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-500">
              <div className="text-4xl mb-3">🎬</div>
              <p className="text-sm">Chọn file video ở danh sách bên trái</p>
            </div>
          ) : !selected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-500">
              <div className="text-4xl mb-3">👈</div>
              <p className="text-sm">Chọn một bài để xem và điều chỉnh</p>
            </div>
          ) : (
            <div className="flex flex-col md:h-full md:overflow-hidden">
              {/* Video */}
              <div className="md:flex-1 md:overflow-hidden bg-black">
                <video
                  ref={videoRef}
                  src={videoObjectUrl ?? undefined}
                  controls
                  className="w-full bg-black object-contain max-h-[40vh] md:max-h-none md:h-full"
                  onLoadedMetadata={() => {
                    const dur = videoRef.current?.duration ?? 0;
                    if (videoSaveTime && dur > 0) {
                      const autoIso = new Date(videoSaveTime - dur * 1000).toISOString();
                      setVideoStartInput(isoToDatetimeLocal(autoIso));
                      setSegments((prev) =>
                        computeOffsets(rawSegments, autoIso).map((s, i) => ({
                          ...s, status: prev[i]?.status ?? s.status, videoUrl: prev[i]?.videoUrl ?? s.videoUrl,
                        }))
                      );
                    }
                    // Seek to selected segment
                    if (selectedIndex !== null && videoRef.current) {
                      videoRef.current.currentTime = segments[selectedIndex]?.startSeconds ?? 0;
                    }
                  }}
                  onTimeUpdate={() => {
                    const t = videoRef.current?.currentTime ?? 0;
                    setCurrentTime(t);
                    // Auto-pause at segment end
                    if (selected && t >= selected.startSeconds + selected.durationSeconds) {
                      videoRef.current?.pause();
                    }
                  }}
                />
              </div>

              {/* Controls */}
              <div className="shrink-0 p-4 border-t border-gray-700 space-y-4">
                {/* Song title */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">{selected.songTitle}</p>
                    <p className="text-xs text-gray-400">{selected.singerName} · {formatTime(selected.durationSeconds)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_BADGE[selected.status]}`}>
                      {STATUS_LABEL[selected.status]}
                    </span>
                    {selected.videoUrl && (
                      <a href={selected.videoUrl} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-green-400 hover:text-green-300 underline">Drive ↗</a>
                    )}
                  </div>
                </div>

                {/* Segment mini-timeline + +/- controls */}
                <SegmentPreview
                  segment={selected}
                  currentTime={currentTime}
                  onAdjust={handleAdjust}
                />

                {/* Cut / Edit buttons */}
                {selected.status === "done" ? (
                  <button
                    onClick={() => handleEdit(selectedIndex!)}
                    className="w-full py-2.5 rounded-lg text-sm font-medium bg-gray-600 hover:bg-gray-500 text-white transition-colors"
                  >
                    {vi.videoCut.editBtn}
                  </button>
                ) : (
                  <button
                    onClick={handleCutSelected}
                    disabled={processing || !ffmpegLoaded}
                    className="w-full py-2.5 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 transition-colors"
                  >
                    {selected.status === "cutting" ? vi.videoCut.cuttingBtn
                      : selected.status === "uploading" ? vi.videoCut.uploadingBtn
                      : vi.videoCut.cutBtn}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
