type Props = {
  value: string;
  onChange: (v: string) => void;
};

export default function ToneInput({ value, onChange }: Props) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tone (tuỳ chọn)</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        placeholder="VD: Am, C, C#m..."
      />
    </div>
  );
}
