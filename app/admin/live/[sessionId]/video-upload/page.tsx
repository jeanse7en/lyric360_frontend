"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useDriveUpload } from "../video-cut/_components/useDriveUpload";
import {
  type Segment,
  type SegmentUpload,
  fetchVideoSegments,
  patchVideoFolder,
  patchRegistrationVideoUrl,
} from "./_lib/video_upload_service";
import UploadTopBar from "./_components/UploadTopBar";
import SegmentList from "./_components/SegmentList";
import SegmentDetail from "./_components/SegmentDetail";

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseFilenameTimestamp(filename: string): Date | null {
  const m = filename.match(/(\d{8})_(\d{6})/);
  if (!m) return null;
  const [, date, time] = m;
  const iso = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}T${time.slice(0, 2)}:${time.slice(2, 4)}:${time.slice(4, 6)}`;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve(v.duration); };
    v.onerror = () => { URL.revokeObjectURL(url); resolve(0); };
    v.src = url;
  });
}

function bestMatch(videoStart: Date, durationSec: number, segments: Segment[]): number | null {
  const vsMs = videoStart.getTime();
  const veMs = vsMs + durationSec * 1000;
  let bestIdx: number | null = null;
  let bestOverlap = 0;
  segments.forEach((seg, i) => {
    const ssMs = new Date(seg.actual_start_iso).getTime();
    const seMs = new Date(seg.actual_end_iso).getTime();
    if (ssMs < veMs && seMs > vsMs) {
      const overlap = Math.min(seMs, veMs) - Math.max(ssMs, vsMs);
      if (overlap > bestOverlap) { bestOverlap = overlap; bestIdx = i; }
    }
  });
  return bestIdx;
}

function fmtHHmm(iso: string) {
  return new Date(iso).toLocaleTimeString("vi", { hour: "2-digit", minute: "2-digit", hour12: false });
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function VideoUploadPage() {
  const { sessionId } = useParams<{ sessionId: string }>();

  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [uploads, setUploads] = useState<SegmentUpload[]>([]);
  const [processing, setProcessing] = useState(false);

  const [driveFolderName, setDriveFolderName] = useState("");
  const [driveParentId, setDriveParentId] = useState("root");
  const folderIdRef = useRef<string | null>(null);

  const { authorized, getToken, createFolder, uploadFileResumable } = useDriveUpload();

  // ── Load ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchVideoSegments(sessionId)
      .then((data) => {
        if (!data) return;
        folderIdRef.current = data.video_folder_id ?? null;
        setDriveFolderName(data.video_folder_name ?? "");
        setDriveParentId(data.parent_folder_id ?? "root");
        const segs: Segment[] = data.segments ?? [];
        setSegments(segs);
        setUploads(segs.map((s) => ({
          file: null, objectUrl: null,
          status: s.video_url ? "done" : "idle",
          progress: 0,
          videoUrl: s.video_url ?? null,
          error: null,
        })));
      })
      .finally(() => setLoading(false));
  }, [sessionId]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const updateUpload = useCallback((index: number, patch: Partial<SegmentUpload>) => {
    setUploads((prev) => prev.map((u, i) => i === index ? { ...u, ...patch } : u));
  }, []);

  const createNewFolder = useCallback(async (): Promise<string> => {
    const id = await createFolder(driveFolderName, driveParentId);
    folderIdRef.current = id;
    await patchVideoFolder(sessionId, id);
    return id;
  }, [createFolder, driveFolderName, driveParentId, sessionId]);

  const ensureFolder = useCallback(async (): Promise<string> => {
    if (folderIdRef.current) return folderIdRef.current;
    return createNewFolder();
  }, [createNewFolder]);

  const assignFile = useCallback((index: number, file: File) => {
    setUploads((prev) => {
      const prev_url = prev[index]?.objectUrl;
      if (prev_url) URL.revokeObjectURL(prev_url);
      return prev.map((u, i) => i === index
        ? { ...u, file, objectUrl: URL.createObjectURL(file), status: "idle", error: null, progress: 0 }
        : u);
    });
  }, []);

  // ── Auto fill ──────────────────────────────────────────────────────────────

  const handleAutoFill = useCallback(async (files: FileList) => {
    const arr = Array.from(files);
    const parsed = await Promise.all(arr.map(async (file) => ({
      file,
      start: parseFilenameTimestamp(file.name),
      duration: await getVideoDuration(file),
    })));
    setUploads((prev) => {
      const next = [...prev];
      for (const { file, start, duration } of parsed) {
        if (!start) continue;
        const idx = bestMatch(start, duration, segments);
        if (idx !== null && next[idx].status !== "done") {
          const prevUrl = next[idx].objectUrl;
          if (prevUrl) URL.revokeObjectURL(prevUrl);
          next[idx] = { ...next[idx], file, objectUrl: URL.createObjectURL(file), status: "idle", error: null };
        }
      }
      return next;
    });
  }, [segments]);

  // ── Upload ─────────────────────────────────────────────────────────────────

  const uploadOne = useCallback(async (index: number) => {
    const seg = segments[index];
    const up = uploads[index];
    if (!up?.file) return;
    updateUpload(index, { status: "uploading", progress: 0, error: null });
    try {
      let folderId = await ensureFolder();
      const timeTag = fmtHHmm(seg.actual_start_iso).replace(":", "");
      const filename = `${seg.singer_name}_${seg.song_title}_${timeTag}.mp4`;
      let result;
      try {
        result = await uploadFileResumable(up.file, filename, folderId, (pct) => updateUpload(index, { progress: pct }));
      } catch (uploadErr) {
        if (String(uploadErr).includes("404")) {
          folderIdRef.current = null;
          folderId = await createNewFolder();
          result = await uploadFileResumable(up.file, filename, folderId, (pct) => updateUpload(index, { progress: pct }));
        } else {
          throw uploadErr;
        }
      }
      await patchRegistrationVideoUrl(seg.registration_id, result.webViewLink);
      updateUpload(index, { status: "done", videoUrl: result.webViewLink, progress: 100 });
    } catch (err) {
      updateUpload(index, { status: "error", error: String(err) });
    }
  }, [segments, uploads, ensureFolder, createNewFolder, uploadFileResumable, updateUpload]);

  const handleUploadAll = useCallback(async () => {
    setProcessing(true);
    await Promise.all(
      uploads.map((u, i) => (u.file && u.status === "idle" ? uploadOne(i) : Promise.resolve()))
    );
    setProcessing(false);
  }, [uploads, uploadOne]);

  // ── Derived ────────────────────────────────────────────────────────────────

  const selected = selectedIndex !== null ? segments[selectedIndex] : null;
  const selectedUp = selectedIndex !== null ? uploads[selectedIndex] : null;
  const pendingCount = uploads.filter((u) => u.file && u.status === "idle").length;
  const doneCount = uploads.filter((u) => u.status === "done").length;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen md:h-screen bg-gray-900 text-white flex flex-col md:overflow-hidden">

      <UploadTopBar
        sessionId={sessionId}
        segments={segments}
        doneCount={doneCount}
        authorized={authorized}
        getToken={getToken}
        processing={processing}
        pendingCount={pendingCount}
        onUploadAll={handleUploadAll}
        onAutoFill={handleAutoFill}
      />

      <div className="flex flex-col md:flex-row md:flex-1 md:overflow-hidden">

        <SegmentList
          loading={loading}
          segments={segments}
          uploads={uploads}
          selectedIndex={selectedIndex}
          onSelect={setSelectedIndex}
        />

        <div className="flex-1 flex flex-col md:overflow-hidden">
          {!selected || !selectedUp ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-500">
              <div className="text-4xl mb-3">👈</div>
              <p className="text-sm">Chọn một bài để gán video</p>
            </div>
          ) : (
            <SegmentDetail
              selected={selected}
              selectedUp={selectedUp}
              selectedIndex={selectedIndex!}
              authorized={authorized}
              onAssignFile={assignFile}
              onUpload={uploadOne}
            />
          )}
        </div>
      </div>
    </div>
  );
}