"use client";

import { useState, useRef, useEffect, useCallback } from "react";

type Props = {
  songTitle?: string;
  onPresent: (url: string) => void;
  /** Override the action button label. Defaults to "📺 Chiếu" */
  presentLabel?: string;
};

const HAV_SEARCH = "https://hopamviet.vn/chord/search?song=";

function toProxyUrl(url: string) {
  return `/api/hopamviet?url=${encodeURIComponent(url)}`;
}

function extractOriginalUrl(proxyHref: string): string | null {
  try {
    const u = new URL(proxyHref, window.location.origin);
    const raw = u.searchParams.get("url");
    return raw ? decodeURIComponent(raw) : null;
  } catch {
    return null;
  }
}

export default function HopAmVietPanel({ songTitle = "", onPresent, presentLabel = "📺 Chiếu" }: Props) {
  const [query, setQuery] = useState(songTitle);
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);
  const [currentOriginalUrl, setCurrentOriginalUrl] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Update search input when the playing song changes, but don't auto-search
  useEffect(() => {
    setQuery(songTitle);
  }, [songTitle]);

  const handleSearch = useCallback(() => {
    const q = query.trim();
    if (!q) return;
    const originalUrl = `${HAV_SEARCH}${encodeURIComponent(q)}`;
    const proxied = toProxyUrl(originalUrl);
    setIframeSrc(proxied);
    setCurrentOriginalUrl(originalUrl);
  }, [query]);

  const handleIframeLoad = useCallback(() => {
    try {
      const iframe = iframeRef.current;
      if (!iframe?.contentWindow) return;
      // Because our proxy serves HTML from our origin, we can read the iframe's location
      const href = iframe.contentWindow.location.href;
      const original = extractOriginalUrl(href);
      if (original) {
        setCurrentOriginalUrl(original);
        setIframeSrc(href);
      }
    } catch {
      // cross-origin guard — shouldn't happen with our proxy, but be safe
    }
  }, []);

  const handlePresent = useCallback(() => {
    if (!iframeSrc) return;
    // We present the proxy URL so the TV iframe also avoids X-Frame-Options
    onPresent(iframeSrc);
  }, [iframeSrc, onPresent]);

  return (
    <div className="bg-gray-800 rounded-xl p-4 shadow-2xl flex flex-col h-[50vh]">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-orange-400">HopAmViet</h3>
        <div className="flex gap-2">
          {currentOriginalUrl && (
            <a
              href={currentOriginalUrl}
              target="_blank"
              rel="noreferrer"
              className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-xs text-gray-300 transition-colors"
              title="Mở tab mới"
            >
              ↗ Tab mới
            </a>
          )}
          {iframeSrc && (
            <button
              onClick={handlePresent}
              className="bg-green-700 hover:bg-green-600 px-3 py-1 rounded text-sm text-white transition-colors"
            >
              {presentLabel}
            </button>
          )}
        </div>
      </div>

      {/* Search bar */}
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Tên bài hát..."
          className="flex-1 bg-gray-700 text-white px-3 py-1.5 rounded text-sm border border-gray-600 focus:outline-none focus:border-orange-400"
        />
        <button
          onClick={handleSearch}
          className="bg-orange-600 hover:bg-orange-500 px-3 py-1.5 rounded text-sm text-white font-medium transition-colors"
        >
          Tìm
        </button>
      </div>

      {/* Iframe preview */}
      <div className="flex-grow bg-gray-900 rounded border border-gray-700 overflow-hidden">
        {iframeSrc ? (
          <iframe
            ref={iframeRef}
            src={iframeSrc}
            onLoad={handleIframeLoad}
            className="w-full h-full rounded"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm gap-2">
            <span>Tìm lời bài hát trên HopAmViet</span>
            {songTitle && (
              <button
                onClick={handleSearch}
                className="text-orange-400 hover:text-orange-300 underline text-xs"
              >
                Tìm &quot;{songTitle}&quot;
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
