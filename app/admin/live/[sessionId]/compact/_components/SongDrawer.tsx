"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import HopAmVietPanel from "../../lyric/_components/HopAmVietPanel";
import LyricHtmlPanel, { buildLyricHtml, openHtmlWindow } from "./LyricHtmlPanel";
import { DEFAULT_STYLE, LyricHtmlStyle } from "./LyricHtmlStyleBar";


type NoteDialogState = {
  isOpen: boolean;
  queueId: string;
  tone: string;
  note: string;
  rating: number;
};

type Props = {
  item: any; // queue item with songs.song_sheets / songs.song_lyrics
  onPlay: (queueId: string, songId: string) => void;
  onStop: (queueId: string) => void;
  onPresent: (url: string) => void;
  onOpenNote: (state: NoteDialogState) => void;
  onShowSheetFullscreen: (url: string) => void;
  onClose: () => void;
};

function toEmbedUrl(url: string) {
  return url.replace(/\/edit.*$/, "/embed?rm=minimal");
}
function toPreviewUrl(url: string) {
  return url.replace("/view", "/preview");
}

export default function SongDrawer({
  item,
  onPlay,
  onStop,
  onPresent,
  onOpenNote,
  onShowSheetFullscreen,
  onClose,
}: Props) {
  const router = useRouter();
  const song = item.songs;
  const sheets: any[] = song?.song_sheets ?? [];
  const dbLyrics: any[] = song?.song_lyrics ?? [];

  // ── Sheet selection ──────────────────────────────────────────────────────
  const [sheetIdx, setSheetIdx] = useState(0);
  const selectedSheet = sheets[sheetIdx];
  const sheetPreviewUrl = selectedSheet ? toPreviewUrl(selectedSheet.sheet_drive_url) : null;

  // ── Lyric selection ──────────────────────────────────────────────────────
  // source: "db" | "hopamviet" | "html" | null
  const [lyricSource, setLyricSource] = useState<"db" | "hopamviet" | "html" | null>(null);
  const [dbLyricIdx, setDbLyricIdx] = useState(0);
  const [hopAmVietUrl, setHopAmVietUrl] = useState<string | null>(null);

  // HTML lyric style
  const [htmlStyle, setHtmlStyle] = useState<LyricHtmlStyle>(DEFAULT_STYLE);

  // Auto-select first DB lyric with a slide URL; fall back to hopamviet intent
  useEffect(() => {
    const firstWithSlide = dbLyrics.findIndex((l) => l.slide_drive_url);
    if (firstWithSlide >= 0) {
      setDbLyricIdx(firstWithSlide);
      setLyricSource("db");
    } else {
      setLyricSource(null); // will be set when admin picks from HopAmViet
    }
  }, [item.id]);

  const selectedDbLyric = dbLyrics[dbLyricIdx];
  const dbLyricEmbedUrl = selectedDbLyric?.slide_drive_url
    ? toEmbedUrl(selectedDbLyric.slide_drive_url)
    : null;

  const activeLyricUrl =
    lyricSource === "db" ? dbLyricEmbedUrl :
    lyricSource === "hopamviet" ? hopAmVietUrl :
    null;

  // The lyrics text used for HTML generation (from selected DB lyric)
  const htmlLyricsText = dbLyrics.find((l) => l.lyrics)?.lyrics ?? "";

  // ── Actions ──────────────────────────────────────────────────────────────
  const handlePlay = () => {
    onPlay(item.id, song.id);
    if (lyricSource === "html" && htmlLyricsText) {
      const html = buildLyricHtml(song?.title ?? "", song?.author ?? null, htmlLyricsText, htmlStyle);
      openHtmlWindow(html);
    } else if (activeLyricUrl) {
      onPresent(activeLyricUrl);
    }
    if (sheetPreviewUrl) onShowSheetFullscreen(sheetPreviewUrl);
    onClose();
  };

  const handleStop = () => {
    onStop(item.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 text-white flex flex-col overflow-hidden">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-800 border-b border-gray-700 shrink-0">
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors text-sm font-medium"
        >
          ← Quay lại
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-bold truncate">{song?.title ?? "—"}</p>
          <p className="text-xs text-gray-400 truncate">{item.singer_name}</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${
          item.status === "playing" ? "bg-blue-600 text-white" :
          item.status === "done" ? "bg-gray-600 text-gray-300" :
          "bg-gray-700 text-gray-300"
        }`}>
          {item.status === "playing" ? "Đang hát" : item.status === "done" ? "Đã xong" : "Chờ"}
        </span>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-4 p-4">

        {/* ── Sheet panel ── */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-yellow-400 text-sm">Bản Nhạc</h3>
            {sheetPreviewUrl && (
              <button
                onClick={() => onShowSheetFullscreen(sheetPreviewUrl)}
                className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded transition-colors"
              >
                ⛶ Toàn màn hình
              </button>
            )}
          </div>

          {sheets.length > 0 ? (
            <>
              <div className="flex gap-2 mb-2 flex-wrap">
                {sheets.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => setSheetIdx(i)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      sheetIdx === i ? "bg-yellow-500 text-black" : "bg-gray-700 hover:bg-gray-600 text-white"
                    }`}
                  >
                    {i + 1}
                    {s.tone_male ? ` · Nam: ${s.tone_male}` : ""}
                    {s.tone_female ? ` · Nữ: ${s.tone_female}` : ""}
                  </button>
                ))}
              </div>
              <div className="h-[35vh] bg-gray-950 rounded border border-gray-700 overflow-hidden">
                {sheetPreviewUrl ? (
                  <iframe src={sheetPreviewUrl} className="w-full h-full" />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                    Không có link xem trước
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="h-[10vh] flex items-center justify-center bg-gray-800 rounded border border-gray-700 text-gray-500 text-sm">
              Chưa có bản nhạc
            </div>
          )}
        </section>

        {/* ── Lyric section ── */}
        <section>
          <h3 className="font-bold text-pink-400 text-sm mb-2">Lời Bài Hát</h3>

          {/* ── Panel 1: System lyrics ── */}
          <div className={`rounded-xl border-2 mb-3 transition-colors ${
            lyricSource === "db" ? "border-green-500" : "border-gray-700"
          }`}>
            <div className="bg-gray-800 rounded-xl p-3 flex flex-col gap-2">
              {/* Panel header with explicit select button */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-200">Lời Hệ Thống</span>
                {lyricSource === "db" ? (
                  <span className="text-xs font-semibold text-green-400 flex items-center gap-1">
                    <span>✓</span> Đang chọn
                  </span>
                ) : (
                  dbLyrics.some((l) => l.slide_drive_url) && (
                    <button
                      onClick={() => setLyricSource("db")}
                      className="text-xs bg-pink-700 hover:bg-pink-600 text-white px-3 py-1 rounded font-medium transition-colors"
                    >
                      Chọn lời này
                    </button>
                  )
                )}
              </div>

              {dbLyrics.length > 0 ? (
                <>
                  {/* Lyric version tabs */}
                  <div className="flex gap-2 flex-wrap">
                    {dbLyrics.map((lyric, i) => (
                      <button
                        key={lyric.id}
                        onClick={() => setDbLyricIdx(i)}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                          dbLyricIdx === i
                            ? "bg-pink-500 text-white"
                            : "bg-gray-700 hover:bg-gray-600 text-white"
                        }`}
                      >
                        {i + 1}
                        {lyric.source_lyric === "AI" && <span className="ml-1 text-purple-300">·AI</span>}
                        {lyric.verified_at && <span className="ml-1 text-green-400">✓</span>}
                      </button>
                    ))}
                  </div>
                  {/* Preview of selected DB lyric */}
                  {dbLyricEmbedUrl && (
                    <div className="h-[25vh] bg-gray-900 rounded border border-gray-700 overflow-hidden">
                      <iframe src={dbLyricEmbedUrl} className="w-full h-full" />
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs text-gray-500 italic">Chưa có lời trong hệ thống</p>
              )}
            </div>
          </div>

          {/* ── Panel 3: HTML Lyric ── */}
          <LyricHtmlPanel
            song={song}
            lyricId={dbLyrics.find((l) => l.lyrics)?.id}
            lyricsText={htmlLyricsText}
            isSelected={lyricSource === "html"}
            onSelect={() => setLyricSource("html")}
            style={htmlStyle}
            onStyleChange={setHtmlStyle}
          />

          {/* ── Panel 2: HopAmViet ── */}
          <div className={`rounded-xl border-2 transition-colors ${
            lyricSource === "hopamviet" ? "border-green-500" : "border-gray-700"
          }`}>
            {/* Panel header — sits above HopAmVietPanel's own header */}
            <div className="flex items-center justify-between px-4 pt-3 pb-1 bg-gray-800 rounded-t-xl">
              <span className="text-xs font-semibold text-gray-200">Lời Internet (HopAmViet)</span>
              {lyricSource === "hopamviet" ? (
                <span className="text-xs font-semibold text-green-400 flex items-center gap-1">
                  <span>✓</span> Đang chọn
                </span>
              ) : (
                hopAmVietUrl && (
                  <button
                    onClick={() => setLyricSource("hopamviet")}
                    className="text-xs bg-orange-700 hover:bg-orange-600 text-white px-3 py-1 rounded font-medium transition-colors"
                  >
                    Chọn lời này
                  </button>
                )
              )}
            </div>
            {/* HopAmVietPanel — "📺 Lưu trang này" stores the URL without broadcasting */}
            <div className="rounded-b-xl overflow-hidden">
              <HopAmVietPanel
                songTitle={song?.title ?? ""}
                presentLabel="💾 Lưu trang này"
                onPresent={(url) => setHopAmVietUrl(url)}
              />
            </div>
          </div>
        </section>
      </div>

      {/* ── Action bar ── */}
      <div className="shrink-0 bg-gray-800 border-t border-gray-700 px-4 py-3 flex gap-2">
        {item.status === "waiting" && (
          <button
            onClick={handlePlay}
            className="flex-1 py-3 rounded-xl text-sm font-bold bg-green-600 hover:bg-green-500 text-white transition-colors"
          >
            ▶ Diễn
          </button>
        )}
        {item.status === "playing" && (
          <button
            onClick={handleStop}
            className="flex-1 py-3 rounded-xl text-sm font-bold bg-red-600 hover:bg-red-500 text-white transition-colors"
          >
            🛑 Dừng
          </button>
        )}
        <button
          onClick={() => router.push(`/admin/songs/${song?.id}`)}
          className="flex-1 py-3 rounded-xl text-sm font-medium bg-gray-700 hover:bg-gray-600 text-white transition-colors"
        >
          ✏️ Xem &amp; Sửa
        </button>
        <button
          onClick={() => {
            onOpenNote({ isOpen: true, queueId: item.id, tone: item.actual_tone || "", note: item.note || "", rating: item.rating || 5 });
            onClose();
          }}
          className="flex-1 py-3 rounded-xl text-sm font-medium bg-blue-800 hover:bg-blue-700 text-white transition-colors"
        >
          📝 Ghi chú
        </button>
      </div>
    </div>
  );
}
