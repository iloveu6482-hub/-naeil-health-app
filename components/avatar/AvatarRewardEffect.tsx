export default function AvatarRewardEffect({ points, visible }: { points: number; visible: boolean }) {
  if (!visible) return null;
  return <div className="avatar-reward-pop pointer-events-none absolute left-1/2 top-1/2 z-30 -translate-x-1/2 rounded-full border border-amber-200 bg-white/90 px-4 py-2 text-center shadow-lg backdrop-blur"><p className="text-xl font-black text-amber-500">+{points}P</p><p className="text-xs font-bold text-[#1F5A3A]">헬스포인트 획득!</p></div>;
}
