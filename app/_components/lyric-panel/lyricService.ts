export type Lyric = {
  id: string;
  lyrics?: string;
  slide_drive_url?: string;
  source_lyric?: string;
  composed_at?: string;
  verified_at?: string | null;
};

const API = process.env.NEXT_PUBLIC_API_URL;

export async function addLyric(
  songId: string,
  payload: { lyrics: string; source_lyric: string; composed_at: string | null }
): Promise<Lyric> {
  const res = await fetch(`${API}/api/songs/${songId}/lyrics`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("save_failed");
  return res.json();
}

export async function aiFetchLyrics(title: string, author?: string): Promise<{ lyrics: string; year?: string }> {
  const params = new URLSearchParams({ title });
  if (author) params.set("author", author);
  const res = await fetch(`${API}/api/songs/ai-fetch-lyrics?${params}`, { method: "POST" });
  if (res.status === 501) throw new Error("not_impl");
  if (!res.ok) throw new Error("ai_failed");
  return res.json();
}

export async function generateSlide(songId: string, lyricId: string): Promise<Lyric> {
  const res = await fetch(`${API}/api/songs/${songId}/lyrics/${lyricId}/generate-slide`, { method: "POST" });
  if (res.status === 501) throw new Error("slide_not_impl");
  if (!res.ok) throw new Error("slide_failed");
  return res.json();
}

export async function verifyLyric(songId: string, lyricId: string): Promise<void> {
  await fetch(`${API}/api/songs/${songId}/lyrics/${lyricId}/verify`, { method: "POST" });
}

export async function deleteLyric(songId: string, lyricId: string): Promise<void> {
  await fetch(`${API}/api/songs/${songId}/lyrics/${lyricId}`, { method: "DELETE" });
}
