"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../_components/Header";
import Footer from "../_components/Footer";

type Session = { id: string; session_date: string; status: string };

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function SessionPickerPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sessions`);
        if (res.ok) setSessions(await res.json());
      } finally { setLoading(false); }
    };
    fetch_();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-blue-400 mb-8">Chọn Đêm Diễn</h1>

        {loading && <p className="text-center text-gray-500">Đang tải...</p>}

        {!loading && sessions.length === 0 && (
          <p className="text-center text-gray-500">Không có đêm diễn nào sắp tới</p>
        )}

        <div className="space-y-3">
          {sessions.map(session => (
            <button
              key={session.id}
              onClick={() => router.push(`/live/${session.id}`)}
              className="w-full p-4 rounded-xl border text-left transition-all bg-gray-800 border-gray-700 hover:border-blue-500 hover:bg-gray-750"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">{formatDate(session.session_date)}</span>
                {session.status === 'live'
                  ? <span className="text-xs bg-red-600 text-white px-2 py-1 rounded-full font-bold animate-pulse">🔴 Đang diễn</span>
                  : session.status === 'ended'
                  ? <span className="text-xs bg-gray-700 text-gray-500 px-2 py-1 rounded-full">✓ Đã kết thúc</span>
                  : <span className="text-xs bg-gray-600 text-gray-300 px-2 py-1 rounded-full">📅 Sắp tới</span>
                }
              </div>
            </button>
          ))}
        </div>
      </div>
      </div>
      <Footer />
    </div>
  );
}