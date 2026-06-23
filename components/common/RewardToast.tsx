"use client";

import { useEffect, useState } from "react";
import { Sprout } from "lucide-react";

interface RewardToastProps {
  message: string;
  points: number;
  visible: boolean;
  onHide: () => void;
}

export default function RewardToast({ message, points, visible, onHide }: RewardToastProps) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onHide, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible, onHide]);

  if (!visible) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-white border border-[#4CAF6A] rounded-2xl shadow-xl px-5 py-3 flex items-center gap-3 animate-bounce">
      <div className="w-10 h-10 bg-[#EAF7EF] rounded-full flex items-center justify-center">
        <Sprout size={20} className="text-[#4CAF6A]" />
      </div>
      <div>
        <p className="text-sm font-bold text-[#1F2937]">{message}</p>
        <p className="text-base font-extrabold text-[#4CAF6A]">+{points} 건강씨앗 획득!</p>
      </div>
    </div>
  );
}
