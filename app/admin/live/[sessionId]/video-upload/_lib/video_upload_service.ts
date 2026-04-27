const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type UploadStatus = "idle" | "uploading" | "done" | "error";

export type SegmentUpload = {
  file: File | null;
  objectUrl: string | null;
  status: UploadStatus;
  progress: number;
  videoUrl: string | null;
  error: string | null;
};

export const STATUS_BADGE: Record<UploadStatus, string> = {
  idle:      "bg-gray-700 text-gray-300",
  uploading: "bg-blue-700 text-white",
  done:      "bg-green-700 text-white",
  error:     "bg-red-700 text-white",
};

export const STATUS_LABEL: Record<UploadStatus, string> = {
  idle:      "Chờ",
  uploading: "Đang upload",
  done:      "Xong",
  error:     "Lỗi",
};

export type Segment = {
  registration_id: string;
  song_title: string;
  singer_name: string;
  booker_phone?: string | null;
  actual_start_iso: string;
  actual_end_iso: string;
  video_url?: string | null;
};

export type VideoSegmentsResponse = {
  video_folder_id?: string | null;
  video_folder_name?: string;
  parent_folder_id?: string;
  segments: Segment[];
};

export async function fetchVideoSegments(sessionId: string): Promise<VideoSegmentsResponse | null> {
  const res = await fetch(`${API}/api/sessions/${sessionId}/video-segments`);
  if (!res.ok) return null;
  return res.json();
}

export async function patchVideoFolder(sessionId: string, folderId: string): Promise<void> {
  await fetch(`${API}/api/sessions/${sessionId}/video-folder`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder_id: folderId }),
  });
}

export async function patchRegistrationVideoUrl(registrationId: string, videoUrl: string): Promise<void> {
  await fetch(`${API}/api/queue/registrations/${registrationId}/video-url`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ video_url: videoUrl }),
  });
}