export type Sheet = {
  id: string;
  sheet_drive_url: string;
  tone_male?: string;
  tone_female?: string;
  verified_at?: string | null;
};

const API = process.env.NEXT_PUBLIC_API_URL;

export async function addSheet(
  songId: string,
  payload: { sheet_drive_url: string; tone_male?: string | null; tone_female?: string | null }
): Promise<Sheet> {
  const res = await fetch(`${API}/api/songs/${songId}/sheets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("add_failed");
  return res.json();
}

export async function verifySheet(songId: string, sheetId: string): Promise<void> {
  await fetch(`${API}/api/songs/${songId}/sheets/${sheetId}/verify`, { method: "POST" });
}

export async function deleteSheet(songId: string, sheetId: string): Promise<void> {
  await fetch(`${API}/api/songs/${songId}/sheets/${sheetId}`, { method: "DELETE" });
}
