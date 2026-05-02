"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fmtTime, fmtDateTime } from "../../../../lib/format";
import EditRegistrationModal, { type EditableRegistration } from "../../../_components/EditRegistrationModal";
import ConfirmModal from "../../../_components/ConfirmModal";
import { fetchSetting } from "../../../_lib/settings_service";
import AccordionRow from "../../../_components/AccordionRow";

const API = process.env.NEXT_PUBLIC_API_URL;

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
  sessionDate?: string | null;
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

const DEFAULT_TEMPLATE = "🎵 Bài hát: [Bài hát]\n✍️ Tác giả: [Tác giả]\n🎤 Khách hát: [Người hát]";

function formatSessionDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.slice(0, 10).split("-");
  return `${day}-${month}-${year}`;
}

export default function LiveList({ queue, currentSongId, sessionStartedAt, sessionDate, onPlay, onStop, onViewSong, onOpenNote, onPresent, onPresentHtml, onRefresh }: Props) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [editingItem, setEditingItem] = useState<EditableRegistration | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copyTemplate, setCopyTemplate] = useState(DEFAULT_TEMPLATE);
  const [sortBy, setSortBy] = useState<"created_at" | "actual_start">("created_at");
  const [videoInputId, setVideoInputId] = useState<string | null>(null);
  const [videoInputValue, setVideoInputValue] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchSetting("copy_fb_template").then(val => { if (val) setCopyTemplate(val); });
  }, []);

  const handleSaveVideoUrl = async (id: string) => {
    await fetch(`${API}/api/queue/registrations/${id}/video-url`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ video_url: videoInputValue }),
    });
    setVideoInputId(null);
    setVideoInputValue("");
    onRefresh?.();
  };

  const handleDelete = async (id: string) => {
    await fetch(`${API}/api/queue/registrations/${id}`, { method: "DELETE" });
    setDeletingId(null);
    onRefresh?.();
  };

  const handleCopyFB = (item: any) => {
    const songTitle = (item.songs?.title ?? item.free_text_song_name ?? "").toUpperCase();
    const text = copyTemplate
      .split("[Bài hát]").join(songTitle)
      .split("[Tác giả]").join(item.songs?.author ?? "")
      .split("[Người hát]").join(item.singer_name ?? "")
      .split("[Ngày diễn]").join(formatSessionDate(sessionDate));
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

  const sortedQueue = [...queue].sort((a, b) => {
    if (sortBy === "actual_start") {
      const ta = a.actual_start ? new Date(a.actual_start).getTime() : Infinity;
      const tb = b.actual_start ? new Date(b.actual_start).getTime() : Infinity;
      return ta - tb;
    }
    // preorder_number first (nulls last), then created_at
    const pa = a.preorder_number ?? Infinity;
    const pb = b.preorder_number ?? Infinity;
    if (pa !== pb) return pa - pb;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

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
        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={() => setSortBy(s => s === "created_at" ? "actual_start" : "created_at")}
            className={`px-2 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
              sortBy === "actual_start"
                ? "bg-blue-600 border-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-300"
            }`}
            title={sortBy === "created_at" ? "Đang sắp xếp theo thời gian đăng ký" : "Đang sắp xếp theo giờ diễn"}
          >
            {sortBy === "actual_start" ? "⏱ Giờ diễn" : "📋 Đăng ký"}
          </button>
          {onRefresh && (
            <button
              onClick={handleRefresh}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-blue-800 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
              title="Làm mới hàng đợi"
            >
              <span style={{ display: "inline-block", transition: "transform 0.6s ease", transform: spinning ? "rotate(360deg)" : "rotate(0deg)" }}>↺</span>
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {sortedQueue.map((item, index) => {
          const isOpen = openMenuId === item.id;
          const htmlLyricId = getHtmlLyricId(item);

          return (
            <div key={item.id}>
              <AccordionRow
                isOpen={isOpen}
                onToggle={() => toggle(item.id)}
                highlight={item.status === "playing" ? "active" : item.status === "done" ? "dim" : "none"}
                summary={
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-900 dark:text-white truncate">
                        {item.preorder_number != null
                          ? <span className="inline-flex items-center justify-center w-5 h-5 mr-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-[10px] font-bold">{item.preorder_number}</span>
                          : <span className="text-gray-400 font-normal text-xs mr-1">{index + 1}.</span>
                        }
                        {item.songs?.title ?? item.free_text_song_name}
                        {item.free_text_song_name && (
                          <span className="ml-1.5 text-amber-500" title="Bài hát chưa có trong hệ thống">⚠️</span>
                        )}
                        {!item.free_text_song_name && item.songs && (
                          item.songs.song_lyrics?.some((l: any) => !l.verified_at) ||
                          item.songs.song_sheets?.some((s: any) => !s.verified_at)
                        ) && (
                          <span className="ml-1.5 text-orange-400 text-xs font-normal" title="Bài hát chưa được xác nhận">chưa xác nhận</span>
                        )}
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
                        {item.video_url && (
                          <a
                            href={item.video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="ml-2 text-green-500 hover:text-green-400"
                            title="Xem video"
                          >🎬</a>
                        )}
                        {item.want_facebook_post && (
                          <span className="ml-1 text-blue-400" title="Khách yêu cầu đăng Facebook">📤</span>
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
                  </div>
                }
              >
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
                <button
                  onClick={() => {
                    setVideoInputId(videoInputId === item.id ? null : item.id);
                    setVideoInputValue(item.video_url ?? "");
                  }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    item.video_url
                      ? "bg-green-600 hover:bg-green-500 text-white"
                      : "bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white"
                  }`}
                >
                  🎬 Video
                </button>
                <button
                  onClick={() => { setDeletingId(item.id); setOpenMenuId(null); }}
                  className="flex-1 py-2 rounded-lg text-sm font-medium bg-red-100 dark:bg-red-900/40 hover:bg-red-200 dark:hover:bg-red-900/60 text-red-700 dark:text-red-400 transition-colors"
                >
                  Xoá
                </button>
              </AccordionRow>
              {isOpen && videoInputId === item.id && (
                <div className="flex gap-2 px-1 pb-2 mt-1">
                  <input
                    type="text"
                    value={videoInputValue}
                    onChange={e => setVideoInputValue(e.target.value)}
                    placeholder="Dán link video vào đây..."
                    className="flex-1 px-3 py-1.5 rounded-lg text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => handleSaveVideoUrl(item.id)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-green-600 hover:bg-green-500 text-white transition-colors"
                  >
                    Lưu
                  </button>
                  <button
                    onClick={() => setVideoInputId(null)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 text-gray-700 dark:text-white transition-colors"
                  >
                    Huỷ
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
      {deletingId && (
        <ConfirmModal
          title="Xoá khỏi hàng đợi?"
          message="Đăng ký này sẽ bị xoá vĩnh viễn khỏi hàng đợi."
          confirmLabel="Xoá"
          confirmClassName="px-4 py-2 rounded-lg text-sm bg-red-600 hover:bg-red-500 text-white transition-colors"
          onConfirm={() => handleDelete(deletingId)}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </div>
  );
}
