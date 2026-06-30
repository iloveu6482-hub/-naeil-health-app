export type NudgeCoachId = "onyu" | "haru" | "kangtaeo" | "rumi";

export type NudgeMessage = {
  title: string;
  message: string;
};

const nudgeMessagesByCoach: Record<NudgeCoachId, NudgeMessage[]> = {
  onyu: [
    {
      title: "천천히 다시 시작해요",
      message: "며칠 쉬어가셨어도 괜찮습니다. 오늘은 물 한 잔과 가벼운 움직임부터 천천히 시작해보세요.",
    },
    {
      title: "몸이 기다리고 있어요",
      message: "건강 관리는 다시 이어가는 것이 중요합니다. 무리하지 말고 오늘 기록 하나만 남겨보세요.",
    },
    {
      title: "작게 시작해도 됩니다",
      message: "오랜만이어도 괜찮습니다. 지금 할 수 있는 작은 실천 하나가 다시 흐름을 만들어줍니다.",
    },
  ],
  haru: [
    {
      title: "오늘 다시 함께해요",
      message: "잠깐 쉬었어도 괜찮아요. 오늘은 물 한 잔, 걸음 기록 하나부터 다정하게 다시 시작해볼까요?",
    },
    {
      title: "작은 기록이면 충분해요",
      message: "완벽하지 않아도 좋아요. 지금 남기는 작은 기록 하나가 내일의 건강을 다시 이어줘요.",
    },
    {
      title: "다시 잘할 수 있어요",
      message: "며칠 비어 있어도 흐름은 다시 만들 수 있어요. 오늘의 몸 상태부터 가볍게 확인해봐요.",
    },
  ],
  kangtaeo: [
    {
      title: "지금 다시 시작합시다",
      message: "최근 기록이 비었습니다. 오늘 10분만 움직이고 물 한 잔부터 채우면 흐름을 다시 잡을 수 있습니다.",
    },
    {
      title: "기록부터 회복합시다",
      message: "건강 루틴은 멈췄을 때 바로 복귀하는 게 중요합니다. 오늘 할 수 있는 것부터 바로 갑시다.",
    },
    {
      title: "오늘부터 다시 갑니다",
      message: "며칠 빠졌다고 끝난 게 아닙니다. 지금 걸음수와 수분 기록부터 채우면 충분히 회복 가능합니다.",
    },
  ],
  rumi: [
    {
      title: "다시 같이 해보자",
      message: "며칠 기록이 비어 있어! 부담 갖지 말고 오늘 물 한 잔이랑 가벼운 움직임부터 같이 해보자.",
    },
    {
      title: "오늘 기록 하나만!",
      message: "잠깐 쉬었어도 괜찮아. 지금 기록 하나만 남기면 다시 건강 루틴에 올라탈 수 있어.",
    },
    {
      title: "살짝만 다시 시작",
      message: "며칠 쉬었으니까 오늘은 작게 가자. 물, 걸음, 수면 중 하나만 채워도 충분히 좋아!",
    },
  ],
};

export function resolveNudgeCoachId(coachId?: string | null): NudgeCoachId {
  if (coachId === "onyu" || coachId === "onyou") return "onyu";
  if (coachId === "haru") return "haru";
  if (coachId === "taeo" || coachId === "kangtaeo") return "kangtaeo";
  if (coachId === "rumi" || coachId === "lumi") return "rumi";
  return "haru";
}

export function getLocalNudgeMessage(
  coachId?: string | null,
  daysMissed = 3
): NudgeMessage {
  const resolvedCoachId = resolveNudgeCoachId(coachId);
  const messages = nudgeMessagesByCoach[resolvedCoachId];
  const safeMissedDays = Math.max(3, Math.round(daysMissed));
  const selectedMessage =
    messages[Math.floor(Math.random() * messages.length)] || messages[0];

  if (resolvedCoachId === "rumi") {
    return {
      ...selectedMessage,
      message: `${safeMissedDays}일째 기록이 비어 있어! 부담 갖지 말고 오늘 물 한 잔이랑 가벼운 움직임부터 같이 해보자.`,
    };
  }

  return selectedMessage;
}
