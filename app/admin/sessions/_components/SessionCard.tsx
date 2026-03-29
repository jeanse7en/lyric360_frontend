"use client";

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

type Props = {
  session: Session;
  onStart: (id: string) => void;
  onStop: (id: string) => void;
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatTime(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
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

export default function SessionCard({ session, onStart, onStop }: Props) {
  return (
    <div className={`rounded-xl border p-4 transition-all ${
      session.status === "live" ? "bg-gray-800 border-red-500" :
      session.status === "ended" ? "bg-gray-850 border-gray-700 opacity-70" :
      "bg-gray-800 border-gray-600"
    }`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          {session.name && <p className="font-semibold text-white truncate">{session.name}</p>}
          <p className="text-sm text-gray-400">{formatDate(session.session_date)}</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${STATUS_BADGE[session.status]}`}>
          {STATUS_LABEL[session.status]}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 mb-3">
        <div>🕐 Bắt đầu: <span className="text-gray-300">{formatTime(session.started_at)}</span></div>
        <div>🕐 Kết thúc: <span className="text-gray-300">{formatTime(session.ended_at)}</span></div>
        <div>🎤 Lượt đăng ký: <span className="text-gray-300">{session.order_count}</span></div>
        <div>
          ⚠️ Bài chưa xác nhận:{" "}
          <span className={session.unverified_song_count > 0 ? "text-amber-400 font-medium" : "text-gray-300"}>
            {session.unverified_song_count}
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        {session.status === "planned" && (
          <button
            onClick={() => onStart(session.id)}
            className="flex-1 py-2 rounded-lg text-sm font-medium bg-green-600 hover:bg-green-500 text-white transition-colors"
          >
            ▶ Bắt đầu
          </button>
        )}
        {session.status === "live" && (
          <button
            onClick={() => onStop(session.id)}
            className="flex-1 py-2 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-500 text-white transition-colors"
          >
            ⏹ Kết thúc
          </button>
        )}
      </div>
    </div>
  );
}
