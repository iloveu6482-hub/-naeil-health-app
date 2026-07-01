"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ClipboardList, BookOpen, BarChart2, UsersRound, UserRound } from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: Home, label: "홈" },
  { href: "/checkup", icon: ClipboardList, label: "건강기록" },
  { href: "/habits", icon: BookOpen, label: "습관" },
  { href: "/weekly-report", icon: BarChart2, label: "분석" },
  { href: "/community", icon: UsersRound, label: "커뮤니티", hasNew: true },
  { href: "/my", icon: UserRound, label: "MY" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-40 bg-white border-t border-gray-100 flex">
      {navItems.map(({ href, icon: Icon, label, hasNew }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center py-2 gap-0.5"
          >
            <span className="relative">
              <Icon
                size={22}
                className={active ? "text-[#4CAF6A]" : "text-gray-400"}
              />
              {hasNew ? (
                <span className="absolute -right-3 -top-2 rounded-full bg-red-500 px-1 text-[9px] font-black leading-3 text-white">
                  NEW
                </span>
              ) : null}
            </span>
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
