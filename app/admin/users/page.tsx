"use client";

import { useState, useEffect, useRef } from "react";
import Header from "../../_components/Header";
import Footer from "../../_components/Footer";
import DataTable, { type Column } from "../../_components/DataTable";
import DeleteConfirmModal from "../../_components/DeleteConfirmModal";
import { listUsers, updateUser, deleteUser, type User } from "../../_lib/users_service";

function EditUserModal({
  user,
  onSave,
  onCancel,
}: {
  user: User;
  onSave: (updated: User) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone_zalo ?? "");
  const [facebook, setFacebook] = useState(user.facebook_link ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputCls =
    "w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Tên không được để trống"); return; }
    setSaving(true);
    setError(null);
    const updated = await updateUser(user.id, {
      name: name.trim(),
      phone_zalo: phone.trim() || null,
      facebook_link: facebook.trim() || null,
    });
    setSaving(false);
    if (!updated) { setError("Lưu thất bại, thử lại."); return; }
    onSave(updated);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4">
        <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">Chỉnh sửa khách hàng</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tên *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className={inputCls}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Số Zalo</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className={inputCls}
              placeholder="Tuỳ chọn"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Facebook</label>
            <input
              type="text"
              value={facebook}
              onChange={e => setFacebook(e.target.value)}
              className={inputCls}
              placeholder="Link hoặc tên tài khoản (tuỳ chọn)"
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2 justify-end pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white transition-colors"
            >
              {saving ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchUsers = async (q: string, off: number, append = false) => {
    setLoading(true);
    try {
      const data = await listUsers(q, off, 50);
      setHasMore(data.length === 50);
      setUsers(prev => {
        if (!append) return data;
        const seen = new Set(prev.map(u => u.id));
        return [...prev, ...data.filter(u => !seen.has(u.id))];
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers("", 0); }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setOffset(0);
      fetchUsers(query, 0);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const loadMore = () => {
    const next = offset + 50;
    setOffset(next);
    fetchUsers(query, next, true);
  };

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting && hasMore && !loading) loadMore(); },
      { threshold: 0.1 },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, offset, query]);

  const handleSaveEdit = (updated: User) => {
    setUsers(prev => prev.map(u => (u.id === updated.id ? updated : u)));
    setEditUser(null);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteUser(deleteId);
    setUsers(prev => prev.filter(u => u.id !== deleteId));
    setDeleteId(null);
  };

  const columns: Column<User>[] = [
    {
      key: "index",
      header: "#",
      headerClassName: "w-10 text-center",
      cellClassName: "text-center text-gray-400 tabular-nums text-xs",
      cell: (_, i) => i + 1,
    },
    {
      key: "name",
      header: "Tên",
      cellClassName: "font-medium text-gray-900 dark:text-white",
      cell: u => u.name,
    },
    {
      key: "phone",
      header: "Số Zalo",
      headerClassName: "hidden sm:table-cell",
      cellClassName: "hidden sm:table-cell font-mono text-xs",
      cell: u =>
        u.phone_zalo ? (
          <a
            href={`tel:${u.phone_zalo}`}
            className="text-blue-500 hover:underline"
          >
            {u.phone_zalo}
          </a>
        ) : (
          <span className="text-gray-300 dark:text-gray-600">—</span>
        ),
    },
    {
      key: "facebook",
      header: "Facebook",
      headerClassName: "hidden md:table-cell",
      cellClassName: "hidden md:table-cell text-gray-500 dark:text-gray-400 text-xs max-w-[180px] truncate",
      cell: u =>
        u.facebook_link ? (
          <a
            href={u.facebook_link.startsWith("http") ? u.facebook_link : `https://facebook.com/${u.facebook_link}`}
            target="_blank"
            rel="noreferrer"
            className="text-blue-500 hover:underline"
          >
            {u.facebook_link}
          </a>
        ) : (
          <span className="text-gray-300 dark:text-gray-600">—</span>
        ),
    },
    {
      key: "created",
      header: "Ngày tạo",
      headerClassName: "hidden lg:table-cell",
      cellClassName: "hidden lg:table-cell text-gray-400 text-xs tabular-nums",
      cell: u =>
        u.created_at
          ? new Date(u.created_at).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
          : "—",
    },
    {
      key: "actions",
      header: "",
      headerClassName: "w-20",
      cellClassName: "text-right",
      cell: u => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => setEditUser(u)}
            className="px-2 py-1 rounded text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
          >
            Sửa
          </button>
          <button
            onClick={() => setDeleteId(u.id)}
            className="px-2 py-1 rounded text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
          >
            Xoá
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header />
      <div className="flex-1 max-w-4xl w-full mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Khách hàng</h1>
          <span className="text-sm text-gray-400">{users.length} người</span>
        </div>

        <div className="mb-4">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Tìm theo tên hoặc số điện thoại..."
            className="w-full sm:max-w-xs px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <DataTable
          columns={columns}
          rows={users}
          keyFn={u => u.id}
          emptyMessage={loading ? "Đang tải..." : "Không tìm thấy khách hàng"}
        />

        <div ref={sentinelRef} className="py-2 text-center text-sm text-gray-400">
          {loading && "Đang tải..."}
        </div>
      </div>
      <Footer />

      {editUser && (
        <EditUserModal
          user={editUser}
          onSave={handleSaveEdit}
          onCancel={() => setEditUser(null)}
        />
      )}
      {deleteId && (
        <DeleteConfirmModal
          title="Xoá khách hàng"
          message="Bạn có chắc muốn xoá khách hàng này? Lịch sử đặt bài sẽ không bị xoá nhưng sẽ không còn liên kết với tài khoản."
          confirmLabel="Xoá"
          cancelLabel="Huỷ"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}