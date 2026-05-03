"use client";

type Props = {
  value: number | null;
  onChange: (v: number | null) => void;
  queueLimit: number;
  takenNumbers: number[];
};

export default function PreorderNumberSelect({ value, onChange, queueLimit, takenNumbers }: Props) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Số thứ tự <span className="font-normal text-gray-400">(tuỳ chọn)</span>
      </label>
      <select
        value={value ?? ""}
        onChange={e => onChange(e.target.value ? Number(e.target.value) : null)}
        className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
      >
        <option value="">Tự động</option>
        {Array.from({ length: queueLimit }, (_, i) => i + 1).map((n) => {
          const taken = takenNumbers.includes(n);
          return (
            <option key={n} value={n} disabled={taken}>
              {n}{taken ? " (đã đặt)" : ""}
            </option>
          );
        })}
      </select>
    </div>
  );
}
