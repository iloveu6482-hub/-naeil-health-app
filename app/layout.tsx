import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "내일의건강 - AI 건강관리 파트너",
  description: "오늘의 건강을 이해하고, 더 나은 내일을 준비하는 AI 건강관리 파트너",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className="h-full">
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
