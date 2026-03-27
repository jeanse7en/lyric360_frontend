"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";

type Lyric = { id: string; slide_drive_url?: string; verified_at: string | null; created_at: string };

const API = process.env.NEXT_PUBLIC_API_URL;

function toEmbedUrl(url: string) { return url.replace(/\/edit.*/, "/embed?rm=minimal"); }
function toEditUrl(url: string)  { return url.replace(/\/(edit|embed)[^/]*.*/, "/edit"); }

export default function SongLyricPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const backUrl = `/songs${searchParams.get('q') ? `?q=${encodeURIComponent(searchParams.get('q')!)}` : ''}`;
  const [lyrics, setLyrics] = useState<Lyric[]>([]);
  const [title, setTitle] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [editMode, setEditMode] = useState(false);

  const fetchSong = async () => {
    const res = await fetch(`${API}/api/songs/${id}`);
    if (!res.ok) return;
    const data = await res.json();
    setTitle(data.title);
    setLyrics(data.lyrics || []);
  };

  useEffect(() => { fetchSong(); }, [id]);

  const handleVerify = async (lyric: Lyric) => {
    await fetch(`${API}/api/songs/${id}/lyrics/${lyric.id}/verify`, { method: "POST" });
    fetchSong();
  };

  const selected = lyrics[selectedIdx];
  const src = selected?.slide_drive_url
    ? (editMode ? toEditUrl(selected.slide_drive_url) : toEmbedUrl(selected.slide_drive_url))
    : null;

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-3 bg-gray-800 border-b border-gray-700 shrink-0">
        <button onClick={() => router.push(backUrl)} className="text-gray-400 hover:text-white transition-colors">← Quay lại</button>
        <h1 className="font-bold text-lg truncate flex-1">{title} — Lời bài hát</h1>
      </div>

      {/* Lyric tabs */}
      {lyrics.length > 0 && (
        <div className="flex gap-2 px-4 py-2 bg-gray-800 border-b border-gray-700 shrink-0 flex-wrap">
          {lyrics.map((lyric, i) => (
            <button
              key={lyric.id}
              onClick={() => { setSelectedIdx(i); setEditMode(false); }}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                selectedIdx === i ? "bg-pink-500 text-white" : "bg-gray-700 hover:bg-gray-600 text-white"
              }`}
            >
              Lời {i + 1}
              {!lyric.verified_at && <span className="ml-1 text-amber-400">●</span>}
            </button>
          ))}
        </div>
      )}

      {/* Action bar for selected lyric */}
      {selected && (
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 border-b border-gray-700 shrink-0">
          {selected.slide_drive_url && (
            <button
              onClick={() => setEditMode(v => !v)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                editMode ? "bg-blue-600 text-white" : "bg-gray-700 hover:bg-gray-600 text-white"
              }`}
            >
              ✏️ {editMode ? "Đang chỉnh sửa" : "Chỉnh sửa"}
            </button>
          )}
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
          : <div className="flex items-center justify-center h-full text-gray-400">Không có lời bài hát</div>
        }
      </div>
    </div>
  );
}