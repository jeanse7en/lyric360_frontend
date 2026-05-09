"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import Button from "../../../_components/Button";

type Props = {
  url: string;
  title: string;
  onClose: () => void;
};

export default function QRModal({ url, title, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, { width: 256, margin: 2, color: { dark: "#111827", light: "#ffffff" } });
    }
  }, [url]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-base font-bold text-gray-900 dark:text-white mb-0.5">{title}</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Quét QR hoặc chia sẻ link để khách đăng ký bài hát
        </p>
        <div className="flex justify-center mb-3 bg-white rounded-lg p-2">
          <canvas ref={canvasRef} className="rounded" />
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 break-all text-center mb-4 font-mono">{url}</p>
        <div className="flex gap-2">
          <Button onClick={handleCopy} className="flex-1">
            {copied ? "✓ Đã copy!" : "Copy link"}
          </Button>
          <Button href={url} target="_blank" rel="noopener noreferrer" variant="secondary">
            Mở tab mới ↗
          </Button>
          <Button onClick={onClose} variant="secondary">
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
}