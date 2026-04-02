import vi from '@/lib/vi';

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
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{vi.sessionSelector.label}</label>
      {sessions.length === 0 ? (
        <p className="text-sm text-gray-500">{vi.sessionSelector.empty}</p>
      ) : (
        <select
          value={selectedId}
          onChange={e => onChange(e.target.value)}
          className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          required
        >
          {sessions.map(session => (
            <option key={session.id} value={session.id}>
              {session.status === 'live' ? vi.sessionSelector.live : vi.sessionSelector.planned}
              {formatDate(session.session_date)}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
