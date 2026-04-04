"use client";

import { useState } from "react";
import Header from "../../../_components/Header";
import Footer from "../../../_components/Footer";

const API = process.env.NEXT_PUBLIC_API_URL;

type SyncPreviewItem = {
  row_number: number;
  song_title: string;
  author: string | null;
  year: string | null;
  lyrics_preview: string | null;
  sheet_url: string | null;
  lyric_slide_url: string | null;
  song_id: string | null;
  action: "CREATE" | "UPDATE" | "SKIP";
  changes: string[];
};

type SyncPreviewResponse = {
  items: SyncPreviewItem[];
  total: number;
  to_create: number;
  to_update: number;
};

type SyncRunResult = {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
};

const ACTION_STYLES: Record<SyncPreviewItem["action"], string> = {
  CREATE: "bg-green-100 text-green-700 border-green-200",
  UPDATE: "bg-blue-100 text-blue-700 border-blue-200",
  SKIP:   "bg-gray-100 text-gray-500 border-gray-200",
};

const ACTION_LABELS: Record<SyncPreviewItem["action"], string> = {
  CREATE: "Tạo mới",
  UPDATE: "Cập nhật",
  SKIP:   "Bỏ qua",
};

export default function SyncPage() {
  const [sheetName, setSheetName] = useState("NewSheet");
  const [preview, setPreview] = useState<SyncPreviewResponse | null>(null);
  const [runResult, setRunResult] = useState<SyncRunResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"ALL" | "CREATE" | "UPDATE" | "SKIP">("ALL");

  const handlePreview = async () => {
    if (!sheetName.trim()) return;
    setLoading(true);
    setError("");
    setPreview(null);
    setRunResult(null);
    try {
      const params = new URLSearchParams({ sheet_name: sheetName.trim() });
      const res = await fetch(`${API}/api/songs/sync/preview?${params}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.detail ?? "Không thể tải preview");
        return;
      }
      setPreview(await res.json());
    } finally {
      setLoading(false);
    }
  };

  const handleRun = async () => {
    if (!sheetName.trim()) return;
    setRunning(true);
    setError("");
    setRunResult(null);
    try {
      const params = new URLSearchParams({ sheet_name: sheetName.trim() });
      const res = await fetch(`${API}/api/songs/sync/run?${params}`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.detail ?? "Đồng bộ thất bại");
        return;
      }
      const result: SyncRunResult = await res.json();
      setRunResult(result);
      // Refresh preview after run
      await handlePreview();
    } finally {
      setRunning(false);
    }
  };

  const visibleItems =
    preview?.items.filter(i => filter === "ALL" || i.action === filter) ?? [];

  const hasChanges = preview && (preview.to_create > 0 || preview.to_update > 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header />

      <div className="flex-1 max-w-4xl w-full mx-auto py-6 px-4">
        {/* Page title */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              Đồng Bộ từ Google Sheet
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Xem trước thay đổi rồi nhấn Thực hiện để đồng bộ vào hệ thống
            </p>
          </div>
          <a
            href="/admin/songs"
            className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            ← Quay lại
          </a>
        </div>

        {/* Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 mb-5">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Tên sheet
              </label>
              <input
                type="text"
                value={sheetName}
                onChange={e => setSheetName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handlePreview()}
                placeholder="NewSheet"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <button
              onClick={handlePreview}
              disabled={loading || !sheetName.trim()}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-700 hover:bg-gray-600 text-white transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {loading ? "Đang tải..." : "Xem trước"}
            </button>
            {hasChanges && (
              <button
                onClick={handleRun}
                disabled={running}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {running ? "Đang đồng bộ..." : "▶ Thực hiện"}
              </button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Run result banner */}
        {runResult && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4 text-sm text-green-800">
            <span className="font-semibold">Đồng bộ hoàn tất.</span>{" "}
            Tạo mới: <strong>{runResult.created}</strong> · Cập nhật:{" "}
            <strong>{runResult.updated}</strong> · Bỏ qua:{" "}
            <strong>{runResult.skipped}</strong>
            {runResult.errors.length > 0 && (
              <ul className="mt-2 list-disc list-inside text-red-700 space-y-0.5">
                {runResult.errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Preview */}
        {preview && (
          <>
            {/* Summary bar */}
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {preview.total} bài hát từ sheet
              </span>
              <span className="text-xs bg-green-100 text-green-700 border border-green-200 rounded-full px-2 py-0.5 font-medium">
                {preview.to_create} tạo mới
              </span>
              <span className="text-xs bg-blue-100 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5 font-medium">
                {preview.to_update} cập nhật
              </span>
              <span className="text-xs bg-gray-100 text-gray-500 border border-gray-200 rounded-full px-2 py-0.5 font-medium">
                {preview.total - preview.to_create - preview.to_update} bỏ qua
              </span>

              {/* Filter tabs */}
              <div className="ml-auto flex gap-1">
                {(["ALL", "CREATE", "UPDATE", "SKIP"] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      filter === f
                        ? "bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900"
                        : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    {f === "ALL" ? "Tất cả" : ACTION_LABELS[f]}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              {visibleItems.length === 0 ? (
                <p className="text-center text-gray-400 py-10 text-sm">
                  Không có bài hát nào
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 w-8">#</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Tên bài hát</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 w-24">Hành động</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Thay đổi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleItems.map(item => (
                      <tr
                        key={item.row_number}
                        className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="px-4 py-3 text-gray-400 text-xs">{item.row_number}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {item.song_title}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5 flex gap-2 flex-wrap">
                            {item.author && <span>{item.author}</span>}
                            {item.year && <span>{item.year}</span>}
                            {item.lyrics_preview && (
                              <span
                                className="text-gray-400 truncate max-w-xs"
                                title={item.lyrics_preview}
                              >
                                🎵 {item.lyrics_preview}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${ACTION_STYLES[item.action]}`}
                          >
                            {ACTION_LABELS[item.action]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {item.changes.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {item.changes.map((c, i) => (
                                <span
                                  key={i}
                                  className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2 py-0.5 rounded"
                                >
                                  {c}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}