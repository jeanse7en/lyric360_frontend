type Props = {
  mode: 'sheet' | 'lyric';
  sheetUrl: string | null;
  lyricUrl: string | null;
  onClose: () => void;
};

export default function FullscreenOverlay({ mode, sheetUrl, lyricUrl, onClose }: Props) {
  const src = mode === 'sheet' ? sheetUrl ?? '' : lyricUrl ?? '';

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex justify-between items-center p-4 bg-gray-900">
        <h2 className="text-xl font-bold text-white">
          {mode === 'sheet' ? 'Sheet Nhạc' : 'Lời Bài Hát'}
        </h2>
        <button onClick={onClose} className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-lg font-bold text-lg shadow-lg">
          ✖ Đóng
        </button>
      </div>
      <div className="flex-grow bg-white">
        <iframe src={src} className="w-full h-full" />
      </div>
    </div>
  );
}