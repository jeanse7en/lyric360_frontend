type Props = {
  title: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function InlineConfirm({ title, loading, onConfirm, onCancel }: Props) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-xs text-gray-500 dark:text-gray-400">{title}</span>
      <button
        type="button"
        onClick={onConfirm}
        disabled={loading}
        className="text-xs px-1.5 py-0.5 rounded bg-red-500 hover:bg-red-600 text-white disabled:opacity-50 transition-colors"
      >
        {loading ? "..." : "Xoá"}
      </button>
      <button
        type="button"
        onClick={onCancel}
        disabled={loading}
        className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
      >
        Huỷ
      </button>
    </span>
  );
}
