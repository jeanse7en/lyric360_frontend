interface Props {
  label: string;
  displayValue: React.ReactNode;
  editing: boolean;
  onStartEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  saving?: boolean;
  canSave?: boolean;
  children: React.ReactNode;
}

export default function InlineEditRow({
  label,
  displayValue,
  editing,
  onStartEdit,
  onSave,
  onCancel,
  saving = false,
  canSave = true,
  children,
}: Props) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="text-sm font-medium text-gray-900 dark:text-white shrink-0">{label}</span>
      {editing ? (
        <>
          {children}
          <button
            onClick={onSave}
            disabled={saving || !canSave}
            className="text-green-400 hover:text-green-300 disabled:opacity-40 text-base leading-none"
            title="Lưu"
          >
            ✓
          </button>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-200 text-base leading-none"
            title="Hủy"
          >
            ✕
          </button>
        </>
      ) : (
        <button
          onClick={onStartEdit}
          className="text-sm text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-300 transition-colors truncate text-left"
          title="Click để chỉnh sửa"
        >
          {displayValue}
        </button>
      )}
    </div>
  );
}