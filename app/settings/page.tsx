"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import MobileShell from "@/components/layout/MobileShell";
import AppHeader from "@/components/layout/AppHeader";
import BottomNav from "@/components/layout/BottomNav";
import AvatarViewer from "@/components/avatar/AvatarViewer";
import { getCustomAvatarSource, getHeaderAvatarSource } from "@/lib/avatarProfile";
import { resetDemoData } from "@/lib/demoData";
import { getFromStorage, saveToStorage, removeFromStorage, STORAGE_KEYS } from "@/lib/storage";
import { sampleUser } from "@/lib/sampleData";
import type { UserProfile } from "@/types/user";
import type { AvatarItem } from "@/types/reward";
import type { PointTransaction } from "@/types/reward";
import type { Challenge } from "@/types/challenge";
import { calculatePointBalance } from "@/lib/rewards";
import { User, RefreshCw, AlertTriangle, Bell, FileText, Shirt, Ruler, Scale, TrendingUp } from "lucide-react";
import { signOutLocal } from "@/lib/auth";
import type { AvatarGrowthMode, HealthChangeSnapshot } from "@/types/v3";

const avatarStyleLabels = {
  "3d": "나만의 AI 건강이",
  emotional: "감성 애니메이션형",
  webtoon: "웹툰 히어로형",
  senior: "시니어 친화형",
};

