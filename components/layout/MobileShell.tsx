"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sprout } from "lucide-react";
import { getSession } from "@/lib/auth";

export default function MobileShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const isPublicPage = pathname === "/" || pathname === "/login" || pathname === "/signup";

  useEffect(() => {
    const session = getSession();
    if (!isPublicPage && !session) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    setReady(true);
  }, [isPublicPage, pathname, router]);

  return (
    <div className="min-h-screen bg-[#D4EDD9] flex justify-center items-start">
      <div
        className="relative w-full max-w-[430px] min-h-screen bg-[#FAFCFA] shadow-2xl flex flex-col"
        style={{ minHeight: "100dvh" }}
      >
        {ready || isPublicPage ? (
          children
        ) : (
          <div className="flex min-h-screen items-center justify-center text-[#1F5A3A]">
            <div className="text-center">
              <Sprout className="mx-auto mb-3 animate-pulse" size={36} />
              <p className="font-semibold">내 건강 정보를 불러오는 중이에요</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
