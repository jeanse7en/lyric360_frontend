type Props = {
  bookerName: string;
  singerName: string;
  phone: string;
  tablePos: string;
  onBookerNameChange: (v: string) => void;
  onSingerNameChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onTablePosChange: (v: string) => void;
};

export default function BookerInfo({ bookerName, singerName, phone, tablePos, onBookerNameChange, onSingerNameChange, onPhoneChange, onTablePosChange }: Props) {
  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
      <input
        required
        type="text"
        value={bookerName}
        onChange={e => onBookerNameChange(e.target.value)}
        onBlur={() => !singerName && onSingerNameChange(bookerName)}
        className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500"
        placeholder="Tên người đặt bàn *"
      />
      <div className="flex gap-2">
        <input
          type="tel"
          value={phone}
          onChange={e => onPhoneChange(e.target.value)}
          className="w-1/2 px-4 py-2 border rounded"
          placeholder="Số Zalo (Nhận video)"
        />
        <select
          value={tablePos}
          onChange={e => onTablePosChange(e.target.value)}
          className="w-1/2 px-4 py-2 border rounded text-gray-600"
        >
          <option value="">Vị trí bàn</option>
          <option value="near_stage">Bàn gần sân khấu</option>
          <option value="middle">Bàn ở giữa</option>
          <option value="far_stage">Bàn xa sân khấu</option>
        </select>
      </div>
      <input
        required
        type="text"
        value={singerName}
        onChange={e => onSingerNameChange(e.target.value)}
        className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500"
        placeholder="Tên người hát *"
      />
    </div>
  );
}
