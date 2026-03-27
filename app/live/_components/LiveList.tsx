type NoteDialogState = {
  isOpen: boolean;
  queueId: string;
  tone: string;
  note: string;
  rating: number;
};

type Props = {
  queue: any[];
  onPlay: (queueId: string, songId: string) => void;
  onStop: (queueId: string) => void;
  onViewSong: (songId: string) => void;
  onOpenNote: (state: NoteDialogState) => void;
};

export default function LiveList({ queue, onPlay, onStop, onViewSong, onOpenNote }: Props) {
  return (
    <div className="w-full md:w-1/3 bg-gray-800 rounded-xl p-4 shadow-2xl overflow-y-auto max-h-[90vh]">
      <div className="flex items-center gap-3 mb-4 border-b border-gray-700 pb-2">
        <a href="/live" className="text-gray-400 hover:text-white text-sm transition-colors">← Quay lại</a>
        <h2 className="text-xl font-bold text-blue-400">Hàng Đợi Hát (Live)</h2>
      </div>
      <div className="space-y-3">
        {queue.map((item, index) => (
          <div
            key={item.id}
            className={`p-3 rounded-lg border transition-all ${
              item.status === "playing" ? "bg-blue-900 border-blue-500"
              : item.status === "done" ? "bg-gray-800 border-gray-700"
              : "bg-gray-750 border-gray-600"
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="font-bold text-lg text-white">{index + 1}. {item.singer_name}</span>
              <span className="text-xs bg-gray-600 px-2 py-1 rounded text-white">{item.table_position || "Khách"}</span>
            </div>
            <div className="text-xs text-gray-400 mb-2 border-b border-gray-700 pb-2">
              SĐT Đặt: <span className="text-gray-300 font-mono">{item.booker_phone || "Không có"}</span>
            </div>

            <div className="text-gray-200 font-medium">🎵 {item.songs?.title}</div>
            <div className="text-sm text-gray-500 mb-3">{item.songs?.author}</div>

            {item.status === "waiting" && (
              <button onClick={() => onPlay(item.id, item.songs.id)} className="w-full bg-green-600 hover:bg-green-500 py-2 rounded font-bold text-sm mb-2 transition-colors">
                ▶ Bắt đầu diễn
              </button>
            )}
            {item.status === "playing" && (
              <button onClick={() => onStop(item.id)} className="w-full bg-red-600 hover:bg-red-500 py-2 rounded font-bold text-sm mb-2 transition-colors shadow-lg">
                🛑 Xong & Tới bài tiếp
              </button>
            )}

            <div className="flex gap-2">
              <button onClick={() => onViewSong(item.songs.id)} className="flex-1 bg-gray-700 hover:bg-gray-600 py-1.5 rounded text-xs transition-colors">
                👀 Xem Sheet/Lời
              </button>
              <button
                onClick={() => onOpenNote({ isOpen: true, queueId: item.id, tone: item.actual_tone || '', note: item.note || '', rating: item.rating || 5 })}
                className="flex-1 bg-blue-700 hover:bg-blue-600 py-1.5 rounded text-xs transition-colors"
              >
                📝 Ghi chú
              </button>
            </div>
          </div>
        ))}
        {queue.length === 0 && <p className="text-gray-500 italic text-center py-4">Chưa có ai đăng ký</p>}
      </div>
    </div>
  );
}