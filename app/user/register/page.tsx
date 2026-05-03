"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "../../_components/Header";
import Footer from "../../_components/Footer";
import BookerInfo from "../../_components/BookerInfo";
import SessionSelector from "../../_components/SessionSelector";
import SongSearch from "../../_components/SongSearch";
import DrinkSelector from "../../_components/DrinkSelector";
import ToneInput from "../../_components/ToneInput";
import {
  fetchAvailableSessions,
  fetchSessionById,
  fetchUserRecentSongs,
  fetchSessionBookingInfo,
  fetchQueueLimit,
  submitRegistration,
  type Session,
  type Song,
  type UserExistingReg,
} from "../../_lib/registration_service";
import SuccessScreen from "./_components/SuccessScreen";

type SuccessInfo = { orderNumber: number; userId: string };

function MobileRegistrationInner() {
  const searchParams = useSearchParams();
  const preselectedSessionId = searchParams.get("session_id");
  const urlAllowDuplicate = searchParams.get("allow_duplicate") === "true";
  const [allowDuplicate, setAllowDuplicate] = useState(urlAllowDuplicate);
  const [bookerName, setBookerName] = useState("");
  const [singerName, setSingerName] = useState("");
  const [phone, setPhone] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedSong, setSelectedSong] = useState<any>(null);
  const [songInputValue, setSongInputValue] = useState("");
  const [tone, setTone] = useState("");
  const [selectedDrinks, setSelectedDrinks] = useState<string[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [bookedSongIds, setBookedSongIds] = useState<string[]>([]);
  const [takenPreorderNumbers, setTakenPreorderNumbers] = useState<number[]>([]);
  const [recentSongs, setRecentSongs] = useState<Song[]>([]);
  const [userExistingReg, setUserExistingReg] = useState<UserExistingReg | null>(null);
  const [preorderNumber, setPreorderNumber] = useState<number | null>(null);
  const [queueLimit, setQueueLimit] = useState<number>(30);
  const [success, setSuccess] = useState<SuccessInfo | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    fetchQueueLimit().then(setQueueLimit);
    Promise.all([
      fetchAvailableSessions(),
      preselectedSessionId ? fetchSessionById(preselectedSessionId) : Promise.resolve(null),
    ]).then(([available, preselected]) => {
      const merged = preselected && !available.find(s => s.id === preselected.id)
        ? [preselected, ...available]
        : available;
      if (!merged.length) return;
      setSessions(merged);
      setSelectedSessionId(preselectedSessionId ?? merged[0].id);
      if (!urlAllowDuplicate && preselected?.is_private) setAllowDuplicate(true);
    });
  }, [preselectedSessionId]);

  useEffect(() => {
    if (!userId) { setRecentSongs([]); return; }
    fetchUserRecentSongs(userId).then(setRecentSongs);
  }, [userId]);

  useEffect(() => {
    setUserExistingReg(null);
    setBookedSongIds([]);
    setTakenPreorderNumbers([]);
    setSelectedSong(null);
    if (!selectedSessionId) return;
    fetchSessionBookingInfo(selectedSessionId, userId).then((info) => {
      setBookedSongIds(info.booked_song_ids);
      setUserExistingReg(info.user_registration);
      setTakenPreorderNumbers(info.taken_preorder_numbers);
    });
  }, [selectedSessionId, userId]);


  const selectedSession = sessions.find((s) => s.id === selectedSessionId);
  const queueFull = !!selectedSession && selectedSession.order_count >= queueLimit;
  const songSearchReady = mounted && !!singerName && !!selectedSessionId && !queueFull;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singerName) { setError("Vui lòng nhập tên của bạn!"); return; }
    if (!selectedSessionId) { setError("Vui lòng chọn buổi diễn!"); return; }
    if (!selectedSong && !songInputValue.trim()) { setError("Vui lòng chọn hoặc nhập tên bài hát!"); return; }
    if (!allowDuplicate && userExistingReg) return;
    if (queueFull) return;
    setError("");
    setSubmitting(true);
    try {
      const result = await submitRegistration({
        session_id: selectedSessionId,
        song_id: selectedSong?.id,
        free_text_song_name: !selectedSong && songInputValue.trim() ? songInputValue.trim() : undefined,
        singer_name: singerName,
        booker_phone: phone,
        tone: tone || undefined,
        drinks: selectedDrinks,
        user_id: userId ?? undefined,
        allow_duplicate: allowDuplicate,
        preorder_number: preorderNumber ?? undefined,
      });
      if (!result.ok) { setError(result.error); return; }
      if (result.data.user_id) localStorage.setItem("lyric360_user_id", result.data.user_id);
      setSuccess({ orderNumber: result.data.order_number, userId: result.data.user_id });
      setSelectedSong(null);
      setSelectedDrinks([]);
      setTone("");
    } catch { setError("Lỗi kết nối!"); }
    finally { setSubmitting(false); }
  };

  if (success) {
    return (
      <SuccessScreen
        orderNumber={success.orderNumber}
        userId={success.userId}
        onRegisterAnother={() => { setSuccess(null); setError(""); }}
      />
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
              onBookerNameChange={setBookerName}
              onSingerNameChange={setSingerName}
              onPhoneChange={setPhone}
              onUserIdChange={setUserId}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Số thứ tự <span className="font-normal text-gray-400">(tuỳ chọn)</span>
              </label>
              <select
                value={preorderNumber ?? ""}
                onChange={e => setPreorderNumber(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">Tự động</option>
                {Array.from({ length: queueLimit }, (_, i) => i + 1).map((n) => {
                  const taken = takenPreorderNumbers.includes(n);
                  return (
                    <option key={n} value={n} disabled={taken}>
                      {n}{taken ? " (đã đặt)" : ""}
                    </option>
                  );
                })}
              </select>
            </div>
            <SessionSelector sessions={sessions} selectedId={selectedSessionId} onChange={setSelectedSessionId} />

            {queueFull && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-300 text-sm">
                <span className="text-lg">🚫</span>
                <span>Đã đủ số lượng đăng ký.</span>
              </div>
            )}

            {!queueFull && !allowDuplicate && userExistingReg && (
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

            {!queueFull && (allowDuplicate || !userExistingReg) && (
              <>
                <SongSearch
                  selectedSong={selectedSong}
                  onSelect={setSelectedSong}
                  onInputChange={setSongInputValue}
                  disabled={!songSearchReady}
                  bookedSongIds={allowDuplicate ? [] : bookedSongIds}
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

export default function MobileRegistration() {
  return (
    <Suspense>
      <MobileRegistrationInner />
    </Suspense>
  );
}