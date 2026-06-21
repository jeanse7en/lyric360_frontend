"use client";

import { Suspense } from "react";
import SectionCard from "./SectionCard";
import DrinksSection from "./DrinksSection";
import RegistrationSection from "./RegistrationSection";
import SongDisplaySection from "./SongDisplaySection";
import QRSection from "./QRSection";
import CopyFBSection from "./CopyFBSection";
import GooglePhotosSection from "./GooglePhotosSection";
import PreorderListSection from "./PreorderListSection";

export default function ConfigTab() {
  return (
    <>
      <SectionCard title="Đồ uống" description="Danh sách đồ uống hiển thị trong form đặt bài.">
        <DrinksSection />
      </SectionCard>

      <SectionCard title="Đặt bài" description="Cấu hình giới hạn số lượng bài trong hàng chờ đăng ký.">
        <RegistrationSection />
      </SectionCard>

      <SectionCard title="Hiển thị bài hát" description="Cài đặt mặc định cho màn hình hiển thị lời bài hát.">
        <SongDisplaySection />
      </SectionCard>

      <SectionCard title="Nội dung Copy FB" description="Mẫu văn bản khi nhấn Copy FB trong hàng đợi. Dùng tag [Bài hát], [Tác giả], [Người hát], [Ngày diễn].">
        <CopyFBSection />
      </SectionCard>

      <SectionCard title="Google Photos" description="Kết nối tài khoản Google Photos một lần. Sau đó hệ thống tự đọc video để ghép vào bài hát.">
        <Suspense fallback={null}>
          <GooglePhotosSection />
        </Suspense>
      </SectionCard>

      <SectionCard title="Danh sách Pre-order" description="Bài hát được đặt sẵn — tự động thêm vào hàng đợi khi tạo buổi diễn mới.">
        <PreorderListSection />
      </SectionCard>

      <SectionCard title="QR đăng ký bài hát" description="Khách hàng quét mã này để truy cập trang đăng ký bài hát.">
        <QRSection />
      </SectionCard>
    </>
  );
}
