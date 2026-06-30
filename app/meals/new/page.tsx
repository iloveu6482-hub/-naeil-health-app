"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ChevronRight,
  Leaf,
  PencilLine,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";
import MobileShell from "@/components/layout/MobileShell";
import AppHeader from "@/components/layout/AppHeader";
import { getMealTypeLabel } from "@/lib/mealAnalysis";
import { createEarnTransaction, hasEarnedTodayForReason } from "@/lib/rewards";
import { getFromStorage, saveToStorage, STORAGE_KEYS } from "@/lib/storage";
import { sampleUser } from "@/lib/sampleData";
import type { MealAnalysis, MealCategory, MealType } from "@/types/meal";
import type { PointTransaction } from "@/types/reward";
import type { UserProfile } from "@/types/user";

const mealTypes: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

const categoryMenus: Array<{
  id: MealCategory;
  label: string;
  menus: string[];
}> = [
  {
    id: "korean",
    label: "한식",
    menus: ["백반", "비빔밥", "김치찌개", "된장찌개", "불고기", "제육볶음", "김밥", "국밥"],
  },
  {
    id: "western",
    label: "양식",
    menus: ["샐러드", "파스타", "스테이크", "샌드위치", "햄버거", "피자", "오믈렛"],
  },
  {
    id: "chinese",
    label: "중식",
    menus: ["짜장면", "짬뽕", "볶음밥", "마파두부", "탕수육", "마라탕", "딤섬"],
  },
  {
    id: "japanese",
    label: "일식",
    menus: ["초밥", "돈카츠", "라멘", "우동", "덮밥", "메밀소바", "연어구이"],
  },
  {
    id: "snack",
    label: "간식/음료",
    menus: ["커피", "라떼", "빵", "과자", "과일", "요거트", "단 음료"],
  },
];

const conditionOptions: Array<{
  value: NonNullable<MealAnalysis["mealCondition"]>;
  label: string;
}> = [
  { value: "balanced", label: "균형식" },
  { value: "normal", label: "보통" },
  { value: "heavy", label: "과식" },
  { value: "late", label: "야식" },
  { value: "skipped", label: "결식" },
];

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function buildMealSummary(
  selectedMenus: string[],
  manualMenu: string,
  includesVegetables: boolean,
  condition: NonNullable<MealAnalysis["mealCondition"]>
) {
  const menuText = [...selectedMenus, manualMenu.trim()].filter(Boolean).join(", ");
  const vegetableText = includesVegetables ? "채소 포함" : "채소 부족 가능";
  const conditionText =
    condition === "balanced"
      ? "균형식"
      : condition === "heavy"
        ? "과식"
        : condition === "late"
          ? "야식"
          : condition === "skipped"
            ? "결식"
            : "보통";

  return {
    foodName: menuText || "직접 입력 식사",
    summary: `${conditionText}으로 기록했어요. ${vegetableText} 여부를 함께 저장해 식사 습관 흐름을 볼 수 있어요.`,
    advice: includesVegetables
      ? "좋아요. 다음 리포트에서 식사 시간, 메뉴 구성, 채소 섭취 흐름을 함께 살펴볼게요."
      : "다음 식사에는 나물, 샐러드, 쌈채소처럼 부담 없는 채소를 한 가지 더해보세요.",
  };
}

