"use client";

import { useState } from "react";

type Lyric = { id: string; slide_drive_url?: string; verified_at: string | null };

type Props = {
  lyric: Lyric;
  editMode: boolean;
  editUrl?: string;
  onEdit: () => void;
  onVerify: () => void;
  onDelete: () => void;
};

export default function LyricFab({ lyric, editMode, editUrl, onEdit, onVerify, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  return (
    <>
      <div className="absolute bottom-6 right-6 flex flex-col items-end gap-2">
        {open && (
          <div className="flex flex-col items-end gap-2 mb-1">
            {lyric.slide_drive_url && (
              <button
                onClick={() => { onEdit(); setOpen(false); }}
                className="flex items-center gap-2 px-4 py-2 rounded-full shadow-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors"
              >
                ✏️ {editMode ? "Thoát chỉnh sửa" : "Chỉnh sửa"}
              </button>
            )}
            {editMode && editUrl && (
              <a
                href={editUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2 rounded-full shadow-lg text-sm font-medium bg-gray-600 hover:bg-gray-500 text-white transition-colors"
              >
                ↗ Mở tab mới
              </a>
            )}
            {!lyric.verified_at && (
              <button
                onClick={() => { onVerify(); setOpen(false); }}
                className="flex items-center gap-2 px-4 py-2 rounded-full shadow-lg text-sm font-medium bg-green-600 hover:bg-green-500 text-white transition-colors"
              >
                ✓ Xác nhận
              </button>
            )}
            <button
              onClick={() => { setDeleteConfirm(true); setOpen(false); }}
              className="flex items-center gap-2 px-4 py-2 rounded-full shadow-lg text-sm font-medium bg-red-600 hover:bg-red-500 text-white transition-colors"
            >
              🗑 Xóa
            </button>
          </div>
        )}

        <button
          onClick={() => setOpen(v => !v)}
          className="w-12 h-12 rounded-full shadow-xl bg-gray-800 hover:bg-gray-700 text-white text-xl flex items-center justify-center transition-colors border border-gray-600"
        >
          {open ? "✕" : "⋯"}
        </button>
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4 text-gray-900">
            <h2 className="text-lg font-bold mb-2">Xác nhận xóa</h2>
            <p className="text-sm text-gray-600 mb-5">
              Bạn có chắc muốn xóa lời này không? Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => { onDelete(); setDeleteConfirm(false); }}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-500 text-white transition-colors"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
