"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fmtTime, fmtDateTime } from "../../../../lib/format";
import EditRegistrationModal, { type EditableRegistration } from "../../../_components/EditRegistrationModal";

type NoteDialogState = {
  isOpen: boolean;
  queueId: string;
  tone: string;
  note: string;
  rating: number;
};

type Props = {
  queue: any[];
  currentSongId?: string | null;
  sessionStartedAt?: string | null;
  onPlay: (queueId: string, songId: string) => void;
  onStop: (queueId: string) => void;
  onViewSong: (songId: string) => void;
  onOpenNote: (state: NoteDialogState) => void;
  onPresent?: (url: string) => void;
  onPresentHtml?: (lyricId: string) => void;
  onRefresh?: () => void;
};

const DRINK_LABELS: Record<string, string> = {
  bia_tiger: "Bia Tiger", bia_heineken: "Bia Heineken", bia_333: "Bia 333",
  ruou_vang_do: "Vang đỏ", ruou_vang_trang: "Vang trắng",
  coca_cola: "Coca", pepsi: "Pepsi", nuoc_suoi: "Nước suối",
  tra_da: "Trà đá", nuoc_cam: "Nước cam",
};

function getHtmlLyricId(item: any): string | null {
  return item.songs?.song_lyrics?.[0]?.id ?? null;
}

