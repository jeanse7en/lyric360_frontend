"use client";

import { useEffect, useState } from "react";
import Header from "../_components/Header";
import Footer from "../_components/Footer";
import SessionActionMenu from "./_components/SessionActionMenu";

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

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });
}

const STATUS_BADGE: Record<string, string> = {
  live: "bg-red-600 text-white animate-pulse",
  planned: "bg-gray-600 text-gray-200",
  ended: "bg-gray-700 text-gray-400",
};

const STATUS_LABEL: Record<string, string> = {
  live: "🔴 Đang diễn",
  planned: "📅 Sắp tới",
  ended: "✓ Đã kết thúc",
};

type EditState = { id: string; name: string; date: string } | null;

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState("");
  const [addDate, setAddDate] = useState(today());
  const [editState, setEditState] = useState<EditState>(null);

  // Filters
  const [filterName, setFilterName] = useState("");
  const [dateFrom, setDateFrom] = useState(today());
  const [dateTo, setDateTo] = useState(today());

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterName.trim()) params.set("name", filterName.trim());
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);
      const res = await fetch(`${API}/api/sessions?${params}`);
      if (res.ok) setSessions(await res.json());
    } finally { setLoading(false); }
  };

  useEffect(() => {
    const id = setTimeout(fetchSessions, 300);
    return () => clearTimeout(id);
  }, [filterName, dateFrom, dateTo]);

  const handleAdd = async () => {
    const res = await fetch(`${API}/api/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: addName || null, session_date: addDate }),
    });
    if (!res.ok) { setError("Không thể tạo buổi diễn"); return; }
    setShowAdd(false);
    setAddName("");
    setAddDate(today());
    fetchSessions();
  };

  const handleStart = async (id: string) => {
    setError("");
    const res = await fetch(`${API}/api/sessions/${id}/start`, { method: "POST" });
    if (!res.ok) { const d = await res.json(); setError(d.detail || "Lỗi"); return; }
    fetchSessions();
  };

  const handleStop = async (id: string) => {
    await fetch(`${API}/api/sessions/${id}/stop`, { method: "POST" });
    fetchSessions();
  };

  const handleDelete = async (id: string) => {
    await fetch(`${API}/api/sessions/${id}`, { method: "DELETE" });
    setExpandedId(null);
    fetchSessions();
  };

  const handleEdit = async () => {
    if (!editState) return;
    await fetch(`${API}/api/sessions/${editState.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editState.name || null, session_date: editState.date }),
    });
    setEditState(null);
    fetchSessions();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <Header />
      <div className="flex-1 max-w-2xl w-full mx-auto py-6 px-4">

        {/* Title + Add */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl font-bold">Buổi Diễn</h1>
          <button
            onClick={() => setShowAdd(true)}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors"
          >
            + Thêm
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-900 border border-red-500 text-red-200 text-sm flex justify-between">
            <span>{error}</span>
            <button onClick={() => setError("")} className="ml-3 text-red-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Filters */}
        <div className="space-y-2 mb-5">
          <input
            type="text"
            value={filterName}
            onChange={e => setFilterName(e.target.value)}
            placeholder="Tìm theo tên buổi diễn..."
            className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="text-xs text-gray-400 mb-1 block">Từ ngày</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-400 mb-1 block">Đến ngày</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500" />
            </div>
            <button onClick={() => { setDateFrom(""); setDateTo(""); }}
              className="px-3 py-2 text-xs text-gray-400 hover:text-white border border-gray-600 rounded-lg transition-colors">
              Xóa lọc
            </button>
          </div>
        </div>

        {/* Session list */}
        {loading && <p className="text-center text-gray-500 py-8">Đang tải...</p>}
        {!loading && sessions.length === 0 && (
          <p className="text-center text-gray-500 py-8">Không có buổi diễn nào</p>
        )}
        <div className="space-y-3">
          {sessions.map(session => (
            <div
              key={session.id}
              className={`rounded-xl border transition-all ${
                session.status === "live" ? "bg-gray-800 border-red-500" :
                session.status === "ended" ? "bg-gray-800 border-gray-700 opacity-70" :
                "bg-gray-800 border-gray-600"
              }`}
            >
              {/* Row — click to expand */}
              <button
                className="w-full p-4 text-left flex items-center justify-between"
                onClick={() => setExpandedId(expandedId === session.id ? null : session.id)}
              >
                <div className="min-w-0">
                  {session.name && <p className="font-semibold text-white truncate">{session.name}</p>}
                  <p className={`text-sm ${session.name ? "text-gray-400" : "font-semibold text-white"}`}>
                    {formatDate(session.session_date)}
                  </p>
                </div>
                <span className={`ml-3 shrink-0 text-xs px-2 py-1 rounded-full font-medium ${STATUS_BADGE[session.status]}`}>
                  {STATUS_LABEL[session.status]}
                </span>
              </button>

              {/* Expanded actions */}
              {expandedId === session.id && (
                <div className="px-4 pb-4">
                  <SessionActionMenu
                    session={session}
                    onStart={handleStart}
                    onStop={handleStop}
                    onDelete={handleDelete}
                    onEdit={s => setEditState({ id: s.id, name: s.name ?? "", date: s.session_date })}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <Footer />

      {/* Add dialog */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4 text-gray-900">
            <h2 className="text-lg font-bold mb-4">Thêm buổi diễn mới</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên buổi diễn (tuỳ chọn)</label>
                <input type="text" value={addName} onChange={e => setAddName(e.target.value)}
                  placeholder="VD: Đêm nhạc Trịnh Công Sơn"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày diễn</label>
                <input type="date" value={addDate} onChange={e => setAddDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-5">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm rounded-lg bg-gray-100 hover:bg-gray-200">Hủy</button>
              <button onClick={handleAdd} disabled={!addDate}
                className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium disabled:opacity-50">
                Thêm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit dialog */}
      {editState && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4 text-gray-900">
            <h2 className="text-lg font-bold mb-4">Chỉnh sửa buổi diễn</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên buổi diễn</label>
                <input type="text" value={editState.name} onChange={e => setEditState({ ...editState, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày diễn</label>
                <input type="date" value={editState.date} onChange={e => setEditState({ ...editState, date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-5">
              <button onClick={() => setEditState(null)} className="px-4 py-2 text-sm rounded-lg bg-gray-100 hover:bg-gray-200">Hủy</button>
              <button onClick={handleEdit} className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium">Lưu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
