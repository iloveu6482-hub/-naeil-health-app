import type { DailyLog } from "@/types/health";
import type { HealthCheckup } from "@/types/health";
import { Footprints, Moon, Droplets, Activity } from "lucide-react";

interface TodaySummaryCardProps {
  log: DailyLog;
  checkup?: HealthCheckup;
}

interface SummaryItem {
  icon: React.ReactNode;
  label: string;
  value: string;
  status: "good" | "normal" | "caution";
}

export default function TodaySummaryCard({ log, checkup }: TodaySummaryCardProps) {
  const items: SummaryItem[] = [
    {
      icon: <Footprints size={20} />,
      label: "걸음 수",
      value: `${log.steps.toLocaleString()}보`,
      status: log.steps >= 7000 ? "good" : "caution",
    },
    {
      icon: <Moon size={20} />,
      label: "수면",
      value: `${log.sleepHours}시간`,
      status: log.sleepHours >= 7 ? "good" : "caution",
    },
    {
      icon: <Droplets size={20} />,
      label: "수분",
      value: `${log.waterCups}잔`,
      status: log.waterCups >= 6 ? "good" : "caution",
    },
    {
      icon: <Activity size={20} />,
      label: "혈압",
      value: checkup ? `${checkup.systolicBp}/${checkup.diastolicBp}` : "미입력",
      status: checkup && checkup.systolicBp < 130 ? "good" : "normal",
    },
  ];

  const statusColors = {
    good: "text-[#4CAF6A] bg-[#EAF7EF]",
    normal: "text-gray-500 bg-gray-50",
    caution: "text-[#F59E0B] bg-yellow-50",
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <p className="text-sm font-semibold text-gray-500 mb-3">오늘의 건강 요약</p>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item, i) => (
          <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${statusColors[item.status]}`}>
            <span>{item.icon}</span>
            <div>
              <p className="text-xs text-gray-500">{item.label}</p>
              <p className="text-base font-bold text-[#1F2937]">{item.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
