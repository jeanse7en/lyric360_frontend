"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// Khởi tạo Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LiveDashboard() {
  const [queue, setQueue] = useState<any[]>([]);
  const [currentSongId, setCurrentSongId] = useState<string | null>(null);
  const [fullScreenMode, setFullScreenMode] = useState<'none' | 'sheet' | 'lyric'>('none');
  
  // State cho Dialog Ghi chú
  const [noteDialog, setNoteDialog] = useState({ isOpen: false, queueId: '', tone: '', note: '', rating: 5 });

  // ID của đêm diễn giả định
  const sessionId = "00000000-0000-0000-0000-000000000000";

  const fetchInitialQueue = async () => {
    const { data } = await supabase
      .from("queue_registrations")
      .select(`id, singer_name, booker_phone, table_position, status, actual_tone, note, rating, created_at, songs ( id, title, author, sheet_drive_url, slide_drive_url )`)
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });
    
    setQueue(data || []);
    
    // Nếu chưa xem bài nào, tự động hiển thị bài đang chơi (nếu có)
    const playingSong = (data as any[])?.find((item) => item.status === "playing");
    if (playingSong && !currentSongId) {
      setCurrentSongId(playingSong.songs.id);
    }
  };

  useEffect(() => {
    fetchInitialQueue();
    // Lắng nghe Real-time
    const channel = supabase.channel("public:queue_registrations")
      .on("postgres_changes", { event: "*", schema: "public", table: "queue_registrations", filter: `session_id=eq.${sessionId}` }, () => fetchInitialQueue())
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handlePlaySong = async (queueId: string, songId: string) => {
    // Tắt bài cũ, bật bài mới
    await supabase.from("queue_registrations").update({ status: "done" }).eq("status", "playing").eq("session_id", sessionId);
    await supabase.from("queue_registrations").update({ status: "playing", actual_start: new Date().toISOString() }).eq("id", queueId);
    setCurrentSongId(songId);
  };

  const handleStopSong = async (currentQueueId: string) => {
    // Đánh dấu xong bài hiện tại
    await supabase.from("queue_registrations").update({ status: "done", actual_end: new Date().toISOString() }).eq("id", currentQueueId);
    // Chuẩn bị bài tiếp theo
    const nextItem = queue.find(item => item.status === "waiting" && item.id !== currentQueueId);
    if (nextItem) setCurrentSongId(nextItem.songs.id);
  };

  // Lưu Ghi chú
  const saveNote = async () => {
    await supabase.from("queue_registrations")
      .update({ actual_tone: noteDialog.tone, note: noteDialog.note, rating: noteDialog.rating })
      .eq("id", noteDialog.queueId);
    setNoteDialog({ ...noteDialog, isOpen: false });
    fetchInitialQueue();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 font-sans">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
        
        {/* ================= CỘT TRÁI: DANH SÁCH LIVE ================= */}
        <div className="w-full md:w-1/3 bg-gray-800 rounded-xl p-4 shadow-2xl overflow-y-auto max-h-[90vh]">
          <h2 className="text-xl font-bold mb-4 text-blue-400 border-b border-gray-700 pb-2">Hàng Đợi Hát (Live)</h2>
          <div className="space-y-3">
            {queue.map((item, index) => (
              <div key={item.id} className={`p-3 rounded-lg border transition-all ${item.status === "playing" ? "bg-blue-900 border-blue-500" : item.status === "done" ? "bg-gray-800 border-gray-700" : "bg-gray-750 border-gray-600"}`}>
                
                {/* THÔNG TIN KHÁCH HÀNG */}
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-lg text-white">{index + 1}. {item.singer_name}</span>
                  <span className="text-xs bg-gray-600 px-2 py-1 rounded text-white">{item.table_position || "Khách"}</span>
                </div>
                <div className="text-xs text-gray-400 mb-2 border-b border-gray-700 pb-2">
                  SĐT Đặt: <span className="text-gray-300 font-mono">{item.booker_phone || "Không có"}</span>
                </div>
                
                <div className="text-gray-200 font-medium">🎵 {item.songs?.title}</div>
                <div className="text-sm text-gray-500 mb-3">{item.songs?.author}</div>

                {/* Các nút hành động chính */}
                {item.status === "waiting" && (
                  <button onClick={() => handlePlaySong(item.id, item.songs.id)} className="w-full bg-green-600 hover:bg-green-500 py-2 rounded font-bold text-sm mb-2 transition-colors">▶ Bắt đầu diễn</button>
                )}
                {item.status === "playing" && (
                  <button onClick={() => handleStopSong(item.id)} className="w-full bg-red-600 hover:bg-red-500 py-2 rounded font-bold text-sm mb-2 transition-colors shadow-lg">🛑 Xong & Tới bài tiếp</button>
                )}
                
                {/* NÚT XEM LẠI & GHI CHÚ */}
                <div className="flex gap-2">
                  <button 
                    onClick={() => setCurrentSongId(item.songs.id)} 
                    className="flex-1 bg-gray-700 hover:bg-gray-600 py-1.5 rounded text-xs transition-colors"
                  >
                    👀 Xem Sheet/Lời
                  </button>
                  <button 
                    onClick={() => setNoteDialog({ isOpen: true, queueId: item.id, tone: item.actual_tone || '', note: item.note || '', rating: item.rating || 5 })} 
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

        {/* ================= CỘT PHẢI: IFRAME HIỂN THỊ ================= */}
        <div className="w-full md:w-2/3 flex flex-col gap-4">
          
          {/* Màn Hình Sheet Nhạc */}
          <div className="bg-gray-800 rounded-xl p-4 shadow-2xl h-[45vh] flex flex-col relative group">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-yellow-400">Màn Hình Sheet Nhạc</h3>
              {currentSongId && (
                <button onClick={() => setFullScreenMode('sheet')} className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-sm text-white transition-colors">
                  🔲 Phóng to
                </button>
              )}
            </div>
            <div className="flex-grow bg-gray-900 rounded border border-gray-700">
              {currentSongId ? (
                <iframe src={queue.find(q => q.songs?.id === currentSongId)?.songs?.sheet_drive_url?.replace('/view', '/preview')} className="w-full h-full rounded" />
              ) : <div className="flex items-center justify-center h-full text-gray-500">Chưa chọn bài hát</div>}
            </div>
          </div>

          {/* Màn Hình Lời Bài Hát */}
          <div className="bg-gray-800 rounded-xl p-4 shadow-2xl h-[40vh] flex flex-col relative group">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-pink-400">Màn Hình Lời Bài Hát</h3>
              {currentSongId && (
                <button onClick={() => setFullScreenMode('lyric')} className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-sm text-white transition-colors">
                  🔲 Phóng to
                </button>
              )}
            </div>
            <div className="flex-grow bg-gray-900 rounded border border-gray-700">
               {currentSongId ? (
                <iframe src={queue.find(q => q.songs?.id === currentSongId)?.songs?.slide_drive_url?.replace(/\/edit.*/, "/embed?rm=minimal")} className="w-full h-full rounded" />
              ) : <div className="flex items-center justify-center h-full text-gray-500">Chưa chọn bài hát</div>}
            </div>
          </div>
        </div>
      </div>

      {/* ================= LỚP PHỦ TOÀN MÀN HÌNH (FULLSCREEN OVERLAY) ================= */}
      {fullScreenMode !== 'none' && currentSongId && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="flex justify-between items-center p-4 bg-gray-900">
            <h2 className="text-xl font-bold text-white">
              {fullScreenMode === 'sheet' ? 'Sheet Nhạc' : 'Lời Bài Hát'}
            </h2>
            <button onClick={() => setFullScreenMode('none')} className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-lg font-bold text-lg shadow-lg">
              ✖ Đóng
            </button>
          </div>
          <div className="flex-grow bg-white">
            <iframe 
              src={fullScreenMode === 'sheet' 
                ? queue.find(q => q.songs?.id === currentSongId)?.songs?.sheet_drive_url?.replace('/view', '/preview')
                : queue.find(q => q.songs?.id === currentSongId)?.songs?.slide_drive_url?.replace(/\/edit.*/, "/embed?rm=minimal")
              } 
              className="w-full h-full"
            />
          </div>
        </div>
      )}

      {/* ================= DIALOG GHI CHÚ (MODAL) ================= */}
      {noteDialog.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 p-6 rounded-xl w-full max-w-md shadow-2xl border border-gray-600">
            <h3 className="text-xl font-bold mb-4 text-white">📝 Ghi chú tư liệu biểu diễn</h3>
            
            <label className="block text-sm text-gray-400 mb-1">Tone thực tế khách hát</label>
            <input type="text" value={noteDialog.tone} onChange={e => setNoteDialog({...noteDialog, tone: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white mb-4 outline-none focus:border-blue-500" placeholder="VD: Am, C#m..." />
            
            <label className="block text-sm text-gray-400 mb-1">Chất lượng biểu diễn (Sao)</label>
            <input type="number" min="1" max="5" value={noteDialog.rating} onChange={e => setNoteDialog({...noteDialog, rating: Number(e.target.value)})} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white mb-4 outline-none focus:border-blue-500" />
            
            <label className="block text-sm text-gray-400 mb-1">Lưu ý khác</label>
            <textarea value={noteDialog.note} onChange={e => setNoteDialog({...noteDialog, note: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white mb-6 h-24 outline-none focus:border-blue-500" placeholder="Khách hát yếu nhịp, cần nâng tone..." />
            
            <div className="flex justify-end gap-3">
              <button onClick={() => setNoteDialog({...noteDialog, isOpen: false})} className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white transition-colors">Hủy</button>
              <button onClick={saveNote} className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors">💾 Lưu Ghi Chú</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}