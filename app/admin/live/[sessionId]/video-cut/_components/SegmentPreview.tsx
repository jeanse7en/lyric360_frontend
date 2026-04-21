"use client";

import { useRef, useCallback } from "react";
import { SegmentState, formatTime } from "./VideoTimeline";

type Props = {
  segment: SegmentState;
  currentTime: number; // absolute video time
  onAdjust: (field: "startSeconds" | "durationSeconds", delta: number) => void;
};

const STEPS = [0.5, 1, 5];

export default function SegmentPreview({ segment, currentTime, onAdjust }: Props) {
  const barRef = useRef<HTMLDivElement>(null);

  // currentTime relative to segment start
  const relativeTime = currentTime - segment.startSeconds;
  const progress = segment.durationSeconds > 0
    ? Math.max(0, Math.min(1, relativeTime / segment.durationSeconds))
    : 0;

  const handleBarClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = barRef.current?.getBoundingClientRect();
      if (!rect) return;
      const frac = (e.clientX - rect.left) / rect.width;
      // seek is handled by parent via onAdjust on start; here we just signal relative seek
      // We repurpose: clicking bar tells parent the desired segment-relative position
      // Pass as a custom event via a data attribute hack isn't clean — skip for now
      // The video seeked via the <video> controls directly is fine
    },
    []
  );

  const endSeconds = segment.startSeconds + segment.durationSeconds;

  return (
    <div className="space-y-4">
      {/* Mini progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-500">
          <span>{formatTime(segment.startSeconds)}</span>
          <span className="text-gray-300">{formatTime(relativeTime > 0 ? relativeTime : 0)} / {formatTime(segment.durationSeconds)}</span>
          <span>{formatTime(endSeconds)}</span>
        </div>
        <div ref={barRef} className="relative h-2 bg-gray-700 rounded-full cursor-pointer" onClick={handleBarClick}>
          <div
            className="absolute left-0 top-0 h-full bg-blue-500 rounded-full transition-none"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      {/* +/- controls */}
      <div className="grid grid-cols-2 gap-3">
        {/* Start adjust */}
        <div className="bg-gray-800 rounded-lg p-3 space-y-2">
          <div className="text-xs text-gray-400 font-medium">Bắt đầu: <span className="text-white">{formatTime(segment.startSeconds)}</span></div>
          <div className="flex items-center gap-1 flex-wrap">
            {STEPS.map(s => (
              <button key={`es-${s}`}
                onClick={() => onAdjust("startSeconds", -s)}
                className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded text-green-400"
              >−{s}s</button>
            ))}
            {STEPS.map(s => (
              <button key={`ls-${s}`}
                onClick={() => {
                  if (s < segment.durationSeconds) onAdjust("startSeconds", s);
                }}
                className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded text-red-400"
              >+{s}s</button>
            ))}
          </div>
        </div>

        {/* End adjust */}
        <div className="bg-gray-800 rounded-lg p-3 space-y-2">
          <div className="text-xs text-gray-400 font-medium">Kết thúc: <span className="text-white">{formatTime(endSeconds)}</span></div>
          <div className="flex items-center gap-1 flex-wrap">
            {STEPS.map(s => (
              <button key={`ee-${s}`}
                onClick={() => {
                  if (segment.durationSeconds - s > 1) onAdjust("durationSeconds", -s);
                }}
                className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded text-red-400"
              >−{s}s</button>
            ))}
            {STEPS.map(s => (
              <button key={`le-${s}`}
                onClick={() => onAdjust("durationSeconds", s)}
                className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded text-green-400"
              >+{s}s</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
