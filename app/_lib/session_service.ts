const API = process.env.NEXT_PUBLIC_API_URL;

export type SessionInfo = {
  id: string;
  session_date?: string;
  started_at?: string;
  status?: string;
};

export type QueueItem = {
  id: string;
  status: string;
  songs?: { id: string; title: string };
  actual_tone?: string;
  note?: string;
  rating?: number;
};

export type SongDetail = {
  id: string;
  title: string;
  author?: string;
  lyrics?: unknown[];
  sheets?: unknown[];
};

export async function fetchSessionInfo(sessionId: string): Promise<SessionInfo | null> {
  const res = await fetch(`${API}/api/sessions/${sessionId}`);
  if (!res.ok) return null;
  return res.json();
}

export async function fetchSessionQueue(sessionId: string): Promise<QueueItem[]> {
  const res = await fetch(`${API}/api/sessions/${sessionId}/queue`);
  if (!res.ok) return [];
  return res.json();
}

export async function playQueueItem(sessionId: string, queueId: string): Promise<void> {
  await fetch(`${API}/api/sessions/${sessionId}/queue/${queueId}/play`, { method: "POST" });
}

export async function updateSessionPresenting(sessionId: string, url: string): Promise<void> {
  await fetch(`${API}/api/sessions/${sessionId}/present`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
}

export async function fetchSongDetail(songId: string): Promise<SongDetail | null> {
  const res = await fetch(`${API}/api/songs/${songId}`);
  if (!res.ok) return null;
  return res.json();
}
