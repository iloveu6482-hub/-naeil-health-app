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
    <div className="bg-[#EAF7EF] rounded-2xl p-4 flex items-start gap-3">
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-white bg-[#DDF3E5] shadow-sm ring-1 ring-[#BDE8CA]">
        <Image src={coachAvatar} alt={title} fill unoptimized={coachAvatar.startsWith("data:")} className="scale-[1.22] rounded-full object-cover object-[center_18%]" />
      </div>
      <div>
        <p className="text-xs font-semibold text-[#4CAF6A] mb-1">{title}</p>
        <p className="text-sm text-[#1F2937] leading-relaxed">{message}</p>
      </div>
    </div>
  );
}
