export default function QueueFullBanner() {
  return (
    <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-300 text-sm">
      <span className="text-lg">🚫</span>
      <span>Đã đủ số lượng đăng ký.</span>
    </div>
  );
}
