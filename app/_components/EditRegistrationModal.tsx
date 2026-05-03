"use client";

import { useEffect, useState } from "react";
import SessionSelector from "./SessionSelector";
import SongSearch from "./SongSearch";
import DrinkSelector from "./DrinkSelector";
import BookerInfo from "./BookerInfo";
import PreorderNumberSelect from "./PreorderNumberSelect";
import { fetchQueueLimit, fetchSessionBookingInfo } from "../_lib/registration_service";

const API = process.env.NEXT_PUBLIC_API_URL;

type Song = { id: string; title: string; author?: string };

type Session = {
  id: string;
  session_date: string;
  status: "planned" | "live" | "ended";
};

export type EditableRegistration = {
  registration_id: string;
  session_id: string;
  song_id?: string;
  song_title: string;
  song_author?: string;
  drinks: string[];
  // admin-only
  user_id?: string | null;
  singer_name?: string;
  booker_phone?: string;
  preorder_number?: number | null;
};

type Props = {
  item: EditableRegistration;
  onClose: () => void;
  onSaved: () => void;
  isAdmin?: boolean;
};

export default function EditRegistrationModal({ item, onClose, onSaved, isAdmin }: Props) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState(item.session_id);
  const [selectedSong, setSelectedSong] = useState<Song | null>(
    item.song_id ? { id: item.song_id, title: item.song_title, author: item.song_author } : null
  );
  const [freeTextSong, setFreeTextSong] = useState(item.song_id ? "" : item.song_title);
  const [drinks, setDrinks] = useState<string[]>(item.drinks ?? []);
  // admin booker fields
  const [bookerName, setBookerName] = useState(item.singer_name ?? "");
  const [singerName, setSingerName] = useState(item.singer_name ?? "");
  const [bookerPhone, setBookerPhone] = useState(item.booker_phone ?? "");
  const [userId, setUserId] = useState<string | null>(item.user_id ?? null);
  const [preorderNumber, setPreorderNumber] = useState<number | null>(item.preorder_number ?? null);
  const [queueLimit, setQueueLimit] = useState(30);
  const [takenNumbers, setTakenNumbers] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");

  useEffect(() => {
    fetch(`${API}/api/sessions`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: Session[]) => {
        const visible = data.filter(
          s => s.status !== "ended" || s.id === item.session_id
        );
        if (!visible.find(s => s.id === item.session_id)) {
          const current = data.find(s => s.id === item.session_id);
          if (current) visible.unshift(current);
        }
        setSessions(visible);
      })
      .catch(() => setModalError("Không thể tải danh sách đêm diễn"));
  }, [item.session_id]);

  useEffect(() => {
    if (!isAdmin) return;
    Promise.all([
      fetchQueueLimit(),
      fetchSessionBookingInfo(selectedSessionId),
    ]).then(([limit, info]) => {
      setQueueLimit(limit);
      // Exclude the current registration's own slot so it doesn't appear as taken
      setTakenNumbers(info.taken_preorder_numbers.filter(n => n !== item.preorder_number));
    });
  }, [isAdmin, selectedSessionId, item.preorder_number]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setModalError("");
    try {
      const body: Record<string, unknown> = { drinks };
      if (selectedSessionId !== item.session_id) body.session_id = selectedSessionId;
      if (selectedSong) {
        body.song_id = selectedSong.id;
      } else if (freeTextSong.trim()) {
        body.free_text_song_name = freeTextSong.trim();
      }

      if (isAdmin) {
        body.user_id = userId ?? null;
        body.singer_name = singerName.trim() || bookerName.trim();
        body.booker_phone = bookerPhone.trim() || null;
        body.preorder_number = preorderNumber;
      }

      const res = await fetch(`${API}/api/queue/registrations/${item.registration_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail ?? "Lỗi không xác định");
      }
      onSaved();
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : "Lỗi không xác định");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl p-6 overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Chỉnh sửa đăng ký</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {isAdmin && (
            <>
              <BookerInfo
                bookerName={bookerName}
                singerName={singerName}
                phone={bookerPhone}
                onBookerNameChange={setBookerName}
                onSingerNameChange={setSingerName}
                onPhoneChange={setBookerPhone}
                onUserIdChange={setUserId}
                skipLocalStorage
              />
              <PreorderNumberSelect
                value={preorderNumber}
                onChange={setPreorderNumber}
                queueLimit={queueLimit}
                takenNumbers={takenNumbers}
              />
            </>
          )}

          <SessionSelector
            sessions={sessions}
            selectedId={selectedSessionId}
            onChange={setSelectedSessionId}
          />

          <SongSearch
            selectedSong={selectedSong}
            onSelect={setSelectedSong}
            onInputChange={setFreeTextSong}
            bookedSongIds={[]}
            recentSongs={[]}
          />

          <DrinkSelector selected={drinks} onChange={setDrinks} />

          {modalError && (
            <p className="text-sm text-red-500 dark:text-red-400">{modalError}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium transition-colors"
            >
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
