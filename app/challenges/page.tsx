"use client";

import { useEffect, useState } from "react";
import MobileShell from "@/components/layout/MobileShell";
import AppHeader from "@/components/layout/AppHeader";
import BottomNav from "@/components/layout/BottomNav";
import RewardToast from "@/components/common/RewardToast";
import { getFromStorage, saveToStorage, STORAGE_KEYS } from "@/lib/storage";
import { createEarnTransaction, addPointTransaction } from "@/lib/rewards";
import { sampleChallenges } from "@/lib/sampleData";
import type { Challenge } from "@/types/challenge";
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

  useEffect(() => {
    const saved = getFromStorage<Challenge[]>(STORAGE_KEYS.CHALLENGES, sampleChallenges);
    setChallenges(saved);
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

    const tx = createEarnTransaction("user-001", challenge.rewardPoints, `챌린지 완료: ${challenge.title}`);
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

  return (
    <MobileShell>
      <AppHeader title="건강 챌린지" />
      <RewardToast
        message="챌린지 보상 획득!"
        points={toastPoints}
        visible={showToast}
        onHide={() => setShowToast(false)}
      />
      <main className="flex-1 overflow-y-auto bg-[#FAFCFA] pb-24">
        <div className="bg-gradient-to-br from-[#EAF7EF] to-white px-4 py-5 border-b border-gray-100">
          <h2 className="text-xl font-extrabold text-[#1F2937]">나의 챌린지</h2>
          <p className="text-sm text-gray-500 mt-1">
            달성할수록 건강씨앗이 쌓여요 🌱
          </p>
        </div>

        <div className="px-4 py-4 flex flex-col gap-4">
          {challenges.map((c) => {
            const progress = getProgress(c);
            const daysLeft = getDaysLeft(c.endDate);
            const isComplete = progress >= 100;

            return (
              <div
                key={c.id}
                className={`bg-white rounded-2xl p-4 shadow-sm border ${
                  isComplete ? "border-[#4CAF6A]" : "border-gray-100"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {typeIcons[c.targetType]}
                    <h3 className="font-bold text-[#1F2937] text-base">{c.title}</h3>
                  </div>
                  <div className="flex items-center gap-1 bg-[#EAF7EF] px-2 py-0.5 rounded-full">
                    <Sprout size={12} className="text-[#4CAF6A]" />
                    <span className="text-xs font-bold text-[#1F5A3A]">{c.rewardPoints}씨앗</span>
                  </div>
                </div>

                <p className="text-sm text-gray-500 mb-3">{c.description}</p>

                {/* Progress */}
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>진행률</span>
                    <span className="font-semibold text-[#1F2937]">
                      {c.currentValue} / {c.targetValue}
                      {c.targetType === "water" ? "잔" : c.targetType === "steps" ? "보" : c.targetType === "sleep" ? "시간" : "회"}
                    </span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isComplete ? "bg-[#4CAF6A]" : "bg-[#F7C948]"
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-gray-400">남은 기간: {daysLeft}일</span>
                    <span className={isComplete ? "text-[#4CAF6A] font-bold" : "text-gray-400"}>
                      {Math.round(progress)}%
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-3">
                  {!isComplete && (
                    <button
                      onClick={() => handleCheck(c.id)}
                      className="flex-1 py-2.5 border-2 border-[#4CAF6A] text-[#4CAF6A] font-semibold rounded-xl text-sm hover:bg-[#EAF7EF] active:scale-95 transition-all"
                    >
                      오늘 체크
                    </button>
                  )}
                  {isComplete && !c.isRewardClaimed && (
                    <button
                      onClick={() => handleClaim(c.id)}
                      className="flex-1 py-2.5 bg-[#F7C948] text-[#1F5A3A] font-bold rounded-xl text-sm active:scale-95 transition-all flex items-center justify-center gap-1 shadow"
                    >
                      <Trophy size={16} />
                      보상 받기! +{c.rewardPoints}씨앗
                    </button>
                  )}
                  {isComplete && c.isRewardClaimed && (
                    <div className="flex-1 py-2.5 bg-gray-100 text-gray-400 font-semibold rounded-xl text-sm text-center">
                      ✓ 보상 수령 완료
                    </div>
                  )}
                </div>

                {/* Coach */}
                <div className="mt-3 bg-[#EAF7EF] rounded-xl px-3 py-2 text-xs text-[#1F5A3A]">
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
