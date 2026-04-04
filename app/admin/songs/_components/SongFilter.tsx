type VerifyStatus = "UNVERIFIED_ALL" | "UNVERIFIED_LYRIC" | "UNVERIFIED_SHEET" | "VERIFIED" | "";

const VERIFY_FILTERS: { label: string; value: VerifyStatus }[] = [
  { label: "Tất cả", value: "" },
  { label: "Chưa xác nhận", value: "UNVERIFIED_ALL" },
  { label: "Lời chưa xác nhận", value: "UNVERIFIED_LYRIC" },
  { label: "Sheet chưa xác nhận", value: "UNVERIFIED_SHEET" },
  { label: "Đã xác nhận", value: "VERIFIED" },
];

type Props = {
  query: string;
  verifyStatus: VerifyStatus;
  onQueryChange: (query: string) => void;
  onVerifyStatusChange: (status: VerifyStatus) => void;
};

export type { VerifyStatus };

export default function SongFilter({ query, verifyStatus, onQueryChange, onVerifyStatusChange }: Props) {
  return (
    <div className="flex gap-2 mb-4">
      <input
        type="text"
        value={query}
        onChange={e => onQueryChange(e.target.value)}
        placeholder="Tìm kiếm bài hát..."
        className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
      />
      <select
        value={verifyStatus}
        onChange={e => onVerifyStatusChange(e.target.value as VerifyStatus)}
        className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
      >
        {VERIFY_FILTERS.map(f => (
          <option key={f.value} value={f.value}>{f.label}</option>
        ))}
      </select>
    </div>
  );
}
