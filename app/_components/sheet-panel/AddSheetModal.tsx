"use client";

import { useState } from "react";
import { addSheet, type Sheet } from "./sheetService";
import { useDrivePicker } from "./useDrivePicker";
import vi from "../../../lib/vi";

type Props = {
  songId: string;
  onSaved: (sheet: Sheet) => void;
  onClose: () => void;
};

export default function AddSheetModal({ songId, onSaved, onClose }: Props) {
  const [url, setUrl] = useState("");
  const [toneMale, setToneMale] = useState("");
  const [toneFemale, setToneFemale] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const { open: openPicker, picking, error: pickerError, canUsePicker } = useDrivePicker(setUrl);
  const displayError = error || pickerError;

  const handleSave = async () => {
    if (!url.trim()) return;
    setSaving(true);
    setError("");
    try {
      const sheet = await addSheet(songId, {
        sheet_drive_url: url.trim(),
        tone_male: toneMale || null,
        tone_female: toneFemale || null,
      });
      onSaved(sheet);
      onClose();
    } catch {
      setError(vi.sheetPanel.errCannotAdd);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setUrl(""); setToneMale(""); setToneFemale(""); setError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4 text-gray-900">
        <h2 className="text-lg font-bold mb-4">{vi.sheetPanel.addModalTitle}</h2>
        <div className="space-y-3">
          {/* Drive URL + picker */}
          <div className="flex gap-2">
            <input
              type="text" value={url} onChange={e => setUrl(e.target.value)}
              placeholder={vi.sheetPanel.urlPlaceholder}
              className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
            {canUsePicker && (
              <button
                onClick={openPicker} disabled={picking}
                title="Chọn từ Google Drive"
                className="px-3 py-2 border rounded-lg text-sm bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {picking ? "..." : "📂"}
              </button>
            )}
          </div>

          {/* Tone inputs */}
          <div className="flex gap-2">
            <input
              type="text" value={toneMale} onChange={e => setToneMale(e.target.value)}
              placeholder={vi.sheetPanel.toneMalePlaceholder}
              className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text" value={toneFemale} onChange={e => setToneFemale(e.target.value)}
              placeholder={vi.sheetPanel.toneFemalePlaceholder}
              className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {displayError && <p className="text-red-500 text-xs">{displayError}</p>}

          <div className="flex gap-3 justify-end pt-1">
            <button onClick={handleClose} className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 transition-colors">
              {vi.sheetPanel.cancelBtn}
            </button>
            <button
              onClick={handleSave} disabled={!url.trim() || saving}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-50"
            >
              {saving ? vi.sheetPanel.savingBtn : vi.sheetPanel.saveBtn}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
