"use client";

import { useState } from "react";
import BookerInfo from "../../../_components/BookerInfo";
import SongSearch from "../../../_components/SongSearch";
import SubmitButton from "../../../_components/SubmitButton";

const API = process.env.NEXT_PUBLIC_API_URL;

type Song = { id: string; title: string; author?: string };

type Props = {
  sessionId: string;
  onClose: () => void;
  onAdded: () => void;
};

export default function AddSongModal({ sessionId, onClose, onAdded }: Props) {
  const [bookerName, setBookerName] = useState("");
  const [singerName, setSingerName] = useState("");
  const [phone, setPhone] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [freeTextSong, setFreeTextSong] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSongInputChange = (value: string) => {
    if (!selectedSong) setFreeTextSong(value);
  };

  const handleSubmit = async () => {
    if (!singerName.trim()) { setError("Vui lòng nhập tên người hát"); return; }
    if (!selectedSong && !freeTextSong.trim()) { setError("Vui lòng chọn hoặc nhập tên bài hát"); return; }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/admin/queue/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          singer_name: singerName.trim(),
          booker_phone: phone.trim() || "",
          user_id: userId ?? undefined,
          song_id: selectedSong?.id ?? null,
          free_text_song_name: selectedSong ? null : (freeTextSong.trim() || null),
          allow_duplicate: true,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail ?? "Đã có lỗi xảy ra");
        return;
      }
      onAdded();
      onClose();
    } catch {
      setError("Không thể kết nối đến server");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Thêm bài hát (Admin)</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none"
          >×</button>
        </div>

        <BookerInfo
          bookerName={bookerName}
          singerName={singerName}
          phone={phone}
          onBookerNameChange={setBookerName}
          onSingerNameChange={setSingerName}
          onPhoneChange={setPhone}
          onUserIdChange={setUserId}
          skipLocalStorage
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Bài hát <span className="text-red-500">*</span>
          </label>
          <SongSearch
            selectedSong={selectedSong}
            onSelect={song => { setSelectedSong(song); setFreeTextSong(""); }}
            onInputChange={handleSongInputChange}
          />
        </div>

        {error && (
          <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
        )}

        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium transition-colors"
          >
            Hủy
          </button>
          <SubmitButton
            type="button"
            submitting={submitting}
            label="Thêm bài"
            loadingLabel="Đang thêm..."
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
          />
        </div>
      </div>
    </div>
  );
}
