"use client";

import { useState, useEffect, useRef } from "react";
import { type LyricHtmlStyle } from "./LyricHtmlStyleBar";

// ── HTML Lyric Presentation Generator ─────────────────────────────────────────

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildLyricHtml(
  title: string,
  author: string | null,
  lyricsText: string,
  style: LyricHtmlStyle,
  layoutW = typeof window !== "undefined" ? window.innerWidth : 1280,
  layoutH = typeof window !== "undefined" ? window.innerHeight : 720,
): string {
  const { bgColor, color1, color2, fontFamily, fontSize, singlePage } = style;
  const paragraphs = lyricsText
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  // Group into pages
  const pages: Array<Array<{ text: string; globalIdx: number }>> = [];
  if (singlePage) {
    pages.push(paragraphs.map((text, i) => ({ text, globalIdx: i })));
  } else {
    const MAX_PER_PAGE = 8;
    for (let i = 0; i < paragraphs.length; i += MAX_PER_PAGE) {
      pages.push(
        paragraphs.slice(i, i + MAX_PER_PAGE).map((text, j) => ({ text, globalIdx: i + j }))
      );
    }
  }

  const total = pages.length;
  const slidesHtml = pages
    .map((items, si) => {
      const stanzas = items
        .map(({ text, globalIdx }) => {
          const col = globalIdx % 2 === 0 ? color1 : color2;
          return `<p class="stanza" data-gi="${globalIdx}" style="color:${col}">${esc(text).replace(/\n/g, "<br>")}</p>`;
        })
        .join("");
      const pgBadge = total > 1 ? `<div class="pg">${si + 1}/${total}</div>` : "";
      return `<div class="slide${si === 0 ? " active" : ""}" data-idx="${si}">
  <div class="content">
    ${pgBadge}
    <div class="stanzas">${stanzas}</div>
  </div>
</div>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<title>${esc(title)}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;background:${bgColor};overflow:hidden}
body{font-family:${fontFamily},Arial,sans-serif;cursor:none;user-select:none}
.slide{display:none;width:100vw;height:100vh;flex-direction:column;align-items:center;justify-content:center;padding:2vh 3vw;padding-top:calc(2vh + 42px)}
.slide.active{display:flex}
.content{width:100%;flex:1;display:flex;flex-direction:column;gap:.4em;text-align:center;font-size:${fontSize}px;overflow:hidden}
.pg{color:#333;font-size:11px;text-align:right;flex-shrink:0;margin-bottom:.2em}
.stanzas{columns:2;column-gap:3em;text-align:center;flex:1}
.stanza{break-inside:avoid;white-space:pre-wrap;line-height:1.5;font-weight:500;margin-bottom:.4em}
/* ── banner ── */
#banner{
  position:fixed;top:0;left:0;right:0;z-index:99;
  display:flex;align-items:center;flex-wrap:wrap;gap:10px;
  padding:8px 16px;
  background:rgba(10,10,10,.85);backdrop-filter:blur(6px);
  font-family:Arial,sans-serif;font-size:12px;color:#aaa;
  transition:opacity .4s,transform .4s;
  cursor:default;
}
#banner.hidden{opacity:0;transform:translateY(-100%);pointer-events:none}
#banner label{display:flex;align-items:center;gap:5px}
#banner select,#banner input[type=number]{background:#222;color:#fff;border:1px solid #444;border-radius:4px;padding:2px 6px;font-size:12px}
#banner input[type=number]{width:54px;text-align:center}
.theme-dot{width:22px;height:22px;border-radius:50%;border:2px solid transparent;outline:2px solid #000;cursor:pointer;transition:transform .15s;flex-shrink:0}
.theme-dot:hover{transform:scale(1.15)}
.theme-dot.active{border-color:#fff;transform:scale(1.15)}
#banner .sep{width:1px;height:20px;background:#333}
#banner .hint-keys{margin-left:auto;color:#444;font-size:11px;white-space:nowrap}
</style></head><body>

<div id="banner">
  <!-- Theme dots -->
  <div id="themes" style="display:flex;gap:5px;align-items:center"></div>
  <div class="sep"></div>
  <!-- Hidden color state inputs (read by notifyParent) -->
  <input type="hidden" id="cBg" value="${bgColor}">
  <input type="hidden" id="c1" value="${color1}">
  <input type="hidden" id="c2" value="${color2}">
  <label>Font
    <select id="sFnt">
      ${["Arial","Georgia","Times New Roman","Courier New","Verdana","Tahoma"].map(f=>`<option value="${f}"${f===fontFamily?" selected":""}>${f}</option>`).join("")}
    </select>
  </label>
  <label>Cỡ<input type="number" id="nSz" min="12" max="120" step="4" value="${fontSize}"></label>
  <div class="sep"></div>
  <button id="bSingle" style="background:${singlePage ? "#4f46e5" : "#333"};color:#fff;border:none;border-radius:4px;padding:3px 10px;font-size:12px;cursor:pointer">1 trang</button>
  <div class="sep"></div>
  <span class="hint-keys">← → · click · Esc</span>
</div>

${slidesHtml}
<script>
var slides=document.querySelectorAll('.slide'),cur=0;
var baseSize=${fontSize};
var isSingle=${singlePage ? "true" : "false"};
// Layout constants baked in at generation time — same values used by the preview iframe
var LAYOUT_W=${layoutW},LAYOUT_H=${layoutH};

// Capture all stanzas once at load time (source of truth for repagination)
var allStanzas=Array.from(document.querySelectorAll('.stanza'));

// ── theme presets ──
var THEMES=[
  {label:'Vàng',   bg:'#000000',c1:'#FFD700',c2:'#FFFFFF'},
  {label:'Hồng',   bg:'#0d0010',c1:'#FF69B4',c2:'#FFD6F0'},
  {label:'Xanh',   bg:'#000a1a',c1:'#00BFFF',c2:'#E0F7FF'},
  {label:'Xanh lá',bg:'#001a0a',c1:'#39FF14',c2:'#CCFFCC'},
  {label:'Đỏ',     bg:'#1a0000',c1:'#FF4444',c2:'#FFD0D0'},
  {label:'Trắng',  bg:'#FFFFFF',c1:'#1a1a1a',c2:'#444444'},
];
var activeThemeIdx=-1;
(function(){
  var container=document.getElementById('themes');
  THEMES.forEach(function(t,i){
    var btn=document.createElement('button');
    btn.className='theme-dot';
    btn.title=t.label;
    btn.style.background='linear-gradient(135deg,'+t.c1+' 50%,'+t.c2+' 50%)';
    btn.style.outlineColor=t.bg==='#FFFFFF'?'#ccc':'#000';
    // mark active if current colors match
    if(t.bg===${JSON.stringify(bgColor)}&&t.c1===${JSON.stringify(color1)}&&t.c2===${JSON.stringify(color2)}){
      btn.classList.add('active');
      activeThemeIdx=i;
    }
    btn.addEventListener('click',function(e){
      e.stopPropagation();
      container.querySelectorAll('.theme-dot').forEach(function(b){b.classList.remove('active');});
      btn.classList.add('active');
      activeThemeIdx=i;
      document.getElementById('cBg').value=t.bg;
      document.getElementById('c1').value=t.c1;
      document.getElementById('c2').value=t.c2;
      applyBg(t.bg);
      applyColors();
      notifyParent();
    });
    container.appendChild(btn);
  });
})();

// ── banner auto-hide ──
var banner=document.getElementById('banner');
var hideTimer;
function showBanner(){
  document.body.style.cursor='default';
  banner.classList.remove('hidden');
  clearTimeout(hideTimer);
  hideTimer=setTimeout(function(){
    banner.classList.add('hidden');
    document.body.style.cursor='none';
  },3000);
}
document.addEventListener('mousemove',showBanner);
showBanner();

// ── live style updates ──
function applyBg(v){document.body.style.background=v;}
function applyColors(){
  var c1=document.getElementById('c1').value;
  var c2=document.getElementById('c2').value;
  document.querySelectorAll('.stanza').forEach(function(el,i){
    var gi=parseInt(el.getAttribute('data-gi')||i);
    el.style.color=gi%2===0?c1:c2;
  });
}
function applyFont(v){document.body.style.fontFamily=v+',Arial,sans-serif';}
function applySize(v){
  var n=parseInt(v);
  if(!n||n<12)return;
  baseSize=n;
  if(!isSingle){repaginate();}else{fit();}
}

// ── notify parent React component of style changes (for live broadcast) ──
function notifyParent(){
  try{
    window.parent.postMessage({
      type:'lyric-style',
      bgColor:document.getElementById('cBg').value,
      color1:document.getElementById('c1').value,
      color2:document.getElementById('c2').value,
      fontFamily:document.getElementById('sFnt').value,
      fontSize:parseInt(document.getElementById('nSz').value)||baseSize,
      singlePage:isSingle
    },'*');
  }catch(e){}
}

document.getElementById('sFnt').addEventListener('change',function(){applyFont(this.value);notifyParent();});
document.getElementById('nSz').addEventListener('change',function(){applySize(this.value);notifyParent();});
document.getElementById('nSz').addEventListener('input',function(){applySize(this.value);notifyParent();});

// ── repaginate: redistribute stanzas so each page fits at baseSize ──
function repaginate(){
  if(isSingle) return;

  // Off-screen measuring box — uses baked-in LAYOUT dimensions, not actual viewport
  var maxH=LAYOUT_H*0.88;
  var measure=document.createElement('div');
  measure.style.cssText=
    'position:fixed;top:-9999px;left:0;overflow:hidden;'+
    'width:'+(LAYOUT_W-48)+'px;'+
    'font-size:'+baseSize+'px;'+
    'font-family:'+getComputedStyle(document.body).fontFamily+';'+
    'line-height:1.5;columns:2;column-gap:3em;padding:4px 0';
  document.body.appendChild(measure);

  // Greedy page-fill: add stanzas one by one; start new page on overflow
  var pages=[[]];
  var pi=0;
  allStanzas.forEach(function(stanza){
    pages[pi].push(stanza);
    // measure current page
    measure.innerHTML='';
    pages[pi].forEach(function(s){measure.appendChild(s.cloneNode(true));});
    if(measure.scrollHeight>maxH && pages[pi].length>1){
      var moved=pages[pi].pop(); // spill last stanza to next page
      pi++;
      pages[pi]=[moved];
    }
  });
  document.body.removeChild(measure);

  // Rebuild slide DOM
  var slideParent=slides[0].parentNode;
  Array.from(document.querySelectorAll('.slide')).forEach(function(s){slideParent.removeChild(s);});

  var total=pages.length;
  pages.forEach(function(stanzaList,idx){
    var slide=document.createElement('div');
    slide.className='slide'+(idx===0?' active':'');
    var content=document.createElement('div');
    content.className='content';
    content.style.fontSize=baseSize+'px';
    if(total>1){
      var pg=document.createElement('div');
      pg.className='pg';
      pg.textContent=(idx+1)+'/'+total;
      content.appendChild(pg);
    }
    var stanzasDiv=document.createElement('div');
    stanzasDiv.className='stanzas';
    stanzaList.forEach(function(s){stanzasDiv.appendChild(s);});
    content.appendChild(stanzasDiv);
    slide.appendChild(content);
    slideParent.appendChild(slide);
  });

  slides=document.querySelectorAll('.slide');
  cur=0;
}

// ── single-page toggle ──
document.getElementById('bSingle').addEventListener('click',function(e){
  e.stopPropagation();
  isSingle=!isSingle;
  this.style.background=isSingle?'#4f46e5':'#333';
  if(isSingle){
    // Collapse: rebuild as one slide with all stanzas
    var slideParent=slides[0].parentNode;
    Array.from(document.querySelectorAll('.slide')).forEach(function(s){slideParent.removeChild(s);});
    var slide=document.createElement('div');
    slide.className='slide active';
    var content=document.createElement('div');
    content.className='content';
    var stanzasDiv=document.createElement('div');
    stanzasDiv.className='stanzas';
    allStanzas.forEach(function(s){stanzasDiv.appendChild(s);});
    content.appendChild(stanzasDiv);
    slide.appendChild(content);
    slideParent.appendChild(slide);
    slides=document.querySelectorAll('.slide');
    cur=0;
    fit();
  } else {
    repaginate();
  }
  notifyParent();
});

banner.addEventListener('click',function(e){e.stopPropagation();});

// ── slides ──
function show(n){
  slides[cur].classList.remove('active');
  cur=(n+slides.length)%slides.length;
  slides[cur].classList.add('active');
}
function fit(){
  // Only used in single-page mode: shrink font until all stanzas fit
  if(!isSingle) return;
  var s=slides[cur],c=s.querySelector('.content');
  var lo=10,hi=baseSize,best=lo;
  while(lo<=hi){
    var mid=Math.floor((lo+hi)/2);
    c.style.fontSize=mid+'px';
    var fits=c.scrollHeight<=s.clientHeight*0.97&&c.scrollWidth<=s.clientWidth*0.98;
    if(fits){best=mid;lo=mid+1;}
    else{hi=mid-1;}
  }
  c.style.fontSize=best+'px';
}

document.addEventListener('click',function(){show(cur+1);});
document.addEventListener('keydown',function(e){
  if(e.key==='ArrowRight'||e.key==='ArrowDown'||e.key===' ')show(cur+1);
  else if(e.key==='ArrowLeft'||e.key==='ArrowUp')show(cur-1);
  else if(e.key==='Escape')window.close();
});

var resizeTimer;
window.addEventListener('resize',function(){
  clearTimeout(resizeTimer);
  resizeTimer=setTimeout(function(){
    if(isSingle){fit();}else{repaginate();}
  },200);
});

// Init
if(isSingle){fit();}else{repaginate();}
</script></body></html>`;
}

export function openHtmlWindow(html: string) {
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

// ── Panel component ────────────────────────────────────────────────────────────

const API = process.env.NEXT_PUBLIC_API_URL;

type Props = {
  song: { id?: string; title?: string; author?: string } | null;
  lyricId?: string;
  lyricsText: string;
  onLyricsTextChange?: (text: string) => void;
  isSelected: boolean;
  onSelect: () => void;
  /** When provided, shows a 📺 button that broadcasts the generated HTML to the TV */
  onPresentHtml?: (html: string) => void;
  style: LyricHtmlStyle;
  onStyleChange: (s: LyricHtmlStyle) => void;
  previewHeight?: string;
};

export default function LyricHtmlPanel({
  song, lyricId, lyricsText, onLyricsTextChange,
  isSelected, onSelect, onPresentHtml,
  style, onStyleChange, previewHeight = "20vh",
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(lyricsText);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!editing) setDraft(lyricsText); }, [lyricsText, editing]);

  const hasLyrics = lyricsText.trim().length > 0 || draft.trim().length > 0;
  const displayText = editing ? draft : lyricsText;

  // Capture viewport once at mount — baked into every buildLyricHtml call so
  // preview iframe and opened fullscreen window use identical layout math.
  const [layoutW] = useState(() => typeof window !== "undefined" ? window.innerWidth : 1280);
  const [layoutH] = useState(() => typeof window !== "undefined" ? window.innerHeight : 720);

  const build = (text: string, s: LyricHtmlStyle) =>
    buildLyricHtml(song?.title ?? "", song?.author ?? null, text, s, layoutW, layoutH);

  // Debounced srcdoc — only rebuilds when lyrics text or external style changes
  const [previewHtml, setPreviewHtml] = useState("");
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!hasLyrics) return;
    if (previewTimer.current) clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(() => {
      setPreviewHtml(build(displayText, style));
    }, 150);
    return () => { if (previewTimer.current) clearTimeout(previewTimer.current); };
  }, [displayText, style, song?.title, song?.author, layoutW, layoutH]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(0.25);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setPreviewScale(el.clientWidth / layoutW);
    update();
    const obs = new ResizeObserver(update);
    obs.observe(el);
    return () => obs.disconnect();
  }, [layoutW]);

  // Listen for style changes from the iframe banner → update state + re-broadcast
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (!e.data || e.data.type !== 'lyric-style') return;
      const { bgColor, color1, color2, fontFamily, fontSize, singlePage } = e.data as LyricHtmlStyle & { type: string };
      const newStyle: LyricHtmlStyle = { bgColor, color1, color2, fontFamily, fontSize, singlePage };
      onStyleChange(newStyle);
      if (onPresentHtml) {
        const text = draft.trim() || lyricsText;
        onPresentHtml(build(text, newStyle));
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onStyleChange, onPresentHtml, draft, lyricsText, song?.title, song?.author]);

  const buildHtml = () => build(draft.trim() || lyricsText, style);

  const handlePreview = () => {
    if (!hasLyrics) return;
    openHtmlWindow(buildHtml());
  };

  const handlePresentToTV = () => {
    if (!hasLyrics || !onPresentHtml) return;
    onSelect();
    onPresentHtml(buildHtml());
  };

  const handleSave = async () => {
    if (!song?.id || !lyricId) return;
    setSaving(true);
    try {
      await fetch(`${API}/api/songs/${song.id}/lyrics/${lyricId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lyrics: draft }),
      });
      onLyricsTextChange?.(draft);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setDraft(lyricsText);
    setEditing(false);
  };

  return (
    <div className={`rounded-xl border-2 mb-3 transition-colors ${isSelected ? "border-green-500" : "border-gray-700"}`}>
      <div className="bg-gray-800 rounded-xl p-3 flex flex-col gap-2">

        {/* Header row */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-200">Lời HTML (Tự tạo)</span>
          <div className="flex items-center gap-2">
            {/* Present to TV button */}
            {onPresentHtml && hasLyrics && (
              <button
                onClick={handlePresentToTV}
                className={`text-xs px-3 py-1 rounded font-medium transition-colors flex items-center gap-1 ${
                  isSelected
                    ? "bg-green-700 hover:bg-green-600 text-white"
                    : "bg-gray-700 hover:bg-gray-600 text-white"
                }`}
                title="Chiếu lên màn hình TV"
              >
                📺{isSelected && <span className="text-green-300">✓</span>}
              </button>
            )}

            {/* Select indicator (without onPresentHtml — drawer context) */}
            {!onPresentHtml && (
              isSelected ? (
                <span className="text-xs font-semibold text-green-400 flex items-center gap-1">
                  <span>✓</span> Đang chọn
                </span>
              ) : (
                hasLyrics && (
                  <button onClick={onSelect}
                    className="text-xs bg-indigo-700 hover:bg-indigo-600 text-white px-3 py-1 rounded font-medium transition-colors">
                    Chọn lời này
                  </button>
                )
              )
            )}

            {!editing ? (
              <button onClick={() => { setDraft(lyricsText); setEditing(true); }}
                className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded transition-colors">
                ✏️ Sửa
              </button>
            ) : (
              <>
                <button onClick={handleSave} disabled={saving || !lyricId}
                  className="text-xs bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white px-2 py-1 rounded transition-colors">
                  {saving ? "Đang lưu…" : "💾 Lưu"}
                </button>
                <button onClick={handleCancel}
                  className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded transition-colors">
                  Huỷ
                </button>
              </>
            )}
          </div>
        </div>

        {!hasLyrics ? (
          <p className="text-xs text-gray-500 italic">Chưa có lời để tạo HTML</p>
        ) : editing ? (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full rounded bg-gray-900 text-white text-xs p-2 font-mono leading-relaxed resize-y"
            style={{ minHeight: previewHeight }}
            placeholder="Nhập lời bài hát, ngăn cách các đoạn bằng dòng trống..."
          />
        ) : (
          <div className="flex gap-2 items-start">
            {/* Iframe rendered at 1280×720 (TV proportions) and scaled to container */}
            <div ref={containerRef} className="flex-1 rounded overflow-hidden border border-gray-700"
              style={{ height: `${Math.round(layoutH * previewScale)}px` }}>
              {previewHtml ? (
                <iframe
                  srcDoc={previewHtml}
                  style={{
                    display: 'block',
                    width: `${layoutW}px`,
                    height: `${layoutH}px`,
                    transform: `scale(${previewScale})`,
                    transformOrigin: 'top left',
                  }}
                  sandbox="allow-scripts"
                />
              ) : (
                <div className="flex items-center justify-center text-gray-500 text-xs"
                  style={{ height: `${Math.round(layoutH * previewScale)}px`, background: style.bgColor }}>
                  …
                </div>
              )}
            </div>
            <button onClick={handlePreview}
              className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded transition-colors shrink-0"
              style={{ writingMode: "vertical-rl" }}>
              ⛶ Toàn màn hình
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
