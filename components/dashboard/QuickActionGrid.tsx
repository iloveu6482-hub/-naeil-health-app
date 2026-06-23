import Link from "next/link";
import { ClipboardList, BookOpen, Trophy, BarChart2, Sprout, ShoppingBag, Gift } from "lucide-react";

const actions = [
  { href: "/checkup", icon: ClipboardList, label: "검진결과\n입력", color: "bg-blue-50 text-blue-600" },
  { href: "/habits", icon: BookOpen, label: "생활습관\n기록", color: "bg-green-50 text-green-600" },
  { href: "/challenges", icon: Trophy, label: "챌린지\n보기", color: "bg-yellow-50 text-yellow-600" },
  { href: "/weekly-report", icon: BarChart2, label: "주간\n리포트", color: "bg-purple-50 text-purple-600" },
  { href: "/points", icon: Sprout, label: "건강씨앗\n확인", color: "bg-emerald-50 text-emerald-600" },
  { href: "/avatar-shop", icon: ShoppingBag, label: "아바타\n상점", color: "bg-pink-50 text-pink-600" },
  { href: "/rewards", icon: Gift, label: "보상\n내역", color: "bg-orange-50 text-orange-600" },
];

export default function QuickActionGrid() {
  return (
    <div className="grid grid-cols-4 gap-2">
      {actions.map(({ href, icon: Icon, label, color }) => (
        <Link
          key={href}
          href={href}
          className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-gray-50 active:scale-95 transition-transform"
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
            <Icon size={22} />
          </div>
          <span className="text-xs text-center text-gray-600 font-medium leading-tight whitespace-pre-line">
            {label}
          </span>
        </Link>
      ))}
    </div>
  );
}
