"use client";

import Link from "next/link";

type Props = {
  songTitle: string;
  userId: string | null;
};

export default function ExistingRegWarning({ songTitle, userId }: Props) {
  return (
    <Link
      href={`/user/history?user_id=${userId}`}
      className="flex items-center gap-2 px-4 py-3 rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-300 text-sm hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
    >
      <span className="text-lg">⚠️</span>
      <span>
        Bạn đã đăng ký <strong>{songTitle}</strong> trong đêm diễn này.
        Click để đi đến bài hát đó.
      </span>
    </Link>
  );
}
