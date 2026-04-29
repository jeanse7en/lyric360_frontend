"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmModal from "../../../_components/ConfirmModal";

type Session = {
  id: string;
  name?: string;
  session_date: string;
  status: string;
  is_private: boolean;
  started_at?: string;
  ended_at?: string;
  order_count: number;
  unverified_song_count: number;
};

type Props = {
  session: Session;
  onStart: (id: string) => void;
  onStop: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (session: Session) => void;
  onQR: (session: Session) => void;
};

export default function SessionActionMenu({ session, onStart, onStop, onDelete, onEdit, onQR }: Props) {
  const router = useRouter();
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [startConfirm, setStartConfirm] = useState(false);
  const [stopConfirm, setStopConfirm] = useState(false);
  return (
    <div className="mt-3 pt-3 border-t border-gray-700 space-y-2">
      {/* Stats row */}
      <div className="flex gap-4 text-xs text-gray-400 mb-1">
        <span>🎤 {session.order_count} lượt đăng ký</span>
        {session.unverified_song_count > 0 && (
          <span className="text-amber-400">⚠️ {session.unverified_song_count} bài chưa xác nhận</span>
        )}
        {session.started_at && <span>▶ {new Date(session.started_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</span>}
        {session.ended_at && <span>⏹ {new Date(session.ended_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</span>}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {session.status === "planned" && (
          <button
            onClick={() => setStartConfirm(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-600 hover:bg-green-500 text-white transition-colors"
          >
            Bắt đầu
          </button>
        )}
        {session.status === "live" && (
          <button
            onClick={() => setStopConfirm(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 hover:bg-red-500 text-white transition-colors"
          >
            Kết thúc
          </button>
        )}
        <button
            onClick={() => router.push(`/admin/live/${session.id}`)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors"
        >
          Xem
        </button>
        {session.status === "ended" && (
          <>
            <button
              onClick={() => router.push(`/admin/live/${session.id}/video-cut`)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-700 hover:bg-gray-600 text-gray-200 transition-colors"
            >
              Cắt video
            </button>
            <button
              onClick={() => router.push(`/admin/live/${session.id}/video-upload`)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-700 hover:bg-gray-600 text-gray-200 transition-colors"
            >
              Upload video
            </button>
          </>
        )}
        <button
          onClick={() => onQR(session)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-700 hover:bg-gray-600 text-white transition-colors"
        >
          QR đăng ký
        </button>
        <button
          onClick={() => onEdit(session)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-700 hover:bg-gray-600 text-white transition-colors"
        >
          Chỉnh sửa
        </button>
        <button
          onClick={() => setDeleteConfirm(true)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-700 hover:bg-red-700 text-red-400 hover:text-white transition-colors"
        >
          Xóa
        </button>
      </div>

      {startConfirm && (
        <ConfirmModal
          title="Bắt đầu buổi diễn?"
          message={<>Buổi diễn <span className="font-semibold">{session.name || session.session_date}</span> sẽ chuyển sang trạng thái <span className="text-green-600 font-semibold">Live</span>. Các buổi đang live khác sẽ bị dừng lại.</>}
          confirmLabel="▶ Bắt đầu"
          confirmClassName="px-4 py-2 rounded-lg text-sm bg-green-600 hover:bg-green-500 text-white transition-colors"
          onConfirm={() => { onStart(session.id); setStartConfirm(false); }}
          onCancel={() => setStartConfirm(false)}
        />
      )}
      {stopConfirm && (
        <ConfirmModal
          title="Kết thúc buổi diễn?"
          message={<>Buổi diễn <span className="font-semibold">{session.name || session.session_date}</span> sẽ kết thúc. Hàng đợi sẽ bị đóng lại.</>}
          confirmLabel="⏹ Kết thúc"
          confirmClassName="px-4 py-2 rounded-lg text-sm bg-red-600 hover:bg-red-500 text-white transition-colors"
          onConfirm={() => { onStop(session.id); setStopConfirm(false); }}
          onCancel={() => setStopConfirm(false)}
        />
      )}
      {deleteConfirm && (
        <ConfirmModal
          title="Xác nhận xóa"
          message="Buổi diễn này sẽ bị xóa vĩnh viễn cùng toàn bộ hàng đợi."
          confirmLabel="Xóa"
          confirmClassName="px-4 py-2 rounded-lg text-sm bg-red-600 hover:bg-red-500 text-white transition-colors"
          onConfirm={() => { onDelete(session.id); setDeleteConfirm(false); }}
          onCancel={() => setDeleteConfirm(false)}
        />
      )}
    </div>
  );
}
