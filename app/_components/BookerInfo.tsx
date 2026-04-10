"use client";

import { useEffect, useRef, useState } from "react";

type User = { id: string; name: string; phone_zalo?: string };

type Props = {
  bookerName: string;
  singerName: string;
  phone: string;
  onBookerNameChange: (v: string) => void;
  onSingerNameChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onUserIdChange: (id: string | null) => void;
};

const inputCls = "w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function BookerInfo({ bookerName, singerName, phone, onBookerNameChange, onSingerNameChange, onPhoneChange, onUserIdChange }: Props) {
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Auto-load user from localStorage on mount
  useEffect(() => {
    const storedId = localStorage.getItem("lyric360_user_id");
    if (!storedId) return;
    fetch(`${API}/api/users/${storedId}`)
      .then(r => r.ok ? r.json() : null)
      .then((user: User | null) => { if (user?.name) selectUser(user); })
      .catch(() => {});
  }, []);

  const handleNameChange = (v: string) => {
    onBookerNameChange(v);
    onUserIdChange(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!v.trim()) { setSuggestions([]); setShowDropdown(false); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API}/api/users/search?q=${encodeURIComponent(v)}`);
        if (!res.ok) return;
        const data: User[] = await res.json();
        setSuggestions(data);
        setShowDropdown(data.length > 0);
      } catch { /* ignore */ }
    }, 300);
  };

  const selectUser = (user: User) => {
    onBookerNameChange(user.name);
    if (!singerName) onSingerNameChange(user.name);
    if (user.phone_zalo) onPhoneChange(user.phone_zalo);
    onUserIdChange(user.id);
    setShowDropdown(false);
    setSuggestions([]);
  };

  return (
    <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-700/40 rounded-lg border border-gray-200 dark:border-gray-600">
      <div ref={wrapperRef} className="relative">
        <input
          required
          type="text"
          value={bookerName}
          onChange={e => handleNameChange(e.target.value)}
          onBlur={() => { if (!singerName) onSingerNameChange(bookerName); }}
          className={inputCls}
          placeholder="Tên người đặt bàn *"
          autoComplete="off"
        />
        {showDropdown && (
          <ul className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {suggestions.map(u => (
              <li
                key={u.id}
                onMouseDown={() => selectUser(u)}
                className="px-4 py-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/40 text-gray-900 dark:text-white text-sm"
              >
                <span className="font-medium">{u.name}</span>
                {u.phone_zalo && <span className="ml-2 text-gray-400 text-xs">{u.phone_zalo}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>

      <input
        required
        type="tel"
        value={phone}
        onChange={e => onPhoneChange(e.target.value)}
        className={inputCls}
        placeholder="Số Zalo *"
      />

      <input
        required
        type="text"
        value={singerName}
        onChange={e => onSingerNameChange(e.target.value)}
        className={inputCls}
        placeholder="Tên người hát *"
      />
    </div>
  );
}
