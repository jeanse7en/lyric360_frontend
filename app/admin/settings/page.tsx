"use client";

import { Suspense } from "react";
import Header from "../../_components/Header";
import Footer from "../../_components/Footer";
import SectionCard from "./_components/SectionCard";
import DrinksSection from "./_components/DrinksSection";
import RegistrationSection from "./_components/RegistrationSection";
import SongDisplaySection from "./_components/SongDisplaySection";
import QRSection from "./_components/QRSection";
import CopyFBSection from "./_components/CopyFBSection";
import GooglePhotosSection from "./_components/GooglePhotosSection";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header />
      <div className="flex-1 max-w-2xl w-full mx-auto py-10 px-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Cài đặt</h1>

        <SectionCard
          title="Đồ uống"
          description="Danh sách đồ uống hiển thị trong form đặt bài."
        >
          <DrinksSection />
        </SectionCard>

        <SectionCard
          title="Đặt bài"
          description="Cấu hình giới hạn số lượng bài trong hàng chờ đăng ký."
        >
          <RegistrationSection />
        </SectionCard>

        <SectionCard
          title="Hiển thị bài hát"
          description="Cài đặt mặc định cho màn hình hiển thị lời bài hát."
        >
          <SongDisplaySection />
        </SectionCard>

        <SectionCard
          title="Nội dung Copy FB"
          description="Mẫu văn bản khi nhấn Copy FB trong hàng đợi. Dùng tag [Bài hát], [Tác giả], [Người hát], [Ngày diễn]."
        >
          <CopyFBSection />
        </SectionCard>

        <SectionCard
          title="Google Photos"
          description="Kết nối tài khoản Google Photos một lần. Sau đó hệ thống tự đọc video để ghép vào bài hát."
        >
          <Suspense fallback={null}>
            <GooglePhotosSection />
          </Suspense>
        </SectionCard>

        <SectionCard
          title="QR đăng ký bài hát"
          description="Khách hàng quét mã này để truy cập trang đăng ký bài hát."
        >
          <QRSection />
        </SectionCard>
      </div>
      <Footer />
    </div>
  );
}