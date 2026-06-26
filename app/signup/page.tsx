"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, Mail, Sprout, UserRound } from "lucide-react";
import MobileShell from "@/components/layout/MobileShell";
import { signUpLocal } from "@/lib/auth";
import { saveToStorage, STORAGE_KEYS } from "@/lib/storage";
import type { UserProfile } from "@/types/user";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const account = await signUpLocal(name, email, password);
      const profile: UserProfile = { id: account.id, name: account.name, birthYear: 1978, gender: "other", avatarStyle: "emotional" };
      saveToStorage(STORAGE_KEYS.USER_PROFILE, profile);
      router.push("/avatar");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "회원가입하지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { label: "이름", value: name, setter: setName, type: "text", placeholder: "이름을 입력하세요", icon: UserRound },
    { label: "이메일", value: email, setter: setEmail, type: "email", placeholder: "name@example.com", icon: Mail },
    { label: "비밀번호", value: password, setter: setPassword, type: "password", placeholder: "6자 이상 입력", icon: LockKeyhole },
  ];

  return (
    <MobileShell>
      <main className="flex min-h-screen flex-col bg-gradient-to-b from-[#EAF7EF] to-[#FAFCFA] px-6 py-10">
        <div className="mb-7 text-center"><Sprout className="mx-auto mb-3 text-[#4CAF6A]" size={42} /><h1 className="text-2xl font-extrabold text-[#1F5A3A]">건강관리 시작하기</h1><p className="mt-2 text-sm text-gray-600">회원가입 후 나만의 건강이를 만들어보세요.</p></div>
        <form onSubmit={handleSubmit} className="rounded-3xl border border-green-100 bg-white p-5 shadow-sm">
          {fields.map(({ label, value, setter, type, placeholder, icon: Icon }) => (
            <label key={label} className="mb-4 block last:mb-0"><span className="mb-2 block text-sm font-bold text-gray-700">{label}</span><span className="flex items-center gap-2 rounded-xl border border-gray-200 px-3"><Icon size={18} className="text-gray-400" /><input className="min-h-12 w-full outline-none" type={type} value={value} onChange={(e) => setter(e.target.value)} placeholder={placeholder} minLength={type === "password" ? 6 : undefined} required /></span></label>
          ))}
          {error && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}
          <button disabled={loading} className="mt-5 w-full rounded-2xl bg-[#4CAF6A] py-4 text-lg font-bold text-white shadow-lg disabled:opacity-60">{loading ? "계정 만드는 중..." : "회원가입하고 아바타 만들기"}</button>
        </form>
        <p className="mt-5 text-center text-sm text-gray-600">이미 계정이 있나요? <Link href="/login" className="font-bold text-[#1F5A3A]">로그인</Link></p>
      </main>
    </MobileShell>
  );
}
