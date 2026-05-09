"use client";

import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL;

type Props = { sessionId: string };

export default function LinkPhotosButton({ sessionId }: Props) {
  const [linking, setLinking] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleClick = async () => {
    setLinking(true);
    setResult(null);
    try {
      const res = await fetch(`${API}/api/sessions/${sessionId}/link-photos-videos`, { method: "POST" });
      const d = await res.json();
      if (res.ok) setResult(`✓ Đã link ${d.linked} video (${d.skipped} bỏ qua)`);
      else setResult(`✗ ${d.detail ?? "Lỗi"}`);
    } catch {
      setResult("✗ Không thể kết nối");
    } finally {
      setLinking(false);
    }
  };

  return (
    <>
      <button
        disabled={linking}
        onClick={handleClick}
        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-700 hover:bg-gray-600 text-white transition-colors disabled:opacity-50"
      >
        {linking ? "⏳..." : "📷 Link Photos"}
      </button>
      {result && <span className="text-xs text-gray-300 self-center">{result}</span>}
    </>
  );
}
