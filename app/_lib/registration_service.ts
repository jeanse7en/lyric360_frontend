import { fetchSetting } from "./settings_service";

const API = process.env.NEXT_PUBLIC_API_URL;

export type Session = { id: string; session_date: string; status: "planned" | "live" | "ended"; order_count: number; is_private?: boolean };
export type Song = { id: string; title: string; author?: string };
export type UserExistingReg = { registration_id: string; song_id: string; song_title: string };

export type SessionBookingInfo = {
  booked_song_ids: string[];
  user_registration: UserExistingReg | null;
};

export type RegisterPayload = {
  session_id: string;
  song_id?: string;
  free_text_song_name?: string;
  singer_name: string;
  booker_phone: string;
  tone?: string;
  drinks: string[];
  user_id?: string;
};

export type RegisterResult = { order_number: number; user_id: string };

export async function fetchQueueLimit(): Promise<number> {
  const val = await fetchSetting("queue_limit");
  const parsed = parseInt(val ?? "30", 10);
  return isNaN(parsed) ? 30 : parsed;
}

export async function fetchAvailableSessions(): Promise<Session[]> {
  const res = await fetch(`${API}/api/sessions/available`);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchSessionById(id: string): Promise<Session | null> {
  const res = await fetch(`${API}/api/sessions/${id}`);
  if (!res.ok) return null;
  return res.json();
}

export async function fetchUserRecentSongs(userId: string): Promise<Song[]> {
  const res = await fetch(`${API}/api/queue/user/${userId}`);
  if (!res.ok) return [];
  const items: any[] = await res.json();
  const seen = new Set<string>();
  const unique: Song[] = [];
  for (const item of items) {
    if (item.song_id && !seen.has(item.song_id)) {
      seen.add(item.song_id);
      unique.push({ id: item.song_id, title: item.song_title, author: item.song_author });
    }
  }
  return unique;
}

export async function fetchSessionBookingInfo(
  sessionId: string,
  userId?: string | null,
): Promise<SessionBookingInfo> {
  const url = `${API}/api/sessions/${sessionId}/booked-songs${userId ? `?user_id=${userId}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) return { booked_song_ids: [], user_registration: null };
  const data = await res.json();
  return {
    booked_song_ids: data.booked_song_ids ?? [],
    user_registration: data.user_registration ?? null,
  };
}

export async function submitRegistration(
  payload: RegisterPayload,
): Promise<{ ok: true; data: RegisterResult } | { ok: false; error: string }> {
  const res = await fetch(`${API}/api/queue/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) return { ok: false, error: data.detail ?? "Đăng ký thất bại" };
  return { ok: true, data };
}