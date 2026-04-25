import Link from "next/link";
import Header from "../../../_components/Header";
import Footer from "../../../_components/Footer";

interface Props {
  orderNumber: number;
  userId: string;
  onRegisterAnother: () => void;
}

export default function SuccessScreen({ orderNumber, userId, onRegisterAnother }: Props) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header hideNav />
      <div className="flex-1 p-4 flex items-center justify-center">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 border border-gray-200 dark:border-gray-700 text-center space-y-5">
          <div className="text-5xl">🎉</div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Đăng ký thành công!</h2>
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Số thứ tự của bạn</p>
            <p className="text-6xl font-black text-blue-600 dark:text-blue-400 mt-1">{orderNumber}</p>
          </div>
          <div className="flex flex-col gap-3">
            <Link
              href={`/user/history?user_id=${userId}`}
              className="w-full py-3 rounded-lg bg-green-600 hover:bg-green-500 text-white font-semibold transition-colors"
            >
              🎵 Xem lời bài hát của tôi
            </Link>
            <button
              onClick={onRegisterAnother}
              className="w-full py-3 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium transition-colors"
            >
              Đăng ký thêm bài
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}