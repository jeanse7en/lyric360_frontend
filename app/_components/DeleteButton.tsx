"use client";

import { useState } from "react";
import InlineConfirm from "./InlineConfirm";

type Props = {
  onDelete: () => void | Promise<void>;
  title?: string;
  className?: string;
};

export default function DeleteButton({ onDelete, title = "Xoá?", className }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onDelete();
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  };

  if (confirming) {
    return (
      <InlineConfirm
        title={title}
        loading={loading}
        onConfirm={() => { void handleConfirm(); }}
        onCancel={() => setConfirming(false)}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className={className ?? "text-gray-400 hover:text-red-500 transition-colors"}
      title="Xoá"
    >
      Xóa
    </button>
  );
}
