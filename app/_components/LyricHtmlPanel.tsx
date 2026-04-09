"use client";

import { useState, useEffect } from "react";
import LyricHtmlStyleBar, { DEFAULT_STYLE, type LyricHtmlStyle } from "./LyricHtmlStyleBar";

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

function LyricPreview({ lyricsText, style }: { lyricsText: string; style: LyricHtmlStyle }) {
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
  lyricId?: string;
  lyricsText: string;
  onLyricsTextChange?: (text: string) => void;
  isSelected: boolean;
  onSelect: () => void;
  /** When provided, shows 📺 button — present lyric by storing URL */
  onPresentConfig?: (lyricId: string, style: LyricHtmlStyle) => void;
  style: LyricHtmlStyle;
  onStyleChange: (s: LyricHtmlStyle) => void;
  previewHeight?: string;
};

export default function LyricHtmlPanel({
  song, lyricId, lyricsText, onLyricsTextChange,
  isSelected, onSelect, onPresentConfig,
  style, onStyleChange, previewHeight = "20vh",
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(lyricsText);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!editing) setDraft(lyricsText); }, [lyricsText, editing]);

  const hasLyrics = lyricsText.trim().length > 0 || draft.trim().length > 0;
  const displayText = editing ? draft : lyricsText;

  const handlePresentToTV = () => {
    if (!hasLyrics || !onPresentConfig || !lyricId) return;
    onSelect();
    onPresentConfig(lyricId, style);
  };

  const handleFullscreen = () => {
    if (!lyricId) return;
    const url = `/live/lyric?lyric_id=${lyricId}&${styleToParams(style)}`;
    window.open(url, "_blank");
  };

  const handleSave = async () => {
    if (!song?.id || !lyricId) return;
    setSaving(true);
    try {
      await fetch(`${API}/api/songs/${song.id}/lyrics/${lyricId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lyrics: draft }),
      });
      onLyricsTextChange?.(draft);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`rounded-xl border-2 mb-3 transition-colors ${isSelected ? "border-green-500" : "border-gray-700"}`}>
      <div className="bg-gray-800 rounded-xl p-3 flex flex-col gap-2">

        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-200">Lời HTML (Tự tạo)</span>
          <div className="flex items-center gap-2">
            {onPresentConfig && hasLyrics && lyricId && (
              <button
                onClick={handlePresentToTV}
                className={`text-xs px-3 py-1 rounded font-medium transition-colors flex items-center gap-1 ${
                  isSelected ? "bg-green-700 hover:bg-green-600 text-white" : "bg-gray-700 hover:bg-gray-600 text-white"
                }`}
                title="Chiếu lên màn hình TV"
              >
                📺{isSelected && <span className="text-green-300">✓</span>}
              </button>
            )}

            {!onPresentConfig && (
              isSelected ? (
                <span className="text-xs font-semibold text-green-400 flex items-center gap-1">✓ Đang chọn</span>
              ) : hasLyrics ? (
                <button onClick={onSelect}
                  className="text-xs bg-indigo-700 hover:bg-indigo-600 text-white px-3 py-1 rounded font-medium transition-colors">
                  Chọn lời này
                </button>
              ) : null
            )}

            {!editing ? (
              <button onClick={() => { setDraft(lyricsText); setEditing(true); }}
                className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded transition-colors">
                ✏️ Sửa
              </button>
            ) : (
              <>
                <button onClick={handleSave} disabled={saving || !lyricId}
                  className="text-xs bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white px-2 py-1 rounded transition-colors">
                  {saving ? "Đang lưu…" : "💾 Lưu"}
                </button>
                <button onClick={() => { setDraft(lyricsText); setEditing(false); }}
                  className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded transition-colors">
                  Huỷ
                </button>
              </>
            )}
          </div>
        </div>

        {/* Style controls */}
        <LyricHtmlStyleBar style={style} onChange={onStyleChange} />

        {/* Body */}
        {!hasLyrics ? (
          <p className="text-xs text-gray-500 italic">Chưa có lời để xem trước</p>
        ) : editing ? (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full rounded bg-gray-900 text-white text-xs p-2 font-mono leading-relaxed resize-y"
            style={{ minHeight: previewHeight }}
            placeholder="Nhập lời bài hát, ngăn cách các đoạn bằng dòng trống..."
          />
        ) : (
          <div className="flex gap-2 items-stretch">
            <div className="flex-1">
              <LyricPreview lyricsText={displayText} style={style} />
            </div>
            {lyricId && (
              <button
                onClick={handleFullscreen}
                className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 rounded transition-colors shrink-0"
                style={{ writingMode: "vertical-rl" }}
                title="Xem trước toàn màn hình"
              >
                ⛶ Toàn màn hình
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
