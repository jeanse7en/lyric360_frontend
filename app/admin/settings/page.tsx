"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "../../_components/Header";
import Footer from "../../_components/Footer";
import ConfigTab from "./_components/ConfigTab";
import TracesTab from "./_components/TracesTab";

const TABS = [
  { key: "config", label: "Cấu hình" },
  { key: "traces", label: "Nhật ký" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function SettingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = (searchParams.get("tab") ?? "config") as TabKey;

  const setTab = (key: TabKey) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", key);
    router.replace(`?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header />
      <div className={`flex-1 w-full mx-auto py-10 px-4 ${tab === "traces" ? "max-w-7xl" : "max-w-2xl"}`}>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Hệ thống</h1>

        {/* Tab bar */}
        <div className="flex gap-1 mb-8 border-b border-gray-200 dark:border-gray-700">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t.key
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "config" && <ConfigTab />}

        {tab === "traces" && <TracesTab />}
      </div>
      <Footer />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsContent />
    </Suspense>
  );
}
