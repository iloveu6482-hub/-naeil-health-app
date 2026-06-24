"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MobileShell from "@/components/layout/MobileShell";
import AppHeader from "@/components/layout/AppHeader";
import BottomNav from "@/components/layout/BottomNav";
import RewardToast from "@/components/common/RewardToast";
import { saveToStorage, getFromStorage, STORAGE_KEYS } from "@/lib/storage";
import { createEarnTransaction, hasEarnedTodayForReason, addPointTransaction } from "@/lib/rewards";
import { sampleCheckup } from "@/lib/sampleData";
import type { HealthCheckup } from "@/types/health";
import { Camera, Pencil } from "lucide-react";
import { createCheckupInsights } from "@/lib/healthInsights";

type FormData = Omit<HealthCheckup, "id">;

export default function CheckupPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>({ ...sampleCheckup });
  const [showToast, setShowToast] = useState(false);

  const handleChange = (key: keyof FormData, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    const checkup: HealthCheckup = { ...form, id: `checkup-${Date.now()}` };
    saveToStorage(STORAGE_KEYS.HEALTH_CHECKUP, checkup);
    const records = getFromStorage<HealthCheckup[]>(STORAGE_KEYS.HEALTH_CHECKUP_RECORDS, []);
    saveToStorage(STORAGE_KEYS.HEALTH_CHECKUP_RECORDS, [...records.filter((record) => record.id !== checkup.id), checkup]);
    saveToStorage(STORAGE_KEYS.CHECKUP_INSIGHTS, createCheckupInsights(checkup));

    const txs = getFromStorage(STORAGE_KEYS.POINT_TRANSACTIONS, []);
    if (!hasEarnedTodayForReason(txs, "건강검진 결과 입력")) {
      const tx = createEarnTransaction("user-001", 50, "건강검진 결과 입력");
      addPointTransaction(tx);
      window.dispatchEvent(new Event("pointsUpdated"));
      setShowToast(true);
    }

    setTimeout(() => router.push("/report"), 1200);
  };

  const fields: { key: keyof FormData; label: string; unit?: string; type?: string }[] = [
    { key: "checkupDate", label: "검진일", type: "date" },
    { key: "height", label: "키", unit: "cm" },
    { key: "weight", label: "체중", unit: "kg" },
    { key: "bmi", label: "BMI", unit: "kg/m²" },
    { key: "waist", label: "허리둘레", unit: "cm" },
    { key: "systolicBp", label: "수축기 혈압", unit: "mmHg" },
    { key: "diastolicBp", label: "이완기 혈압", unit: "mmHg" },
    { key: "fastingGlucose", label: "공복혈당", unit: "mg/dL" },
    { key: "totalCholesterol", label: "총콜레스테롤", unit: "mg/dL" },
    { key: "hdl", label: "HDL 콜레스테롤", unit: "mg/dL" },
    { key: "ldl", label: "LDL 콜레스테롤", unit: "mg/dL" },
    { key: "triglyceride", label: "중성지방", unit: "mg/dL" },
    { key: "ast", label: "AST", unit: "U/L" },
    { key: "alt", label: "ALT", unit: "U/L" },
    { key: "gammaGtp", label: "감마GTP", unit: "U/L" },
    { key: "creatinine", label: "크레아티닌", unit: "mg/dL" },
    { key: "uricAcid", label: "요산", unit: "mg/dL" },
    { key: "hemoglobin", label: "혈색소", unit: "g/dL" },
  ];

  return (
    <MobileShell>
      <AppHeader title="건강검진 입력" showBack backHref="/dashboard" />
      <RewardToast
        message="건강검진 결과 입력 완료!"
        points={50}
        visible={showToast}
        onHide={() => setShowToast(false)}
      />
      <main className="flex-1 overflow-y-auto bg-[#FAFCFA] pb-24">
        <div className="bg-[#EAF7EF] px-4 py-4 border-b border-gray-100">
          <p className="text-sm text-gray-600 leading-relaxed">
            건강검진 결과를 직접 입력하거나 결과지를 업로드해 AI 리포트를 받아보세요.
          </p>
        </div>

        {/* OCR 버튼 */}
        <div className="px-4 pt-4">
          <button
            onClick={() => router.push("/checkup/ocr")}
            className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-[#4CAF6A] rounded-2xl py-4 text-[#4CAF6A] font-semibold bg-[#EAF7EF] hover:bg-[#d5f0e0] active:scale-95 transition-all"
          >
            <Camera size={20} />
            검진결과 사진으로 입력하기
          </button>
        </div>

        <div className="px-4 py-4">
          <div className="flex items-center gap-2 mb-4">
            <Pencil size={16} className="text-gray-400" />
            <p className="text-sm font-semibold text-gray-600">직접 입력</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {fields.map((f, i) => (
              <div
                key={f.key}
                className={`flex items-center px-4 py-3 ${
                  i < fields.length - 1 ? "border-b border-gray-50" : ""
                }`}
              >
                <label className="text-sm text-gray-700 w-36 flex-shrink-0">{f.label}</label>
                <div className="flex items-center gap-1 flex-1">
                  <input
                    type={f.type || "number"}
                    value={form[f.key] as string | number}
                    onChange={(e) =>
                      handleChange(
                        f.key,
                        f.type === "date" ? e.target.value : parseFloat(e.target.value) || 0
                      )
                    }
                    className="flex-1 text-right text-sm font-semibold text-[#1F2937] border-0 outline-none bg-transparent"
                  />
                  {f.unit && <span className="text-xs text-gray-400">{f.unit}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* 생활습관 */}
          <div className="mt-4 bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm font-semibold text-gray-600 mb-3">생활습관</p>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">흡연 여부</span>
                <select
                  value={form.smokingStatus}
                  onChange={(e) => handleChange("smokingStatus", e.target.value as HealthCheckup["smokingStatus"])}
                  className="text-sm border border-gray-200 rounded-lg px-2 py-1"
                >
                  <option value="none">비흡연</option>
                  <option value="past">과거 흡연</option>
                  <option value="current">현재 흡연</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">음주 빈도</span>
                <select
                  value={form.drinkingFrequency}
                  onChange={(e) => handleChange("drinkingFrequency", e.target.value as HealthCheckup["drinkingFrequency"])}
                  className="text-sm border border-gray-200 rounded-lg px-2 py-1"
                >
                  <option value="none">거의 안 마심</option>
                  <option value="low">가끔 (월 1~3회)</option>
                  <option value="medium">보통 (주 1~2회)</option>
                  <option value="high">자주 (주 3회 이상)</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">운동 빈도</span>
                <select
                  value={form.exerciseFrequency}
                  onChange={(e) => handleChange("exerciseFrequency", e.target.value as HealthCheckup["exerciseFrequency"])}
                  className="text-sm border border-gray-200 rounded-lg px-2 py-1"
                >
                  <option value="low">거의 안 함</option>
                  <option value="medium">주 1~3회</option>
                  <option value="high">주 4회 이상</option>
                </select>
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            className="w-full mt-4 bg-[#4CAF6A] text-white text-lg font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all"
          >
            직접 입력 저장하기 (+50P)
          </button>
        </div>
      </main>
      <BottomNav />
    </MobileShell>
  );
}
