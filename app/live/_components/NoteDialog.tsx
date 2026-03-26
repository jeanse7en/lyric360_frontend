type NoteDialogState = {
  isOpen: boolean;
  queueId: string;
  tone: string;
  note: string;
  rating: number;
};

type Props = {
  state: NoteDialogState;
  onChange: (state: NoteDialogState) => void;
  onSave: () => void;
};

export default function NoteDialog({ state, onChange, onSave }: Props) {
  if (!state.isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 p-6 rounded-xl w-full max-w-md shadow-2xl border border-gray-600">
        <h3 className="text-xl font-bold mb-4 text-white">📝 Ghi chú tư liệu biểu diễn</h3>

        <label className="block text-sm text-gray-400 mb-1">Tone thực tế khách hát</label>
        <input
          type="text"
          value={state.tone}
          onChange={e => onChange({ ...state, tone: e.target.value })}
          className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white mb-4 outline-none focus:border-blue-500"
          placeholder="VD: Am, C#m..."
        />

        <label className="block text-sm text-gray-400 mb-1">Chất lượng biểu diễn (Sao)</label>
        <input
          type="number"
          min="1"
          max="5"
          value={state.rating}
          onChange={e => onChange({ ...state, rating: Number(e.target.value) })}
          className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white mb-4 outline-none focus:border-blue-500"
        />

        <label className="block text-sm text-gray-400 mb-1">Lưu ý khác</label>
        <textarea
          value={state.note}
          onChange={e => onChange({ ...state, note: e.target.value })}
          className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white mb-6 h-24 outline-none focus:border-blue-500"
          placeholder="Khách hát yếu nhịp, cần nâng tone..."
        />

        <div className="flex justify-end gap-3">
          <button onClick={() => onChange({ ...state, isOpen: false })} className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white transition-colors">
            Hủy
          </button>
          <button onClick={onSave} className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors">
            💾 Lưu Ghi Chú
          </button>
        </div>
      </div>
    </div>
  );
}
