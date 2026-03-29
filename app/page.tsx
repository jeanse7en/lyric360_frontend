"use client";

import { useState, useEffect } from "react";
import Header from "./_components/Header";
import Footer from "./_components/Footer";
import BookerInfo from "./_components/BookerInfo";
import SessionSelector from "./_components/SessionSelector";
import SongSearch from "./_components/SongSearch";
import DrinkSelector from "./_components/DrinkSelector";
import ToneInput from "./_components/ToneInput";

type Session = { id: string; session_date: string; status: 'planned' | 'live' | 'ended' };

export default function MobileRegistration() {
  const [bookerName, setBookerName] = useState("");
  const [singerName, setSingerName] = useState("");
  const [phone, setPhone] = useState("");
  const [tablePos, setTablePos] = useState("");
  const [selectedSong, setSelectedSong] = useState<any>(null);
  const [tone, setTone] = useState("");
  const [selectedDrinks, setSelectedDrinks] = useState<string[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState("");

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sessions/available`);
        if (!res.ok) return;
        const data: Session[] = await res.json();
        if (data.length === 0) return;
        setSessions(data);
        // Backend already returns live first, so default to first item
        setSelectedSessionId(data[0].id);
      } catch (err) { console.error(err); }
    };
    fetchSessions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSong) return alert("Vui lòng chọn bài hát!");
    if (!selectedSessionId) return alert("Vui lòng chọn buổi diễn!");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/queue/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: selectedSessionId,
          song_id: selectedSong.id,
          singer_name: singerName,
          booker_phone: phone,
          table_position: tablePos,
          tone: tone || undefined,
          drinks: selectedDrinks,
        }),
      });
      if (res.ok) {
        alert("🎉 Đăng ký thành công!");
        setSelectedSong(null);
        setSelectedDrinks([]);
      }
    } catch { alert("Lỗi kết nối!"); }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 p-4 md:bg-gray-200 flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">Đăng Ký Bài Hát</h1>
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
          />

          <SessionSelector
            sessions={sessions}
            selectedId={selectedSessionId}
            onChange={setSelectedSessionId}
          />

          <SongSearch selectedSong={selectedSong} onSelect={setSelectedSong} />

          <ToneInput value={tone} onChange={setTone} />

          <DrinkSelector selected={selectedDrinks} onChange={setSelectedDrinks} />

          <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700">
            Gửi Đăng Ký
          </button>
        </form>
      </div>
      </div>
      <Footer />
    </div>
  );
}