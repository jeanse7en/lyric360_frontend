"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import vi from "../../../../lib/vi";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const API = process.env.NEXT_PUBLIC_API_URL;

export default function CreateSongModal({ isOpen, onClose }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!title.trim()) return;
    setCreating(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/songs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), author: author.trim() || null }),
      });
      if (!res.ok) { setError(vi.createSong.errCannotCreate); return; }
      const data = await res.json();
      router.push(`/admin/songs/${data.id}/edit`);
    } finally { setCreating(false); }
  };

  const handleClose = () => {
    setTitle(""); setAuthor(""); setError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4 text-gray-900">
        <h2 className="text-lg font-bold mb-4">{vi.createSong.modalTitle}</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {vi.createSong.titleLabel} <span className="text-red-500">*</span>
            </label>
            <input
              type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder={vi.createSong.titlePlaceholder}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              onKeyDown={e => e.key === "Enter" && handleCreate()}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {vi.createSong.authorLabel}
            </label>
            <input
              type="text" value={author} onChange={e => setAuthor(e.target.value)}
              placeholder={vi.createSong.authorPlaceholder}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              onKeyDown={e => e.key === "Enter" && handleCreate()}
            />
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <div className="flex gap-3 justify-end pt-1">
            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              {vi.createSong.cancelBtn}
            </button>
            <button
              onClick={handleCreate} disabled={!title.trim() || creating}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-50"
            >
              {creating ? vi.createSong.creatingBtn : vi.createSong.createBtn}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
