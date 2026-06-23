import ProgressRing from "@/components/common/ProgressRing";
import { getScoreLabel, getScoreColor } from "@/lib/healthRules";

interface HealthScoreCardProps {
  score: number;
}

export default function HealthScoreCard({ score }: HealthScoreCardProps) {
  const color = getScoreColor(score);
  const label = getScoreLabel(score);

  return (
    <div className="bg-gradient-to-br from-[#1F5A3A] to-[#4CAF6A] rounded-2xl p-5 text-white">
      <p className="text-sm text-green-100 mb-3">오늘의 건강관리 참고 점수</p>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-end gap-1">
            <span className="text-5xl font-extrabold">{score}</span>
            <span className="text-xl text-green-200 mb-1">/ 100</span>
          </div>
          <span className="inline-block mt-1 bg-white/20 text-white text-sm font-semibold px-3 py-0.5 rounded-full">
            {label}
          </span>
        </div>
        <ProgressRing
          value={score}
          size={90}
          strokeWidth={9}
          color="rgba(255,255,255,0.9)"
          label={`${score}`}
        />
      </div>
      <p className="text-xs text-green-100 mt-3">
        * 건강관리 참고 점수로 의료 진단과는 다릅니다
      </p>
    </div>
  );
}
