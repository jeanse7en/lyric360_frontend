"use client";

import { useRef, useState, useCallback } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

export function useFFmpeg() {
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (ffmpegRef.current) return;
    setLoading(true);
    try {
      const ff = new FFmpeg();
      const base = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
      await ff.load({
        coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, "application/wasm"),
      });
      ffmpegRef.current = ff;
      setLoaded(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const cut = useCallback(
    async (
      videoFile: File,
      startSeconds: number,
      durationSeconds: number,
      outputName = "output.mp4"
    ): Promise<Blob> => {
      const ff = ffmpegRef.current;
      if (!ff) throw new Error("FFmpeg not loaded");

      await ff.writeFile("input.mp4", await fetchFile(videoFile));
      await ff.exec([
        "-ss", String(startSeconds),
        "-i", "input.mp4",
        "-t", String(durationSeconds),
        "-c", "copy",
        "-avoid_negative_ts", "make_zero",
        outputName,
      ]);
      const data = await ff.readFile(outputName);
      await ff.deleteFile("input.mp4");
      await ff.deleteFile(outputName);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bytes: BlobPart = typeof data === "string" ? new TextEncoder().encode(data) : (data as any);
      return new Blob([bytes], { type: "video/mp4" });
    },
    []
  );

  return { loaded, loading, load, cut };
}
