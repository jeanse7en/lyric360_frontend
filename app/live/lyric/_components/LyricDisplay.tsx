"use client";

import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import LyricHtmlStyleBar, { type LyricHtmlStyle } from "../../../_components/LyricHtmlStyleBar";

type Props = {
  text: string;
  title: string;
  author?: string | null;
  style: LyricHtmlStyle;
};

export default function LyricDisplay({ text, title, author, style: initialStyle }: Props) {
  const [style, setStyle] = useState(initialStyle);
  const [pages, setPages] = useState<string[][]>([]);
  const [cur, setCur] = useState(0);
  const [bannerVisible, setBannerVisible] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const preFitFontSizeRef = useRef(initialStyle.fontSize);

  const stanzas = text.split(/\n\n+/).map(p => p.trim()).filter(Boolean);

  // ── Repagination ─────────────────────────────────────────────────────────
  const repaginate = useCallback(() => {
    const measure = measureRef.current;
    const container = containerRef.current;
    if (!measure || !container) return;

    if (style.singlePage) {
      setPages([stanzas]);
      return;
    }

    const maxH = container.clientHeight * 0.86;
    measure.style.fontSize = `${style.fontSize}px`;
    measure.style.fontFamily = `${style.fontFamily}, Arial, sans-serif`;
    measure.style.width = `${container.clientWidth - 48}px`;

    const result: string[][] = [[]];
    let pi = 0;

    stanzas.forEach(stanza => {
      result[pi].push(stanza);
      measure.innerHTML = result[pi]
        .map(s => `<p style="break-inside:avoid;white-space:pre-wrap;line-height:1.5;margin-bottom:.4em">${s}</p>`)
        .join("");
      if (measure.scrollHeight > maxH && result[pi].length > 1) {
        const moved = result[pi].pop()!;
        pi++;
        result[pi] = [moved];
      }
    });

    setPages(result);
    setCur(0);
  }, [stanzas.join("\n\n"), style.fontSize, style.fontFamily, style.singlePage]);

  useLayoutEffect(() => { repaginate(); }, [repaginate]);

  // Re-run on resize
  useEffect(() => {
    const obs = new ResizeObserver(repaginate);
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [repaginate]);

  // ── Single-page fit: shrink font until all stanzas fit, update StyleBar ────
  useLayoutEffect(() => {
    if (!style.singlePage) {
      // Restore the font size that was active before entering single-page mode
      setStyle(s => ({ ...s, fontSize: preFitFontSizeRef.current }));
      return;
    }
    // Save current size so we can restore it when single-page is turned off
    preFitFontSizeRef.current = style.fontSize;

    const container = containerRef.current;
    const measure = measureRef.current;
    if (!container || !measure) return;

    // Use the off-screen measuring div (columns:2) — same technique as repaginate.
    // Read actual padding from the content div so we don't hardcode magic numbers.
    const content = container.querySelector<HTMLDivElement>(".lyric-content");
    if (!content) return;
    const cs = getComputedStyle(content);
    const availW = content.clientWidth
      - parseFloat(cs.paddingLeft)
      - parseFloat(cs.paddingRight);
    const availH = content.clientHeight
      - parseFloat(cs.paddingTop)
      - parseFloat(cs.paddingBottom);

    measure.style.width = `${availW}px`;
    measure.style.fontFamily = `${style.fontFamily}, Arial, sans-serif`;
    const html = stanzas
      .map(s => `<p style="break-inside:avoid;white-space:pre-wrap;line-height:1.5;margin-bottom:.4em">${s}</p>`)
      .join("");

    let lo = 10, hi = style.fontSize, best = lo;
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      measure.style.fontSize = `${mid}px`;
      measure.innerHTML = html;
      if (measure.scrollHeight <= availH) { best = mid; lo = mid + 1; }
      else hi = mid - 1;
    }
    measure.innerHTML = "";

    if (best !== style.fontSize) {
      setStyle(s => ({ ...s, fontSize: best }));
    }
  }, [style.singlePage]); // run once when singlePage toggles on

  // ── Keyboard / click navigation ───────────────────────────────────────────
  const navigate = useCallback((delta: number) => {
    setCur(c => (c + delta + pages.length) % pages.length);
  }, [pages.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") navigate(1);
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") navigate(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  // ── Banner auto-hide ──────────────────────────────────────────────────────
  const showBanner = useCallback(() => {
    setBannerVisible(true);
    clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setBannerVisible(false), 3000);
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", showBanner);
    showBanner();
    return () => window.removeEventListener("mousemove", showBanner);
  }, [showBanner]);

  const page = pages[cur] ?? [];
  const total = pages.length;

  return (
    <div
      ref={containerRef}
      className={`w-screen h-screen overflow-hidden relative select-none ${bannerVisible ? "cursor-default" : "cursor-none"}`}
      style={{ background: style.bgColor, fontFamily: `${style.fontFamily}, Arial, sans-serif` }}
      onClick={() => navigate(1)}
    >
      {/* Hidden measuring box for repagination */}
      <div
        ref={measureRef}
        style={{
          position: "fixed", top: -9999, left: 0,
          columns: 2, columnGap: "3em",
          visibility: "hidden", pointerEvents: "none",
        }}
        aria-hidden
      />

      {/* Auto-hide banner */}
      <div
        className="absolute top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{ opacity: bannerVisible ? 1 : 0, transform: bannerVisible ? "translateY(0)" : "translateY(-100%)", cursor: "default" }}
        onClick={e => e.stopPropagation()}
      >
        <LyricHtmlStyleBar style={style} onChange={setStyle} />
      </div>

      {/* Lyric content */}
      <div
        className="lyric-content w-full h-full flex flex-col items-center justify-center px-12 pt-14 pb-4 gap-2 text-center overflow-hidden"
        style={{ fontSize: style.fontSize }}
      >
        {total > 1 && (
          <div className="absolute top-12 right-4 text-xs text-gray-600">{cur + 1}/{total}</div>
        )}
        <div style={{ columns: 2, columnGap: "3em", width: "100%" }}>
          {page.map((stanza, i) => {
            // globalIdx = position in original stanzas array
            const globalIdx = stanzas.indexOf(stanza);
            return (
              <p
                key={i}
                style={{
                  color: globalIdx % 2 === 0 ? style.color1 : style.color2,
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.5,
                  fontWeight: 500,
                  marginBottom: "0.4em",
                  breakInside: "avoid",
                }}
              >
                {stanza}
              </p>
            );
          })}
        </div>
      </div>

      {/* Swipe hint (fades out) */}
      {total > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-gray-700 text-xs pointer-events-none">
          ← → · click
        </div>
      )}
    </div>
  );
}
