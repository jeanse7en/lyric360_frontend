"use client";

import { type Lyric } from "./lyricService";
import vi from "../../../lib/vi";

function toEmbedUrl(url: string) { return url.replace(/\/edit.*/, "/embed?rm=minimal"); }
function toEditUrl(url: string) { return url.replace(/\/(edit|embed)[^/]*.*/, "/edit"); }

type Props = {
  lyrics: Lyric[];
  selectedIdx: number;
  onSelectIdx: (i: number) => void;
  editMode: boolean;
  onEditModeChange: (v: boolean) => void;
  onPresent?: (url: string) => void;
  canEdit?: boolean;
  onVerify: (lyric: Lyric) => void;
  onDelete: (id: string) => void;
};

export default function LyricSlidePanel({
  lyrics, selectedIdx, onSelectIdx, editMode, onEditModeChange,
  onPresent, canEdit = false, onVerify, onDelete,
}: Props) {
  const selected = lyrics[selectedIdx];
  const editUrl = selected?.slide_drive_url ? toEditUrl(selected.slide_drive_url) : undefined;

  return (
    <div className="flex gap-2 mb-2 flex-wrap items-center justify-between">
      {/* Tabs (left) */}
      <div className="flex gap-2 flex-wrap items-center">
        {lyrics.map((lyric, i) => {
          const embedUrl = lyric.slide_drive_url ? toEmbedUrl(lyric.slide_drive_url) : null;
          return (
            <div key={lyric.id} className="flex gap-px">
              <button
                onClick={() => { onSelectIdx(i); onEditModeChange(false); }}
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
              onClick={() => onEditModeChange(!editMode)}
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
            <button onClick={() => onVerify(selected)} className="px-2 py-1 rounded text-xs bg-green-700 hover:bg-green-600 text-white transition-colors">
              {vi.lyricPanel.verifyBtn}
            </button>
          )}
          <button onClick={() => onDelete(selected.id)} className="px-2 py-1 rounded text-xs bg-red-700 hover:bg-red-600 text-white transition-colors">
            {vi.lyricPanel.deleteBtn}
          </button>
        </div>
      )}
    </div>
  );
}
