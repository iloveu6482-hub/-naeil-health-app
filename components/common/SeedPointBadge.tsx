import { Sprout } from "lucide-react";

interface SeedPointBadgeProps {
  amount: number;
  size?: "sm" | "md" | "lg";
}

export default function SeedPointBadge({ amount, size = "md" }: SeedPointBadgeProps) {
  const sizes = {
    sm: "text-xs px-2 py-0.5 gap-0.5",
    md: "text-sm px-3 py-1 gap-1",
    lg: "text-base px-4 py-1.5 gap-1.5",
  };

  const iconSizes = { sm: 12, md: 14, lg: 16 };

  return (
    <span
      className={`inline-flex items-center bg-[#EAF7EF] rounded-full font-bold text-[#1F5A3A] ${sizes[size]}`}
    >
      <Sprout size={iconSizes[size]} className="text-[#4CAF6A]" />
      {amount.toLocaleString()}
      <span className="font-normal text-[#4CAF6A]">씨앗</span>
    </span>
  );
}
