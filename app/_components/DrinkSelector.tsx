"use client";

import { useEffect, useState } from "react";
import { fetchSetting } from "../_lib/settings_service";

type Drink = { id: string; label: string };

interface Props {
  selected: string[];
  onChange: (ids: string[]) => void;
}

export default function DrinkSelector({ selected, onChange }: Props) {
  const [drinks, setDrinks] = useState<Drink[]>([]);

  useEffect(() => {
    fetchSetting("drinks").then((val) => {
      if (!val) return;
      try {
        const parsed: Drink[] = JSON.parse(val);
        if (Array.isArray(parsed)) setDrinks(parsed);
      } catch {}
    });
  }, []);

  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((d) => d !== id) : [...selected, id]);
  };

  if (drinks.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Đồ uống (tuỳ chọn)</p>
      <div className="flex flex-wrap gap-2">
      {drinks.map((d) => (
        <button
          key={d.id}
          type="button"
          onClick={() => toggle(d.id)}
          className={`px-3 py-1 rounded-full text-sm border transition-colors ${
            selected.includes(d.id)
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600"
          }`}
        >
          {d.label}
        </button>
      ))}
      </div>
    </div>
  );
}