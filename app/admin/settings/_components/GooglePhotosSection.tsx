"use client";

export default function GooglePhotosSection() {
  return (
    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
      <p>
        Hệ thống dùng tài khoản Google đã kết nối (cùng tài khoản với Google Slides).
        Để kích hoạt, xoá file <code className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-xs font-mono">oauth_token.json</code> và
        chạy lại luồng xác thực tại <code className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-xs font-mono">GET /api/auth/init</code>.
      </p>
      <p>
        Sau khi kết nối, dùng nút <span className="font-medium">📷 Link Photos</span> trong trang buổi diễn để ghép video tự động.
      </p>
    </div>
  );
}
