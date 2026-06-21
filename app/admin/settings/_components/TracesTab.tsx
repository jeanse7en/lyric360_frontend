"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import DataTable, { type Column } from "../../../_components/DataTable";
import { listAuditLogs, type AuditLog } from "../../../_lib/audit_service";
import { searchUsers, type User as UserResult } from "../../../_lib/users_service";

const ENTITY_TYPE_OPTIONS = [
  { value: "", label: "Tất cả loại" },
  { value: "registration", label: "Đăng ký bài" },
  { value: "user", label: "Khách hàng" },
];

const ACTION_OPTIONS = [
  { value: "", label: "Tất cả hành động" },
  { value: "create", label: "Tạo mới" },
  { value: "create_by_admin", label: "Tạo (Admin)" },
  { value: "update", label: "Cập nhật" },
  { value: "delete", label: "Xoá" },
];

const ENTITY_TYPE_LABELS: Record<string, string> = {
  registration: "Đăng ký",
  user: "Khách hàng",
};

const ACTION_LABELS: Record<string, string> = {
  create: "Tạo mới",
  create_by_admin: "Tạo (Admin)",
  update: "Cập nhật",
  delete: "Xoá",
};

const ACTION_COLORS: Record<string, string> = {
  create: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20",
  create_by_admin: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20",
  update: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20",
  delete: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20",
};

const inputCls =
  "px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none";

function JsonCell({ data }: { data: Record<string, unknown> | null }) {
  if (!data) return <span className="text-gray-300 dark:text-gray-600">—</span>;
  return (
    <div className="space-y-0.5">
      {Object.entries(data).map(([k, v]) => (
        <div key={k} className="text-xs">
          <span className="text-gray-400 dark:text-gray-500">{k}: </span>
          <span className="text-gray-700 dark:text-gray-200 font-mono">{String(v ?? "—")}</span>
        </div>
      ))}
    </div>
  );
}

function ShortId({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button onClick={handleCopy} title={id} className="font-mono text-xs text-gray-400 hover:text-blue-500 transition-colors">
      {copied ? "✓" : id.slice(0, 8) + "…"}
    </button>
  );
}

function ActorCell({ log }: { log: AuditLog }) {
  if (!log.actor_user_id) return <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>;
  return (
    <div className="flex flex-col gap-0.5">
      {log.actor_name && (
        <span className="text-xs font-medium text-gray-800 dark:text-gray-100">{log.actor_name}</span>
      )}
      <ShortId id={log.actor_user_id} />
    </div>
  );
}

