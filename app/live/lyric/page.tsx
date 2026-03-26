"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LiveLyricPage() {
  const [lyricUrl, setLyricUrl] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      // Find the currently live session
      const { data: session } = await supabase
        .from("live_sessions")
        .select("id, presenting_lyric_url")
        .eq("status", "live")
        .single();

      if (!session) { setReady(true); return; }

      setLyricUrl(session.presenting_lyric_url ?? null);
      setReady(true);

      // Subscribe to broadcast from musician
      const channel = supabase
        .channel(`lyric_present_${session.id}`)
        .on("broadcast", { event: "present" }, (payload) => {
          setLyricUrl(payload.payload.url ?? null);
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

  if (!lyricUrl) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-gray-500 text-xl">
        Đang chờ nhạc công chọn bài...
      </div>
    );
  }

  return (
    <iframe
      src={lyricUrl}
      className="w-screen h-screen border-0"
      allowFullScreen
    />
  );
}