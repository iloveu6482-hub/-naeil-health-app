interface EmptyStateProps {
  emoji?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ emoji = "🌱", title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
      <span className="text-5xl">{emoji}</span>
      <h3 className="text-lg font-bold text-[#1F2937]">{title}</h3>
      {description && <p className="text-sm text-gray-500 max-w-[240px]">{description}</p>}
      {action}
    </div>
  );
}