function ActorSearch({ onSelect }: { onSelect: (userId: string) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); setOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      const data = await searchUsers(query);
      setResults(data);
      setOpen(data.length > 0);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleClear = () => { setQuery(""); onSelect(""); };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); if (!e.target.value.trim()) onSelect(""); }}
          placeholder="Tìm actor theo tên..."
          className={inputCls + " sm:w-52 pr-7"}
        />
        {query && (
          <button onClick={handleClear} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">✕</button>
        )}
      </div>
      {open && (
        <div className="absolute z-20 top-full mt-1 left-0 w-full min-w-[200px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
          {results.map(u => (
            <button
              key={u.id}
              onMouseDown={() => { onSelect(u.id); setQuery(u.name); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <span className="font-medium">{u.name}</span>
              {u.phone_zalo && <span className="ml-2 text-xs text-gray-400">{u.phone_zalo}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const COLUMNS: Column<AuditLog>[] = [
  {
    key: "index",
    header: "#",
    headerClassName: "w-10 text-center",
    cellClassName: "text-center text-gray-400 tabular-nums text-xs",
    cell: (_, i) => i + 1,
  },
  {
    key: "created_at",
    header: "Thời gian",
    cellClassName: "text-xs text-gray-500 dark:text-gray-400 tabular-nums whitespace-nowrap",
    cell: log =>
      new Date(log.created_at).toLocaleString("vi-VN", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
      }),
  },
  {
    key: "entity_type",
    header: "Loại",
    cellClassName: "text-xs font-medium text-gray-700 dark:text-gray-200 whitespace-nowrap",
    cell: log => ENTITY_TYPE_LABELS[log.entity_type] ?? log.entity_type,
  },
  {
    key: "action",
    header: "Hành động",
    cellClassName: "whitespace-nowrap",
    cell: log => (
      <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${ACTION_COLORS[log.action] ?? ""}`}>
        {ACTION_LABELS[log.action] ?? log.action}
      </span>
    ),
  },
  {
    key: "actor",
    header: "Actor",
    cell: log => <ActorCell log={log} />,
  },
  {
    key: "entity_id",
    header: "Entity ID",
    cell: log => <ShortId id={log.entity_id} />,
  },
  {
    key: "ip",
    header: "IP",
    cellClassName: "font-mono text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap",
    cell: log => log.ip_address ?? <span className="text-gray-300 dark:text-gray-600">—</span>,
  },
  {
    key: "mac",
    header: "MAC",
    cellClassName: "font-mono text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap",
    cell: log => log.mac_address ?? <span className="text-gray-300 dark:text-gray-600">—</span>,
  },
  {
    key: "user_agent",
    header: "Device",
    cellClassName: "text-xs text-gray-400 dark:text-gray-500 max-w-[220px]",
    cell: log =>
      log.user_agent ? (
        <span title={log.user_agent} className="block truncate">{log.user_agent}</span>
      ) : (
        <span className="text-gray-300 dark:text-gray-600">—</span>
      ),
  },
  {
    key: "before",
    header: "Trước",
    cellClassName: "min-w-[140px]",
    cell: log => <JsonCell data={log.before} />,
  },
  {
    key: "after",
    header: "Sau",
    cellClassName: "min-w-[140px]",
    cell: log => <JsonCell data={log.after} />,
  },
];

export default function TracesTab() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityType, setEntityType] = useState("");
  const [action, setAction] = useState("");
  const [entityId, setEntityId] = useState("");
  const [actorUserId, setActorUserId] = useState("");
  const [ipFilter, setIpFilter] = useState("");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchLogs = useCallback(async (
    et: string, ac: string, eid: string, uid: string, ip: string, off: number, append = false,
  ) => {
    setLoading(true);
    try {
      const data = await listAuditLogs({
        entity_type: et || undefined,
        action: ac || undefined,
        entity_id: eid.trim() || undefined,
        actor_user_id: uid || undefined,
        ip_address: ip.trim() || undefined,
        offset: off,
        limit: 50,
      });
      setHasMore(data.length === 50);
      setLogs(prev => {
        if (!append) return data;
        const seen = new Set(prev.map(l => l.id));
        return [...prev, ...data.filter(l => !seen.has(l.id))];
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLogs("", "", "", "", "", 0); }, [fetchLogs]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setOffset(0);
      fetchLogs(entityType, action, entityId, actorUserId, ipFilter, 0);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [entityType, action, entityId, actorUserId, ipFilter, fetchLogs]);

  const loadMore = useCallback(() => {
    const next = offset + 50;
    setOffset(next);
    fetchLogs(entityType, action, entityId, actorUserId, ipFilter, next, true);
  }, [offset, entityType, action, entityId, actorUserId, ipFilter, fetchLogs]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting && hasMore && !loading) loadMore(); },
      { threshold: 0.1 },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, loadMore]);

  const hasActiveFilter = !!(actorUserId || ipFilter || entityId);

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4">
        <select value={entityType} onChange={e => setEntityType(e.target.value)} className={inputCls}>
          {ENTITY_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <select value={action} onChange={e => setAction(e.target.value)} className={inputCls}>
          {ACTION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <ActorSearch onSelect={uid => { setActorUserId(uid); setOffset(0); }} />

        <input
          type="text"
          value={ipFilter}
          onChange={e => setIpFilter(e.target.value)}
          placeholder="Lọc theo IP..."
          className={inputCls + " sm:w-40 font-mono"}
        />

        <input
          type="text"
          value={entityId}
          onChange={e => setEntityId(e.target.value)}
          placeholder="Lọc theo Entity ID..."
          className={inputCls + " sm:w-64 font-mono"}
        />

        {hasActiveFilter && (
          <button
            onClick={() => { setActorUserId(""); setIpFilter(""); setEntityId(""); }}
            className="px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            Xoá bộ lọc
          </button>
        )}
      </div>

      <div className="flex items-center justify-end mb-2">
        <span className="text-sm text-gray-400">{logs.length} bản ghi</span>
      </div>

      <DataTable
        columns={COLUMNS}
        rows={logs}
        keyFn={l => l.id}
        emptyMessage={loading ? "Đang tải..." : "Không có bản ghi nào"}
      />

      <div ref={sentinelRef} className="py-2 text-center text-sm text-gray-400">
        {loading && "Đang tải..."}
      </div>
    </div>
  );
}
