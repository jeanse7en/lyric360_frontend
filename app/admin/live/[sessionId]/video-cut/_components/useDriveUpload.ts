"use client";

import { useCallback, useRef, useState } from "react";

const SCOPE = "https://www.googleapis.com/auth/drive.file";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GisWindow = Window & { google?: any };

function loadGis(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as GisWindow).google?.accounts?.oauth2) { resolve(); return; }
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Google Identity Services"));
    document.head.appendChild(s);
  });
}

export function useDriveUpload() {
  const [authorized, setAuthorized] = useState(false);
  const tokenRef = useRef<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clientRef = useRef<any>(null);
  const pendingRef = useRef<{ resolve: (t: string) => void; reject: (e: Error) => void } | null>(null);

  const getToken = useCallback((): Promise<string> => {
    if (tokenRef.current) return Promise.resolve(tokenRef.current);

    return new Promise(async (resolve, reject) => {
      pendingRef.current = { resolve, reject };
      await loadGis();
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (!clientId) { reject(new Error("NEXT_PUBLIC_GOOGLE_CLIENT_ID not configured")); return; }

      if (!clientRef.current) {
        clientRef.current = (window as GisWindow).google!.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: SCOPE,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          callback: (r: any) => {
            if (!pendingRef.current) return;
            if (r.error || !r.access_token) {
              pendingRef.current.reject(new Error(r.error ?? "OAuth failed"));
            } else {
              tokenRef.current = r.access_token;
              setAuthorized(true);
              pendingRef.current.resolve(r.access_token);
            }
            pendingRef.current = null;
          },
        });
      }
      // prompt="" = silent if previously granted, shows consent otherwise
      clientRef.current.requestAccessToken({ prompt: "" });
    });
  }, []);

  const createFolder = useCallback(async (name: string, parentId: string): Promise<string> => {
    const token = await getToken();
    const res = await fetch(
      "https://www.googleapis.com/drive/v3/files?supportsAllDrives=true",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          mimeType: "application/vnd.google-apps.folder",
          parents: [parentId],
        }),
      }
    );
    if (!res.ok) throw new Error(`Create folder failed: ${res.status}`);
    const data = await res.json();
    return data.id as string;
  }, [getToken]);

  const uploadFile = useCallback(async (
    blob: Blob,
    filename: string,
    folderId: string,
  ): Promise<{ id: string; webViewLink: string }> => {
    const token = await getToken();
    const metadata = { name: filename, parents: [folderId] };
    const form = new FormData();
    form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
    form.append("file", blob, filename);

    const res = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink&supportsAllDrives=true",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      }
    );
    if (!res.ok) {
      // Token may have expired — clear it so next call re-auths
      if (res.status === 401) tokenRef.current = null;
      throw new Error(`Drive upload failed: ${res.status}`);
    }
    const data = await res.json();
    return {
      id: data.id as string,
      webViewLink: (data.webViewLink as string) ?? `https://drive.google.com/file/d/${data.id}/view`,
    };
  }, [getToken]);

  const deleteFile = useCallback(async (fileId: string): Promise<void> => {
    try {
      const token = await getToken();
      await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?supportsAllDrives=true`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      );
    } catch {
      // Deletion failure is non-fatal
    }
  }, [getToken]);

  return { authorized, getToken, createFolder, uploadFile, deleteFile };
}