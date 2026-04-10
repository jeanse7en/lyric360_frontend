"use client";

import { useState, useEffect } from "react";
import LyricHtmlStyleBar, { DEFAULT_STYLE, type LyricHtmlStyle } from "./LyricHtmlStyleBar";
import AddLyricModal from "./lyric-panel/AddLyricModal";
import DeleteConfirmModal from "./DeleteConfirmModal";
import { type Lyric, verifyLyric, deleteLyric } from "./lyric-panel/lyricService";

export { DEFAULT_STYLE, type LyricHtmlStyle };

const API = process.env.NEXT_PUBLIC_API_URL;


// Build URL params from style so /live/lyric can reconstruct the exact style
export function styleToParams(style: LyricHtmlStyle): string {
  const p = new URLSearchParams({
    bg: style.bgColor,
    c1: style.color1,
    c2: style.color2,
    font: style.fontFamily,
    size: String(style.fontSize),
    single: style.singlePage ? "1" : "0",
  });
  return p.toString();
}

export function paramsToStyle(params: URLSearchParams): LyricHtmlStyle {
  return {
    bgColor:    params.get("bg")    ?? DEFAULT_STYLE.bgColor,
    color1:     params.get("c1")    ?? DEFAULT_STYLE.color1,
    color2:     params.get("c2")    ?? DEFAULT_STYLE.color2,
    fontFamily: params.get("font")  ?? DEFAULT_STYLE.fontFamily,
    fontSize:   Number(params.get("size"))  || DEFAULT_STYLE.fontSize,
    singlePage: params.get("single") === "1",
  };
}

// ── Simple React preview (no iframe, no HTML generation) ─────────────────────

