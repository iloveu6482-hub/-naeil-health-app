import AnimatedAvatar from "@/components/avatar/AnimatedAvatar";
import type { AvatarStyle } from "@/types/user";

interface CoachMessageCardProps {
  message: string;
  style?: AvatarStyle;
  imageUrl?: string;
}

export default function CoachMessageCard({ message, style = "3d", imageUrl }: CoachMessageCardProps) {
  return (
    <div className="bg-[#EAF7EF] rounded-2xl p-4 flex items-start gap-3">
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-[#4CAF6A]"><AnimatedAvatar style={style} mood="cheer" size="sm" imageUrl={imageUrl} fill glow={false} /></div>
      <div>
        <p className="text-xs font-semibold text-[#4CAF6A] mb-1">건강이의 한마디</p>
        <p className="text-sm text-[#1F2937] leading-relaxed">{message}</p>
      </div>
    </div>
  );
}
