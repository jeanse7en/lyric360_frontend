"use client";

import { useState } from "react";
import { addLyric, aiFetchLyrics, generateSlide, type Lyric } from "./lyricService";
import vi from "../../../lib/vi";

type Props = {
  songId: string;
  songTitle: string;
  songAuthor: string;
  onSaved: (lyric: Lyric) => void;
  onClose: () => void;
};

function yearToIso(year: string): string | null {
  const y = year.trim();
  if (!y) return null;
  const n = parseInt(y, 10);
  if (isNaN(n)) return null;
  return new Date(n, 0, 1).toISOString();
}

export default function AddLyricModal({ songId, songTitle, songAuthor, onSaved, onClose }: Props) {
  const [text, setText] = useState("");
  const [composedAt, setComposedAt] = useState("");
  const [isFromAI, setIsFromAI] = useState(false);
  const [aiComposedAt, setAiComposedAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [generatingSlide, setGeneratingSlide] = useState(false);
  const [error, setError] = useState("");
  const [savedLyric, setSavedLyric] = useState<Lyric | null>(null);

  const activeComposedAt = isFromAI ? aiComposedAt : composedAt;
  const setActiveComposedAt = isFromAI ? setAiComposedAt : setComposedAt;

  const handleAiFetch = async () => {
    setFetching(true);
    setError("");
    try {
      const data = await aiFetchLyrics(songTitle, songAuthor);
      setText(data.lyrics ?? "");
      setAiComposedAt(data.year ?? "");
      setIsFromAI(true);
    } catch (e: any) {
      setError(e.message === "not_impl" ? vi.lyricPanel.errAiNotImpl : vi.lyricPanel.errAiFailed);
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async () => {
    if (!text.trim()) return;
    setSaving(true);
    setError("");
    try {
      const lyric = await addLyric(songId, {
        lyrics: text.trim(),
        source_lyric: isFromAI ? "AI" : "MANUAL",
        composed_at: yearToIso(activeComposedAt),
      });
      onSaved(lyric);
      setSavedLyric(lyric);
    } catch {
      setError(vi.lyricPanel.errCannotSave);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateSlide = async () => {
    if (!savedLyric) return;
    setGeneratingSlide(true);
    setError("");
    try {
      const updated = await generateSlide(songId, savedLyric.id);
      setSavedLyric(updated);
      onSaved(updated);
    } catch (e: any) {
      setError(e.message === "slide_not_impl" ? vi.lyricPanel.errSlideNotImpl : vi.lyricPanel.errSlideFailed);
    } finally {
      setGeneratingSlide(false);
    }
  };

  const handleClose = () => {
    setText(""); setComposedAt(""); setAiComposedAt(""); setIsFromAI(false);
    setError(""); setSavedLyric(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 text-gray-900">
        <h2 className="text-lg font-bold mb-4">{vi.lyricPanel.addModalTitle}</h2>

        {!savedLyric ? (
          /* Step 1 — Enter lyric text */
          <div className="space-y-3">
            <textarea
              value={text}
              onChange={e => { setText(e.target.value); setIsFromAI(false); }}
              placeholder={vi.lyricPanel.textPlaceholder}
              rows={6}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 font-mono resize-y"
            />

            <div className="flex items-center gap-2">
              <input
                type="text" value={activeComposedAt}
                onChange={e => setActiveComposedAt(e.target.value)}
                placeholder={vi.lyricPanel.yearPlaceholder}
                className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
              {isFromAI && (
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded shrink-0">
                  {vi.lyricPanel.aiBadge}
                </span>
              )}
            </div>

            {error && <p className="text-red-500 text-xs">{error}</p>}

            <div className="flex gap-2">
              <button
                onClick={handleAiFetch} disabled={fetching || !songTitle}
                className="flex-1 py-2 rounded-lg text-sm font-medium bg-purple-600 hover:bg-purple-500 text-white transition-colors disabled:opacity-50"
              >
                {fetching ? vi.lyricPanel.aiFetchingBtn : vi.lyricPanel.aiFetchBtn}
              </button>
              <button
                onClick={handleSave} disabled={!text.trim() || saving}
                className="flex-1 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-50"
              >
                {saving ? vi.lyricPanel.savingBtn : vi.lyricPanel.saveBtn}
              </button>
            </div>

            <div className="flex justify-end">
              <button onClick={handleClose} className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 transition-colors">
                {vi.lyricPanel.cancelBtn}
              </button>
            </div>
          </div>
        ) : (
          /* Step 2 — Generate slide */
          <div className="space-y-4">
            <p className="text-sm text-green-600 font-medium">✓ Đã lưu lời bài hát</p>

            {error && <p className="text-red-500 text-xs">{error}</p>}

            {savedLyric.slide_drive_url ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-green-600 font-medium">✓ Slide đã được tạo</span>
                <a href={savedLyric.slide_drive_url} target="_blank" rel="noreferrer"
                  className="text-xs text-blue-600 hover:underline">
                  {vi.lyricPanel.viewSlideLink}
                </a>
              </div>
            ) : (
              <button
                onClick={handleGenerateSlide} disabled={generatingSlide}
                className="w-full py-2 rounded-lg text-sm font-medium bg-purple-600 hover:bg-purple-500 text-white transition-colors disabled:opacity-50"
              >
                {generatingSlide ? vi.lyricPanel.generatingSlideBtn : vi.lyricPanel.generateSlideBtn}
              </button>
            )}

            <div className="flex justify-end">
              <button onClick={handleClose} className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-800 hover:bg-gray-700 text-white transition-colors">
                {vi.lyricPanel.closeBtn}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
