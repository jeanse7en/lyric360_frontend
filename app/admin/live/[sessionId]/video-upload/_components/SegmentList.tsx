"use client";

import { type Segment, type SegmentUpload, STATUS_BADGE, STATUS_LABEL } from "../_lib/video_upload_service";

function fmtDuration(isoStart: string, isoEnd: string) {
  const sec = (new Date(isoEnd).getTime() - new Date(isoStart).getTime()) / 1000;
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

type Props = {
  loading: boolean;
  segments: Segment[];
  uploads: SegmentUpload[];
  selectedIndex: number | null;
  onSelect: (i: number) => void;
};

export default function SegmentList({ loading, segments, uploads, selectedIndex, onSelect }: Props) {
  return (
    <div className="md:w-72 shrink-0 flex flex-col border-b md:border-b-0 md:border-r border-gray-700 md:overflow-y-auto">
      {loading ? (
        <p className="text-xs text-gray-500 text-center py-8">Đang tải...</p>
      ) : segments.length === 0 ? (
        <p className="text-xs text-gray-500 text-center py-8">Chưa có dữ liệu</p>
      ) : (
        <ul>
          {segments.map((seg, i) => {
            const up = uploads[i];
            if (!up) return null;
            return (
              <li
                key={seg.registration_id}
                onClick={() => onSelect(i)}
                className={`flex items-start gap-3 px-4 py-3 cursor-pointer border-b border-gray-800 transition-colors ${
                  selectedIndex === i
                    ? "bg-blue-900/40 border-l-2 border-l-blue-500"
                    : "hover:bg-gray-800/50"
                }`}
              >
                <span className="text-xs text-gray-500 mt-0.5 w-5 shrink-0 tabular-nums">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{seg.song_title}</p>
                  <p className="text-xs text-gray-400 truncate">{seg.singer_name}</p>
                  {seg.booker_phone && (
                    <a
                      href={`tel:${seg.booker_phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-blue-400 hover:text-blue-300 truncate"
                    >{seg.booker_phone}</a>
                  )}
                  <p className="text-xs text-gray-500">{fmtDuration(seg.actual_start_iso, seg.actual_end_iso)}</p>
                  {up.file && up.status !== "done" && (
                    <p className="text-xs text-blue-400 truncate mt-0.5" title={up.file.name}>{up.file.name}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${STATUS_BADGE[up.status]}`}>
                    {STATUS_LABEL[up.status]}
                  </span>
                  {up.status === "uploading" && (
                    <span className="text-[10px] text-blue-300 tabular-nums">{up.progress}%</span>
                  )}
                  {up.videoUrl && (
                    <a href={up.videoUrl} target="_blank" rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-[10px] text-green-400 hover:text-green-300 underline">
                      Drive ↗
                    </a>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}