type Session = {
  id: string;
  session_date: string;
  status: 'planned' | 'live' | 'ended';
};

type Props = {
  sessions: Session[];
  selectedId: string;
  onChange: (id: string) => void;
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function SessionSelector({ sessions, selectedId, onChange }: Props) {
  if (sessions.length === 0) return null;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Buổi diễn *</label>
      <select
        value={selectedId}
        onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500 text-gray-700"
        required
      >
        {sessions.map(session => (
          <option key={session.id} value={session.id}>
            {session.status === 'live' ? '🔴 Đang diễn – ' : '📅 '}
            {formatDate(session.session_date)}
          </option>
        ))}
      </select>
    </div>
  );
}