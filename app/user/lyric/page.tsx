"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "../../_components/Header";
import Footer from "../../_components/Footer";

const API = process.env.NEXT_PUBLIC_API_URL;

type QueueItem = {
  registration_id: string;
  song_title: string;
  song_author?: string;
  slide_drive_url?: string;
  status: string;
  session_date: string;
};

type UserSuggestion = { id: string; name: string; phone_zalo?: string };

const STATUS_LABELS: Record<string, string> = {
  waiting: "Đang chờ",
  performing: "Đang hát",
  done: "Đã hát",
};

function UserLyricContent() {
  const params = useSearchParams();
  const router = useRouter();
  const urlUserId = params.get("user_id");

  // Resolved user id (from URL, localStorage, or search)
  const [userId, setUserId] = useState<string | null>(null);
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<QueueItem | null>(null);

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
        router.replace(`/user/lyric?user_id=${stored}`);
      }
    }
  }, [urlUserId]);

  // Load queue items when userId is known
  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError("");
    fetch(`${API}/api/queue/user/${userId}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setItems)
      .catch(() => setError("Không thể tải danh sách bài hát"))
      .finally(() => setLoading(false));
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
    router.replace(`/user/lyric?user_id=${u.id}`);
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

  // ── Lyric iframe view ──────────────────────────────────────────────────────
  if (selected) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
          <button
            onClick={() => setSelected(null)}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            ← Quay lại
          </button>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{selected.song_title}</p>
            {selected.song_author && <p className="text-xs text-gray-400">{selected.song_author}</p>}
          </div>
        </div>
        {selected.slide_drive_url ? (
          <iframe
            src={selected.slide_drive_url.replace(/\/edit.*$/, "/embed?rm=minimal")}
            className="flex-1 w-full border-0"
            allowFullScreen
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400 p-8 text-center">
            Bài hát này chưa có slide lời.
          </div>
        )}
      </div>
    );
  }

  // ── Song list ──────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 max-w-md mx-auto w-full p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Bài hát của tôi</h1>
        <button
          onClick={() => { setUserId(null); localStorage.removeItem("lyric360_user_id"); router.replace("/user/lyric"); }}
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
              onClick={() => item.slide_drive_url && setSelected(item)}
              className={`p-4 rounded-xl border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 ${item.slide_drive_url ? "cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors" : "opacity-60"}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{item.song_title}</p>
                  {item.song_author && <p className="text-xs text-gray-400 mt-0.5">{item.song_author}</p>}
                  <p className="text-xs text-gray-400 mt-1">{item.session_date}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    item.status === "performing" ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400" :
                    item.status === "done" ? "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400" :
                    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
                  }`}>
                    {STATUS_LABELS[item.status] ?? item.status}
                  </span>
                  {item.slide_drive_url && (
                    <span className="text-xs text-blue-500">Xem lời →</span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
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
