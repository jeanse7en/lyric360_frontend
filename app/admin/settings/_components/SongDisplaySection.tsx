"use client";

import { useEffect, useState } from "react";
import { fetchSetting, saveSetting } from "../../../_lib/settings_service";
import InlineEditRow from "../../../_components/InlineEditRow";

type Field = "font_size" | "one_page";

export default function SongDisplaySection() {
  const [fontSize, setFontSize] = useState("24");
  const [onePage, setOnePage] = useState(true);
  const [editing, setEditing] = useState<Field | null>(null);
  const [draft, setDraft] = useState("");
  const [draftOnePage, setDraftOnePage] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchSetting("song_font_size"),
      fetchSetting("song_one_page"),
    ]).then(([fs, op]) => {
      if (fs) setFontSize(fs);
      if (op !== null) setOnePage(op === "true");
      setLoaded(true);
    });
  }, []);

  const startEdit = (field: Field) => {
    setEditing(field);
    if (field === "font_size") setDraft(fontSize);
    else setDraftOnePage(onePage);
  };

  const cancel = () => setEditing(null);

  const save = async (field: Field) => {
    setSaving(true);
    if (field === "font_size") {
      const size = parseInt(draft, 10);
      if (!isNaN(size) && size >= 8) {
        await saveSetting("song_font_size", String(size));
        setFontSize(String(size));
      }
    } else {
      await saveSetting("song_one_page", String(draftOnePage));
      setOnePage(draftOnePage);
    }
    setSaving(false);
    setEditing(null);
  };

  if (!loaded) return <p className="text-sm text-gray-400">Đang tải…</p>;

  return (
    <div className="flex flex-col gap-3">
      <InlineEditRow
        label="Cỡ chữ mặc định"
        displayValue={`${fontSize}px`}
        editing={editing === "font_size"}
        onStartEdit={() => startEdit("font_size")}
        onSave={() => save("font_size")}
        onCancel={cancel}
        saving={saving}
        canSave={!isNaN(parseInt(draft, 10)) && parseInt(draft, 10) >= 8}
      >
        <div className="flex items-center gap-1">
          <button
            onClick={() => setDraft((v) => String(Math.max(8, parseInt(v, 10) - 2)))}
            className="w-7 h-7 rounded border border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm"
          >
            −
          </button>
          <input
            autoFocus
            type="number"
            min={8}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") save("font_size"); if (e.key === "Escape") cancel(); }}
            className="w-14 text-center px-1 py-0.5 rounded border border-gray-300 dark:border-gray-500 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-400"
          />
          <button
            onClick={() => setDraft((v) => String(parseInt(v, 10) + 2))}
            className="w-7 h-7 rounded border border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm"
          >
            +
          </button>
          <span className="text-xs text-gray-400 ml-1">px</span>
        </div>
      </InlineEditRow>

      <InlineEditRow
        label="Hiển thị một trang"
        displayValue={onePage ? "Bật" : "Tắt"}
        editing={editing === "one_page"}
        onStartEdit={() => startEdit("one_page")}
        onSave={() => save("one_page")}
        onCancel={cancel}
        saving={saving}
      >
        <button
          onClick={() => setDraftOnePage((v) => !v)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            draftOnePage ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              draftOnePage ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </InlineEditRow>
    </div>
  );
}