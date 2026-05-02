import { type ReactNode } from "react";

type Props = {
  isOpen: boolean;
  onToggle: () => void;
  summary: ReactNode;
  children: ReactNode;
  highlight?: "none" | "active" | "dim";
};

export default function AccordionRow({ isOpen, onToggle, summary, children, highlight = "none" }: Props) {
  return (
    <div className={`rounded-lg border overflow-hidden ${
      highlight === "active"
        ? "border-blue-400 dark:border-blue-500"
        : "border-gray-200 dark:border-gray-600"
    }`}>
      <div
        onClick={onToggle}
        className={`p-3 flex items-center gap-2 cursor-pointer select-none transition-colors ${
          highlight === "active"
            ? "bg-blue-50 dark:bg-blue-900"
            : highlight === "dim"
            ? "bg-gray-50 dark:bg-gray-800 opacity-60"
            : isOpen
            ? "bg-gray-100 dark:bg-gray-600"
            : "bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700"
        }`}
      >
        <div className="flex-1 min-w-0">{summary}</div>
        <span className="text-gray-400 dark:text-gray-500 text-xs shrink-0">{isOpen ? "▲" : "▼"}</span>
      </div>

      {isOpen && (
        <div className="flex gap-2 px-2 pt-1 pb-2 flex-wrap border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
          {children}
        </div>
      )}
    </div>
  );
}
