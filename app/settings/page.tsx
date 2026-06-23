"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MobileShell from "@/components/layout/MobileShell";
import AppHeader from "@/components/layout/AppHeader";
import BottomNav from "@/components/layout/BottomNav";
import HealthAvatar from "@/components/common/HealthAvatar";
import { getFromStorage, saveToStorage, removeFromStorage, STORAGE_KEYS } from "@/lib/storage";
import { sampleUser } from "@/lib/sampleData";
import type { UserProfile } from "@/types/user";
import type { AvatarItem } from "@/types/reward";
import { User, RefreshCw, AlertTriangle } from "lucide-react";
import { signOutLocal } from "@/lib/auth";

const avatarStyleLabels = {
  "3d": "밝은 3D 캐릭터형",
  emotional: "감성 애니메이션형",
  webtoon: "웹툰 히어로형",
  senior: "시니어 친화형",
};

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile>(sampleUser);
  const [equippedItems, setEquippedItems] = useState<AvatarItem[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const saved = getFromStorage<UserProfile | null>(STORAGE_KEYS.USER_PROFILE, null);
    if (saved) setUser(saved);
    const items = getFromStorage<AvatarItem[]>(STORAGE_KEYS.AVATAR_ITEMS, []);
    setEquippedItems(items.filter((i) => i.isEquipped));
  }, []);

  const handleReset = () => {
    Object.values(STORAGE_KEYS).forEach((key) => removeFromStorage(key));
    router.push("/");
  };

  return (
    <MobileShell>
      <AppHeader title="설정" />
      <main className="flex-1 overflow-y-auto bg-[#FAFCFA] pb-24 px-4 py-4">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <div className="flex items-center gap-4 mb-4">
            <HealthAvatar style={user.avatarStyle} size="md" imageUrl={user.avatarImage} />
            <div>
              <h2 className="text-xl font-extrabold text-[#1F2937]">{user.name}</h2>
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
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
