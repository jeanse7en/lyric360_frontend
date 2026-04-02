"use client";

import { useState } from "react";
import FullscreenOverlay from "./FullscreenOverlay";
import DeleteConfirmModal from "./DeleteConfirmModal";
import AddLyricModal from "./lyric-panel/AddLyricModal";
import { verifyLyric, deleteLyric, type Lyric } from "./lyric-panel/lyricService";
import vi from "../../lib/vi";

export type { Lyric };

type Props = {
  songId?: string;
  songTitle?: string;
  songAuthor?: string;
  lyrics: Lyric[];
  onLyricsChange?: (lyrics: Lyric[]) => void;
  onPresent?: (url: string) => void;
  hasSong: boolean;
  canEdit?: boolean;
};

function toEmbedUrl(url: string) { return url.replace(/\/edit.*/, "/embed?rm=minimal"); }
function toEditUrl(url: string) { return url.replace(/\/(edit|embed)[^/]*.*/, "/edit"); }

export default function LyricPanel({
  songId, songTitle = "", songAuthor = "",
  lyrics, onLyricsChange, onPresent,
  hasSong, canEdit = false,
}: Props) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  const selected = lyrics[selectedIdx];
  const src = selected?.slide_drive_url
    ? (editMode ? toEditUrl(selected.slide_drive_url) : toEmbedUrl(selected.slide_drive_url))
    : null;
  const editUrl = selected?.slide_drive_url ? toEditUrl(selected.slide_drive_url) : undefined;

  const handleLyricSaved = (lyric: Lyric) => {
    const existing = lyrics.findIndex(l => l.id === lyric.id);
    if (existing >= 0) {
      // update in-place (e.g. slide generated)
      onLyricsChange?.(lyrics.map(l => l.id === lyric.id ? lyric : l));
    } else {
      // new lyric added
      const next = [...lyrics, lyric];
      onLyricsChange?.(next);
      setSelectedIdx(next.length - 1);
    }
  };

  const handleVerify = async (lyric: Lyric) => {
    if (!songId) return;
    await verifyLyric(songId, lyric.id);
    onLyricsChange?.(lyrics.map(l => l.id === lyric.id ? { ...l, verified_at: new Date().toISOString() } : l));
  };

  const handleDelete = async () => {
    if (!deleteId || !songId) return;
    await deleteLyric(songId, deleteId);
    const next = lyrics.filter(l => l.id !== deleteId);
    onLyricsChange?.(next);
    setSelectedIdx(i => Math.min(i, Math.max(0, next.length - 1)));
    setDeleteId(null);
    setEditMode(false);
  };

  return (
    <>
      <div className="bg-gray-800 rounded-xl p-4 shadow-2xl h-[40vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold text-pink-400">{vi.lyricPanel.title}</h3>
          <div className="flex gap-2">
            {canEdit && songId && (
              <button onClick={() => setShowAdd(true)} className="bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded text-sm text-white transition-colors">
                {vi.lyricPanel.addBtn}
              </button>
            )}
            {src && (
              <button onClick={() => setFullscreen(true)} className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-sm text-white transition-colors">
                {vi.lyricPanel.fullscreenBtn}
              </button>
            )}
          </div>
        </div>

        {/* Lyric tabs + edit controls on the same row */}
        {(lyrics.length > 0 || (canEdit && selected)) && (
          <div className="flex gap-2 mb-2 flex-wrap items-center justify-between">
            {/* Tabs (left) */}
            <div className="flex gap-2 flex-wrap items-center">
              {lyrics.map((lyric, i) => {
                const embedUrl = lyric.slide_drive_url ? toEmbedUrl(lyric.slide_drive_url) : null;
                return (
                  <div key={lyric.id} className="flex gap-px">
                    <button
                      onClick={() => { setSelectedIdx(i); setEditMode(false); }}
                      className={`px-3 py-1 text-xs font-medium transition-colors ${
                        onPresent ? "rounded-l" : "rounded"
                      } ${selectedIdx === i ? "bg-pink-500 text-white" : "bg-gray-700 hover:bg-gray-600 text-white"}`}
                    >
                      {i + 1}
                      {lyric.source_lyric === "AI" && <span className="ml-1 text-purple-300">·AI</span>}
                      {lyric.verified_at && <span className="ml-1 text-green-400">✓</span>}
                    </button>
                    {onPresent && embedUrl && (
                      <button
                        onClick={() => onPresent(embedUrl)}
                        className="px-2 py-1 rounded-r text-xs font-medium bg-green-700 hover:bg-green-600 text-white transition-colors"
                        title={vi.lyricPanel.presentTitle}
                      >
                        📺
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Edit controls (right) */}
            {canEdit && selected && (
              <div className="flex gap-2 flex-wrap items-center">
                {selected.slide_drive_url && (
                  <button
                    onClick={() => setEditMode(v => !v)}
                    className="px-2 py-1 rounded text-xs bg-blue-700 hover:bg-blue-600 text-white transition-colors"
                  >
                    {editMode ? vi.lyricPanel.exitEditBtn : vi.lyricPanel.editBtn}
                  </button>
                )}
                {editMode && editUrl && (
                  <a href={editUrl} target="_blank" rel="noreferrer"
                    className="px-2 py-1 rounded text-xs bg-gray-600 hover:bg-gray-500 text-white transition-colors">
                    {vi.lyricPanel.openTabBtn}
                  </a>
                )}
                {!selected.verified_at && (
                  <button onClick={() => handleVerify(selected)} className="px-2 py-1 rounded text-xs bg-green-700 hover:bg-green-600 text-white transition-colors">
                    {vi.lyricPanel.verifyBtn}
                  </button>
                )}
                <button onClick={() => setDeleteId(selected.id)} className="px-2 py-1 rounded text-xs bg-red-700 hover:bg-red-600 text-white transition-colors">
                  {vi.lyricPanel.deleteBtn}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Preview */}
        <div className="flex-grow bg-gray-900 rounded border border-gray-700">
          {src ? (
            <iframe src={src} className="w-full h-full rounded" />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              {hasSong ? vi.lyricPanel.selectHint : vi.lyricPanel.noSong}
            </div>
          )}
        </div>
      </div>

      {fullscreen && src && (
        <FullscreenOverlay url={src} title={vi.lyricPanel.fullscreenTitle} onClose={() => setFullscreen(false)} />
      )}

      {showAdd && songId && (
        <AddLyricModal
          songId={songId}
          songTitle={songTitle}
          songAuthor={songAuthor}
          onSaved={handleLyricSaved}
          onClose={() => setShowAdd(false)}
        />
      )}

      {deleteId && (
        <DeleteConfirmModal
          title={vi.lyricPanel.confirmDeleteTitle}
          message={vi.lyricPanel.confirmDeleteMsg}
          confirmLabel={vi.lyricPanel.deleteBtn}
          cancelLabel={vi.lyricPanel.cancelBtn}
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </>
  );
}
