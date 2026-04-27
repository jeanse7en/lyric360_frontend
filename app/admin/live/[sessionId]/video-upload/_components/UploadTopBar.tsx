"use client";

import { type Segment } from "../_lib/video_upload_service";

type Props = {
  sessionId: string;
  segments: Segment[];
  doneCount: number;
  authorized: boolean;
  getToken: () => Promise<string>;
  processing: boolean;
  pendingCount: number;
  onUploadAll: () => void;
  onAutoFill: (files: FileList) => void;
};

export default function UploadTopBar({
  sessionId, segments, doneCount,
  authorized, getToken,
  processing, pendingCount,
  onUploadAll, onAutoFill,
}: Props) {
  return (
    <div className="flex flex-col gap-2 px-4 py-2 border-b border-gray-700 shrink-0 sm:flex-row sm:items-center sm:flex-wrap">
      <div className="flex items-center gap-2">
        <a href={`/admin/live/${sessionId}`} className="text-gray-400 hover:text-white text-sm">← Live</a>
        <span className="text-gray-600">/</span>
        <h1 className="text-sm font-semibold">📤 Upload video</h1>
        {segments.length > 0 && (
          <span className="text-xs text-gray-500">{doneCount}/{segments.length} xong</span>
        )}
      </div>

      <div className="flex items-center gap-2 sm:ml-auto">
        {!authorized && (
          <button
            onClick={() => getToken().catch(() => {})}
            className="text-xs px-3 py-1.5 rounded bg-yellow-600 hover:bg-yellow-500 text-white"
          >
            🔑 Kết nối Drive
          </button>
        )}
        {authorized && <span className="text-xs text-green-400">✓ Drive</span>}

        <label className="text-xs px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-white cursor-pointer transition-colors">
          ✨ Auto fill
          <input type="file" accept="video/*" multiple className="hidden"
            onChange={(e) => e.target.files && onAutoFill(e.target.files)} />
        </label>

        <button
          onClick={onUploadAll}
          disabled={processing || !authorized || pendingCount === 0}
          className="text-xs px-3 py-1.5 rounded bg-green-600 hover:bg-green-500 text-white disabled:opacity-40 transition-colors"
        >
          {processing ? "Đang upload…" : `Upload tất cả (${pendingCount})`}
        </button>
      </div>
    </div>
  );
}