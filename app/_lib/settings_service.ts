const API = process.env.NEXT_PUBLIC_API_URL;

export async function fetchSetting(key: string): Promise<string | null> {
  const res = await fetch(`${API}/api/settings/${key}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.value ?? null;
}

export async function saveSetting(key: string, value: string): Promise<void> {
  await fetch(`${API}/api/settings/${key}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ value }),
  });
}