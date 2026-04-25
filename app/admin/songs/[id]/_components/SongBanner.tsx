"use client";

import { useState } from "react";
import vi from "../../../../../lib/vi";
import InlineEditRow from "../../../../_components/InlineEditRow";

const API = process.env.NEXT_PUBLIC_API_URL;

type Props = {
  songId: string;
  title: string;
  author: string;
  onChanged: (title: string, author: string) => void;
};

type Field = "title" | "author";

export default function SongBanner({ songId, title, author, onChanged }: Props) {
  const [editing, setEditing] = useState<Field | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const startEdit = (field: Field) => {
    setEditing(field);
    setDraft(field === "title" ? title : author);
    setError("");
  };

  const cancel = () => { setEditing(null); setError(""); };

  const save = async () => {
    if (editing === "title" && !draft.trim()) return;
    setSaving(true);
    setError("");
    try {
      const patch = editing === "title"
        ? { title: draft.trim(), author }
        : { title, author: draft.trim() || null };
      const res = await fetch(`${API}/api/songs/${songId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) { setError(vi.songBanner.errCannotSave); return; }
      onChanged(
        editing === "title" ? draft.trim() : title,
        editing === "author" ? (draft.trim() || "") : author,
      );
      setEditing(null);
    } finally { setSaving(false); }
  };

  const renderField = (field: Field, label: string, placeholder: string, value: string) => (
    <InlineEditRow
      label={label}
      displayValue={value || <span className="text-gray-500 italic">{placeholder}</span>}
      editing={editing === field}
      onStartEdit={() => startEdit(field)}
      onSave={save}
      onCancel={cancel}
      saving={saving}
      canSave={field !== "title" || !!draft.trim()}
    >
      <input
        autoFocus
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel(); }}
        placeholder={placeholder}
        className="flex-1 min-w-0 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-500 rounded px-2 py-0.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-400"
      />
    </InlineEditRow>
  );

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-5 py-4 mb-4 shadow-sm">
      <div className="flex flex-col gap-2">
        {renderField("title", vi.songBanner.titleLabel, vi.songBanner.titlePlaceholder, title)}
        {renderField("author", vi.songBanner.authorLabel, vi.songBanner.authorPlaceholder, author)}
      </div>
      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
    </div>
  );
}
