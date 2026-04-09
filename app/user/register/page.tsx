"use client";

import { useState, useEffect } from "react";
import Header from "../../_components/Header";
import Footer from "../../_components/Footer";
import BookerInfo from "../../_components/BookerInfo";
import SessionSelector from "../../_components/SessionSelector";
import SongSearch from "../../_components/SongSearch";
import DrinkSelector from "../../_components/DrinkSelector";
import ToneInput from "../../_components/ToneInput";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL;

type Session = { id: string; session_date: string; status: 'planned' | 'live' | 'ended' };
type SuccessInfo = { orderNumber: number; userId: string };
type Song = { id: string; title: string; author?: string };
type UserExistingReg = { registration_id: string; song_id: string; song_title: string };

export default function MobileRegistration() {
  const [bookerName, setBookerName] = useState("");
  const [singerName, setSingerName] = useState("");
  const [phone, setPhone] = useState("");
  const [tablePos, setTablePos] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedSong, setSelectedSong] = useState<any>(null);
  const [songInputValue, setSongInputValue] = useState("");
  const [tone, setTone] = useState("");
  const [selectedDrinks, setSelectedDrinks] = useState<string[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [success, setSuccess] = useState<SuccessInfo | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Booking context
  const [bookedSongIds, setBookedSongIds] = useState<string[]>([]);
  const [recentSongs, setRecentSongs] = useState<Song[]>([]);
  const [userExistingReg, setUserExistingReg] = useState<UserExistingReg | null>(null);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await fetch(`${API}/api/sessions/available`);
        if (!res.ok) return;
        const data: Session[] = await res.json();
        if (data.length === 0) return;
        setSessions(data);
        setSelectedSessionId(data[0].id);
      } catch (err) { console.error(err); }
    };
    fetchSessions();
  }, []);

  // Fetch recent songs when userId is set
  useEffect(() => {
    if (!userId) { setRecentSongs([]); return; }
    fetch(`${API}/api/queue/user/${userId}`)
      .then(r => r.ok ? r.json() : [])
      .then((items: any[]) => {
        const seen = new Set<string>();
        const unique: Song[] = [];
        for (const item of items) {
          if (!seen.has(item.song_id)) {
            seen.add(item.song_id);
            unique.push({ id: item.song_id, title: item.song_title, author: item.song_author });
          }
        }
        setRecentSongs(unique);
      })
      .catch(() => {});
  }, [userId]);

  // Fetch session booking info when userId + session are both set
  useEffect(() => {
    setUserExistingReg(null);
    setBookedSongIds([]);
    setSelectedSong(null);
    if (!selectedSessionId) return;
    const url = `${API}/api/sessions/${selectedSessionId}/booked-songs${userId ? `?user_id=${userId}` : ""}`;
    fetch(url)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        setBookedSongIds(data.booked_song_ids ?? []);
        setUserExistingReg(data.user_registration ?? null);
      })
      .catch(() => {});
  }, [selectedSessionId, userId]);

  const songSearchReady = mounted && !!singerName && !!selectedSessionId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singerName) { setError("Vui lòng nhập tên của bạn!"); return; }
    if (!selectedSessionId) { setError("Vui lòng chọn buổi diễn!"); return; }
    if (!selectedSong && !songInputValue.trim()) { setError("Vui lòng chọn hoặc nhập tên bài hát!"); return; }
    if (userExistingReg) return; // blocked by UI
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/queue/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: selectedSessionId,
          song_id: selectedSong?.id || undefined,
          free_text_song_name: !selectedSong && songInputValue.trim() ? songInputValue.trim() : undefined,
          singer_name: singerName,
          booker_phone: phone,
          table_position: tablePos,
          tone: tone || undefined,
          drinks: selectedDrinks,
          user_id: userId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail ?? "Đăng ký thất bại"); return; }
      if (data.user_id) localStorage.setItem("lyric360_user_id", data.user_id);
      setSuccess({ orderNumber: data.order_number, userId: data.user_id });
      setSelectedSong(null);
      setSelectedDrinks([]);
      setTone("");
    } catch { setError("Lỗi kết nối!"); }
    finally { setSubmitting(false); }
  };

  const handleRegisterAnother = () => {
    setSuccess(null);
    setError("");
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        <Header hideNav />
        <div className="flex-1 p-4 flex items-center justify-center">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 border border-gray-200 dark:border-gray-700 text-center space-y-5">
            <div className="text-5xl">🎉</div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Đăng ký thành công!</h2>
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Số thứ tự của bạn</p>
              <p className="text-6xl font-black text-blue-600 dark:text-blue-400 mt-1">{success.orderNumber}</p>
            </div>
            <div className="flex flex-col gap-3">
              <Link
                href={`/user/history?user_id=${success.userId}`}
                className="w-full py-3 rounded-lg bg-green-600 hover:bg-green-500 text-white font-semibold transition-colors"
              >
                🎵 Xem lời bài hát của tôi
              </Link>
              <button
                onClick={handleRegisterAnother}
                className="w-full py-3 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium transition-colors"
              >
                Đăng ký thêm bài
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header hideNav />
      <div className="flex-1 p-4 flex items-center justify-center">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 border border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-6">Đăng Ký Bài Hát</h1>

          {error && (
            <div className="mb-4 px-4 py-2 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <BookerInfo
              bookerName={bookerName}
              singerName={singerName}
              phone={phone}
              tablePos={tablePos}
              onBookerNameChange={setBookerName}
              onSingerNameChange={setSingerName}
              onPhoneChange={setPhone}
              onTablePosChange={setTablePos}
              onUserIdChange={setUserId}
            />
            <SessionSelector sessions={sessions} selectedId={selectedSessionId} onChange={setSelectedSessionId} />

            {/* Duplicate registration warning */}
            {userExistingReg && (
              <Link
                href={`/user/history?user_id=${userId}`}
                className="flex items-center gap-2 px-4 py-3 rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-300 text-sm hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
              >
                <span className="text-lg">⚠️</span>
                <span>
                  Bạn đã đăng ký <strong>{userExistingReg.song_title}</strong> trong đêm diễn này.
                  Click để đi đến bài hát đó.
                </span>
              </Link>
            )}

            {!userExistingReg && (
              <>
                <SongSearch
                  selectedSong={selectedSong}
                  onSelect={setSelectedSong}
                  onInputChange={setSongInputValue}
                  disabled={!songSearchReady}
                  bookedSongIds={bookedSongIds}
                  recentSongs={recentSongs}
                />
                <ToneInput value={tone} onChange={setTone} />
                <DrinkSelector selected={selectedDrinks} onChange={setSelectedDrinks} />
                <button
                  suppressHydrationWarning
                  type="submit"
                  disabled={submitting || !songSearchReady}
                  className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-60"
                >
                  {submitting ? "Đang gửi..." : "Gửi Đăng Ký"}
                </button>
              </>
            )}
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}
