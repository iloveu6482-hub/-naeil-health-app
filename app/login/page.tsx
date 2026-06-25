"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, Mail, Sprout } from "lucide-react";
import MobileShell from "@/components/layout/MobileShell";
import { getSession, signInLocal } from "@/lib/auth";
import { getFromStorage, removeFromStorage, saveToStorage, STORAGE_KEYS } from "@/lib/storage";
import type { UserProfile } from "@/types/user";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saveEmail, setSaveEmail] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedEmail = getFromStorage<string>(STORAGE_KEYS.SAVED_LOGIN_EMAIL, "");
    if (savedEmail) {
      setEmail(savedEmail);
      setSaveEmail(true);
    }

    if (getSession()) {
      const profile = getFromStorage<UserProfile | null>(STORAGE_KEYS.USER_PROFILE, null);
      router.replace(profile ? "/dashboard" : "/avatar");
    }
  }, [router]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signInLocal(email, password, keepSignedIn);
      if (saveEmail) {
        saveToStorage(STORAGE_KEYS.SAVED_LOGIN_EMAIL, email.trim().toLowerCase());
      } else {
        removeFromStorage(STORAGE_KEYS.SAVED_LOGIN_EMAIL);
      }
      const profile = getFromStorage<UserProfile | null>(STORAGE_KEYS.USER_PROFILE, null);
      router.push(profile ? "/dashboard" : "/avatar");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "로그인하지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileShell>
      <main className="flex min-h-screen flex-col bg-gradient-to-b from-[#EAF7EF] to-[#FAFCFA] px-6 py-12">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#4CAF6A] text-white shadow-lg"><Sprout size={32} /></div>
          <h1 className="text-2xl font-extrabold text-[#1F5A3A]">내일의건강 로그인</h1>
          <p className="mt-2 text-sm text-gray-600">나만의 건강이와 건강 기록을 이어서 관리하세요.</p>
        </div>
        <form onSubmit={handleSubmit} className="rounded-3xl border border-green-100 bg-white p-5 shadow-sm">
          <label className="mb-4 block">
            <span className="mb-2 block text-sm font-bold text-gray-700">이메일</span>
            <span className="flex items-center gap-2 rounded-xl border border-gray-200 px-3"><Mail size={18} className="text-gray-400" /><input className="min-h-12 w-full outline-none" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" required /></span>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-gray-700">비밀번호</span>
            <span className="flex items-center gap-2 rounded-xl border border-gray-200 px-3"><LockKeyhole size={18} className="text-gray-400" /><input className="min-h-12 w-full outline-none" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="6자 이상 입력" minLength={6} required /></span>
          </label>
          <div className="mt-4 grid gap-2 rounded-2xl bg-[#F7FBF8] p-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-600">
              <input type="checkbox" checked={saveEmail} onChange={(event) => setSaveEmail(event.target.checked)} className="h-4 w-4 accent-[#4CAF6A]" />
              아이디 저장
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-600">
              <input type="checkbox" checked={keepSignedIn} onChange={(event) => setKeepSignedIn(event.target.checked)} className="h-4 w-4 accent-[#4CAF6A]" />
              로그인 상태 유지
            </label>
          </div>
          {error && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}
          <button disabled={loading} className="mt-5 w-full rounded-2xl bg-[#4CAF6A] py-4 text-lg font-bold text-white shadow-lg disabled:opacity-60">{loading ? "로그인 중..." : "로그인"}</button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600">처음 오셨나요? <Link href="/signup" className="font-bold text-[#1F5A3A]">회원가입</Link></p>
        <p className="mt-auto pt-8 text-center text-xs leading-relaxed text-gray-400">MVP 버전에서는 계정과 사진이 현재 브라우저에 저장됩니다.</p>
      </main>
    </MobileShell>
  );
}
