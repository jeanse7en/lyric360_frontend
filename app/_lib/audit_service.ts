const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type AuditLog = {
  id: string;
  entity_type: string;
  action: string;
  actor_user_id: string | null;
  entity_id: string;
  mac_address: string | null;
  ip_address: string | null;
  user_agent: string | null;
  actor_name: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  created_at: string;
};

export type AuditFilters = {
  entity_type?: string;
  action?: string;
  entity_id?: string;
  actor_user_id?: string;
  ip_address?: string;
  offset?: number;
  limit?: number;
};

export async function listAuditLogs(filters: AuditFilters = {}): Promise<AuditLog[]> {
  const params = new URLSearchParams();
  if (filters.entity_type) params.set("entity_type", filters.entity_type);
  if (filters.action) params.set("action", filters.action);
  if (filters.entity_id) params.set("entity_id", filters.entity_id);
  if (filters.actor_user_id) params.set("actor_user_id", filters.actor_user_id);
  if (filters.ip_address) params.set("ip_address", filters.ip_address);
  if (filters.offset !== undefined) params.set("offset", String(filters.offset));
  if (filters.limit !== undefined) params.set("limit", String(filters.limit));

  const res = await fetch(`${API}/api/audit?${params.toString()}`);
  if (!res.ok) return [];
  return res.json();
}
