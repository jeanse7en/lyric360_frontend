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
    <div className="w-full bg-white dark:bg-gray-800 rounded-xl p-4 shadow-2xl overflow-y-auto max-h-[90vh]">
      <div className="flex items-center gap-3 mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
        <a href="/live" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm transition-colors">← Quay lại</a>
        <h2 className="text-xl font-bold text-blue-600 dark:text-blue-400">Hàng Đợi Hát (Live)</h2>
      </div>
      <div className="space-y-3">
        {queue.map((item, index) => (
          <div
            key={item.id}
            className={`p-3 rounded-lg border transition-all ${
              item.status === "playing"
                ? "bg-blue-50 dark:bg-blue-900 border-blue-400 dark:border-blue-500"
                : item.status === "done"
                ? "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-60"
                : "bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600"
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-900 dark:text-white truncate">{index + 1}. {item.songs?.title}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {item.singer_name}
                  {item.booker_phone && <span className="ml-2 font-mono">{item.booker_phone}</span>}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                {item.status === "waiting" && (
                  <button onClick={() => onPlay(item.id, item.songs.id)} className="bg-green-600 hover:bg-green-500 px-2 py-1 rounded text-xs font-bold text-white transition-colors">▶</button>
                )}
                {item.status === "playing" && (
                  <button onClick={() => onStop(item.id)} className="bg-red-600 hover:bg-red-500 px-2 py-1 rounded text-xs font-bold text-white transition-colors">🛑</button>
                )}
                <button onClick={() => onViewSong(item.songs.id)} className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 px-2 py-1 rounded text-xs transition-colors">👀</button>
                <button onClick={() => onOpenNote({ isOpen: true, queueId: item.id, tone: item.actual_tone || '', note: item.note || '', rating: item.rating || 5 })} className="bg-blue-100 dark:bg-blue-700 hover:bg-blue-200 dark:hover:bg-blue-600 px-2 py-1 rounded text-xs transition-colors">📝</button>
              </div>
            </div>
          </div>
        ))}
        {queue.length === 0 && <p className="text-gray-400 italic text-center py-4">Chưa có ai đăng ký</p>}
      </div>
    </div>
  );
}
