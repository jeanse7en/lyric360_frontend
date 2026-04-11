"use client";

const FONT_OPTIONS = ["Arial", "Georgia", "Times New Roman", "Courier New", "Verdana", "Tahoma"];

type Theme = { label: string; bg: string; c1: string; c2: string };
const THEMES: Theme[] = [
  { label: "Vàng",    bg: "#000000", c1: "#FFD700", c2: "#FFFFFF" },
  { label: "Hồng",   bg: "#0d0010", c1: "#FF69B4", c2: "#FFD6F0" },
  { label: "Xanh",   bg: "#000a1a", c1: "#00BFFF", c2: "#E0F7FF" },
  { label: "Xanh lá",bg: "#001a0a", c1: "#39FF14", c2: "#CCFFCC" },
  { label: "Đỏ",     bg: "#1a0000", c1: "#FF4444", c2: "#FFD0D0" },
  { label: "Trắng",  bg: "#FFFFFF", c1: "#1a1a1a", c2: "#444444" },
];

export type LyricHtmlStyle = {
  bgColor: string;
  color1: string;
  color2: string;
  fontFamily: string;
  fontSize: number; // base font size in px (auto-fit scales from this)
  singlePage: boolean; // all stanzas on one slide, no pagination
  splitColumns: boolean; // split lines evenly into 2 columns
};

export const DEFAULT_STYLE: LyricHtmlStyle = {
  bgColor: "#000000",
  color1: "#FFD700",
  color2: "#FFFFFF",
  fontFamily: "Times New Roman",
  fontSize: 40,
  singlePage: true,
  splitColumns: true,
};

type Props = {
  style: LyricHtmlStyle;
  onChange: (s: LyricHtmlStyle) => void;
  onClose?: () => void;
};

export default function LyricHtmlStyleBar({ style, onChange, onClose }: Props) {
  const set = (patch: Partial<LyricHtmlStyle>) => onChange({ ...style, ...patch });

  const activeTheme = THEMES.findIndex(
    (t) => t.bg === style.bgColor && t.c1 === style.color1 && t.c2 === style.color2
  );

  return (
    <div className="flex flex-wrap items-center gap-3 px-3 py-2 bg-gray-900 rounded-lg text-xs text-gray-400">
      {/* Theme presets */}
      <div className="flex gap-1">
        {THEMES.map((t, i) => (
          <button
            key={t.label}
            title={t.label}
            onClick={() => onChange({ ...style, bgColor: t.bg, color1: t.c1, color2: t.c2 })}
            className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
              activeTheme === i ? "border-white scale-110" : "border-transparent"
            }`}
            style={{ background: `linear-gradient(135deg, ${t.c1} 50%, ${t.c2} 50%)`, outline: `2px solid ${t.bg}` }}
          />
        ))}
      </div>

      <div className="w-px h-4 bg-gray-700" />

      {/* Font family */}
      <select value={style.fontFamily} onChange={(e) => set({ fontFamily: e.target.value })}
        className="bg-gray-700 text-white rounded px-2 py-1 text-xs">
        {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
      </select>

      {/* Font size stepper */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => set({ fontSize: Math.max(16, style.fontSize - 2) })}
          className="w-7 h-7 flex items-center justify-center rounded bg-gray-700 hover:bg-gray-600 text-white text-sm font-bold leading-none transition-colors select-none"
        >−</button>
        <span className="w-9 text-center text-white tabular-nums">{style.fontSize}</span>
        <button
          onClick={() => set({ fontSize: Math.min(120, style.fontSize + 2) })}
          className="w-7 h-7 flex items-center justify-center rounded bg-gray-700 hover:bg-gray-600 text-white text-sm font-bold leading-none transition-colors select-none"
        >+</button>
      </div>

      {/* Single page toggle */}
      <button
        onClick={() => set({ singlePage: !style.singlePage })}
        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
          style.singlePage
            ? "bg-indigo-600 text-white"
            : "bg-gray-700 text-gray-400 hover:bg-gray-600"
        }`}
      >
        1 trang
      </button>

      <button
        onClick={() => set({ splitColumns: !style.splitColumns })}
        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
          style.splitColumns
            ? "bg-indigo-600 text-white"
            : "bg-gray-700 text-gray-400 hover:bg-gray-600"
        }`}
      >
        {style.splitColumns ? "Chia đều" : "Chia khổ"}
      </button>

      {onClose && (
        <>
          <div className="w-px h-4 bg-gray-700" />
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded bg-gray-700 hover:bg-red-700 text-gray-400 hover:text-white text-sm transition-colors"
            title="Ẩn thanh điều chỉnh"
          >
            ✕
          </button>
        </>
      )}
    </div>
  );
}
