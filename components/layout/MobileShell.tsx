"use client";

export default function MobileShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#D4EDD9] flex justify-center items-start">
      <div
        className="relative w-full max-w-[430px] min-h-screen bg-[#FAFCFA] shadow-2xl flex flex-col"
        style={{ minHeight: "100dvh" }}
      >
        {children}
      </div>
    </div>
  );
}
