"use client";

import { useState } from "react";
import FullscreenOverlay from "./FullscreenOverlay";
import DeleteConfirmModal from "./DeleteConfirmModal";
import AddSheetModal from "./sheet-panel/AddSheetModal";
import { verifySheet, deleteSheet, type Sheet } from "./sheet-panel/sheetService";
import vi from "../../lib/vi";

export type { Sheet };

type Props = {
  songId?: string;
  sheets: Sheet[];
  onSheetsChange?: (sheets: Sheet[]) => void;
  hasSong: boolean;
  canEdit?: boolean;
};

function toPreviewUrl(url: string) { return url.replace("/view", "/preview"); }

export default function SheetPanel({ songId, sheets, onSheetsChange, hasSong, canEdit = false }: Props) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  const selected = sheets[selectedIdx];
  const selectedUrl = selected ? toPreviewUrl(selected.sheet_drive_url) : null;

  const handleSheetAdded = (sheet: Sheet) => {
    const next = [...sheets, sheet];
    onSheetsChange?.(next);
    setSelectedIdx(next.length - 1);
  };

  const handleVerify = async (sheet: Sheet) => {
    if (!songId) return;
    await verifySheet(songId, sheet.id);
    onSheetsChange?.(sheets.map(s => s.id === sheet.id ? { ...s, verified_at: new Date().toISOString() } : s));
  };

  const handleDelete = async () => {
    if (!deleteId || !songId) return;
    await deleteSheet(songId, deleteId);
    const next = sheets.filter(s => s.id !== deleteId);
    onSheetsChange?.(next);
    setSelectedIdx(i => Math.min(i, Math.max(0, next.length - 1)));
    setDeleteId(null);
  };

  return (
    <>
      <div className="bg-gray-800 rounded-xl p-4 shadow-2xl h-[45vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold text-yellow-400">{vi.sheetPanel.title}</h3>
          <div className="flex gap-2">
            {canEdit && songId && (
              <button onClick={() => setShowAdd(true)} className="bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded text-sm text-white transition-colors">
                {vi.sheetPanel.addBtn}
              </button>
            )}
            {selectedUrl && (
              <button onClick={() => setFullscreen(true)} className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-sm text-white transition-colors">
                {vi.sheetPanel.fullscreenBtn}
              </button>
            )}
          </div>
        </div>

        {/* Sheet tabs + per-selected actions */}
        {(sheets.length > 0 || (canEdit && selected)) && (
          <div className="flex gap-2 mb-2 flex-wrap items-center justify-between">
            {/* Tabs (left) */}
            <div className="flex gap-2 flex-wrap items-center">
              {sheets.map((sheet, i) => (
                <button
                  key={sheet.id}
                  onClick={() => setSelectedIdx(i)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    selectedIdx === i ? "bg-yellow-500 text-black" : "bg-gray-700 hover:bg-gray-600 text-white"
                  }`}
                >
                  {i + 1}
                  {sheet.tone_male ? ` · Nam: ${sheet.tone_male}` : ""}
                  {sheet.tone_female ? ` · Nữ: ${sheet.tone_female}` : ""}
                  {sheet.verified_at && <span className="ml-1 text-green-400">✓</span>}
                </button>
              ))}
            </div>

            {/* Actions (right) */}
            {canEdit && selected && (
              <div className="flex gap-2 items-center">
                {!selected.verified_at && (
                  <button onClick={() => handleVerify(selected)} className="px-2 py-1 rounded text-xs bg-green-700 hover:bg-green-600 text-white transition-colors">
                    {vi.sheetPanel.verifyBtn}
                  </button>
                )}
                <button onClick={() => setDeleteId(selected.id)} className="px-2 py-1 rounded text-xs bg-red-700 hover:bg-red-600 text-white transition-colors">
                  {vi.sheetPanel.deleteBtn}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Preview */}
        <div className="flex-grow bg-gray-900 rounded border border-gray-700">
          {selectedUrl ? (
            <iframe src={selectedUrl} className="w-full h-full rounded" />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              {hasSong ? vi.sheetPanel.selectHint : vi.sheetPanel.noSong}
            </div>
          )}
        </div>
      </div>

      {fullscreen && selectedUrl && (
        <FullscreenOverlay url={selectedUrl} title={vi.sheetPanel.fullscreenTitle} onClose={() => setFullscreen(false)} />
      )}

      {showAdd && songId && (
        <AddSheetModal songId={songId} onSaved={handleSheetAdded} onClose={() => setShowAdd(false)} />
      )}

      {deleteId && (
        <DeleteConfirmModal
          title={vi.sheetPanel.confirmDeleteTitle}
          message={vi.sheetPanel.confirmDeleteMsg}
          confirmLabel={vi.sheetPanel.deleteBtn}
          cancelLabel={vi.sheetPanel.cancelBtn}
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </>
  );
}
