"use client";

import { useRef, useCallback } from "react";

export type SegmentState = {
  registrationId: string;
  songTitle: string;
  singerName: string;
  actualStartIso: string;
  actualEndIso: string;
  startSeconds: number;
  durationSeconds: number;
  videoUrl?: string | null;
  status: "idle" | "cutting" | "uploading" | "done" | "error";
};

const COLORS = [
  "bg-blue-500", "bg-purple-500", "bg-green-500", "bg-orange-500",
  "bg-pink-500", "bg-teal-500", "bg-yellow-500", "bg-red-400",
];

type Props = {
  segments: SegmentState[];
  videoDuration: number;
  currentTime: number;
  onSeek: (seconds: number) => void;
  onAdjust: (index: number, field: "startSeconds" | "durationSeconds", value: number) => void;
};

export default function VideoTimeline({
  segments,
  videoDuration,
  currentTime,
  onSeek,
  onAdjust,
}: Props) {
  const barRef = useRef<HTMLDivElement>(null);

  const toPercent = (s: number) =>
    videoDuration > 0 ? `${((s / videoDuration) * 100).toFixed(3)}%` : "0%";

  const handleBarClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = barRef.current?.getBoundingClientRect();
      if (!rect) return;
      const frac = (e.clientX - rect.left) / rect.width;
      onSeek(frac * videoDuration);
    },
    [videoDuration, onSeek]
  );

  const startDrag = useCallback(
    (
      e: React.MouseEvent,
      index: number,
      field: "start" | "end"
    ) => {
      e.stopPropagation();
      const rect = barRef.current?.getBoundingClientRect();
      if (!rect) return;

      const seg = segments[index];
      const onMove = (mv: MouseEvent) => {
        const frac = Math.max(0, Math.min(1, (mv.clientX - rect.left) / rect.width));
        const newTime = frac * videoDuration;
        if (field === "start") {
          const newStart = Math.max(0, Math.min(newTime, seg.startSeconds + seg.durationSeconds - 1));
          const newDuration = seg.startSeconds + seg.durationSeconds - newStart;
          onAdjust(index, "startSeconds", newStart);
          onAdjust(index, "durationSeconds", newDuration);
        } else {
          const newEnd = Math.max(seg.startSeconds + 1, Math.min(newTime, videoDuration));
          onAdjust(index, "durationSeconds", newEnd - seg.startSeconds);
        }
      };
      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [segments, videoDuration, onAdjust]
  );

  if (videoDuration === 0) return null;

  return (
    <div className="mb-6">
      <div className="text-xs text-gray-400 mb-1 flex justify-between">
        <span>0:00</span>
        <span>{formatTime(videoDuration)}</span>
      </div>

      {/* Timeline bar */}
      <div
        ref={barRef}
        onClick={handleBarClick}
        className="relative h-10 bg-gray-700 rounded cursor-pointer select-none overflow-visible"
      >
        {segments.map((seg, i) => {
          const left = toPercent(seg.startSeconds);
          const width = toPercent(seg.durationSeconds);
          const color = COLORS[i % COLORS.length];
          const statusOverlay =
            seg.status === "cutting" || seg.status === "uploading"
              ? "animate-pulse opacity-70"
              : seg.status === "done"
              ? "opacity-50"
              : "";
          return (
            <div
              key={seg.registrationId}
              className={`absolute top-0 h-full ${color} ${statusOverlay} rounded`}
              style={{ left, width }}
              title={`${seg.songTitle} — ${seg.singerName}`}
            >
              {/* Left drag handle */}
              <div
                className="absolute left-0 top-0 h-full w-2 cursor-ew-resize flex items-center justify-center"
                onMouseDown={(e) => startDrag(e, i, "start")}
              >
                <div className="w-0.5 h-5 bg-white opacity-80 rounded" />
              </div>
              {/* Label */}
              <span className="absolute inset-0 flex items-center justify-center text-white text-[10px] font-medium px-3 truncate pointer-events-none">
                {seg.songTitle}
              </span>
              {/* Right drag handle */}
              <div
                className="absolute right-0 top-0 h-full w-2 cursor-ew-resize flex items-center justify-center"
                onMouseDown={(e) => startDrag(e, i, "end")}
              >
                <div className="w-0.5 h-5 bg-white opacity-80 rounded" />
              </div>
            </div>
          );
        })}

        {/* Playhead */}
        <div
          className="absolute top-0 h-full w-0.5 bg-white pointer-events-none z-10"
          style={{ left: toPercent(currentTime) }}
        />
      </div>
    </div>
  );
}

export function formatTime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}
