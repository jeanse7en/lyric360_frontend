"use client";

import { useRef, useEffect, useState } from "react";
import QRCode from "qrcode";

const REGISTER_URL = "https://lyric360.vn/user/register";

export default function QRSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, REGISTER_URL, {
      width: 300,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    }).then(() => setRendered(true));
  }, []);

  const handleSave = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = "lyric360-register-qr.png";
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

  const handlePrint = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL("image/png");
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - Đăng ký bài hát</title>
          <style>
            body { margin: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; font-family: sans-serif; }
            img { width: 300px; height: 300px; }
            p { margin-top: 16px; font-size: 14px; color: #444; }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" />
          <p>Quét mã để đăng ký bài hát</p>
          <p style="font-size:12px;color:#888;">${REGISTER_URL}</p>
          <script>window.onload = () => { window.print(); window.close(); }<\/script>
        </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="bg-white p-4 rounded-xl shadow-md inline-block">
        <canvas ref={canvasRef} />
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500 break-all text-center">{REGISTER_URL}</p>
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={!rendered}
          className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
        >
          Lưu ảnh
        </button>
        <button
          onClick={handlePrint}
          disabled={!rendered}
          className="px-5 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
        >
          In QR
        </button>
      </div>
    </div>
  );
}