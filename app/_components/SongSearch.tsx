import { useState, useEffect } from "react";

type Song = { id: string; title: string; author?: string };

type Props = {
  selectedSong: Song | null;
  onSelect: (song: Song | null) => void;
};

export default function SongSearch({ selectedSong, onSelect }: Props) {
  const [inputValue, setInputValue] = useState("");
  const [results, setResults] = useState<Song[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchSongs = async (q: string, currentOffset: number, append = false) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/songs/search?q=${q}&offset=${currentOffset}&limit=20`);
      if (!res.ok) return;
      const data: Song[] = await res.json();
      setHasMore(data.length === 20);
      setResults(prev => append ? [...prev, ...data] : data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (!isOpen) return;
    const id = setTimeout(() => { setOffset(0); fetchSongs(inputValue, 0); }, 300);
    return () => clearTimeout(id);
  }, [inputValue, isOpen]);

  const loadMore = (e: React.MouseEvent) => {
    e.preventDefault();
    const next = offset + 20;
    setOffset(next);
    fetchSongs(inputValue, next, true);
  };

  const handleSelect = (song: Song) => {
    onSelect(song);
    setInputValue(song.title);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">Chọn Bài Hát *</label>
      <input
        required={!selectedSong}
        type="text"
        value={inputValue}
        onFocus={() => setIsOpen(true)}
        onChange={e => { setInputValue(e.target.value); onSelect(null); }}
        className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        placeholder="Gõ tìm hoặc lướt chọn..."
      />

      {isOpen && !selectedSong && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-xl">
          <ul className="max-h-60 overflow-y-auto">
            {results.map(song => (
              <li
                key={song.id}
                onClick={() => handleSelect(song)}
                className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b"
              >
                <div className="font-medium">{song.title}</div>
                <div className="text-xs text-gray-500">{song.author}</div>
              </li>
            ))}
          </ul>
          {hasMore && (
            <button onClick={loadMore} className="w-full text-center py-2 text-sm text-blue-600 font-bold hover:bg-blue-50">
              ⬇ Tải thêm bài hát...
            </button>
          )}
        </div>
      )}
    </div>
  );
}