export function LyricPreview({ lyricsText, style }: { lyricsText: string; style: LyricHtmlStyle }) {
  const stanzas = lyricsText.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
  return (
    <div
      className="w-full rounded overflow-hidden"
      style={{
        aspectRatio: "16/9",
        background: style.bgColor,
        fontFamily: `${style.fontFamily}, Arial, sans-serif`,
        fontSize: `${style.fontSize}px`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2% 3%",
        gap: "0.4em",
        overflow: "hidden",
      }}
    >
      <div style={{ columns: 2, columnGap: "3em", width: "100%", textAlign: "center" }}>
        {stanzas.map((s, i) => (
          <p
            key={i}
            style={{
              color: i % 2 === 0 ? style.color1 : style.color2,
              whiteSpace: "pre-wrap",
              lineHeight: 1.5,
              fontWeight: 500,
              marginBottom: "0.4em",
              breakInside: "avoid",
            }}
          >
            {s}
          </p>
        ))}
      </div>
    </div>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────────────

type Props = {
  song: { id?: string; title?: string; author?: string } | null;
  // Multi-lyric mode (managed internally)
  lyrics?: Lyric[];
  onLyricsChange?: (lyrics: Lyric[]) => void;
  canEdit?: boolean;
  // Single-lyric mode (backward compat — used when lyrics array is not provided)
  lyricId?: string;
  lyricsText?: string;
  onLyricsTextChange?: (text: string) => void;
  // Common
  isSelected: boolean;
  onSelect: () => void;
  /** When provided, shows 📺 button — present lyric by storing URL */
  onPresentConfig?: (lyricId: string, style: LyricHtmlStyle) => void;
  style: LyricHtmlStyle;
  onStyleChange: (s: LyricHtmlStyle) => void;
  previewHeight?: string;
};

export default function LyricHtmlPanel({
  song, lyrics, onLyricsChange, canEdit = false,
  lyricId: lyricIdProp, lyricsText: lyricsTextProp = "", onLyricsTextChange,
  isSelected, onSelect, onPresentConfig,
  style, onStyleChange, previewHeight = "20vh",
}: Props) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Resolve active lyric from multi or single mode
  const multiMode = !!lyrics;
  const activeLyricId   = multiMode ? lyrics![selectedIdx]?.id   : lyricIdProp;
  const activeLyricsText = multiMode ? (lyrics![selectedIdx]?.lyrics ?? "") : lyricsTextProp;

  useEffect(() => { if (!editing) setDraft(activeLyricsText); }, [activeLyricsText, editing]);
  // Reset selection when lyrics array shrinks
  useEffect(() => {
    if (lyrics && selectedIdx >= lyrics.length) setSelectedIdx(Math.max(0, lyrics.length - 1));
  }, [lyrics?.length]);

  const hasLyrics = activeLyricsText.trim().length > 0 || draft.trim().length > 0;
  const displayText = editing ? draft : activeLyricsText;

  const handlePresentToTV = () => {
    if (!hasLyrics || !onPresentConfig || !activeLyricId) return;
    onSelect();
    onPresentConfig(activeLyricId, style);
  };

  const handleFullscreen = () => {
    if (!activeLyricId) return;
    const url = `/live/lyric?lyric_id=${activeLyricId}&${styleToParams(style)}`;
    window.open(url, "_blank");
  };

  const handleSave = async () => {
    if (!song?.id || !activeLyricId) return;
    setSaving(true);
    try {
      await fetch(`${API}/api/songs/${song.id}/lyrics/${activeLyricId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lyrics: draft }),
      });
      if (multiMode && onLyricsChange && lyrics) {
        onLyricsChange(lyrics.map(l => l.id === activeLyricId ? { ...l, lyrics: draft } : l));
      } else {
        onLyricsTextChange?.(draft);
      }
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleVerify = async () => {
    if (!song?.id || !activeLyricId || !multiMode || !onLyricsChange || !lyrics) return;
    setVerifying(true);
    try {
      await verifyLyric(song.id, activeLyricId);
      onLyricsChange(lyrics.map(l => l.id === activeLyricId ? { ...l, verified_at: new Date().toISOString() } : l));
    } finally {
      setVerifying(false);
    }
  };

  const handleDelete = async () => {
    if (!song?.id || !deleteId || !multiMode || !onLyricsChange || !lyrics) return;
    await deleteLyric(song.id, deleteId);
    const next = lyrics.filter(l => l.id !== deleteId);
    onLyricsChange(next);
    setSelectedIdx(i => Math.min(i, Math.max(0, next.length - 1)));
    setDeleteId(null);
  };

  const handleLyricSaved = (lyric: Lyric) => {
    if (!multiMode || !onLyricsChange || !lyrics) return;
    const existing = lyrics.findIndex(l => l.id === lyric.id);
    if (existing >= 0) {
      onLyricsChange(lyrics.map(l => l.id === lyric.id ? lyric : l));
      setSelectedIdx(existing);
    } else {
      const next = [...lyrics, lyric];
      onLyricsChange(next);
      setSelectedIdx(next.length - 1);
    }
  };

  return (
    <>
      <div className={`rounded-xl border-2 mb-3 transition-colors ${isSelected ? "border-green-500" : "border-gray-700"}`}>
        <div className="bg-gray-800 rounded-xl p-3 flex flex-col gap-2">

          {/* Row 1: title | fullscreen + add */}
          <div className="flex justify-between items-center">
            <span className="font-bold text-pink-400 text-sm">Lời HTML</span>
            <div className="flex gap-2">
              {multiMode && canEdit && song?.id && (
                  <button
                      onClick={() => setShowAdd(true)}
                      className="bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded text-xs text-white transition-colors"
                  >
                    +
                  </button>
              )}
              {activeLyricId && (
                <button
                  onClick={handleFullscreen}
                  className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-xs text-white transition-colors"
                >
                  ⛶
                </button>
              )}
            </div>
          </div>

          {/* Row 2: lyric tabs (left) | present + verify + edit + delete (right) */}
          {(multiMode && (lyrics!.length > 0 || canEdit)) && (
            <div className="flex flex-wrap gap-2 items-center justify-between">
              {/* Tabs */}
              <div className="flex flex-wrap gap-2 items-center">
                {lyrics!.map((lyric, i) => (
                  <button
                    key={lyric.id}
                    onClick={() => { setSelectedIdx(i); setEditing(false); }}
                    className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                      selectedIdx === i ? "bg-pink-500 text-white" : "bg-gray-700 hover:bg-gray-600 text-white"
                    }`}
                  >
                    {i + 1}
                    {lyric.source_lyric === "AI" && <span className="ml-1 text-purple-300">·AI</span>}
                    {lyric.verified_at && <span className="ml-1 text-green-400">✓</span>}
                  </button>
                ))}
              </div>

              {/* Actions */}
              {activeLyricId && (
                <div className="flex flex-wrap gap-2 items-center">
                  {/* Present to TV */}
                  {onPresentConfig && hasLyrics && (
                    <button
                      onClick={handlePresentToTV}
                      className={`text-xs px-2 py-1 rounded font-medium transition-colors flex items-center gap-1 ${
                        isSelected ? "bg-green-700 hover:bg-green-600 text-white" : "bg-gray-700 hover:bg-gray-600 text-white"
                      }`}
                      title="Chiếu lên màn hình TV"
                    >
                      📺{isSelected && <span className="text-green-300">✓</span>}
                    </button>
                  )}

                  {/* Verify */}
                  {canEdit && lyrics![selectedIdx] && !lyrics![selectedIdx].verified_at && (
                    <button
                      onClick={handleVerify}
                      disabled={verifying}
                      className="text-xs px-2 py-1 rounded bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white transition-colors"
                    >
                      {verifying ? "..." : "✓ Xác nhận"}
                    </button>
                  )}

                  {/* Edit / Save / Cancel */}
                  {canEdit && (!editing ? (
                    <button onClick={() => { setDraft(activeLyricsText); setEditing(true); }}
                      className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded transition-colors">
                      ✏️
                    </button>
                  ) : (
                    <>
                      <button onClick={handleSave} disabled={saving}
                        className="text-xs bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white px-2 py-1 rounded transition-colors">
                        {saving ? "Đang lưu…" : "💾 Lưu"}
                      </button>
                      <button onClick={() => { setDraft(activeLyricsText); setEditing(false); }}
                        className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded transition-colors">
                        Huỷ
                      </button>
                    </>
                  ))}

                  {/* Delete */}
                  {canEdit && (
                    <button
                      onClick={() => setDeleteId(activeLyricId)}
                      className="text-xs px-2 py-1 rounded bg-red-700 hover:bg-red-600 text-white transition-colors"
                    >
                      🗑
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Body */}
          {!hasLyrics ? (
            <p className="text-xs text-gray-500 italic">Chưa có lời để xem trước</p>
          ) : editing ? (
            <>
              {/* Style bar — always visible when editing */}
              <LyricHtmlStyleBar style={style} onChange={onStyleChange} />
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="w-full rounded bg-gray-900 text-white text-xs p-2 font-mono leading-relaxed resize-y"
                style={{ minHeight: previewHeight }}
                placeholder="Nhập lời bài hát, ngăn cách các đoạn bằng dòng trống..."
              />
            </>
          ) : (
            <div className="relative group">
              <LyricPreview lyricsText={displayText} style={style} />
              {/* Floating style bar — visible on hover */}
              <div className="absolute bottom-0 inset-x-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto">
                <LyricHtmlStyleBar style={style} onChange={onStyleChange} />
              </div>
            </div>
          )}
        </div>
      </div>

      {showAdd && song?.id && (
        <AddLyricModal
          songId={song.id}
          songTitle={song.title ?? ""}
          songAuthor={song.author ?? ""}
          onSaved={handleLyricSaved}
          onClose={() => setShowAdd(false)}
        />
      )}

      {deleteId && (
        <DeleteConfirmModal
          title="Xoá lời bài hát"
          message="Bạn có chắc muốn xoá lời này không?"
          confirmLabel="Xoá"
          cancelLabel="Huỷ"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </>
  );
}
