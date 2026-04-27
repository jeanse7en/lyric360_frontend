"use client";

type Props = {
  title: string;
  message: React.ReactNode;
  confirmLabel: string;
  confirmClassName?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmModal({ title, message, confirmLabel, confirmClassName, onConfirm, onCancel }: Props) {
  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full text-gray-900">
        <h2 className="text-lg font-bold mb-2">{title}</h2>
        <p className="text-sm text-gray-600 mb-5">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            className={confirmClassName ?? "px-4 py-2 rounded-lg text-sm bg-blue-600 hover:bg-blue-500 text-white transition-colors"}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}