"use client";

import { SegmentState, formatTime } from "./VideoTimeline";
import vi from "@/lib/vi";

type Props = {
  segments: SegmentState[];
  onAdjust: (index: number, field: "startSeconds" | "durationSeconds", value: number) => void;
  onCutOne: (index: number) => void;
  onCutAll: () => void;
  onEdit: (index: number) => void;
  processing: boolean;
  videoLoaded: boolean;
};

const STATUS_BADGE = vi.videoCut.statusBadge;
const STATUS_LABEL = vi.videoCut.statusLabel;

function SecondsInput({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-gray-500">{label}</span>
      <input
        type="number"
        min={0}
        step={0.5}
        value={value.toFixed(1)}
        disabled={disabled}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (!isNaN(v) && v >= 0) onChange(v);
        }}
        className="w-20 text-xs bg-gray-700 border border-gray-600 text-white rounded px-1.5 py-1 disabled:opacity-40"
      />
    </div>
  );
}

export default function SegmentList({
  segments,
  onAdjust,
  onCutOne,
  onCutAll,
  onEdit,
  processing,
  videoLoaded,
}: Props) {
  const allDone = segments.length > 0 && segments.every((s) => s.status === "done");
  const anyBusy = segments.some((s) => s.status === "cutting" || s.status === "uploading");

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-300">
          Segments ({segments.length})
        </h2>
        {!allDone && (
          <button
            onClick={onCutAll}
            disabled={!videoLoaded || processing || segments.length === 0}
            className="px-4 py-1.5 text-sm rounded-lg bg-green-600 hover:bg-green-500 text-white font-medium disabled:opacity-40 transition-colors"
          >
            {anyBusy ? "Đang xử lý..." : "Cắt & Tải tất cả"}
          </button>
        )}
      </div>

      {segments.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">
          Buổi diễn này chưa có dữ liệu thời gian (actual_start / actual_end).
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-700">
                <th className="text-left py-2 pr-3 font-medium">#</th>
                <th className="text-left py-2 pr-3 font-medium">Bài hát</th>
                <th className="text-left py-2 pr-3 font-medium">Ca sĩ</th>
                <th className="text-left py-2 pr-3 font-medium">Bắt đầu (s)</th>
                <th className="text-left py-2 pr-3 font-medium">Kết thúc (s)</th>
                <th className="text-left py-2 pr-3 font-medium">Thời lượng</th>
                <th className="text-left py-2 pr-3 font-medium">Trạng thái</th>
                <th className="text-left py-2 font-medium">Link</th>
              </tr>
            </thead>
            <tbody>
              {segments.map((seg, i) => {
                const endSec = seg.startSeconds + seg.durationSeconds;
                const busy = seg.status === "cutting" || seg.status === "uploading";
                return (
                  <tr key={seg.registrationId} className="border-b border-gray-800 hover:bg-gray-800/40">
                    <td className="py-2 pr-3 text-gray-500">{i + 1}</td>
                    <td className="py-2 pr-3 text-white font-medium max-w-[160px] truncate">
                      {seg.songTitle}
                    </td>
                    <td className="py-2 pr-3 text-gray-400 max-w-[100px] truncate">
                      {seg.singerName}
                    </td>
                    <td className="py-2 pr-3">
                      <SecondsInput
                        label="s"
                        value={seg.startSeconds}
                        disabled={busy || seg.status === "done"}
                        onChange={(v) => {
                          const newDur = endSec - v;
                          if (newDur > 0) {
                            onAdjust(i, "startSeconds", v);
                            onAdjust(i, "durationSeconds", newDur);
                          }
                        }}
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <SecondsInput
                        label="s"
                        value={endSec}
                        disabled={busy || seg.status === "done"}
                        onChange={(v) => {
                          const newDur = v - seg.startSeconds;
                          if (newDur > 0) onAdjust(i, "durationSeconds", newDur);
                        }}
                      />
                    </td>
                    <td className="py-2 pr-3 text-gray-400 text-xs">
                      {formatTime(seg.durationSeconds)}
                    </td>
                    <td className="py-2 pr-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_BADGE[seg.status]}`}>
                          {STATUS_LABEL[seg.status]}
                        </span>
                        {seg.status === "idle" && (
                          <button
                            onClick={() => onCutOne(i)}
                            disabled={!videoLoaded || processing}
                            className="text-xs text-blue-400 hover:text-blue-300 disabled:opacity-40"
                          >
                            Cắt
                          </button>
                        )}
                        {seg.status === "done" && (
                          <button
                            onClick={() => onEdit(i)}
                            className="text-xs text-gray-400 hover:text-white"
                          >
                            {vi.videoCut.editBtn}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-2">
                      {seg.videoUrl ? (
                        <a
                          href={seg.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-green-400 hover:text-green-300 underline"
                        >
                          {vi.videoCut.driveLink}
                        </a>
                      ) : (
                        <span className="text-gray-600 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
