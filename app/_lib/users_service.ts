const API = process.env.NEXT_PUBLIC_API_URL;

export type User = {
  id: string;
  name: string;
  phone_zalo?: string | null;
  facebook_link?: string | null;
  created_at?: string;
};

export async function searchUsers(q: string): Promise<User[]> {
  if (!q.trim()) return [];
  const res = await fetch(`${API}/api/users/search?q=${encodeURIComponent(q)}`);
  if (!res.ok) return [];
  return res.json();
}

export async function getUser(id: string): Promise<User | null> {
  const res = await fetch(`${API}/api/users/${id}`);
  if (!res.ok) return null;
  return res.json();
}

export async function listUsers(q = "", offset = 0, limit = 50): Promise<User[]> {
  const params = new URLSearchParams({ offset: String(offset), limit: String(limit) });
  if (q.trim()) params.set("q", q.trim());
  const res = await fetch(`${API}/api/users?${params}`);
  if (!res.ok) return [];
  return res.json();
}

export async function updateUser(
  id: string,
  data: { name?: string; phone_zalo?: string | null; facebook_link?: string | null },
): Promise<User | null> {
  const res = await fetch(`${API}/api/users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) return null;
  return res.json();
}

export async function deleteUser(id: string): Promise<boolean> {
  const res = await fetch(`${API}/api/users/${id}`, { method: "DELETE" });
  return res.ok || res.status === 204;
}