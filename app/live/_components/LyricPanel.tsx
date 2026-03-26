type Props = {
  lyrics: { slide_drive_url: string }[];
  selectedUrl: string | null;
  onSelect: (url: string) => void;
  onFullscreen: () => void;
  hasSong: boolean;
};

export default function LyricPanel({ lyrics, selectedUrl, onSelect, onFullscreen, hasSong }: Props) {
  return (
    <div className="bg-gray-800 rounded-xl p-4 shadow-2xl h-[40vh] flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-pink-400">Màn Hình Lời Bài Hát</h3>
        {selectedUrl && (
          <button onClick={onFullscreen} className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-sm text-white transition-colors">
            🔲 Phóng to
          </button>
        )}
      </div>

      {lyrics.length > 0 && (
        <div className="flex gap-2 mb-2 flex-wrap">
          {lyrics.map((lyric, i) => {
            const url = lyric.slide_drive_url?.replace(/\/edit.*/, "/embed?rm=minimal");
            return (
              <button
                key={i}
                onClick={() => onSelect(url)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  selectedUrl === url ? 'bg-pink-500 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
              >
                Lời {i + 1}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex-grow bg-gray-900 rounded border border-gray-700">
        {selectedUrl
          ? <iframe src={selectedUrl} className="w-full h-full rounded" />
          : <div className="flex items-center justify-center h-full text-gray-500">
              {hasSong ? 'Chọn lời bên trên' : 'Chưa chọn bài hát'}
            </div>
        }
      </div>
    </div>
  );
}
