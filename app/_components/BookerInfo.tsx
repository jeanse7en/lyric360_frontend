"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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

const namesMatch = (a: string, b: string) =>
  a.trim().toLowerCase() === b.trim().toLowerCase();

export default function BookerInfo({ bookerName, singerName, phone, onBookerNameChange, onSingerNameChange, onPhoneChange, onUserIdChange }: Props) {
  const [nameSuggestions, setNameSuggestions] = useState<User[]>([]);
  const [showNameDropdown, setShowNameDropdown] = useState(false);
  const [phoneSuggestions, setPhoneSuggestions] = useState<User[]>([]);
  const [showPhoneDropdown, setShowPhoneDropdown] = useState(false);
  const [phoneConflict, setPhoneConflict] = useState<User | null>(null);
  const [bookForOther, setBookForOther] = useState(false);

  const nameDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phoneDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nameWrapperRef = useRef<HTMLDivElement>(null);
  const phoneWrapperRef = useRef<HTMLDivElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const confirmedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (nameWrapperRef.current && !nameWrapperRef.current.contains(e.target as Node))
        setShowNameDropdown(false);
      if (phoneWrapperRef.current && !phoneWrapperRef.current.contains(e.target as Node))
        setShowPhoneDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectUser = useCallback((user: User) => {
    onBookerNameChange(user.name);
    if (!bookForOther) onSingerNameChange(user.name);
    if (user.phone_zalo) onPhoneChange(user.phone_zalo);
    onUserIdChange(user.id);
    confirmedUserIdRef.current = user.id;
    setShowNameDropdown(false);
    setNameSuggestions([]);
    setShowPhoneDropdown(false);
    setPhoneSuggestions([]);
    setPhoneConflict(null);
  }, [bookForOther, onBookerNameChange, onSingerNameChange, onPhoneChange, onUserIdChange]);

  // Auto-load user from localStorage on mount
  useEffect(() => {
    const storedId = localStorage.getItem("lyric360_user_id");
    if (!storedId) return;
    fetch(`${API}/api/users/${storedId}`)
      .then(r => r.ok ? r.json() : null)
      .then((user: User | null) => { if (user?.name) selectUser(user); })
      .catch(() => {});
  }, [selectUser]);

  // Keep setCustomValidity in sync with phoneConflict
  useEffect(() => {
    phoneInputRef.current?.setCustomValidity(
      phoneConflict ? "Xác nhận tài khoản trước khi tiếp tục" : ""
    );
  }, [phoneConflict]);

  const resolvePhoneMatch = (match: User, currentName: string) => {
    if (namesMatch(match.name, currentName)) {
      onUserIdChange(match.id);
      confirmedUserIdRef.current = match.id;
      setPhoneConflict(null);
    } else {
      setPhoneConflict(match);
    }
  };

  const handleNameChange = (v: string) => {
    onBookerNameChange(v);

    // If there's a phone conflict, check whether the typed name now resolves it
    if (phoneConflict) {
      if (namesMatch(phoneConflict.name, v)) {
        onUserIdChange(phoneConflict.id);
        confirmedUserIdRef.current = phoneConflict.id;
        setPhoneConflict(null);
      }
      return;
    }

    onUserIdChange(null);
    confirmedUserIdRef.current = null;
    if (nameDebounceRef.current) clearTimeout(nameDebounceRef.current);
    if (!v.trim()) { setNameSuggestions([]); setShowNameDropdown(false); return; }
    nameDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API}/api/users/search?q=${encodeURIComponent(v)}`);
        if (!res.ok) return;
        const data: User[] = await res.json();
        setNameSuggestions(data);
        setShowNameDropdown(data.length > 0);
      } catch { /* ignore */ }
    }, 300);
  };

  const handlePhoneChange = (v: string) => {
    onPhoneChange(v);
    setPhoneConflict(null);
    setShowPhoneDropdown(false);
    setPhoneSuggestions([]);
    if (phoneDebounceRef.current) clearTimeout(phoneDebounceRef.current);
    if (v.trim().length < 4) return;
    phoneDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API}/api/users/search?q=${encodeURIComponent(v.trim())}`);
        if (!res.ok) return;
        const data: User[] = await res.json();
        const unconfirmed = data.filter(u => u.id !== confirmedUserIdRef.current);
        if (!unconfirmed.length) return;

        const exactMatch = unconfirmed.find(u => u.phone_zalo === v.trim());
        if (exactMatch) {
          // Exact phone match — check name to decide conflict or silent confirm
          resolvePhoneMatch(exactMatch, bookerName);
        } else {
          // Partial match — show as suggestions
          setPhoneSuggestions(unconfirmed);
          setShowPhoneDropdown(true);
        }
      } catch { /* ignore */ }
    }, 400);
  };

  return (
    <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-700/40 rounded-lg border border-gray-200 dark:border-gray-600">
      {/* Name field with autocomplete */}
      <div ref={nameWrapperRef} className="relative">
        <input
          required
          type="text"
          value={bookerName}
          onChange={e => handleNameChange(e.target.value)}
          onBlur={() => { if (!bookForOther) onSingerNameChange(bookerName); }}
          className={inputCls}
          placeholder="Tên người đặt bàn *"
          autoComplete="off"
        />
        {showNameDropdown && (
          <ul className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {nameSuggestions.map(u => (
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

      {/* Phone field with autocomplete + conflict guard */}
      <div ref={phoneWrapperRef} className="relative space-y-1">
        <input
          ref={phoneInputRef}
          required
          type="tel"
          value={phone}
          onChange={e => handlePhoneChange(e.target.value)}
          className={`${inputCls}${phoneConflict ? " !border-red-400 focus:!ring-red-400" : ""}`}
          placeholder="Số Zalo *"
          autoComplete="off"
        />
        {showPhoneDropdown && phoneSuggestions.length > 0 && (
          <ul className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {phoneSuggestions.map(u => (
              <li
                key={u.id}
                onMouseDown={() => selectUser(u)}
                className="px-4 py-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/40 text-gray-900 dark:text-white text-sm"
              >
                <span className="font-medium">{u.name}</span>
                {u.phone_zalo && <span className="ml-2 text-gray-400 text-xs font-mono">{u.phone_zalo}</span>}
              </li>
            ))}
          </ul>
        )}
        {phoneConflict && (
          <div className="flex items-center justify-between gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-600 rounded-lg text-sm">
            <p className="text-red-800 dark:text-red-200">
              Số này đã đăng ký tên <span className="font-semibold">{phoneConflict.name}</span>. Bạn có phải người đó không?
            </p>
            <button
              type="button"
              onClick={() => selectUser(phoneConflict)}
              className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded shrink-0"
            >
              Đúng, là tôi
            </button>
          </div>
        )}
      </div>

      <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-gray-600 dark:text-gray-300">
        <input
          type="checkbox"
          checked={bookForOther}
          onChange={e => {
            setBookForOther(e.target.checked);
            if (!e.target.checked) onSingerNameChange(bookerName);
          }}
          className="w-4 h-4 rounded accent-blue-500"
        />
        Đặt cho người khác hát
      </label>
      {bookForOther && (
        <input
          required
          type="text"
          value={singerName}
          onChange={e => onSingerNameChange(e.target.value)}
          className={inputCls}
          placeholder="Tên người hát *"
          autoFocus
        />
      )}
    </div>
  );
}