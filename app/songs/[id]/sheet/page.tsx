"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";

type Sheet = { id: string; sheet_drive_url: string; tone_male?: string; tone_female?: string; verified_at: string | null };

const API = process.env.NEXT_PUBLIC_API_URL;

function toPreviewUrl(url: string) { return url.replace('/view', '/preview'); }

export default function SongSheetPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const backUrl = `/songs${searchParams.get('q') ? `?q=${encodeURIComponent(searchParams.get('q')!)}` : ''}`;
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [title, setTitle] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);

  const fetchSong = async () => {
    const res = await fetch(`${API}/api/songs/${id}`);
    if (!res.ok) return;
    const data = await res.json();
    setTitle(data.title);
    setSheets(data.sheets || []);
  };

  useEffect(() => { fetchSong(); }, [id]);

  const handleVerify = async (sheet: Sheet) => {
    await fetch(`${API}/api/songs/${id}/sheets/${sheet.id}/verify`, { method: "POST" });
    fetchSong();
  };

  const selected = sheets[selectedIdx];
  const src = selected ? toPreviewUrl(selected.sheet_drive_url) : null;

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-3 bg-gray-800 border-b border-gray-700 shrink-0">
        <button onClick={() => router.push(backUrl)} className="text-gray-400 hover:text-white transition-colors">← Quay lại</button>
        <h1 className="font-bold text-lg truncate flex-1">{title} — Sheet nhạc</h1>
      </div>

      {/* Sheet tabs */}
      {sheets.length > 0 && (
        <div className="flex gap-2 px-4 py-2 bg-gray-800 border-b border-gray-700 shrink-0 flex-wrap">
          {sheets.map((sheet, i) => (
            <button
              key={sheet.id}
              onClick={() => setSelectedIdx(i)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                selectedIdx === i ? "bg-yellow-500 text-black" : "bg-gray-700 hover:bg-gray-600 text-white"
              }`}
            >
              Sheet {i + 1}
              {sheet.tone_male ? ` · Nam: ${sheet.tone_male}` : ""}
              {sheet.tone_female ? ` · Nữ: ${sheet.tone_female}` : ""}
              {!sheet.verified_at && <span className="ml-1 text-amber-400">●</span>}
            </button>
          ))}
        </div>
      )}

      {/* Action bar */}
      {selected && (
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 border-b border-gray-700 shrink-0">
          {!selected.verified_at && (
            <button
              onClick={() => handleVerify(selected)}
              className="px-3 py-1.5 rounded text-sm font-medium bg-green-700 hover:bg-green-600 text-white transition-colors"
            >
              ✓ Xác nhận
            </button>
          )}
          {selected.verified_at && (
            <span className="text-xs text-green-400">✓ Đã xác nhận</span>
          )}
        </div>
      )}

      {/* Iframe */}
      <div className="flex-grow bg-white">
        {src
          ? <iframe src={src} className="w-full h-full border-0" allowFullScreen />
          : <div className="flex items-center justify-center h-full text-gray-400">Không có sheet nhạc</div>
        }
      </div>
    </div>
  );
}