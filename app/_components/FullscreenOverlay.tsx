import vi from "../../lib/vi";

type Props = {
  url: string;
  title: string;
  onClose: () => void;
  /** When provided, shows a secondary button that stops the live song then closes */
  onStopLive?: () => void;
};

export default function FullscreenOverlay({ url, title, onClose, onStopLive }: Props) {
  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex justify-between items-center p-4 bg-gray-900">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <div className="flex gap-3">
          {onStopLive && (
            <button
              onClick={() => { onStopLive(); onClose(); }}
              className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg"
            >
              🛑 Dừng Live &amp; Thoát
            </button>
          )}
          <button
            onClick={onClose}
            className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-lg font-bold text-lg shadow-lg"
          >
            {vi.fullscreen.closeBtn}
          </button>
        </div>
      </div>
      <div className="flex-grow bg-white">
        <iframe src={url} className="w-full h-full" />
      </div>
    </div>
  );
}