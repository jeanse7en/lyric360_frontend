type Props = {
  value: string;
  onChange: (v: string) => void;
};

export default function ToneInput({ value, onChange }: Props) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Tone (tuỳ chọn)</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500"
        placeholder="VD: Am, C, C#m..."
      />
    </div>
  );
}