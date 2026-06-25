import Image from "next/image";
import { getDefaultAvatarImage } from "@/lib/defaultAvatars";
import type { AvatarGender, AvatarStyle } from "@/types/user";

interface CoachMessageCardProps {
  message: string;
  title?: string;
  style?: AvatarStyle;
  imageUrl?: string;
  gender?: AvatarGender;
}

export default function CoachMessageCard({ message, title = "건강이의 한마디", style = "3d", imageUrl, gender = "female" }: CoachMessageCardProps) {
  const coachAvatar = imageUrl || getDefaultAvatarImage(gender, style) || "/avatars/default-female-3d.png";

  return (
    <div className="flex items-start gap-3 rounded-2xl bg-[#EAF7EF] p-4">
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border-[3px] border-white bg-[#DDF3E5] shadow-sm ring-2 ring-[#BDE8CA]">
        <Image src={coachAvatar} alt={title} fill unoptimized={coachAvatar.startsWith("data:")} className="rounded-full object-cover object-center" />
      </div>
      <div className="relative flex-1 rounded-2xl border border-[#BDE8CA] bg-white px-3 py-2 shadow-sm">
        <span className="absolute left-[-7px] top-4 h-3.5 w-3.5 rotate-45 border-b border-l border-[#BDE8CA] bg-white" />
        <p className="text-xs font-semibold text-[#4CAF6A] mb-1">{title}</p>
        <p className="text-sm text-[#1F2937] leading-relaxed">{message}</p>
      </div>
    </div>
  );
}
