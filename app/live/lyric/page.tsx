"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type DisplayState =
  | { type: "url"; url: string }
  | { type: "html"; html: string }
  | null;

export default function LiveLyricPage() {
  const [display, setDisplay] = useState<DisplayState>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: session } = await supabase
        .from("live_sessions")
        .select("id, presenting_lyric_url, presenting_lyric_html")
        .eq("status", "live")
        .single();

      if (!session) { setReady(true); return; }

      if (session.presenting_lyric_html) {
        setDisplay({ type: "html", html: session.presenting_lyric_html });
      } else if (session.presenting_lyric_url) {
        setDisplay({ type: "url", url: session.presenting_lyric_url });
      }
      setReady(true);

      const channel = supabase
        .channel(`lyric_present_${session.id}`)
        .on("broadcast", { event: "present" }, ({ payload }) => {
          if (payload.html) {
            setDisplay({ type: "html", html: payload.html });
          } else if (payload.url) {
            setDisplay({ type: "url", url: payload.url });
          }
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

  if (!display) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-gray-500 text-xl">
        Đang chờ nhạc công chọn bài...
      </div>
    );
  }

  if (display.type === "html") {
    return (
      <iframe
        srcDoc={display.html}
        className="w-screen h-screen border-0"
        allowFullScreen
        sandbox="allow-scripts"
      />
    );
  }

  return (
    <iframe
      src={display.url}
      className="w-screen h-screen border-0"
      allowFullScreen
    />
  );
}