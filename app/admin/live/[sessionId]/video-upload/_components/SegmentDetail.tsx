"use client";

import { type Segment, type SegmentUpload, STATUS_BADGE, STATUS_LABEL } from "../_lib/video_upload_service";

function fmtHHmm(iso: string) {
  return new Date(iso).toLocaleTimeString("vi", { hour: "2-digit", minute: "2-digit", hour12: false });
}

type Props = {
  selected: Segment;
  selectedUp: SegmentUpload;
  selectedIndex: number;
  authorized: boolean;
  onAssignFile: (index: number, file: File) => void;
  onUpload: (index: number) => void;
};

export default function SegmentDetail({
  selected, selectedUp, selectedIndex, authorized, onAssignFile, onUpload,
}: Props) {
  return (
    <div className="flex flex-col md:h-full md:overflow-hidden">

      {/* Video preview */}
      <div className="md:flex-1 md:overflow-hidden bg-black flex items-center justify-center min-h-[200px]">
        {selectedUp.objectUrl ? (
          <video
            key={selectedUp.objectUrl}
            src={selectedUp.objectUrl}
            controls
            className="w-full h-full object-contain max-h-[40vh] md:max-h-none"
          />
        ) : (
          <div className="text-center text-gray-600">
            <div className="text-4xl mb-2">🎬</div>
            <p className="text-sm">Chưa có file</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="shrink-0 p-4 border-t border-gray-700 space-y-4">
        {/* Song info + status */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-white">{selected.song_title}</p>
            <p className="text-xs text-gray-400">
              {selected.singer_name} · {fmtHHmm(selected.actual_start_iso)} → {fmtHHmm(selected.actual_end_iso)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_BADGE[selectedUp.status]}`}>
              {STATUS_LABEL[selectedUp.status]}
            </span>
            {selectedUp.videoUrl && (
              <a href={selectedUp.videoUrl} target="_blank" rel="noopener noreferrer"
                className="text-xs text-green-400 hover:text-green-300 underline">
                Drive ↗
              </a>
            )}
          </div>
        </div>

        {/* File picker */}
        <label className="flex items-center gap-3 px-3 py-2 rounded-lg border border-dashed border-gray-600 hover:border-blue-500 cursor-pointer transition-colors">
          <span>📁</span>
          <span className="text-sm text-gray-300 truncate flex-1">
            {selectedUp.file ? selectedUp.file.name : "Chọn file video…"}
          </span>
          <input type="file" accept="video/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onAssignFile(selectedIndex, f); }} />
        </label>

        {/* Progress bar */}
        {selectedUp.status === "uploading" && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Đang upload…</span><span>{selectedUp.progress}%</span>
            </div>
            <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${selectedUp.progress}%` }} />
            </div>
          </div>
        )}

        {selectedUp.error && <p className="text-xs text-red-400">{selectedUp.error}</p>}

        {/* Upload / re-upload button */}
        <button
          onClick={() => onUpload(selectedIndex)}
          disabled={!selectedUp.file || !authorized || selectedUp.status === "uploading"}
          className="w-full py-2.5 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 transition-colors"
        >
          {selectedUp.status === "uploading" ? "Đang upload…"
            : selectedUp.status === "done" ? "Upload lại"
            : "Upload"}
        </button>
      </div>
    </div>
  );
}