"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MobileShell from "@/components/layout/MobileShell";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { saveToStorage, STORAGE_KEYS } from "@/lib/storage";
import type { AuthSession, UserProfile } from "@/types/user";

function pickString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

function KakaoAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("카카오 로그인을 확인하고 있어요.");

  useEffect(() => {
    const completeLogin = async () => {
      const supabase = getSupabaseBrowserClient();

      if (!supabase) {
        setMessage("Supabase 환경변수가 아직 설정되지 않았어요.");
        return;
      }

      try {
        const code = searchParams.get("code");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }

        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (!data.user) throw new Error("카카오 사용자 정보를 찾을 수 없습니다.");

        const user = data.user;
        const kakaoIdentity = user.identities?.find((identity) => identity.provider === "kakao");
        const identityData = (kakaoIdentity?.identity_data ?? {}) as Record<string, unknown>;
        const metadata = user.user_metadata as Record<string, unknown>;
        const nickname = pickString(
          identityData.name,
          identityData.full_name,
          identityData.nickname,
          metadata.name,
          metadata.full_name,
          metadata.nickname,
          user.email,
          "카카오 사용자"
        );
        const profileImageUrl = pickString(
          identityData.avatar_url,
          identityData.picture,
          metadata.avatar_url,
          metadata.picture
        );
        const providerUserId = pickString(kakaoIdentity?.id, metadata.provider_id, user.id);
        const email = user.email ?? pickString(identityData.email, metadata.email);

        const { error: profileError } = await supabase.from("profiles").upsert(
          {
            user_id: user.id,
            provider: "kakao",
            provider_user_id: providerUserId,
            email,
            nickname,
            profile_image_url: profileImageUrl || null,
            created_at: user.created_at ?? new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

        if (profileError) {
          console.error("Kakao profile upsert failed:", profileError.message);
        }

        const session: AuthSession = { userId: user.id, email };
        const profile: UserProfile = {
          id: user.id,
          name: nickname,
          birthYear: new Date().getFullYear() - 46,
          gender: "other",
          avatarStyle: "emotional",
          avatarImage: profileImageUrl || undefined,
        };

        saveToStorage(STORAGE_KEYS.AUTH_SESSION, session);
        saveToStorage(STORAGE_KEYS.USER_PROFILE, profile);
        router.replace("/dashboard");
      } catch (caught) {
        console.error(caught);
        setMessage(caught instanceof Error ? caught.message : "카카오 로그인 처리 중 오류가 발생했어요.");
      }
    };

    completeLogin();
  }, [router, searchParams]);

  return (
    <MobileShell>
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#FAFCFA] px-6 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#DDF3E5] border-t-[#4CAF6A]" />
        <p className="mt-5 text-sm font-bold text-[#1F5A3A]">{message}</p>
      </main>
    </MobileShell>
  );
}

export default function KakaoAuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <KakaoAuthCallbackContent />
    </Suspense>
  );
}

