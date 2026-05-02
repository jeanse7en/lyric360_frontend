"use client";

import { useEffect, useRef, useState } from "react";
import { fetchSetting, saveSetting } from "../../../_lib/settings_service";
import { searchUsers, type User } from "../../../_lib/users_service";

const API = process.env.NEXT_PUBLIC_API_URL;

type SongOption = { id: string; title: string; author?: string };

type PreorderEntry = {
  user_id: string;
  user_name: string;
  song_id: string;
  song_title: string;
  preorder_number: number;
};

const inputCls = "w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none";

export default function PreorderListSection() {
  const [entries, setEntries] = useState<PreorderEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  // Add-row state
  const [adding, setAdding] = useState(false);
  const [preorderNum, setPreorderNum] = useState<number | "">("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userInput, setUserInput] = useState("");
  const [userSuggestions, setUserSuggestions] = useState<User[]>([]);
  const [showUserDrop, setShowUserDrop] = useState(false);
  const [selectedSong, setSelectedSong] = useState<SongOption | null>(null);
  const [songInput, setSongInput] = useState("");
  const [songSuggestions, setSongSuggestions] = useState<SongOption[]>([]);
  const [showSongDrop, setShowSongDrop] = useState(false);

  const userDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const songDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userWrapRef = useRef<HTMLDivElement>(null);
  const songWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSetting("preorder_list").then(val => {
      try { setEntries(JSON.parse(val ?? "[]")); } catch { setEntries([]); }
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userWrapRef.current && !userWrapRef.current.contains(e.target as Node)) setShowUserDrop(false);
      if (songWrapRef.current && !songWrapRef.current.contains(e.target as Node)) setShowSongDrop(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const persist = async (next: PreorderEntry[]) => {
    setSaving(true);
    await saveSetting("preorder_list", JSON.stringify(next));
    setSaving(false);
  };

  const handleDelete = async (index: number) => {
    const next = entries.filter((_, i) => i !== index);
    setEntries(next);
    await persist(next);
  };

  const handleAdd = async () => {
    if (!selectedUser || !selectedSong || !preorderNum) return;
    const entry: PreorderEntry = {
      user_id: selectedUser.id,
      user_name: selectedUser.name,
      song_id: selectedSong.id,
      song_title: selectedSong.title,
      preorder_number: Number(preorderNum),
    };
    const next = [...entries, entry].sort((a, b) => a.preorder_number - b.preorder_number);
    setEntries(next);
    await persist(next);
    setAdding(false);
    setPreorderNum("");
    setSelectedUser(null);
    setUserInput("");
    setSelectedSong(null);
    setSongInput("");
  };

  const handleUserInput = (v: string) => {
    setUserInput(v);
    setSelectedUser(null);
    if (userDebounce.current) clearTimeout(userDebounce.current);
    if (!v.trim()) { setUserSuggestions([]); setShowUserDrop(false); return; }
    userDebounce.current = setTimeout(async () => {
      const data = await searchUsers(v);
      setUserSuggestions(data);
      setShowUserDrop(data.length > 0);
    }, 300);
  };

  const handleSongInput = (v: string) => {
    setSongInput(v);
    setSelectedSong(null);
    if (songDebounce.current) clearTimeout(songDebounce.current);
    if (!v.trim()) { setSongSuggestions([]); setShowSongDrop(false); return; }
    songDebounce.current = setTimeout(async () => {
      const res = await fetch(`${API}/api/songs/search?q=${encodeURIComponent(v)}&limit=10`);
      if (!res.ok) return;
      const data = await res.json();
      setSongSuggestions(data);
      setShowSongDrop(data.length > 0);
    }, 300);
  };

  const addRowValid = selectedUser && selectedSong && preorderNum !== "";

  if (!loaded) return <p className="text-sm text-gray-400">Đang tải…</p>;

  return (
    <div className="space-y-3">
      {entries.length > 0 ? (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
              <th className="pb-2 pr-3 w-10">#</th>
              <th className="pb-2 pr-3">Khách hát</th>
              <th className="pb-2 pr-3">Bài hát</th>
              <th className="pb-2 w-8" />
            </tr>
          </thead>
          <tbody>
            {entries.map((e, i) => (
              <tr key={i} className="border-b border-gray-100 dark:border-gray-700/50">
                <td className="py-2 pr-3 tabular-nums font-semibold text-blue-600 dark:text-blue-400">{e.preorder_number}</td>
                <td className="py-2 pr-3 text-gray-900 dark:text-white">{e.user_name}</td>
                <td className="py-2 pr-3 text-gray-700 dark:text-gray-300 truncate max-w-[160px]">{e.song_title}</td>
                <td className="py-2">
                  <button
                    onClick={() => handleDelete(i)}
                    className="text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors"
                    title="Xoá"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        !adding && <p className="text-sm text-gray-400 dark:text-gray-500 italic">Chưa có pre-order nào.</p>
      )}

      {adding ? (
        <div className="space-y-2 p-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10">
          <div className="flex gap-2 items-start flex-wrap">
            {/* Preorder number */}
            <div className="w-20 shrink-0">
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Số thứ tự</label>
              <input
                type="number"
                min={1}
                value={preorderNum}
                onChange={e => setPreorderNum(e.target.value ? Number(e.target.value) : "")}
                className={inputCls}
                placeholder="1"
              />
            </div>

            {/* User search */}
            <div ref={userWrapRef} className="flex-1 min-w-[140px] relative">
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Khách hát</label>
              <input
                type="text"
                value={selectedUser ? selectedUser.name : userInput}
                onChange={e => handleUserInput(e.target.value)}
                className={`${inputCls}${selectedUser ? " border-green-400 dark:border-green-600" : ""}`}
                placeholder="Tìm tên khách..."
                autoComplete="off"
              />
              {showUserDrop && (
                <ul className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {userSuggestions.map(u => (
                    <li
                      key={u.id}
                      onMouseDown={() => { setSelectedUser(u); setUserInput(u.name); setShowUserDrop(false); }}
                      className="px-3 py-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/40 text-sm text-gray-900 dark:text-white"
                    >
                      <span className="font-medium">{u.name}</span>
                      {u.phone_zalo && <span className="ml-2 text-gray-400 text-xs">{u.phone_zalo}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Song search */}
            <div ref={songWrapRef} className="flex-1 min-w-[140px] relative">
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Bài hát</label>
              <input
                type="text"
                value={selectedSong ? selectedSong.title : songInput}
                onChange={e => handleSongInput(e.target.value)}
                className={`${inputCls}${selectedSong ? " border-green-400 dark:border-green-600" : ""}`}
                placeholder="Tìm bài hát..."
                autoComplete="off"
              />
              {showSongDrop && (
                <ul className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {songSuggestions.map(s => (
                    <li
                      key={s.id}
                      onMouseDown={() => { setSelectedSong(s); setSongInput(s.title); setShowSongDrop(false); }}
                      className="px-3 py-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/40 text-sm text-gray-900 dark:text-white"
                    >
                      <span className="font-medium">{s.title}</span>
                      {s.author && <span className="ml-2 text-gray-400 text-xs">{s.author}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setAdding(false); setPreorderNum(""); setSelectedUser(null); setUserInput(""); setSelectedSong(null); setSongInput(""); }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors"
            >
              Huỷ
            </button>
            <button
              onClick={handleAdd}
              disabled={!addRowValid || saving}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white transition-colors"
            >
              {saving ? "Đang lưu..." : "Thêm"}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full py-2 rounded-lg text-sm font-medium border border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          + Thêm pre-order
        </button>
      )}
    </div>
  );
}
