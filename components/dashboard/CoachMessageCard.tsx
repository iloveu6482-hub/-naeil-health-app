interface CoachMessageCardProps {
  message: string;
}

export default function CoachMessageCard({ message }: CoachMessageCardProps) {
  return (
    <div className="bg-[#EAF7EF] rounded-2xl p-4 flex items-start gap-3">
      <div className="w-10 h-10 bg-[#4CAF6A] rounded-full flex items-center justify-center text-white text-xl flex-shrink-0">
        🌱
      </div>
      <div>
        <p className="text-xs font-semibold text-[#4CAF6A] mb-1">건강이의 한마디</p>
        <p className="text-sm text-[#1F2937] leading-relaxed">{message}</p>
      </div>
    </div>
  );
}
