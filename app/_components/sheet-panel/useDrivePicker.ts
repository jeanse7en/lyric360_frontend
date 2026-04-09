"use client";

import { useState, useCallback } from "react";
import vi from "../../../lib/vi";

declare global {
  interface Window { gapi: any; google: any; }
}

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY ?? "";
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    s.onerror = reject;
    document.body.appendChild(s);
  });
}

export function useDrivePicker(onPick: (url: string) => void) {
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState("");

  const open = useCallback(async () => {
    if (!GOOGLE_API_KEY || !GOOGLE_CLIENT_ID) {
      setError(vi.sheetPanel.errPickerNotConfigured);
      return;
    }
    setPicking(true);
    setError("");
    try {
      await loadScript("https://apis.google.com/js/api.js");
      await loadScript("https://accounts.google.com/gsi/client");
      await new Promise<void>(resolve => window.gapi.load("picker", resolve));

      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: "https://www.googleapis.com/auth/drive.readonly",
        callback: (tokenResponse: any) => {
          if (tokenResponse.error) {
            setError(vi.sheetPanel.errPickerAuth);
            setPicking(false);
            return;
          }
          const picker = new window.google.picker.PickerBuilder()
            .addView(window.google.picker.ViewId.DOCS)
            .setOAuthToken(tokenResponse.access_token)
            .setDeveloperKey(GOOGLE_API_KEY)
            .setOrigin(window.location.origin)
            .setCallback((data: any) => {
              if (data.action === window.google.picker.Action.PICKED) {
                onPick(`https://drive.google.com/file/d/${data.docs[0].id}/view`);
              }
              setPicking(false);
            })
            .build();
          picker.setVisible(true);
        },
      });
      tokenClient.requestAccessToken({ prompt: "" });
    } catch {
      setError(vi.sheetPanel.errPickerFailed);
      setPicking(false);
    }
  }, [onPick]);

  return {
    open,
    picking,
    error,
    canUsePicker: !!GOOGLE_API_KEY && !!GOOGLE_CLIENT_ID,
  };
}
