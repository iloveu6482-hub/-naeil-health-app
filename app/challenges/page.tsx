"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import MobileShell from "@/components/layout/MobileShell";
import AppHeader from "@/components/layout/AppHeader";
import BottomNav from "@/components/layout/BottomNav";
import RewardToast from "@/components/common/RewardToast";
import AvatarViewer from "@/components/avatar/AvatarViewer";
import AvatarRewardEffect from "@/components/avatar/AvatarRewardEffect";
import { getFromStorage, saveToStorage, STORAGE_KEYS } from "@/lib/storage";
import { createEarnTransaction, addPointTransaction } from "@/lib/rewards";
import { sampleChallenges, sampleUser } from "@/lib/sampleData";
import type { Challenge } from "@/types/challenge";
import type { UserProfile } from "@/types/user";
import { Sprout, Trophy, Droplets, Footprints, Moon, UtensilsCrossed, Dumbbell } from "lucide-react";

const typeIcons: Record<Challenge["targetType"], React.ReactNode> = {
  water: <Droplets size={18} className="text-cyan-500" />,
  steps: <Footprints size={18} className="text-green-500" />,
  sleep: <Moon size={18} className="text-blue-500" />,
  meal: <UtensilsCrossed size={18} className="text-orange-400" />,
  exercise: <Dumbbell size={18} className="text-purple-500" />,
};

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [toastPoints, setToastPoints] = useState(0);
  const [user, setUser] = useState<UserProfile>(sampleUser);

  useEffect(() => {
    const saved = getFromStorage<Challenge[]>(STORAGE_KEYS.CHALLENGES, sampleChallenges);
    setChallenges(saved);
    setUser(getFromStorage<UserProfile>(STORAGE_KEYS.USER_PROFILE, sampleUser));
  }, []);

  const handleCheck = (id: string) => {
    const updated = challenges.map((c) => {
      if (c.id !== id) return c;
      const newValue = Math.min(c.currentValue + 1, c.targetValue);
      const completed = newValue >= c.targetValue;
      return {
        ...c,
        currentValue: newValue,
        status: completed ? ("completed" as const) : c.status,
      };
    });
    setChallenges(updated);
    saveToStorage(STORAGE_KEYS.CHALLENGES, updated);
  };

  const handleClaim = (id: string) => {
    const challenge = challenges.find((c) => c.id === id);
    if (!challenge) return;

    const tx = createEarnTransaction(user.id, challenge.rewardPoints, `챌린지 완료: ${challenge.title}`);
    addPointTransaction(tx);
    window.dispatchEvent(new Event("pointsUpdated"));

    const updated = challenges.map((c) =>
      c.id === id ? { ...c, isRewardClaimed: true } : c
    );
    setChallenges(updated);
    saveToStorage(STORAGE_KEYS.CHALLENGES, updated);
    setToastPoints(challenge.rewardPoints);
    setShowToast(true);
  };

  const getProgress = (c: Challenge) =>
    Math.min((c.currentValue / c.targetValue) * 100, 100);

  const getDaysLeft = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };
  const avatarGender = user.defaultAvatarGender || (user.gender === "male" ? "male" : "female");
  const customImage = user.avatarEffect === "illustrated" && user.avatarImage?.startsWith("data:") ? user.avatarImage : undefined;

  return (
    <MobileShell>
      <AppHeader title="건강 챌린지" />
      <RewardToast
        message="챌린지 보상 획득!"
        points={toastPoints}
        visible={showToast}
        onHide={() => setShowToast(false)}
      />
      {showToast && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0B3A24]/55 p-5 backdrop-blur-sm"><div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white text-center shadow-2xl"><div className="relative h-72 bg-gradient-to-b from-[#EAF7EF] to-white"><AvatarViewer style={user.avatarStyle} gender={avatarGender} viewMode="fullbody" mood="reward" customImageUrl={customImage} size="lg" showWindEffect showLeaves showLightTrails /><AvatarRewardEffect points={toastPoints} visible /></div><div className="p-5"><h2 className="text-2xl font-black text-[#1F2937]">챌린지 완료!</h2><p className="mt-2 text-sm text-gray-600">헬스포인트 {toastPoints}P를 획득했어요.<br />마이 아바타가 새로운 보상을 받을 수 있어요.</p><Link href="/avatar-shop" className="mt-4 flex min-h-12 items-center justify-center rounded-2xl bg-[#4CAF6A] font-extrabold text-white">아바타 꾸미러 가기</Link><button onClick={() => setShowToast(false)} className="mt-2 min-h-10 w-full text-sm font-bold text-gray-400">계속 챌린지 보기</button></div></div></div>}
      <main className="flex-1 overflow-y-auto bg-[#FAFCFA] pb-24">
        <div className="bg-gradient-to-br from-[#EAF7EF] to-white px-4 py-4 border-b border-gray-100">
          <h2 className="text-xl font-extrabold text-[#1F2937]">나의 챌린지</h2>
          <p className="text-sm text-gray-500 mt-1">
            건강 행동을 달성할수록 헬스포인트가 쌓여요 🌱
          </p>
        </div>

        <div className="px-3 py-3 flex flex-col gap-3">
          {challenges.map((c) => {
            const progress = getProgress(c);
            const daysLeft = getDaysLeft(c.endDate);
            const isComplete = progress >= 100;

            return (
              <div
                key={c.id}
                className={`bg-white rounded-2xl p-3 shadow-sm border ${
                  isComplete ? "border-[#4CAF6A]" : "border-gray-100"
                }`}
              >
                <div className="flex items-start justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    {typeIcons[c.targetType]}
                    <h3 className="font-bold text-[#1F2937] text-sm leading-snug">{c.title}</h3>
                  </div>
                  <div className="flex items-center gap-1 bg-[#EAF7EF] px-2 py-0.5 rounded-full">
                    <Sprout size={12} className="text-[#4CAF6A]" />
                    <span className="text-xs font-bold text-[#1F5A3A]">{c.rewardPoints}P</span>
                  </div>
                </div>

                <p className="text-xs leading-snug text-gray-500 mb-2">{c.description}</p>

                {/* Progress */}
                <div className="mb-1.5">
                  <div className="flex justify-between text-[11px] text-gray-500 mb-1">
                    <span>진행률</span>
                    <span className="font-semibold text-[#1F2937]">
                      {c.currentValue} / {c.targetValue}
                      {c.targetType === "water" ? "잔" : c.targetType === "steps" ? "보" : c.targetType === "sleep" ? "시간" : "회"}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isComplete ? "bg-[#4CAF6A]" : "bg-[#F7C948]"
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] mt-1">
                    <span className="text-gray-400">남은 기간: {daysLeft}일</span>
                    <span className={isComplete ? "text-[#4CAF6A] font-bold" : "text-gray-400"}>
                      {Math.round(progress)}%
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-2">
                  {!isComplete && (
                    <button
                      onClick={() => handleCheck(c.id)}
                      className="flex-1 py-2 border-2 border-[#4CAF6A] text-[#4CAF6A] font-semibold rounded-xl text-sm hover:bg-[#EAF7EF] active:scale-95 transition-all"
                    >
                      오늘 체크
                    </button>
                  )}
                  {isComplete && !c.isRewardClaimed && (
                    <button
                      onClick={() => handleClaim(c.id)}
                      className="flex-1 py-2 bg-[#F7C948] text-[#1F5A3A] font-bold rounded-xl text-sm active:scale-95 transition-all flex items-center justify-center gap-1 shadow"
                    >
                      <Trophy size={16} />
                      보상 받기! +{c.rewardPoints}P
                    </button>
                  )}
                  {isComplete && c.isRewardClaimed && (
                    <div className="flex-1 py-2 bg-gray-100 text-gray-400 font-semibold rounded-xl text-sm text-center">
                      ✓ 보상 수령 완료
                    </div>
                  )}
                </div>

                {/* Coach */}
                <div className="mt-2 bg-[#EAF7EF] rounded-xl px-3 py-1.5 text-xs text-[#1F5A3A]">
                  🌱 {isComplete
                    ? "훌륭해요! 챌린지를 완료했습니다."
                    : `목표까지 ${c.targetValue - c.currentValue}${c.targetType === "water" ? "잔" : c.targetType === "sleep" ? "시간" : c.targetType === "steps" ? "보" : "회"} 더 남았어요. 함께 실천해봐요!`}
                </div>
              </div>
            );
          })}
        </div>
      </main>
      <BottomNav />
    </MobileShell>
  );
}
