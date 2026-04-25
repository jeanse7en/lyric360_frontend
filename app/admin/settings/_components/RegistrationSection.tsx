"use client";

import { useEffect, useState } from "react";
import { fetchSetting, saveSetting } from "../../../_lib/settings_service";
import InlineEditRow from "../../../_components/InlineEditRow";

export default function RegistrationSection() {
  const [limit, setLimit] = useState("30");
  const [draft, setDraft] = useState("30");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchSetting("queue_limit").then((val) => {
      if (val) setLimit(val);
      setLoaded(true);
    });
  }, []);

  const startEdit = () => { setDraft(limit); setEditing(true); };
  const cancel = () => setEditing(false);

  const save = async () => {
    const num = parseInt(draft, 10);
    if (isNaN(num) || num < 1) return;
    setSaving(true);
    await saveSetting("queue_limit", String(num));
    setLimit(String(num));
    setSaving(false);
    setEditing(false);
  };

  if (!loaded) return <p className="text-sm text-gray-400">Đang tải…</p>;

  return (
    <InlineEditRow
      label="Số bài tối đa trong hàng chờ"
      displayValue={`${limit} bài`}
      editing={editing}
      onStartEdit={startEdit}
      onSave={save}
      onCancel={cancel}
      saving={saving}
      canSave={!isNaN(parseInt(draft, 10)) && parseInt(draft, 10) >= 1}
    >
      <div className="flex items-center gap-1">
        <button
          onClick={() => setDraft((v) => String(Math.max(1, parseInt(v, 10) - 1)))}
          className="w-7 h-7 rounded border border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm"
        >
          −
        </button>
        <input
          autoFocus
          type="number"
          min={1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel(); }}
          className="w-14 text-center px-1 py-0.5 rounded border border-gray-300 dark:border-gray-500 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-400"
        />
        <button
          onClick={() => setDraft((v) => String(parseInt(v, 10) + 1))}
          className="w-7 h-7 rounded border border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm"
        >
          +
        </button>
      </div>
    </InlineEditRow>
  );
}