export default function LiveList({ queue, currentSongId, sessionStartedAt, onPlay, onStop, onViewSong, onOpenNote, onPresent, onPresentHtml, onRefresh }: Props) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [editingItem, setEditingItem] = useState<EditableRegistration | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const router = useRouter();

  const handleCopyFB = (item: any) => {
    const text = `🎵 Bài hát: ${item.songs?.title ?? item.free_text_song_name ?? ""}
✍️ Tác giả: ${item.songs?.author ?? ""}
🎤 Khách hát: ${item.singer_name}
🎸 Đệm đàn: Hà Đàm

🎶 Cafe ĐÀM HÀ
📍 Địa chỉ: 45 Huỳnh Thúc Kháng
📝 Đăng ký bài hát: https://lyric360.vn (Mở vào 8h sáng)`;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleRefresh = () => {
    if (!onRefresh || spinning) return;
    setSpinning(true);
    onRefresh();
    setTimeout(() => setSpinning(false), 600);
  };

  const toggle = (id: string) => setOpenMenuId(prev => prev === id ? null : id);

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-xl p-4 shadow-2xl overflow-y-auto max-h-[90vh]">
      <div className="flex items-center gap-3 mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
        <a href="/admin/live" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm transition-colors">← Quay lại</a>
        <div>
          <h2 className="text-xl font-bold text-blue-600 dark:text-blue-400">Hàng Đợi Hát (Live)</h2>
          {sessionStartedAt && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Bắt đầu: {fmtDateTime(sessionStartedAt)}</p>
          )}
        </div>
        {onRefresh && (
          <button
            onClick={handleRefresh}
            className="ml-auto w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-blue-800 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
            title="Làm mới hàng đợi"
          >
            <span style={{ display: "inline-block", transition: "transform 0.6s ease", transform: spinning ? "rotate(360deg)" : "rotate(0deg)" }}>↺</span>
          </button>
        )}
      </div>

      <div className="space-y-2">
        {queue.map((item, index) => {
          const isOpen = openMenuId === item.id;
          const htmlLyricId = getHtmlLyricId(item);

          return (
            <div key={item.id}>
              {/* Row — clickable */}
              <div
                onClick={() => toggle(item.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-all select-none ${
                  item.status === "playing"
                    ? "bg-blue-50 dark:bg-blue-900 border-blue-400 dark:border-blue-500"
                    : item.status === "done"
                    ? "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-60"
                    : isOpen
                    ? "bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-500"
                    : "bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-900 dark:text-white truncate">
                      {index + 1}. {item.songs?.title}
                      {item.songs?.author && <span className="ml-1.5 text-xs font-normal text-gray-400 dark:text-gray-500">{item.songs.author}</span>}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {item.singer_name}
                      {item.booker_phone && (
                        <a
                          href={`tel:${item.booker_phone}`}
                          onClick={e => e.stopPropagation()}
                          className="ml-2 font-mono hover:text-blue-400 underline underline-offset-2"
                        >{item.booker_phone}</a>
                      )}
                      {item.drinks?.length > 0 && (
                        <span className="ml-2 text-blue-400">
                          🥤 {item.drinks.map((d: string) => DRINK_LABELS[d] ?? d).join(", ")}
                        </span>
                      )}
                    </div>
                    {(item.actual_start || item.actual_end) && (
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {fmtTime(item.actual_start)}
                        {item.actual_end && <> → {fmtTime(item.actual_end)}</>}
                      </div>
                    )}
                  </div>
                  {item.status === "playing" && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500 text-white" title="Đang diễn">● LIVE</span>
                  )}
                  {currentSongId === item.songs?.id && (
                    <span className="text-blue-400 text-sm" title="Đang xem">👀</span>
                  )}
                  <span className="text-gray-400 dark:text-gray-500 text-xs">{isOpen ? "▲" : "▼"}</span>
                </div>
              </div>

              {/* Action row */}
              {isOpen && (
                <div className="flex gap-2 px-1 pt-1 pb-2 flex-wrap">
                  {(item.status === "waiting" || item.status === "done") && (
                    <button
                      onClick={() => {
                        const playing = queue.find(i => i.status === "playing");
                        if (playing) onStop(playing.id);
                        onPlay(item.id, item.songs.id);
                        if (htmlLyricId && onPresentHtml) onPresentHtml(htmlLyricId);
                        setOpenMenuId(null);
                      }}
                      className="flex-1 py-2 rounded-lg text-sm font-semibold bg-green-600 hover:bg-green-500 text-white transition-colors"
                    >
                      Diễn
                    </button>
                  )}
                  {item.status === "playing" && (
                    <button
                      onClick={() => { onStop(item.id); setOpenMenuId(null); }}
                      className="flex-1 py-2 rounded-lg text-sm font-semibold bg-red-600 hover:bg-red-500 text-white transition-colors"
                    >
                      Dừng
                    </button>
                  )}
                  <button
                    onClick={() => { onViewSong(item.songs.id); setOpenMenuId(null); }}
                    className="flex-1 py-2 rounded-lg text-sm font-medium bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white transition-colors"
                  >
                    Xem trước
                  </button>
                  <button
                    onClick={() => {
                      onOpenNote({ isOpen: true, queueId: item.id, tone: item.actual_tone || '', note: item.note || '', rating: item.rating || 5 });
                      setOpenMenuId(null);
                    }}
                    className="flex-1 py-2 rounded-lg text-sm font-medium bg-blue-100 dark:bg-blue-700 hover:bg-blue-200 dark:hover:bg-blue-600 text-blue-800 dark:text-white transition-colors"
                  >
                    Ghi chú
                  </button>
                  <button
                    onClick={() => {
                      setEditingItem({
                        registration_id: item.id,
                        session_id: item.session_id,
                        song_id: item.songs?.id,
                        song_title: item.songs?.title ?? item.free_text_song_name ?? "",
                        song_author: item.songs?.author,
                        drinks: item.drinks ?? [],
                      });
                      setOpenMenuId(null);
                    }}
                    className="flex-1 py-2 rounded-lg text-sm font-medium bg-yellow-100 dark:bg-yellow-700/50 hover:bg-yellow-200 dark:hover:bg-yellow-700 text-yellow-800 dark:text-white transition-colors"
                  >
                    Đổi bài
                  </button>
                  <button
                    onClick={() => { router.push(`/admin/songs/${item.songs.id}`); setOpenMenuId(null); }}
                    className="flex-1 py-2 rounded-lg text-sm font-medium bg-purple-100 dark:bg-purple-800 hover:bg-purple-200 dark:hover:bg-purple-700 text-purple-800 dark:text-white transition-colors"
                  >
                    Sửa bài
                  </button>
                  <button
                    onClick={() => handleCopyFB(item)}
                    className="flex-1 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                  >
                    {copiedId === item.id ? "✓ Đã copy!" : "📋 Copy FB"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {queue.length === 0 && <p className="text-gray-400 italic text-center py-4">Chưa có ai đăng ký</p>}
      </div>
      {editingItem && (
        <EditRegistrationModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSaved={() => { setEditingItem(null); onRefresh?.(); }}
        />
      )}
    </div>
  );
}