function calculateBmi(height?: number, weight?: number) {
  if (!height || !weight || height <= 0 || weight <= 0) return undefined;
  return Number((weight / (height / 100) ** 2).toFixed(1));
}

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile>(sampleUser);
  const [equippedItems, setEquippedItems] = useState<AvatarItem[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [balance, setBalance] = useState(0);
  const [completedChallenges, setCompletedChallenges] = useState(0);
  const [growthMode, setGrowthMode] = useState<AvatarGrowthMode>("routineGrowth");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [bodyMessage, setBodyMessage] = useState("");

  useEffect(() => {
    const saved = getFromStorage<UserProfile | null>(STORAGE_KEYS.USER_PROFILE, null);
    if (saved) {
      setUser(saved);
      if (saved.height) setHeight(String(saved.height));
      if (saved.weight) setWeight(String(saved.weight));
    }
    const items = getFromStorage<AvatarItem[]>(STORAGE_KEYS.AVATAR_ITEMS, []);
    setEquippedItems(items.filter((i) => i.isEquipped));
    setBalance(calculatePointBalance(getFromStorage<PointTransaction[]>(STORAGE_KEYS.POINT_TRANSACTIONS, [])));
    setCompletedChallenges(getFromStorage<Challenge[]>(STORAGE_KEYS.CHALLENGES, []).filter((challenge) => challenge.status === "completed").length);
    setGrowthMode(getFromStorage<AvatarGrowthMode>(STORAGE_KEYS.AVATAR_GROWTH_MODE, "routineGrowth"));
  }, []);

  const handleReset = () => {
    Object.values(STORAGE_KEYS).forEach((key) => removeFromStorage(key));
    router.push("/");
  };
  const handleDemoReset = () => {
    if (!window.confirm("데모 데이터를 포함한 모든 로컬 데이터를 초기화할까요?")) return;
    resetDemoData();
    router.push("/login");
  };
  const displayName = user.name?.trim() || "사용자";
  const avatarGender = user.defaultAvatarGender || (user.gender === "male" ? "male" : "female");
  const customImage = getCustomAvatarSource(user, "fullbody");
  const profileAvatar = getHeaderAvatarSource(user, avatarGender);
  const heightValue = Number(height);
  const weightValue = Number(weight);
  const calculatedBmi = calculateBmi(heightValue, weightValue);

  const handleSaveBodyMetrics = () => {
    if (!calculatedBmi) {
      setBodyMessage("키와 몸무게를 올바르게 입력해주세요.");
      return;
    }

    const nextUser = {
      ...user,
      height: Number(heightValue.toFixed(1)),
      weight: Number(weightValue.toFixed(1)),
      bmi: calculatedBmi,
    };
    const today = new Date().toISOString().slice(0, 10);
    const snapshots = getFromStorage<HealthChangeSnapshot[]>(STORAGE_KEYS.HEALTH_CHANGE_SNAPSHOTS, []);
    const baseSnapshot: HealthChangeSnapshot = {
      id: "profile-current",
      label: "current",
      date: today,
      averageSteps: 0,
      averageSleepHours: 0,
      waterDays: 0,
      mealRecordCount: 0,
      exerciseDays: 0,
      healthScore: 0,
    };
    const previousCurrent = snapshots.find((snapshot) => snapshot.label === "current");
    const nextCurrent: HealthChangeSnapshot = {
      ...(previousCurrent || baseSnapshot),
      id: previousCurrent?.id || baseSnapshot.id,
      label: "current",
      date: today,
      weight: nextUser.weight,
      bmi: calculatedBmi,
    };
    const nextSnapshots = snapshots.length
      ? snapshots.some((snapshot) => snapshot.label === "current")
        ? snapshots.map((snapshot) => (snapshot.label === "current" ? nextCurrent : snapshot))
        : [...snapshots, nextCurrent]
      : [
          { ...nextCurrent, id: "profile-start", label: "start" as const },
          nextCurrent,
        ];

    setUser(nextUser);
    saveToStorage(STORAGE_KEYS.USER_PROFILE, nextUser);
    saveToStorage(STORAGE_KEYS.HEALTH_CHANGE_SNAPSHOTS, nextSnapshots);
    setBodyMessage("키, 몸무게, BMI를 저장했어요. 나의 건강 변화에도 반영됩니다.");
  };

  return (
    <MobileShell>
      <AppHeader title="나의 페이지" />
      <main className="flex-1 overflow-y-auto bg-[#FAFCFA] pb-24 px-4 py-4">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-2 border-white bg-[#EAF7EF] shadow-md ring-2 ring-[#BDE8CA]">
              <Image src={profileAvatar} alt={`${displayName}님의 프로필 아바타`} fill unoptimized={profileAvatar.startsWith("data:")} className="scale-[1.16] rounded-full object-cover object-[center_18%]" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[#1F2937]">{displayName}</h2>
              <p className="text-sm text-gray-500">{user.birthYear}년생</p>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 flex flex-col gap-2">
            {[
              { label: "성별", value: user.gender === "female" ? "여성" : user.gender === "male" ? "남성" : "기타" },
              { label: "아바타 스타일", value: avatarStyleLabels[user.avatarStyle] },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center">
                <span className="text-sm text-gray-500">{label}</span>
                <span className="text-sm font-semibold text-[#1F2937]">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-4 rounded-2xl border border-green-100 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="flex items-center gap-2 font-black text-[#1F2937]">
                <Scale size={18} className="text-[#4CAF6A]" />
                몸 변화 관리
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-gray-500">키와 몸무게를 저장하면 BMI가 자동 계산되고 변화도에 기록돼요.</p>
            </div>
            <button onClick={() => router.push("/health-change")} className="shrink-0 rounded-full bg-[#EAF7EF] px-3 py-2 text-xs font-black text-[#1F5A3A]">
              변화도 보기
            </button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="rounded-2xl bg-[#F7FBF8] p-3">
              <span className="flex items-center gap-1 text-xs font-bold text-gray-500"><Ruler size={14} />키</span>
              <div className="mt-2 flex items-end gap-1">
                <input value={height} onChange={(event) => setHeight(event.target.value)} inputMode="decimal" type="number" step="0.1" min="80" max="230" placeholder="168.1" className="w-full bg-transparent text-xl font-black text-[#1F2937] outline-none" />
                <span className="pb-1 text-xs font-bold text-gray-400">cm</span>
              </div>
            </label>
            <label className="rounded-2xl bg-[#F7FBF8] p-3">
              <span className="flex items-center gap-1 text-xs font-bold text-gray-500"><Scale size={14} />몸무게</span>
              <div className="mt-2 flex items-end gap-1">
                <input value={weight} onChange={(event) => setWeight(event.target.value)} inputMode="decimal" type="number" step="0.1" min="20" max="250" placeholder="72.8" className="w-full bg-transparent text-xl font-black text-[#1F2937] outline-none" />
                <span className="pb-1 text-xs font-bold text-gray-400">kg</span>
              </div>
            </label>
          </div>
          <div className="mt-3 flex items-center justify-between rounded-2xl bg-[#EAF7EF] p-4">
            <div>
              <p className="text-xs font-bold text-[#4CAF6A]">자동 계산 BMI</p>
              <p className="mt-1 text-2xl font-black text-[#1F5A3A]">{calculatedBmi ?? user.bmi ?? "-"}</p>
            </div>
            <button onClick={handleSaveBodyMetrics} className="rounded-2xl bg-[#4CAF6A] px-4 py-3 text-sm font-black text-white transition active:scale-95">
              저장
            </button>
          </div>
          {bodyMessage && <p className="mt-3 rounded-xl bg-green-50 p-3 text-sm font-bold text-[#1F5A3A]">{bodyMessage}</p>}
        </div>

        <div className="mb-4 overflow-hidden rounded-3xl border border-green-100 bg-gradient-to-b from-[#EAF7EF] to-white shadow-sm">
          <div className="px-4 pt-4"><p className="text-lg font-black text-[#1F2937]">{displayName}님의 마이 아바타</p><div className="mt-2 flex gap-2 text-xs font-bold text-[#1F5A3A]"><span className="rounded-full bg-white px-3 py-1">Lv. 3 건강 루틴러</span><span className="rounded-full bg-white px-3 py-1">{balance.toLocaleString()}P</span><span className="rounded-full bg-white px-3 py-1">완료 {completedChallenges}개</span></div></div>
          <div className="relative h-80"><AvatarViewer style={user.avatarStyle} gender={avatarGender} viewMode="fullbody" mood="happy" customImageUrl={customImage} size="lg" showWindEffect showLeaves showLightTrails alt={`${displayName}님의 마이 아바타`} /></div>
          <button onClick={() => router.push("/avatar-shop")} className="mx-4 mb-4 flex min-h-12 w-[calc(100%_-_2rem)] items-center justify-center gap-2 rounded-2xl bg-[#4CAF6A] font-extrabold text-white"><Shirt size={19} />아바타 꾸미기</button>
        </div>

        {/* Equipped Items */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
          <h3 className="font-bold text-[#1F2937] mb-2 flex items-center gap-2">
            <User size={16} className="text-[#4CAF6A]" />
            현재 장착 아이템
          </h3>
          {equippedItems.length === 0 ? (
            <p className="text-sm text-gray-400">장착한 아이템이 없습니다</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {equippedItems.map((item) => (
                <span key={item.id} className="text-sm bg-[#EAF7EF] text-[#1F5A3A] rounded-full px-3 py-1 font-medium">
                  {item.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mb-4 rounded-2xl border border-green-100 bg-white p-4 shadow-sm">
          <h3 className="font-bold text-[#1F2937]">아바타 성장 방식</h3><p className="mt-1 text-xs leading-relaxed text-gray-500">체형을 바꾸지 않고 배경·표정·배지·건강 효과로 성장을 표현해요.</p>
          <div className="mt-3 space-y-2">{[
            { value: "basic", label: "기본형", desc: "아바타 스타일만 유지해요." },
            { value: "routineGrowth", label: "건강 루틴 성장형", desc: "기록과 챌린지에 따라 효과가 성장해요." },
            { value: "goalVisualization", label: "목표 시각화형", desc: "목표를 향한 변화를 강조해요." },
          ].map((option) => <button key={option.value} onClick={() => { const value = option.value as AvatarGrowthMode; setGrowthMode(value); saveToStorage(STORAGE_KEYS.AVATAR_GROWTH_MODE, value); }} className={`w-full rounded-xl border p-3 text-left ${growthMode === option.value ? "border-[#4CAF6A] bg-[#EAF7EF]" : "border-gray-100"}`}><p className="text-sm font-extrabold text-[#1F2937]">{option.label}</p><p className="mt-0.5 text-xs text-gray-500">{option.desc}</p></button>)}</div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
          <button
            onClick={() => router.push("/health-change")}
            className="w-full flex items-center justify-between px-4 py-4 border-b border-gray-50 hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <span className="flex items-center gap-2 font-medium text-[#1F2937]"><TrendingUp size={18} className="text-[#4CAF6A]" />나의 변화도</span>
            <span className="text-gray-400">→</span>
          </button>
          <button
            onClick={() => router.push("/avatar")}
            className="w-full flex items-center justify-between px-4 py-4 border-b border-gray-50 hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <span className="font-medium text-[#1F2937]">아바타 변경하기</span>
            <span className="text-gray-400">→</span>
          </button>
          <button
            onClick={() => router.push("/avatar-shop")}
            className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <span className="font-medium text-[#1F2937]">아바타 상점</span>
            <span className="text-gray-400">→</span>
          </button>
          <button
            onClick={() => router.push("/notifications")}
            className="w-full flex items-center justify-between px-4 py-4 border-t border-gray-50 hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <span className="flex items-center gap-2 font-medium text-[#1F2937]"><Bell size={18} className="text-[#4CAF6A]" />알림 설정</span>
            <span className="text-gray-400">→</span>
          </button>
          <button
            onClick={() => router.push("/privacy")}
            className="w-full flex items-center justify-between px-4 py-4 border-t border-gray-50 hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <span className="flex items-center gap-2 font-medium text-[#1F2937]"><FileText size={18} className="text-[#4CAF6A]" />개인정보처리방침</span>
            <span className="text-gray-400">→</span>
          </button>
          <button
            onClick={() => {
              signOutLocal();
              router.push("/login");
            }}
            className="w-full flex items-center justify-between px-4 py-4 border-t border-gray-50 hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <span className="font-medium text-[#1F2937]">로그아웃</span>
            <span className="text-gray-400">→</span>
          </button>
        </div>

        {/* Disclaimer */}
        <div className="bg-gray-50 rounded-2xl p-4 mb-4 border border-gray-200">
          <p className="text-xs font-semibold text-gray-500 mb-1">서비스 안내</p>
          <p className="text-xs text-gray-500 leading-relaxed">
            본 서비스는 의료 진단이나 치료 목적이 아닌 건강검진 결과 이해 보조 및 생활습관 개선 정보 제공을 위한 서비스입니다.
            정확한 진단과 치료는 의료기관 및 전문의 상담을 권장합니다.
          </p>
        </div>

        {/* App Info */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">앱 버전</span>
            <span className="text-sm font-semibold text-gray-600">v1.0.0 MVP</span>
          </div>
        </div>

        <button
          onClick={handleDemoReset}
          className="mb-4 w-full rounded-2xl border-2 border-[#4CAF6A] bg-white py-3 text-sm font-black text-[#1F5A3A] transition active:scale-95"
        >
          데모 데이터 초기화
        </button>

        {/* Reset */}
        {!showConfirm ? (
          <button
            onClick={() => setShowConfirm(true)}
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-red-200 text-red-400 rounded-2xl font-medium hover:bg-red-50 transition-colors"
          >
            <RefreshCw size={16} />
            데이터 초기화
          </button>
        ) : (
          <div className="bg-red-50 rounded-2xl p-4 border border-red-200">
            <div className="flex items-center gap-2 mb-2 text-red-600">
              <AlertTriangle size={18} />
              <p className="font-bold">정말 초기화하시겠습니까?</p>
            </div>
            <p className="text-sm text-red-500 mb-3">모든 건강 데이터와 포인트가 삭제됩니다.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2 border border-gray-300 text-gray-600 rounded-xl font-medium"
              >
                취소
              </button>
              <button
                onClick={handleReset}
                className="flex-1 py-2 bg-red-500 text-white rounded-xl font-bold"
              >
                초기화
              </button>
            </div>
          </div>
        )}
      </main>
      <BottomNav />
    </MobileShell>
  );
}
