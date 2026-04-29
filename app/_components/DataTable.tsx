import React from "react";

export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T, index: number) => React.ReactNode;
  headerClassName?: string;
  cellClassName?: string;
};

type Props<T> = {
  columns: Column<T>[];
  rows: T[];
  keyFn: (row: T) => string;
  emptyMessage?: string;
  getRowClassName?: (row: T) => string;
};

export default function DataTable<T>({
  columns,
  rows,
  keyFn,
  emptyMessage = "Không có dữ liệu",
  getRowClassName,
}: Props<T>) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-800 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {columns.map(col => (
              <th key={col.key} className={`px-3 py-3 ${col.headerClassName ?? ""}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center text-gray-400 py-10">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={keyFn(row)}
                className={`transition-colors bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/60 ${getRowClassName?.(row) ?? ""}`}
              >
                {columns.map(col => (
                  <td key={col.key} className={`px-3 py-3 ${col.cellClassName ?? ""}`}>
                    {col.cell(row, i)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}