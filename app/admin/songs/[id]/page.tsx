"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "../../../_components/Header";
import Footer from "../../../_components/Footer";
import SheetPanel, { type Sheet } from "../../../_components/SheetPanel";
import LyricPanel, { type Lyric } from "../../../_components/LyricPanel";
import SongBanner from "./_components/SongBanner";
import LyricHtmlPanel from "../../live/[sessionId]/compact/_components/LyricHtmlPanel";
import { DEFAULT_STYLE, type LyricHtmlStyle } from "../../live/[sessionId]/compact/_components/LyricHtmlStyleBar";
import vi from "../../../../lib/vi";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function EditSongPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [lyrics, setLyrics] = useState<Lyric[]>([]);
  const [loading, setLoading] = useState(true);
  const [htmlStyle, setHtmlStyle] = useState<LyricHtmlStyle>(DEFAULT_STYLE);

  useEffect(() => {
    fetch(`${API}/api/songs/${id}`)
      .then(r => r.json())
      .then(data => {
        setTitle(data.title ?? "");
        setAuthor(data.author ?? "");
        setSheets(data.sheets ?? []);
        setLyrics(data.lyrics ?? []);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500">{vi.editSongPage.loadingMsg}</div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header />
      <div className="flex-1 max-w-3xl w-full mx-auto py-6 px-4">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.push("/admin/songs")} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm">
            {vi.editSongPage.backBtn}
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{vi.editSongPage.title}</h1>
        </div>

        <SongBanner
          songId={id}
          title={title}
          author={author}
          onChanged={(t, a) => { setTitle(t); setAuthor(a); }}
        />

        <div className="mb-4">
          <SheetPanel songId={id} sheets={sheets} onSheetsChange={setSheets} hasSong canEdit />
        </div>

        <div className="mb-4">
          <LyricPanel songId={id} songTitle={title} songAuthor={author} lyrics={lyrics} onLyricsChange={setLyrics} hasSong canEdit />
        </div>

        <div className="mb-6">
          {(() => {
            const lyric = lyrics.find(l => l.lyrics);
            return (
              <LyricHtmlPanel
                song={{ id, title, author }}
                lyricId={lyric?.id}
                lyricsText={lyric?.lyrics ?? ""}
                onLyricsTextChange={(text) =>
                  setLyrics(prev => prev.map(l => l.id === lyric?.id ? { ...l, lyrics: text } : l))
                }
                isSelected={false}
                onSelect={() => {}}
                style={htmlStyle}
                onStyleChange={setHtmlStyle}
                previewHeight="30vh"
              />
            );
          })()}
        </div>

        <button
          onClick={() => router.push("/admin/songs")}
          className="w-full py-2 rounded-lg text-sm font-medium bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white transition-colors"
        >
          {vi.editSongPage.doneBtn}
        </button>
      </div>
      <Footer />
    </div>
  );
}
