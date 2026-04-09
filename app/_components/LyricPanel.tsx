"use client";

import { useState } from "react";
import FullscreenOverlay from "./FullscreenOverlay";
import DeleteConfirmModal from "./DeleteConfirmModal";
import AddLyricModal from "./lyric-panel/AddLyricModal";
import LyricSlidePanel from "./lyric-panel/LyricSlidePanel";
import { verifyLyric, deleteLyric, type Lyric } from "./lyric-panel/lyricService";
import LyricHtmlPanel, { DEFAULT_STYLE, type LyricHtmlStyle } from "./LyricHtmlPanel";
import vi from "../../lib/vi";

export type { Lyric };

type Props = {
  songId?: string;
  songTitle?: string;
  songAuthor?: string;
  lyrics: Lyric[];
  onLyricsChange?: (lyrics: Lyric[]) => void;
  onPresent?: (url: string) => void;
  /** Present lyric by storing URL params — enables 📺 button in LyricHtmlPanel. */
  onPresentConfig?: (lyricId: string, style: LyricHtmlStyle) => void;
  hasSong: boolean;
  canEdit?: boolean;
  hideSlide?: boolean;
};

function toEmbedUrl(url: string) { return url.replace(/\/edit.*/, "/embed?rm=minimal"); }
function toEditUrl(url: string) { return url.replace(/\/(edit|embed)[^/]*.*/, "/edit"); }

export default function LyricPanel({
  songId, songTitle = "", songAuthor = "",
  lyrics, onLyricsChange, onPresent, onPresentConfig,
  hasSong, canEdit = false, hideSlide = false,
}: Props) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  // ── HTML lyric panel state ────────────────────────────────────────────────
  const [htmlStyle, setHtmlStyle] = useState<LyricHtmlStyle>(DEFAULT_STYLE);
  const [htmlPresenting, setHtmlPresenting] = useState(false);

  const selected = lyrics[selectedIdx];
  const src = selected?.slide_drive_url
    ? (editMode ? toEditUrl(selected.slide_drive_url) : toEmbedUrl(selected.slide_drive_url))
    : null;

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
      {/*<div className="bg-gray-800 rounded-xl p-4 shadow-2xl h-[40vh] flex flex-col">*/}
      {/*  /!* Header *!/*/}
      {/*  <div className="flex justify-between items-center mb-2">*/}
      {/*    <h3 className="font-bold text-pink-400">{vi.lyricPanel.title}</h3>*/}
      {/*    <div className="flex gap-2">*/}
      {/*      {canEdit && songId && (*/}
      {/*        <button onClick={() => setShowAdd(true)} className="bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded text-sm text-white transition-colors">*/}
      {/*          {vi.lyricPanel.addBtn}*/}
      {/*        </button>*/}
      {/*      )}*/}
      {/*      {src && (*/}
      {/*        <button onClick={() => setFullscreen(true)} className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-sm text-white transition-colors">*/}
      {/*          {vi.lyricPanel.fullscreenBtn}*/}
      {/*        </button>*/}
      {/*      )}*/}
      {/*    </div>*/}
      {/*  </div>*/}

      {/*  /!* Lyric tabs + edit controls on the same row *!/*/}
      {/*  {!hideSlide && (lyrics.length > 0 || (canEdit && selected)) && (*/}
      {/*    <LyricSlidePanel*/}
      {/*      lyrics={lyrics}*/}
      {/*      selectedIdx={selectedIdx}*/}
      {/*      onSelectIdx={setSelectedIdx}*/}
      {/*      editMode={editMode}*/}
      {/*      onEditModeChange={setEditMode}*/}
      {/*      onPresent={onPresent}*/}
      {/*      canEdit={canEdit}*/}
      {/*      onVerify={handleVerify}*/}
      {/*      onDelete={setDeleteId}*/}
      {/*    />*/}
      {/*  )}*/}

      {/*  /!* Preview *!/*/}
      {/*  {!hideSlide && (*/}
      {/*    <div className="flex-grow bg-gray-900 rounded border border-gray-700">*/}
      {/*      {src ? (*/}
      {/*        <iframe src={src} className="w-full h-full rounded" />*/}
      {/*      ) : (*/}
      {/*        <div className="flex items-center justify-center h-full text-gray-500">*/}
      {/*          {hasSong ? vi.lyricPanel.selectHint : vi.lyricPanel.noSong}*/}
      {/*        </div>*/}
      {/*      )}*/}
      {/*    </div>*/}
      {/*  )}*/}
      {/*</div>*/}

      {fullscreen && src && (
        <FullscreenOverlay url={src} title={vi.lyricPanel.fullscreenTitle} onClose={() => setFullscreen(false)} />
      )}

      {/* ── HTML lyric panel (shown only when a song is loaded) ── */}
      {hasSong && (
        <LyricHtmlPanel
          song={{ id: songId, title: songTitle, author: songAuthor }}
          lyricId={lyrics[selectedIdx]?.id}
          lyricsText={lyrics[selectedIdx]?.lyrics ?? ""}
          onLyricsTextChange={(text) => {
            onLyricsChange?.(lyrics.map((l, i) => i === selectedIdx ? { ...l, lyrics: text } : l));
          }}
          isSelected={htmlPresenting}
          onSelect={() => setHtmlPresenting(true)}
          onPresentConfig={onPresentConfig ? (lyricId, style) => {
            setHtmlPresenting(true);
            onPresentConfig(lyricId, style);
          } : undefined}
          style={htmlStyle}
          onStyleChange={setHtmlStyle}
        />
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
