"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import VideoTimeline, { SegmentState } from "./_components/VideoTimeline";
import SegmentList from "./_components/SegmentList";
import { useFFmpeg } from "./_components/useFFmpeg";

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
    const startSeconds = Math.max(0, (effectiveStart - videoStart) / 1000);
    const durationSeconds = Math.max(0, (actualEnd - effectiveStart) / 1000);
    return {
      registrationId: s.registration_id,
      songTitle: s.song_title,
      singerName: s.singer_name,
      actualStartIso: s.actual_start_iso,
      actualEndIso: s.actual_end_iso,
      startSeconds,
      durationSeconds,
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

export default function VideoCutPage() {
  const { sessionId } = useParams<{ sessionId: string }>();

  const [rawSegments, setRawSegments] = useState<RawSegment[]>([]);
  const [segments, setSegments] = useState<SegmentState[]>([]);
  const [loadingSegments, setLoadingSegments] = useState(true);
  const [segmentsError, setSegmentsError] = useState<string | null>(null);

  const [videoStartInput, setVideoStartInput] = useState("");

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoLastModified, setVideoLastModified] = useState<number | null>(null);
  const [videoObjectUrl, setVideoObjectUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [processing, setProcessing] = useState(false);
  const [ffmpegError, setFfmpegError] = useState<string | null>(null);

  const { loaded: ffmpegLoaded, loading: ffmpegLoading, load: loadFFmpeg, cut } = useFFmpeg();

  useEffect(() => {
    setLoadingSegments(true);
    fetch(`${API}/api/sessions/${sessionId}/video-segments`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
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

  const handleVideoStartChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setVideoStartInput(val);
      if (!val) return;
      const iso = new Date(val).toISOString();
      setSegments((prev) =>
        computeOffsets(rawSegments, iso).map((newSeg, i) => ({
          ...newSeg,
          status: prev[i]?.status ?? newSeg.status,
          videoUrl: prev[i]?.videoUrl ?? newSeg.videoUrl,
        }))
      );
    },
    [rawSegments]
  );

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (videoObjectUrl) URL.revokeObjectURL(videoObjectUrl);
      setVideoFile(file);
      setVideoLastModified(file.lastModified);
      setVideoObjectUrl(URL.createObjectURL(file));
      setVideoDuration(0);
      setFfmpegError(null);
      if (!ffmpegLoaded) await loadFFmpeg();
    },
    [videoObjectUrl, ffmpegLoaded, loadFFmpeg]
  );

  const updateSegment = useCallback((index: number, partial: Partial<SegmentState>) => {
    setSegments((prev) => prev.map((s, i) => (i === index ? { ...s, ...partial } : s)));
  }, []);

  const handleAdjust = useCallback(
    (index: number, field: "startSeconds" | "durationSeconds", value: number) => {
      updateSegment(index, { [field]: value });
    },
    [updateSegment]
  );

  const processSegment = useCallback(
    async (index: number) => {
      if (!videoFile || !ffmpegLoaded) return;
      const seg = segments[index];
      if (seg.status === "done") return;
      updateSegment(index, { status: "cutting" });
      try {
        const blob = await cut(videoFile, seg.startSeconds, seg.durationSeconds);
        updateSegment(index, { status: "uploading" });
        const form = new FormData();
        form.append("file", blob, "clip.mp4");
        const res = await fetch(
          `${API}/api/queue/registrations/${seg.registrationId}/video-url`,
          { method: "POST", body: form }
        );
        if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
        const { video_url } = await res.json();
        updateSegment(index, { status: "done", videoUrl: video_url });
      } catch (err) {
        console.error("Segment error:", err);
        updateSegment(index, { status: "error" });
        setFfmpegError(`Segment ${index + 1}: ${String(err)}`);
      }
    },
    [videoFile, ffmpegLoaded, segments, cut, updateSegment]
  );

  const handleCutAll = useCallback(async () => {
    setProcessing(true);
    setFfmpegError(null);
    for (let i = 0; i < segments.length; i++) {
      if (segments[i].status !== "done") await processSegment(i);
    }
    setProcessing(false);
  }, [segments, processSegment]);

  const handleCutOne = useCallback(
    async (index: number) => {
      setProcessing(true);
      setFfmpegError(null);
      await processSegment(index);
      setProcessing(false);
    },
    [processSegment]
  );

  const handleSeek = useCallback((seconds: number) => {
    if (videoRef.current) videoRef.current.currentTime = seconds;
  }, []);

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-700 shrink-0 flex-wrap gap-y-2">
        <a href={`/admin/live/${sessionId}`} className="text-gray-400 hover:text-white text-sm shrink-0">
          ← Live
        </a>
        <span className="text-gray-600">/</span>
        <h1 className="text-sm font-semibold shrink-0">✂ Cắt video</h1>

        <div className="flex items-center gap-2 ml-4">
          <label className="text-xs text-gray-400 shrink-0">Video bắt đầu lúc:</label>
          <input
            type="datetime-local"
            value={videoStartInput}
            onChange={handleVideoStartChange}
            className="text-xs bg-gray-800 border border-gray-600 text-white rounded px-2 py-1"
          />
          <span className="text-xs text-gray-500">(điều chỉnh nếu sai lệch)</span>
        </div>

        {ffmpegLoading && (
          <span className="ml-auto text-xs text-yellow-400 bg-yellow-900/40 rounded px-2 py-1 shrink-0">
            Đang tải FFmpeg.wasm...
          </span>
        )}
        {ffmpegError && (
          <span className="ml-2 text-xs text-red-400 bg-red-900/40 rounded px-2 py-1 max-w-xs truncate">
            {ffmpegError}
          </span>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — video + timeline */}
        <div className="w-[55%] flex flex-col border-r border-gray-700 overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden">
            {!videoObjectUrl ? (
              <label className="flex-1 flex flex-col items-center justify-center cursor-pointer text-center p-8 hover:bg-gray-800/40 transition-colors">
                <div className="text-4xl mb-3">🎬</div>
                <div className="text-gray-300 text-sm mb-1">
                  {ffmpegLoading ? "Đang tải FFmpeg..." : "Chọn file video để cắt"}
                </div>
                <div className="text-xs text-gray-600">MP4, MOV, AVI · xử lý trên trình duyệt</div>
                <input type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
              </label>
            ) : (
              <video
                ref={videoRef}
                src={videoObjectUrl}
                controls
                className="flex-1 w-full bg-black object-contain"
                onLoadedMetadata={() => {
                  const dur = videoRef.current?.duration ?? 0;
                  setVideoDuration(dur);
                  if (videoLastModified && dur > 0) {
                    const autoIso = new Date(videoLastModified - dur * 1000).toISOString();
                    setVideoStartInput(isoToDatetimeLocal(autoIso));
                    setSegments(
                      computeOffsets(rawSegments, autoIso).map((s, i) => ({
                        ...s,
                        status: segments[i]?.status ?? s.status,
                        videoUrl: segments[i]?.videoUrl ?? s.videoUrl,
                      }))
                    );
                  }
                }}
                onTimeUpdate={() => {
                  if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
                }}
              />
            )}
          </div>

          <div className="shrink-0 p-3 border-t border-gray-700">
            {videoDuration > 0 && (
              <VideoTimeline
                segments={segments}
                videoDuration={videoDuration}
                currentTime={currentTime}
                onSeek={handleSeek}
                onAdjust={handleAdjust}
              />
            )}
            {videoFile && (
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-gray-500 truncate max-w-[70%]">{videoFile.name}</span>
                <label className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer ml-2 shrink-0">
                  Đổi file
                  <input type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Right panel — segment list */}
        <div className="flex-1 overflow-y-auto p-4">
          {loadingSegments ? (
            <p className="text-sm text-gray-400 text-center py-16">Đang tải dữ liệu segments...</p>
          ) : segmentsError ? (
            <p className="text-sm text-red-400 text-center py-16">{segmentsError}</p>
          ) : (
            <SegmentList
              segments={segments}
              onAdjust={handleAdjust}
              onCutOne={handleCutOne}
              onCutAll={handleCutAll}
              processing={processing}
              videoLoaded={!!videoFile && ffmpegLoaded}
            />
          )}
        </div>
      </div>
    </div>
  );
}
