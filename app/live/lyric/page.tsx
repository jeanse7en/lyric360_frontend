"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { paramsToStyle, DEFAULT_STYLE, type LyricHtmlStyle } from "../../_components/LyricHtmlPanel";
import LyricDisplay from "./_components/LyricDisplay";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type LyricConfig = {
  lyricId: string;
  style: LyricHtmlStyle;
  text: string;
  title: string;
  author?: string | null;
};

/** Parse a presenting_lyric_url like /live/lyric?lyric_id=abc&bg=...
 *  Returns null if it's an external URL (Google Slides etc.) */
function parseLyricUrl(url: string): { lyricId: string; style: LyricHtmlStyle } | null {
  try {
    // Handle both absolute and relative forms
    const search = url.includes("?") ? url.split("?")[1] : "";
    const params = new URLSearchParams(search);
    const lyricId = params.get("lyric_id");
    if (!lyricId) return null;
    return { lyricId, style: paramsToStyle(params) };
  } catch {
    return null;
  }
}

async function fetchLyricById(lyricId: string): Promise<{ text: string; title: string; author?: string | null } | null> {
  const { data } = await supabase
    .from("song_lyrics")
    .select("lyrics, songs(title, author)")
    .eq("id", lyricId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!data) return null;
  const song = Array.isArray(data.songs) ? data.songs[0] : data.songs;
  return {
    text: (data as any).lyrics ?? "",
    title: (song as any)?.title ?? "",
    author: (song as any)?.author ?? null,
  };
}

export default function LiveLyricPage() {
  const [config, setConfig] = useState<LyricConfig | null>(null);
  const [externalUrl, setExternalUrl] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // Load from URL params (direct open / fullscreen preview) or from DB
  useEffect(() => {
    const init = async () => {
      // 1. Check own URL params first (musician opened this page directly for preview)
      const params = new URLSearchParams(window.location.search);
      const directLyricId = params.get("lyric_id");
      if (directLyricId) {
        const style = paramsToStyle(params);
        const lyric = await fetchLyricById(directLyricId);
        if (lyric) {
          setConfig({ lyricId: directLyricId, style, ...lyric });
          setReady(true);
          return; // preview mode — no Realtime subscription needed
        }
      }

      // 2. TV live mode — read from DB + subscribe to Realtime
      const { data: session } = await supabase
        .from("live_sessions")
        .select("id, presenting_lyric_url")
        .eq("status", "live")
        .maybeSingle();

      if (!session) { setReady(true); return; }

      const applyUrl = async (url: string) => {
        const parsed = parseLyricUrl(url);
        if (parsed) {
          const lyric = await fetchLyricById(parsed.lyricId);
          if (lyric) {
            setConfig({ lyricId: parsed.lyricId, style: parsed.style, ...lyric });
            setExternalUrl(null);
            return;
          }
        }
        // External URL (Google Slides)
        setExternalUrl(url);
        setConfig(null);
      };

      if (session.presenting_lyric_url) {
        await applyUrl(session.presenting_lyric_url);
      }
      setReady(true);

      const channel = supabase
        .channel(`lyric_present_${session.id}`)
        .on("broadcast", { event: "present" }, ({ payload }) => {
          if (payload.url) applyUrl(payload.url);
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    };

    init();
  }, []);

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-gray-500 text-xl">
        Đang tải...
      </div>
    );
  }

  if (config) {
    return (
      <LyricDisplay
        key={config.lyricId + JSON.stringify(config.style)}
        text={config.text}
        title={config.title}
        author={config.author}
        style={config.style}
      />
    );
  }

  if (externalUrl) {
    return (
      <iframe
        src={externalUrl}
        className="w-screen h-screen border-0"
        allowFullScreen
      />
    );
  }

  return (
    <div className="flex items-center justify-center h-screen bg-black text-gray-500 text-xl">
      Đang chờ nhạc công chọn bài...
    </div>
  );
}
