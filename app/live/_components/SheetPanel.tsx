type Props = {
  sheets: { sheet_drive_url: string; tone_male?: string; tone_female?: string }[];
  selectedUrl: string | null;
  onSelect: (url: string) => void;
  onFullscreen: () => void;
  hasSong: boolean;
};

export default function SheetPanel({ sheets, selectedUrl, onSelect, onFullscreen, hasSong }: Props) {
  return (
    <div className="bg-gray-800 rounded-xl p-4 shadow-2xl h-[45vh] flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-yellow-400">Màn Hình Sheet Nhạc</h3>
        {selectedUrl && (
          <button onClick={onFullscreen} className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-sm text-white transition-colors">
            🔲 Phóng to
          </button>
        )}
      </div>

      {sheets.length > 0 && (
        <div className="flex gap-2 mb-2 flex-wrap">
          {sheets.map((sheet, i) => {
            const url = sheet.sheet_drive_url?.replace('/view', '/preview');
            return (
              <button
                key={i}
                onClick={() => onSelect(url)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  selectedUrl === url ? 'bg-yellow-500 text-black' : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
              >
                Sheet {i + 1}{sheet.tone_male ? ` · Nam: ${sheet.tone_male}` : ''}{sheet.tone_female ? ` · Nữ: ${sheet.tone_female}` : ''}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex-grow bg-gray-900 rounded border border-gray-700">
        {selectedUrl
          ? <iframe src={selectedUrl} className="w-full h-full rounded" />
          : <div className="flex items-center justify-center h-full text-gray-500">
              {hasSong ? 'Chọn sheet bên trên' : 'Chưa chọn bài hát'}
            </div>
        }
      </div>
    </div>
  );
}