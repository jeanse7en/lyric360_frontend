"use client";

import { useState, useEffect } from "react";

export default function MobileRegistration() {
  const [bookerName, setBookerName] = useState("");
  const [singerName, setSingerName] = useState("");
  const [phone, setPhone] = useState("");
  const [tablePos, setTablePos] = useState("");
  
  // States cho tìm kiếm và phân trang
  const [inputValue, setInputValue] = useState(""); 
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedSong, setSelectedSong] = useState<any>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Load bài hát từ Backend
  const fetchSongs = async (searchQ: string, currentOffset: number, append: boolean = false) => {
    try {
      const res = await fetch(`https://api.lyric360.vn/api/songs/search?q=${searchQ}&offset=${currentOffset}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        if (data.length < 20) setHasMore(false); // Hết dữ liệu
        else setHasMore(true);
        
        if (append) setSearchResults(prev => [...prev, ...data]);
        else setSearchResults(data);
      }
    } catch (error) { console.error(error); }
  };

  // Chạy khi người dùng mở dropdown hoặc gõ phím
  useEffect(() => {
    if (!isDropdownOpen) return;
    const timeoutId = setTimeout(() => {
      setOffset(0);
      fetchSongs(inputValue, 0, false);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [inputValue, isDropdownOpen]);

  const loadMore = (e: any) => {
    e.preventDefault();
    const nextOffset = offset + 20;
    setOffset(nextOffset);
    fetchSongs(inputValue, nextOffset, true);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!selectedSong) return alert("Vui lòng chọn bài hát!");
    try {
      const res = await fetch("https://api.lyric360.vn/api/queue/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: "00000000-0000-0000-0000-000000000000", song_id: selectedSong.id, singer_name: singerName, booker_phone: phone, table_position: tablePos }),
      });
      if (res.ok) {
        alert("🎉 Đăng ký thành công!");
        setInputValue(""); setSelectedSong(null); setIsDropdownOpen(false);
      }
    } catch (error) { alert("Lỗi kết nối!"); }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:bg-gray-200 flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">Đăng Ký Bài Hát</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
            <input required type="text" value={bookerName} onChange={e => setBookerName(e.target.value)} onBlur={() => !singerName && setSingerName(bookerName)} className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500" placeholder="Tên người đặt bàn *" />
            <div className="flex gap-2">
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-1/2 px-4 py-2 border rounded" placeholder="Số Zalo (Nhận video)" />
              <input type="text" value={tablePos} onChange={e => setTablePos(e.target.value)} className="w-1/2 px-4 py-2 border rounded" placeholder="Vị trí bàn" />
            </div>
            <input required type="text" value={singerName} onChange={e => setSingerName(e.target.value)} className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500" placeholder="Tên người hát *" />
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Chọn Bài Hát *</label>
            <input 
              required={!selectedSong} 
              type="text" 
              value={inputValue}
              onFocus={() => setIsDropdownOpen(true)}
              onChange={(e) => { setInputValue(e.target.value); setSelectedSong(null); }}
              className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Gõ tìm hoặc lướt chọn..." 
            />
            
            {/* DANH SÁCH BÀI HÁT (Có Paging) */}
            {isDropdownOpen && !selectedSong && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-xl">
                <ul className="max-h-60 overflow-y-auto">
                  {searchResults.map((song) => (
                    <li key={song.id} onClick={() => { setSelectedSong(song); setInputValue(song.title); setIsDropdownOpen(false); }} className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b">
                      <div className="font-medium">{song.title}</div>
                      <div className="text-xs text-gray-500">{song.author}</div>
                    </li>
                  ))}
                  {hasMore && (
                    <button onClick={loadMore} className="w-full text-center py-2 text-sm text-blue-600 font-bold hover:bg-blue-50">
                      ⬇ Tải thêm bài hát...
                    </button>
                  )}
                </ul>
              </div>
            )}
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700">Gửi Đăng Ký</button>
        </form>
      </div>
    </div>
  );
}