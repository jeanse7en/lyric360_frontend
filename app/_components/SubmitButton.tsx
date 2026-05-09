"use client";

type Props = {
  submitting: boolean;
  disabled?: boolean;
  label: string;
  loadingLabel?: string;
  type?: "submit" | "button";
  onClick?: () => void;
  className?: string;
};

export default function SubmitButton({
  submitting,
  disabled,
  label,
  loadingLabel,
  type = "submit",
  onClick,
  className = "w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-60",
}: Props) {
  return (
    <button
      suppressHydrationWarning
      type={type}
      disabled={submitting || disabled}
      onClick={onClick}
      className={className}
    >
      {submitting ? (loadingLabel ?? "Đang gửi...") : label}
    </button>
  );
}
