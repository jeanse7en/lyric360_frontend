export default function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">{title}</h2>
      {description && <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">{description}</p>}
      {children}
    </div>
  );
}
