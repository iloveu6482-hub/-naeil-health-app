"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ClipboardList, BookOpen, Trophy, BarChart2 } from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: Home, label: "홈" },
  { href: "/checkup", icon: ClipboardList, label: "검진" },
  { href: "/habits", icon: BookOpen, label: "습관" },
  { href: "/weekly-report", icon: BarChart2, label: "리포트" },
  { href: "/challenges", icon: Trophy, label: "챌린지" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-40 bg-white border-t border-gray-100 flex">
      {navItems.map(({ href, icon: Icon, label }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center py-2 gap-0.5"
          >
            <Icon
              size={22}
              className={active ? "text-[#4CAF6A]" : "text-gray-400"}
            />
            <span
              className={`text-xs font-medium ${
                active ? "text-[#4CAF6A]" : "text-gray-400"
              }`}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
