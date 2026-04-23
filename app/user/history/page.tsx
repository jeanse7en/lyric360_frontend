"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "../../_components/Header";
import Footer from "../../_components/Footer";
import { styleToParams, DEFAULT_STYLE } from "../../_components/LyricHtmlPanel";
import SessionSelector from "../../_components/SessionSelector";
import SongSearch from "../../_components/SongSearch";
import DrinkSelector from "../../_components/DrinkSelector";
import DeleteButton from "../../_components/DeleteButton";

const API = process.env.NEXT_PUBLIC_API_URL;

type QueueItem = {
  registration_id: string;
  song_id?: string;
  song_title: string;
  song_author?: string;
  slide_drive_url?: string;
  lyric_id?: string;
  lyrics_text?: string;
  status: string;
  session_date: string;
  session_id: string;
  drinks: string[];
};

type Song = { id: string; title: string; author?: string };

type Session = {
  id: string;
  session_date: string;
  status: "planned" | "live" | "ended";
};

type UserSuggestion = { id: string; name: string; phone_zalo?: string };

const STATUS_LABELS: Record<string, string> = {
  waiting: "Đang chờ",
  performing: "Đang hát",
  done: "Đã hát",
};

// ── Edit Modal ─────────────────────────────────────────────────────────────────

type EditModalProps = {
  item: QueueItem;
  onClose: () => void;
  onSaved: () => void;
};

function EditModal({ item, onClose, onSaved }: EditModalProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState(item.session_id);
  const [selectedSong, setSelectedSong] = useState<Song | null>(
    item.song_id ? { id: item.song_id, title: item.song_title, author: item.song_author } : null
  );
  const [freeTextSong, setFreeTextSong] = useState(item.song_id ? "" : item.song_title);
  const [drinks, setDrinks] = useState<string[]>(item.drinks ?? []);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");

  // Fetch available sessions (non-ended, plus the current one)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setModalError("");
    try {
      const body: Record<string, unknown> = { drinks };
      if (selectedSessionId !== item.session_id) {
        body.session_id = selectedSessionId;
      }
      if (selectedSong) {
        body.song_id = selectedSong.id;
      } else if (freeTextSong.trim()) {
        body.free_text_song_name = freeTextSong.trim();
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

// ── Main content ───────────────────────────────────────────────────────────────

function UserLyricContent() {
  const params = useSearchParams();
  const router = useRouter();
  const urlUserId = params.get("user_id");

  // Resolved user id (from URL, localStorage, or search)
  const [userId, setUserId] = useState<string | null>(null);
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingItem, setEditingItem] = useState<QueueItem | null>(null);

  const handleDelete = async (id: string) => {
    await fetch(`${API}/api/queue/registrations/${id}`, { method: "DELETE" });
    setItems(prev => prev.filter(i => i.registration_id !== id));
  };

  // Name search state (shown when no userId yet)
  const [searchName, setSearchName] = useState("");
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // On mount, resolve user id from URL or localStorage
  useEffect(() => {
    if (urlUserId) {
      setUserId(urlUserId);
    } else {
      const stored = localStorage.getItem("lyric360_user_id");
      if (stored) {
        setUserId(stored);
        router.replace(`/user/history?user_id=${stored}`);
      }
    }
  }, [urlUserId]);

  const fetchItems = (uid: string) => {
    setLoading(true);
    setError("");
    fetch(`${API}/api/queue/user/${uid}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setItems)
      .catch(() => setError("Không thể tải danh sách bài hát"))
      .finally(() => setLoading(false));
  };

  // Load queue items when userId is known
  useEffect(() => {
    if (!userId) return;
    fetchItems(userId);
  }, [userId]);

  // Name search debounce
  const handleSearchChange = (v: string) => {
    setSearchName(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!v.trim()) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`${API}/api/users/search?q=${encodeURIComponent(v)}`);
        if (res.ok) setSuggestions(await res.json());
      } finally { setSearching(false); }
    }, 300);
  };

  const selectUser = (u: UserSuggestion) => {
    localStorage.setItem("lyric360_user_id", u.id);
    setUserId(u.id);
    router.replace(`/user/history?user_id=${u.id}`);
    setSuggestions([]);
    setSearchName("");
  };

  // ── No user yet → show search ──────────────────────────────────────────────
  if (!userId) {
    return (
      <div className="flex-1 max-w-md mx-auto w-full p-4 flex flex-col gap-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Tìm lịch sử của bạn</h1>
        <div className="relative">
          <input
            type="text"
            value={searchName}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="Nhập tên hoặc số điện thoại..."
            className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            autoComplete="off"
          />
          {searching && (
            <span className="absolute right-3 top-2.5 text-xs text-gray-400">Đang tìm...</span>
          )}
          {suggestions.length > 0 && (
            <ul className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-56 overflow-y-auto">
              {suggestions.map(u => (
                <li
                  key={u.id}
                  onClick={() => selectUser(u)}
                  className="px-4 py-3 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/40 text-gray-900 dark:text-white"
                >
                  <span className="font-medium">{u.name}</span>
                  {u.phone_zalo && <span className="ml-2 text-gray-400 text-xs">{u.phone_zalo}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
        {searchName && !searching && suggestions.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">Không tìm thấy ai tên "{searchName}".</p>
        )}
      </div>
    );
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
        Đang tải...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center text-red-500 p-8 text-center">
        {error}
      </div>
    );
  }

  // ── Song list ──────────────────────────────────────────────────────────────
  return (
    <>
      <div className="flex-1 max-w-md mx-auto w-full p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Bài hát của tôi</h1>
          <button
            onClick={() => { setUserId(null); localStorage.removeItem("lyric360_user_id"); router.replace("/user/history"); }}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            Đổi người
          </button>
        </div>
        {items.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm">Bạn chưa đăng ký bài hát nào.</p>
        ) : (
          <ul className="space-y-2">
            {items.map(item => (
              <li
                key={item.registration_id}
                className="p-4 rounded-xl border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between">
                  <div
                    onClick={() => item.lyric_id && window.open(`/live/lyric?lyric_id=${item.lyric_id}&${styleToParams(DEFAULT_STYLE)}`, "_blank")}
                    className={`flex-1 min-w-0 ${item.lyric_id ? "cursor-pointer hover:opacity-80 transition-opacity" : "opacity-60"}`}
                  >
                    <p className="font-semibold text-gray-900 dark:text-white">{item.song_title}</p>
                    {item.song_author && <p className="text-xs text-gray-400 mt-0.5">{item.song_author}</p>}
                    <p className="text-xs text-gray-400 mt-1">{item.session_date}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 ml-3 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      item.status === "performing" ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400" :
                      item.status === "done" ? "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400" :
                      "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
                    }`}>
                      {STATUS_LABELS[item.status] ?? item.status}
                    </span>
                    {item.lyric_id && (
                      <span className="text-xs text-blue-500">Xem lời →</span>
                    )}
                    {item.status !== "done" && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); setEditingItem(item); }}
                          className="text-xs text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                          title="Chỉnh sửa đăng ký"
                        >
                          ✏️
                        </button>
                        <span onClick={e => e.stopPropagation()}>
                          <DeleteButton
                            title="Xoá đăng ký?"
                            onDelete={() => handleDelete(item.registration_id)}
                            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                          />
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editingItem && (
        <EditModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSaved={() => {
            setEditingItem(null);
            if (userId) fetchItems(userId);
          }}
        />
      )}
    </>
  );
}

export default function UserLyricPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header hideNav />
      <Suspense>
        <UserLyricContent />
      </Suspense>
      <Footer />
    </div>
  );
}
