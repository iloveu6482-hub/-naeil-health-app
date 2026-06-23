"use client";

import Link from "next/link";
import { Sprout, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { getFromStorage, STORAGE_KEYS } from "@/lib/storage";
import { calculatePointBalance } from "@/lib/rewards";
import type { PointTransaction } from "@/types/reward";

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
  backHref?: string;
}

export default function AppHeader({ title, showBack, backHref }: AppHeaderProps) {
  const [points, setPoints] = useState(0);

  useEffect(() => {
    const txs = getFromStorage<PointTransaction[]>(
      STORAGE_KEYS.POINT_TRANSACTIONS,
      []
    );
    setPoints(calculatePointBalance(txs));

    const handler = () => {
      const updated = getFromStorage<PointTransaction[]>(
        STORAGE_KEYS.POINT_TRANSACTIONS,
        []
      );
      setPoints(calculatePointBalance(updated));
    };
    window.addEventListener("storage", handler);
    window.addEventListener("pointsUpdated", handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("pointsUpdated", handler);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {showBack && backHref ? (
          <Link href={backHref} className="mr-1 text-gray-500 hover:text-gray-800">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        ) : null}
        <Link href="/dashboard" className="flex items-center gap-1">
          <div className="w-7 h-7 bg-[#4CAF6A] rounded-full flex items-center justify-center">
            <Sprout size={16} className="text-white" />
          </div>
          <span className="font-bold text-[#1F5A3A] text-base">
            {title || "내일의건강"}
          </span>
        </Link>
      </div>
      <div className="flex items-center gap-3">
        <Link href="/points" className="flex items-center gap-1 bg-[#EAF7EF] px-3 py-1 rounded-full">
          <Sprout size={14} className="text-[#4CAF6A]" />
          <span className="text-sm font-bold text-[#1F5A3A]">{points.toLocaleString()}</span>
          <span className="text-xs text-[#4CAF6A]">씨앗</span>
        </Link>
        <Link href="/settings" className="text-gray-400 hover:text-gray-600">
          <Settings size={20} />
        </Link>
      </div>
    </header>
  );
}
