"use client";

import { useEffect, useState } from "react";
import { fetchSetting, saveSetting } from "../../../_lib/settings_service";
import InlineEditRow from "../../../_components/InlineEditRow";

type Drink = { id: string; label: string };

export default function DrinksSection() {
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [newLabel, setNewLabel] = useState("");
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchSetting("drinks").then((val) => {
      if (val) {
        try { setDrinks(JSON.parse(val)); } catch {}
      }
      setLoaded(true);
    });
  }, []);

  const persist = async (updated: Drink[]) => {
    setSaving(true);
    await saveSetting("drinks", JSON.stringify(updated));
    setSaving(false);
  };

  const addDrink = async () => {
    const label = newLabel.trim();
    if (!label) return;
    const id = label
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");
    const updated = [...drinks, { id, label }];
    setDrinks(updated);
    setNewLabel("");
    setAdding(false);
    await persist(updated);
  };

  const removeDrink = async (id: string) => {
    const updated = drinks.filter((d) => d.id !== id);
    setDrinks(updated);
    await persist(updated);
  };

  if (!loaded) return <p className="text-sm text-gray-400">Đang tải…</p>;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {drinks.map((d) => (
          <span
            key={d.id}
            className="flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm"
          >
            {d.label}
            <button
              onClick={() => removeDrink(d.id)}
              className="ml-1 text-blue-400 hover:text-red-500 transition-colors font-bold leading-none"
              title="Xóa"
            >
              ×
            </button>
          </span>
        ))}
        {drinks.length === 0 && <p className="text-sm text-gray-400">Chưa có đồ uống nào.</p>}
      </div>

      <InlineEditRow
        label="Thêm đồ uống"
        displayValue={<span className="text-gray-400 italic">Nhấn để thêm mới…</span>}
        editing={adding}
        onStartEdit={() => setAdding(true)}
        onSave={addDrink}
        onCancel={() => { setAdding(false); setNewLabel(""); }}
        saving={saving}
        canSave={!!newLabel.trim()}
      >
        <input
          autoFocus
          type="text"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") addDrink(); if (e.key === "Escape") { setAdding(false); setNewLabel(""); } }}
          placeholder="Tên đồ uống mới…"
          className="flex-1 min-w-0 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-500 rounded px-2 py-0.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-400"
        />
      </InlineEditRow>
    </div>
  );
}