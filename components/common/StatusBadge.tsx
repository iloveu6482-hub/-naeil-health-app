interface StatusBadgeProps {
  status: "good" | "caution" | "warning" | "normal";
  label: string;
}

const statusStyles = {
  good: "bg-[#EAF7EF] text-[#1F5A3A]",
  normal: "bg-gray-100 text-gray-600",
  caution: "bg-yellow-50 text-yellow-700",
  warning: "bg-red-50 text-red-600",
};

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusStyles[status]}`}>
      {label}
    </span>
  );
}
