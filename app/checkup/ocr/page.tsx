"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MobileShell from "@/components/layout/MobileShell";
import AppHeader from "@/components/layout/AppHeader";
import BottomNav from "@/components/layout/BottomNav";
import RewardToast from "@/components/common/RewardToast";
import { mockAnalyzeCheckupImage } from "@/lib/ocr";
import { saveToStorage, getFromStorage, STORAGE_KEYS } from "@/lib/storage";
import { createEarnTransaction, hasEarnedTodayForReason, addPointTransaction } from "@/lib/rewards";
import type { HealthCheckup } from "@/types/health";
import { Camera, ScanLine, CheckCircle2 } from "lucide-react";

type Step = "upload" | "loading" | "result";

export default function OcrPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState<string | null>(null);
  const [result, setResult] = useState<HealthCheckup | null>(null);
  const [showToast, setShowToast] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setFileName(file.name);
  };

  const handleAnalyze = async () => {
    setStep("loading");
    const data = await mockAnalyzeCheckupImage();
    setResult(data);
    setStep("result");
  };

  const handleGenerateReport = () => {
    if (!result) return;
    saveToStorage(STORAGE_KEYS.HEALTH_CHECKUP, result);

    const txs = getFromStorage(STORAGE_KEYS.POINT_TRANSACTIONS, []);
    if (!hasEarnedTodayForReason(txs, "건강검진 결과 입력")) {
      const tx = createEarnTransaction("user-001", 50, "건강검진 결과 입력");
      addPointTransaction(tx);
      window.dispatchEvent(new Event("pointsUpdated"));
      setShowToast(true);
    }

    setTimeout(() => router.push("/report"), 1500);
  };

  return (
    <MobileShell>
      <AppHeader title="검진결과 인식" showBack backHref="/checkup" />
      <RewardToast
        message="검진결과 인식 완료!"
        points={50}
        visible={showToast}
        onHide={() => setShowToast(false)}
      />
      <main className="flex-1 overflow-y-auto bg-[#FAFCFA] pb-24 px-4 py-4">
        {step === "upload" && (
          <div className="flex flex-col gap-4">
            <div className="bg-[#EAF7EF] rounded-2xl p-4 text-sm text-gray-600">
              건강검진 결과지를 촬영하거나 갤러리에서 선택하면 AI가 자동으로 수치를 인식합니다.
            </div>
            <label className="block">
              <div className="border-2 border-dashed border-[#4CAF6A] rounded-2xl py-10 flex flex-col items-center gap-3 cursor-pointer bg-[#EAF7EF] hover:bg-[#d5f0e0] transition-colors">
                <Camera size={40} className="text-[#4CAF6A]" />
                <p className="text-[#1F5A3A] font-semibold">검진결과 사진 선택</p>
                <p className="text-xs text-gray-500">JPG, PNG 파일 지원</p>
                {fileName && (
                  <p className="text-sm text-[#4CAF6A] font-medium">{fileName}</p>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
            <button
              onClick={handleAnalyze}
              className="w-full bg-[#4CAF6A] text-white text-lg font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <ScanLine size={20} />
              검진결과 인식하기
            </button>
            <p className="text-center text-xs text-gray-400">
              * MVP 데모: 샘플 검진 데이터가 자동 입력됩니다
            </p>
          </div>
        )}

        {step === "loading" && (
          <div className="flex flex-col items-center justify-center py-20 gap-6">
            <div className="w-20 h-20 bg-[#EAF7EF] rounded-full flex items-center justify-center animate-pulse">
              <ScanLine size={40} className="text-[#4CAF6A]" />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-[#1F2937]">인식 중...</p>
              <p className="text-sm text-gray-500 mt-1">건강검진 결과를 분석하고 있습니다</p>
            </div>
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-[#4CAF6A] rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {step === "result" && result && (
          <div className="flex flex-col gap-4">
            <div className="bg-[#EAF7EF] rounded-2xl p-4 flex items-center gap-3">
              <CheckCircle2 size={24} className="text-[#4CAF6A]" />
              <div>
                <p className="font-bold text-[#1F5A3A]">인식 완료!</p>
                <p className="text-sm text-gray-600">수치를 확인하고 수정할 수 있습니다</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {[
                { label: "검진일", value: result.checkupDate },
                { label: "키", value: `${result.height} cm` },
                { label: "체중", value: `${result.weight} kg` },
                { label: "BMI", value: `${result.bmi}` },
                { label: "허리둘레", value: `${result.waist} cm` },
                { label: "수축기 혈압", value: `${result.systolicBp} mmHg` },
                { label: "이완기 혈압", value: `${result.diastolicBp} mmHg` },
                { label: "공복혈당", value: `${result.fastingGlucose} mg/dL` },
                { label: "총콜레스테롤", value: `${result.totalCholesterol} mg/dL` },
                { label: "HDL", value: `${result.hdl} mg/dL` },
                { label: "LDL", value: `${result.ldl} mg/dL` },
                { label: "중성지방", value: `${result.triglyceride} mg/dL` },
                { label: "AST", value: `${result.ast} U/L` },
                { label: "ALT", value: `${result.alt} U/L` },
                { label: "감마GTP", value: `${result.gammaGtp} U/L` },
              ].map((item, i, arr) => (
                <div
                  key={i}
                  className={`flex items-center justify-between px-4 py-3 ${
                    i < arr.length - 1 ? "border-b border-gray-50" : ""
                  }`}
                >
                  <span className="text-sm text-gray-600">{item.label}</span>
                  <span className="text-sm font-semibold text-[#1F2937]">{item.value}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleGenerateReport}
              className="w-full bg-[#4CAF6A] text-white text-lg font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all"
            >
              AI 리포트 생성하기 🌱
            </button>
          </div>
        )}
      </main>
      <BottomNav />
    </MobileShell>
  );
}