export default function NewMealPage() {
  const router = useRouter();
  const [mealType, setMealType] = useState<MealType>("lunch");
  const [category, setCategory] = useState<MealCategory>("korean");
  const [selectedMenus, setSelectedMenus] = useState<string[]>([]);
  const [manualMenu, setManualMenu] = useState("");
  const [includesVegetables, setIncludesVegetables] = useState(false);
  const [condition, setCondition] =
    useState<NonNullable<MealAnalysis["mealCondition"]>>("normal");
  const [memo, setMemo] = useState("");
  const [message, setMessage] = useState("");

  const activeCategory = useMemo(
    () => categoryMenus.find((item) => item.id === category) || categoryMenus[0],
    [category]
  );

  const hasMealInput = selectedMenus.length > 0 || manualMenu.trim().length > 0;

  const toggleMenu = (menu: string) => {
    setSelectedMenus((current) =>
      current.includes(menu)
        ? current.filter((item) => item !== menu)
        : [...current, menu]
    );
    setMessage("");
  };

  const saveMeal = () => {
    if (!hasMealInput && condition !== "skipped") {
      setMessage("메뉴를 선택하거나 직접 입력해 주세요.");
      return;
    }

    const today = getTodayKey();
    const records = getFromStorage<MealAnalysis[]>(STORAGE_KEYS.MEAL_RECORDS, []);
    if (
      records.some(
        (record) => record.mealDate === today && record.mealType === mealType
      )
    ) {
      setMessage(`오늘 ${getMealTypeLabel(mealType)} 기록은 이미 저장되어 있어요.`);
      return;
    }

    const mealSummary = buildMealSummary(
      selectedMenus,
      manualMenu,
      includesVegetables,
      condition
    );
    const reward = mealType === "snack" ? 3 : 5;
    const nextMeal: MealAnalysis = {
      id: `meal-${Date.now()}`,
      mealType,
      mealDate: today,
      inputMethod: selectedMenus.length > 0 ? "menu" : "manual",
      category,
      selectedMenus,
      includesVegetables,
      mealCondition: condition,
      memo: memo.trim(),
      foodName: mealSummary.foodName,
      estimatedCalories: 0,
      carbs: 0,
      protein: 0,
      fat: 0,
      summary: mealSummary.summary,
      advice: mealSummary.advice,
      healthPointReward: reward,
      createdAt: new Date().toISOString(),
    };

    const nextRecords = [...records, nextMeal];
    saveToStorage(STORAGE_KEYS.MEAL_RECORDS, nextRecords);

    const profile = getFromStorage<UserProfile>(
      STORAGE_KEYS.USER_PROFILE,
      sampleUser
    );
    const transactions = getFromStorage<PointTransaction[]>(
      STORAGE_KEYS.POINT_TRANSACTIONS,
      []
    );
    const reason = `${getMealTypeLabel(mealType)} 식사 기록`;
    const additions: PointTransaction[] = [];
    if (!hasEarnedTodayForReason(transactions, reason)) {
      additions.push(createEarnTransaction(profile.id, reward, reason));
    }

    const mainTypes = new Set(
      nextRecords
        .filter((record) => record.mealDate === today && record.mealType !== "snack")
        .map((record) => record.mealType)
    );
    if (
      mainTypes.size === 3 &&
      !hasEarnedTodayForReason(transactions, "하루 3끼 식사 기록 완료")
    ) {
      additions.push(
        createEarnTransaction(profile.id, 20, "하루 3끼 식사 기록 완료")
      );
    }

    saveToStorage(STORAGE_KEYS.POINT_TRANSACTIONS, [
      ...transactions,
      ...additions,
    ]);
    window.dispatchEvent(new Event("pointsUpdated"));
    router.push("/meals");
  };

  return (
    <MobileShell>
      <AppHeader title="식사 기록" showBack backHref="/meals" />
      <main className="flex-1 bg-[#F7FBF8] px-4 pb-10 pt-4">
        <section className="rounded-3xl bg-gradient-to-br from-[#176B3A] to-[#4CAF6A] p-5 text-white shadow-lg">
          <div className="flex items-center gap-2 text-green-100">
            <UtensilsCrossed size={20} />
            <span className="text-sm font-bold">사진 분석 없이 가볍게 기록</span>
          </div>
          <h1 className="mt-2 text-2xl font-black">오늘 식사를 선택해 주세요</h1>
          <p className="mt-2 text-sm leading-relaxed text-green-50">
            내 식사 습관의 흐름을 살펴보고, 건강 방향을 잡아주는 리포트를
            작성해드려요.
          </p>
        </section>

        <div className="mt-4 grid grid-cols-4 gap-2">
          {mealTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                setMealType(type);
                setMessage("");
              }}
              className={`min-h-11 rounded-xl text-sm font-bold transition ${
                mealType === type
                  ? "bg-[#4CAF6A] text-white shadow"
                  : "bg-white text-gray-500 ring-1 ring-gray-200"
              }`}
            >
              {getMealTypeLabel(type)}
            </button>
          ))}
        </div>

        <section className="mt-4 rounded-3xl border border-green-100 bg-white p-4 shadow-sm">
          <h2 className="font-black text-[#1F2937]">음식 종류</h2>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {categoryMenus.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setCategory(item.id);
                  setSelectedMenus([]);
                }}
                className={`min-h-10 shrink-0 rounded-full px-4 text-sm font-extrabold transition ${
                  category === item.id
                    ? "bg-[#1F5A3A] text-white"
                    : "bg-[#F1F5F2] text-gray-500"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {activeCategory.menus.map((menu) => {
              const selected = selectedMenus.includes(menu);
              return (
                <button
                  key={menu}
                  type="button"
                  onClick={() => toggleMenu(menu)}
                  className={`min-h-12 rounded-2xl border px-3 text-sm font-bold transition ${
                    selected
                      ? "border-[#4CAF6A] bg-[#EAF7EF] text-[#1F5A3A]"
                      : "border-gray-100 bg-white text-[#1F2937] shadow-sm"
                  }`}
                >
                  {menu}
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-4 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
          <label className="flex items-center gap-2 font-black text-[#1F2937]">
            <PencilLine size={19} className="text-[#4CAF6A]" />
            직접 입력
          </label>
          <input
            value={manualMenu}
            onChange={(event) => setManualMenu(event.target.value)}
            placeholder="예: 현미밥, 계란찜, 라떼"
            className="mt-3 h-12 w-full rounded-2xl border border-gray-100 bg-[#F7FBF8] px-4 text-sm font-bold text-[#1F2937] outline-none focus:border-[#4CAF6A]"
          />
          <textarea
            value={memo}
            onChange={(event) => setMemo(event.target.value)}
            placeholder="남기고 싶은 메모가 있다면 적어주세요."
            className="mt-2 min-h-20 w-full rounded-2xl border border-gray-100 bg-[#F7FBF8] px-4 py-3 text-sm text-[#1F2937] outline-none focus:border-[#4CAF6A]"
          />
        </section>

        <section className="mt-4 rounded-3xl border border-green-100 bg-white p-4 shadow-sm">
          <button
            type="button"
            onClick={() => setIncludesVegetables((value) => !value)}
            className={`flex min-h-14 w-full items-center justify-between rounded-2xl border px-4 transition ${
              includesVegetables
                ? "border-[#4CAF6A] bg-[#EAF7EF]"
                : "border-gray-100 bg-[#F7FBF8]"
            }`}
          >
            <span className="flex items-center gap-2 font-black text-[#1F2937]">
              <Leaf size={20} className="text-[#4CAF6A]" />
              채소가 포함되어 있어요
            </span>
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full ${
                includesVegetables ? "bg-[#4CAF6A] text-white" : "bg-white"
              }`}
            >
              {includesVegetables && <CheckCircle2 size={17} />}
            </span>
          </button>

          <div className="mt-3 grid grid-cols-5 gap-2">
            {conditionOptions.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setCondition(item.value)}
                className={`min-h-10 rounded-xl text-xs font-black transition ${
                  condition === item.value
                    ? "bg-[#4CAF6A] text-white"
                    : "bg-[#F1F5F2] text-gray-500"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        {message && (
          <p className="mt-3 rounded-xl bg-amber-50 p-3 text-center text-sm font-bold text-amber-700">
            {message}
          </p>
        )}

        <section className="mt-4 rounded-2xl bg-[#EAF7EF] p-4">
          <p className="flex items-center gap-2 font-black text-[#1F5A3A]">
            <Sparkles size={19} />
            식단 흐름 리포트 안내
          </p>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            매번 칼로리를 맞히기보다, 아침 결식·야식·채소 포함 여부 같은 식사
            습관의 흐름을 모아 건강 방향을 잡아주는 리포트를 작성해드립니다.
          </p>
        </section>

        <button
          type="button"
          onClick={saveMeal}
          className="mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#4CAF6A] px-3 text-base font-extrabold text-white shadow-lg transition active:scale-[0.98]"
        >
          식사 기록 저장하기
          <ChevronRight size={20} />
        </button>
      </main>
    </MobileShell>
  );
}
