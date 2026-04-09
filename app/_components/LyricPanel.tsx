"use client";

import { useState } from "react";
import DeleteConfirmModal from "./DeleteConfirmModal";
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
};

export default function LyricPanel({
  songId, songTitle = "", songAuthor = "",
  lyrics, onLyricsChange, onPresent, onPresentConfig,
  hasSong, canEdit = false,
}: Props) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [htmlStyle, setHtmlStyle] = useState<LyricHtmlStyle>(DEFAULT_STYLE);
  const [htmlPresenting, setHtmlPresenting] = useState(false);

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
    setDeleteId(null);
  };

  return (
    <>
      {hasSong && (
        <LyricHtmlPanel
          song={{ id: songId, title: songTitle, author: songAuthor }}
          lyrics={lyrics}
          onLyricsChange={onLyricsChange}
          canEdit={canEdit}
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
