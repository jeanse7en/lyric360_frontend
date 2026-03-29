"use client";

import { useState, useEffect } from "react";
import Header from "../../_components/Header";
import Footer from "../../_components/Footer";
import SessionCard from "./_components/SessionCard";
import AddSessionDialog from "./_components/AddSessionDialog";

type Session = {
  id: string;
  name?: string;
  session_date: string;
  status: string;
  started_at?: string;
  ended_at?: string;
  order_count: number;
  unverified_song_count: number;
};

const API = process.env.NEXT_PUBLIC_API_URL;

function today() { return new Date().toISOString().slice(0, 10); }

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState("");

  // Filters
  const [name, setName] = useState("");
  const [dateFrom, setDateFrom] = useState(today());
  const [dateTo, setDateTo] = useState(today());

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (name.trim()) params.set("name", name.trim());
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);
      const res = await fetch(`${API}/api/sessions?${params}`);
      if (res.ok) setSessions(await res.json());
    } finally { setLoading(false); }
  };

  useEffect(() => {
    const id = setTimeout(fetchSessions, 300);
    return () => clearTimeout(id);
  }, [name, dateFrom, dateTo]);

  const handleAdd = async (sessionName: string, date: string) => {
    const res = await fetch(`${API}/api/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: sessionName || null, session_date: date }),
    });
    if (!res.ok) { setError("Không thể tạo buổi diễn"); return; }
    setShowAdd(false);
    fetchSessions();
  };

  const handleStart = async (id: string) => {
    setError("");
    const res = await fetch(`${API}/api/sessions/${id}/start`, { method: "POST" });
    if (!res.ok) {
      const data = await res.json();
      setError(data.detail || "Không thể bắt đầu buổi diễn");
      return;
    }
    fetchSessions();
  };

  const handleStop = async (id: string) => {
    const res = await fetch(`${API}/api/sessions/${id}/stop`, { method: "POST" });
    if (res.ok) fetchSessions();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <Header />
      <div className="flex-1 max-w-2xl w-full mx-auto py-6 px-4">

        {/* Title + Add button */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl font-bold">Quản Lý Buổi Diễn</h1>
          <button
            onClick={() => setShowAdd(true)}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors"
          >
            + Thêm buổi diễn
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-900 border border-red-500 text-red-200 text-sm flex justify-between">
            <span>{error}</span>
            <button onClick={() => setError("")} className="ml-3 text-red-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col gap-2 mb-5">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Tìm theo tên buổi diễn..."
            className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
          />
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-gray-400 mb-1 block">Từ ngày</label>
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 text-white"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-400 mb-1 block">Đến ngày</label>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 text-white"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => { setDateFrom(""); setDateTo(""); }}
                className="px-3 py-2 text-xs text-gray-400 hover:text-white border border-gray-600 rounded-lg transition-colors"
              >
                Xóa lọc
              </button>
            </div>
          </div>
        </div>

        {/* Session list */}
        {loading && <p className="text-center text-gray-500 py-8">Đang tải...</p>}
        {!loading && sessions.length === 0 && (
          <p className="text-center text-gray-500 py-8">Không có buổi diễn nào</p>
        )}
        <div className="space-y-3">
          {sessions.map(session => (
            <SessionCard
              key={session.id}
              session={session}
              onStart={handleStart}
              onStop={handleStop}
            />
          ))}
        </div>
      </div>
      <Footer />

      {showAdd && (
        <AddSessionDialog
          onAdd={handleAdd}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  );
}
