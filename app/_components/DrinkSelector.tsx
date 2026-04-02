const DRINKS = [
  { id: "bia_tiger", label: "Bia Tiger" },
  { id: "bia_heineken", label: "Bia Heineken" },
  { id: "bia_333", label: "Bia 333" },
  { id: "ruou_vang_do", label: "Rượu vang đỏ" },
  { id: "ruou_vang_trang", label: "Rượu vang trắng" },
  { id: "coca_cola", label: "Coca Cola" },
  { id: "pepsi", label: "Pepsi" },
  { id: "nuoc_suoi", label: "Nước suối" },
  { id: "tra_da", label: "Trà đá" },
  { id: "nuoc_cam", label: "Nước cam" },
];

type Props = {
  selected: string[];
  onChange: (selected: string[]) => void;
};

export default function DrinkSelector({ selected, onChange }: Props) {
  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter(d => d !== id) : [...selected, id]);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nước uống (tuỳ chọn)</label>
      <div className="flex flex-wrap gap-2">
        {DRINKS.map(drink => (
          <button
            key={drink.id}
            type="button"
            onClick={() => toggle(drink.id)}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
              selected.includes(drink.id)
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-400'
            }`}
          >
            {drink.label}
          </button>
        ))}
      </div>
    </div>
  );
}
