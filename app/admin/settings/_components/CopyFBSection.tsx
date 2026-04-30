"use client";

import { useEffect, useRef, useState } from "react";
import { fetchSetting, saveSetting } from "../../../_lib/settings_service";

const TAGS = [
  { label: "[Bài hát]", hint: "Tên bài hát" },
  { label: "[Tác giả]", hint: "Tác giả" },
  { label: "[Người hát]", hint: "Tên khách hát" },
  { label: "[Ngày diễn]", hint: "Ngày diễn (dd-MM-yyyy)" },
];

export default function CopyFBSection() {
  const [template, setTemplate] = useState("");
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchSetting("copy_fb_template").then((val) => {
      const v = val ?? "🎵 Bài hát: [Bài hát]\n✍️ Tác giả: [Tác giả]\n🎤 Khách hát: [Người hát]";
      setTemplate(v);
      setLoaded(true);
    });
  }, []);

  const startEdit = () => { setDraft(template); setEditing(true); };
  const cancel = () => setEditing(false);

  const save = async () => {
    setSaving(true);
    await saveSetting("copy_fb_template", draft);
    setTemplate(draft);
    setSaving(false);
    setEditing(false);
  };

  const insertTag = (tag: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart ?? draft.length;
    const end = ta.selectionEnd ?? draft.length;
    const next = draft.slice(0, start) + tag + draft.slice(end);
    setDraft(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + tag.length, start + tag.length);
    });
  };

  const inputCls = "w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none";

  if (!loaded) return <p className="text-sm text-gray-400">Đang tải…</p>;

  return (
    <div className="space-y-3">
      {!editing ? (
        <div className="flex items-start justify-between gap-3">
          <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans flex-1">{template}</pre>
          <button
            onClick={startEdit}
            className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors"
          >
            Sửa
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {TAGS.map(({ label, hint }) => (
              <button
                key={label}
                type="button"
                onClick={() => insertTag(label)}
                title={hint}
                className="px-2 py-1 rounded text-xs font-mono bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
          <textarea
            ref={textareaRef}
            rows={6}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            className={inputCls}
            autoFocus
          />
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Click vào tag để chèn vào vị trí con trỏ. Các tag sẽ được thay thế bằng thông tin thực tế khi copy.
          </p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={cancel}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors"
            >
              Huỷ
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white transition-colors"
            >
              {saving ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
