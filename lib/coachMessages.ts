export type CoachTimeSlot =
  | "morning"
  | "lunch"
  | "afternoon"
  | "evening"
  | "night"
  | "late_night";

export type CoachMessage = {
  messageId: string;
  text: string;
  audioFile: string;
};

export type CoachMessagesByTimeSlot = Record<CoachTimeSlot, CoachMessage[]>;

export const haruCoachMessages = {
  coachId: "haru",
  coachName: "하루쌤",
  personality: "부드러운 칭찬형",
  tone: "다정하고 따뜻한 건강 선생님 말투",
  messages: {
    morning: [
      {
        messageId: "haru_morning_01",
        text: "좋은 아침이에요. 오늘도 몸을 깨우는 작은 움직임부터 시작해볼까요?",
        audioFile: "haru_morning_01.mp3",
      },
      {
        messageId: "haru_morning_02",
        text: "어제보다 조금만 더 가볍게 시작해도 충분히 잘하고 계신 거예요.",
        audioFile: "haru_morning_02.mp3",
      },
      {
        messageId: "haru_morning_03",
        text: "아침 물 한 잔과 가벼운 스트레칭으로 오늘 건강을 열어볼까요?",
        audioFile: "haru_morning_03.mp3",
      },
    ],

    lunch: [
      {
        messageId: "haru_lunch_01",
        text: "점심시간이에요. 천천히 꼭꼭 씹어 드시면 몸이 더 편안해져요.",
        audioFile: "haru_lunch_01.mp3",
      },
      {
        messageId: "haru_lunch_02",
        text: "오늘 식사도 잘 챙기셨나요? 작은 식습관이 내일의 몸을 바꿔요.",
        audioFile: "haru_lunch_02.mp3",
      },
      {
        messageId: "haru_lunch_03",
        text: "식사 후 10분 정도만 가볍게 걸어도 충분히 좋은 선택이에요.",
        audioFile: "haru_lunch_03.mp3",
      },
    ],

    afternoon: [
      {
        messageId: "haru_afternoon_01",
        text: "오후에는 몸이 조금 무거워질 수 있어요. 잠깐 어깨를 펴볼까요?",
        audioFile: "haru_afternoon_01.mp3",
      },
      {
        messageId: "haru_afternoon_02",
        text: "지금까지 잘해오셨어요. 물 한 잔 마시고 다시 천천히 가보면 돼요.",
        audioFile: "haru_afternoon_02.mp3",
      },
      {
        messageId: "haru_afternoon_03",
        text: "오래 앉아 있었다면 잠깐 일어나 몸을 풀어주세요. 몸이 좋아할 거예요.",
        audioFile: "haru_afternoon_03.mp3",
      },
    ],

    evening: [
      {
        messageId: "haru_evening_01",
        text: "오늘 하루도 수고 많으셨어요. 저녁에는 몸을 편하게 풀어주세요.",
        audioFile: "haru_evening_01.mp3",
      },
      {
        messageId: "haru_evening_02",
        text: "가벼운 산책으로 하루를 마무리하면 몸도 마음도 한결 좋아져요.",
        audioFile: "haru_evening_02.mp3",
      },
      {
        messageId: "haru_evening_03",
        text: "오늘의 기록을 남겨보세요. 작은 기록이 건강한 변화를 만들어줘요.",
        audioFile: "haru_evening_03.mp3",
      },
    ],

    night: [
      {
        messageId: "haru_night_01",
        text: "이제는 몸을 쉬게 해줄 시간이에요. 너무 늦지 않게 잠자리에 들어볼까요?",
        audioFile: "haru_night_01.mp3",
      },
      {
        messageId: "haru_night_02",
        text: "오늘 부족했던 부분보다 잘해낸 부분을 먼저 떠올려보세요.",
        audioFile: "haru_night_02.mp3",
      },
      {
        messageId: "haru_night_03",
        text: "편안한 호흡으로 하루를 마무리해요. 내일도 천천히 함께하면 돼요.",
        audioFile: "haru_night_03.mp3",
      },
    ],

    late_night: [
      {
        messageId: "haru_late_night_01",
        text: "아직 깨어 계시네요. 몸이 회복할 수 있도록 이제는 쉬어도 좋아요.",
        audioFile: "haru_late_night_01.mp3",
      },
      {
        messageId: "haru_late_night_02",
        text: "늦은 시간에는 무리하지 않는 게 가장 좋은 건강 습관이에요.",
        audioFile: "haru_late_night_02.mp3",
      },
      {
        messageId: "haru_late_night_03",
        text: "잠깐 휴대폰을 내려놓고 눈을 쉬게 해주세요. 몸이 고마워할 거예요.",
        audioFile: "haru_late_night_03.mp3",
      },
    ],
  } satisfies CoachMessagesByTimeSlot,
};

export const taeoCoachMessages = {
  coachId: "taeo",
  coachName: "강태오 코치",
  personality: "강한 동기부여형",
  tone: "단호하지만 현실적인 운동 코치 말투",
  messages: {
    morning: [
      {
        messageId: "taeo_morning_01",
        text: "오늘 건강은 아침 첫 움직임에서 시작됩니다. 지금 바로 몸을 깨웁시다.",
        audioFile: "taeo_morning_01.mp3",
      },
      {
        messageId: "taeo_morning_02",
        text: "하루를 끌려가지 말고 먼저 시작하세요. 5분 스트레칭부터 갑니다.",
        audioFile: "taeo_morning_02.mp3",
      },
      {
        messageId: "taeo_morning_03",
        text: "어제보다 한 걸음 더 움직이면 충분합니다. 중요한 건 시작입니다.",
        audioFile: "taeo_morning_03.mp3",
      },
    ],

    lunch: [
      {
        messageId: "taeo_lunch_01",
        text: "점심은 대충 넘기지 마세요. 몸을 만드는 것도 전략입니다.",
        audioFile: "taeo_lunch_01.mp3",
      },
      {
        messageId: "taeo_lunch_02",
        text: "식사 후 바로 눕지 말고 10분만 걸어봅시다. 차이가 납니다.",
        audioFile: "taeo_lunch_02.mp3",
      },
      {
        messageId: "taeo_lunch_03",
        text: "오늘 선택한 식사가 내일 컨디션을 만듭니다. 균형 있게 갑시다.",
        audioFile: "taeo_lunch_03.mp3",
      },
    ],

    afternoon: [
      {
        messageId: "taeo_afternoon_01",
        text: "오후에 처지는 건 자연스럽습니다. 하지만 그대로 멈추면 안 됩니다.",
        audioFile: "taeo_afternoon_01.mp3",
      },
      {
        messageId: "taeo_afternoon_02",
        text: "지금 3분만 일어나 움직이세요. 몸은 움직일수록 살아납니다.",
        audioFile: "taeo_afternoon_02.mp3",
      },
      {
        messageId: "taeo_afternoon_03",
        text: "집중력이 떨어졌다면 자세부터 바로잡으세요. 건강도 자세에서 시작됩니다.",
        audioFile: "taeo_afternoon_03.mp3",
      },
    ],

    evening: [
      {
        messageId: "taeo_evening_01",
        text: "오늘 걸음 수 아직 부족합니다. 지금 20분만 더 움직입시다.",
        audioFile: "taeo_evening_01.mp3",
      },
      {
        messageId: "taeo_evening_02",
        text: "하루가 끝나기 전, 마지막 건강 점검입니다. 기록하고 마무리합시다.",
        audioFile: "taeo_evening_02.mp3",
      },
      {
        messageId: "taeo_evening_03",
        text: "저녁 산책은 선택이 아니라 투자입니다. 내 몸에 투자합시다.",
        audioFile: "taeo_evening_03.mp3",
      },
    ],

    night: [
      {
        messageId: "taeo_night_01",
        text: "늦은 야식은 내일 컨디션을 무너뜨립니다. 오늘은 참아봅시다.",
        audioFile: "taeo_night_01.mp3",
      },
      {
        messageId: "taeo_night_02",
        text: "회복도 훈련입니다. 제대로 쉬어야 내일 더 강해집니다.",
        audioFile: "taeo_night_02.mp3",
      },
      {
        messageId: "taeo_night_03",
        text: "오늘 부족했던 건 내일 다시 채우면 됩니다. 대신 잠은 지켜야 합니다.",
        audioFile: "taeo_night_03.mp3",
      },
    ],

    late_night: [
      {
        messageId: "taeo_late_night_01",
        text: "지금은 버티는 시간이 아니라 회복해야 할 시간입니다. 자러 갑시다.",
        audioFile: "taeo_late_night_01.mp3",
      },
      {
        messageId: "taeo_late_night_02",
        text: "밤을 새우면 건강 루틴이 무너집니다. 오늘은 여기서 멈춥시다.",
        audioFile: "taeo_late_night_02.mp3",
      },
      {
        messageId: "taeo_late_night_03",
        text: "내일의 컨디션은 지금 결정됩니다. 휴식도 실력입니다.",
        audioFile: "taeo_late_night_03.mp3",
      },
    ],
  } satisfies CoachMessagesByTimeSlot,
};

export const rumiCoachMessages = {
  coachId: "rumi",
  coachName: "루미",
  personality: "친근한 친구형",
  tone: "밝고 친근한 친구 같은 건강 코치 말투",
  messages: {
    morning: [
      {
        messageId: "rumi_morning_01",
        text: "굿모닝! 오늘도 우리 몸 살짝 깨워볼까? 물 한 잔부터 어때?",
        audioFile: "rumi_morning_01.mp3",
      },
      {
        messageId: "rumi_morning_02",
        text: "아침부터 완벽할 필요 없어. 가볍게 시작하면 그걸로 충분해!",
        audioFile: "rumi_morning_02.mp3",
      },
      {
        messageId: "rumi_morning_03",
        text: "오늘 컨디션 어때? 무리 말고 천천히 몸부터 풀어보자.",
        audioFile: "rumi_morning_03.mp3",
      },
    ],

    lunch: [
      {
        messageId: "rumi_lunch_01",
        text: "점심 챙겼어? 너무 급하게 먹지 말고 천천히 먹자!",
        audioFile: "rumi_lunch_01.mp3",
      },
      {
        messageId: "rumi_lunch_02",
        text: "밥 먹고 바로 앉아만 있으면 몸이 삐질지도 몰라. 살짝 걸어볼까?",
        audioFile: "rumi_lunch_02.mp3",
      },
      {
        messageId: "rumi_lunch_03",
        text: "오늘 점심도 내 몸을 위한 선택이라고 생각하면 더 좋아!",
        audioFile: "rumi_lunch_03.mp3",
      },
    ],

    afternoon: [
      {
        messageId: "rumi_afternoon_01",
        text: "오후 졸림이 왔지? 그럴 땐 일어나서 쭉 기지개 한번!",
        audioFile: "rumi_afternoon_01.mp3",
      },
      {
        messageId: "rumi_afternoon_02",
        text: "지금 물 마셨는지 체크! 안 마셨으면 나랑 같이 한 잔 하자.",
        audioFile: "rumi_afternoon_02.mp3",
      },
      {
        messageId: "rumi_afternoon_03",
        text: "오래 앉아 있었으면 몸이 답답할 수 있어. 1분만 움직여도 좋아!",
        audioFile: "rumi_afternoon_03.mp3",
      },
    ],

    evening: [
      {
        messageId: "rumi_evening_01",
        text: "오늘 하루 어땠어? 산책 조금만 하면 기분이 더 좋아질 거야.",
        audioFile: "rumi_evening_01.mp3",
      },
      {
        messageId: "rumi_evening_02",
        text: "오늘 기록 남기면 내일의 내가 고마워할지도 몰라!",
        audioFile: "rumi_evening_02.mp3",
      },
      {
        messageId: "rumi_evening_03",
        text: "저녁엔 무리하지 말고 가볍게 몸을 풀어주자. 잘하고 있어!",
        audioFile: "rumi_evening_03.mp3",
      },
    ],

    night: [
      {
        messageId: "rumi_night_01",
        text: "이제 슬슬 쉬어야 할 시간이야. 오늘도 진짜 고생 많았어.",
        audioFile: "rumi_night_01.mp3",
      },
      {
        messageId: "rumi_night_02",
        text: "야식 생각나도 잠깐만 참아보자. 내일 아침 몸이 훨씬 가벼울 거야.",
        audioFile: "rumi_night_02.mp3",
      },
      {
        messageId: "rumi_night_03",
        text: "오늘 못한 건 괜찮아. 내일 다시 하면 되니까 편하게 쉬자.",
        audioFile: "rumi_night_03.mp3",
      },
    ],

    late_night: [
      {
        messageId: "rumi_late_night_01",
        text: "아직 안 자고 있어? 이제 눈 좀 쉬게 해주자.",
        audioFile: "rumi_late_night_01.mp3",
      },
      {
        messageId: "rumi_late_night_02",
        text: "늦은 시간엔 건강도 잠을 기다리고 있어. 우리 이제 쉬자.",
        audioFile: "rumi_late_night_02.mp3",
      },
      {
        messageId: "rumi_late_night_03",
        text: "밤에는 무리하지 않는 게 최고야. 내일을 위해 잠깐 멈추자.",
        audioFile: "rumi_late_night_03.mp3",
      },
    ],
  } satisfies CoachMessagesByTimeSlot,
};

export const onyuCoachMessages = {
  coachId: "onyu",
  coachName: "온유쌤",
  personality: "시니어 친화형",
  tone: "천천히 또박또박 안내하는 따뜻한 건강 선생님 말투",
  messages: {
    morning: [
      {
        messageId: "onyu_morning_01",
        text: "좋은 아침입니다. 오늘은 물 한 잔 드시고 천천히 몸을 움직여보세요.",
        audioFile: "onyu_morning_01.mp3",
      },
      {
        messageId: "onyu_morning_02",
        text: "아침에는 무리하지 마시고, 가볍게 기지개부터 시작하시면 좋습니다.",
        audioFile: "onyu_morning_02.mp3",
      },
      {
        messageId: "onyu_morning_03",
        text: "오늘도 편안한 마음으로 시작해보세요. 작은 움직임도 건강에 도움이 됩니다.",
        audioFile: "onyu_morning_03.mp3",
      },
    ],

    lunch: [
      {
        messageId: "onyu_lunch_01",
        text: "점심은 천천히 드시는 것이 좋습니다. 급하게 드시지 않으셔도 됩니다.",
        audioFile: "onyu_lunch_01.mp3",
      },
      {
        messageId: "onyu_lunch_02",
        text: "식사 후에는 바로 눕기보다 잠깐 앉아 쉬시거나 가볍게 걸어보세요.",
        audioFile: "onyu_lunch_02.mp3",
      },
      {
        messageId: "onyu_lunch_03",
        text: "오늘 식사는 잘 챙기셨나요? 규칙적인 식사가 건강 관리의 기본입니다.",
        audioFile: "onyu_lunch_03.mp3",
      },
    ],

    afternoon: [
      {
        messageId: "onyu_afternoon_01",
        text: "오후에는 몸이 무거울 수 있습니다. 잠깐 일어나 어깨를 풀어보세요.",
        audioFile: "onyu_afternoon_01.mp3",
      },
      {
        messageId: "onyu_afternoon_02",
        text: "오래 앉아 계셨다면 천천히 일어나 가볍게 움직여주세요.",
        audioFile: "onyu_afternoon_02.mp3",
      },
      {
        messageId: "onyu_afternoon_03",
        text: "물을 조금 드시고, 눈과 목을 편안하게 쉬게 해주세요.",
        audioFile: "onyu_afternoon_03.mp3",
      },
    ],

    evening: [
      {
        messageId: "onyu_evening_01",
        text: "오늘 하루도 수고 많으셨습니다. 저녁에는 몸을 편안히 쉬게 해주세요.",
        audioFile: "onyu_evening_01.mp3",
      },
      {
        messageId: "onyu_evening_02",
        text: "가능하시다면 가볍게 산책해보세요. 무리하지 않는 선이면 충분합니다.",
        audioFile: "onyu_evening_02.mp3",
      },
      {
        messageId: "onyu_evening_03",
        text: "오늘 건강 기록을 확인해보시면 내 몸 상태를 이해하는 데 도움이 됩니다.",
        audioFile: "onyu_evening_03.mp3",
      },
    ],

    night: [
      {
        messageId: "onyu_night_01",
        text: "이제는 쉬어야 할 시간입니다. 편안한 마음으로 하루를 마무리해보세요.",
        audioFile: "onyu_night_01.mp3",
      },
      {
        messageId: "onyu_night_02",
        text: "늦은 시간에는 과식하지 않는 것이 좋습니다. 몸을 가볍게 해주세요.",
        audioFile: "onyu_night_02.mp3",
      },
      {
        messageId: "onyu_night_03",
        text: "오늘도 잘 해오셨습니다. 내일도 천천히 함께 관리해보겠습니다.",
        audioFile: "onyu_night_03.mp3",
      },
    ],

    late_night: [
      {
        messageId: "onyu_late_night_01",
        text: "많이 늦은 시간입니다. 건강을 위해 이제는 잠시 쉬어가셔도 좋습니다.",
        audioFile: "onyu_late_night_01.mp3",
      },
      {
        messageId: "onyu_late_night_02",
        text: "밤에는 몸이 회복하는 시간이 필요합니다. 편안히 눈을 감아보세요.",
        audioFile: "onyu_late_night_02.mp3",
      },
      {
        messageId: "onyu_late_night_03",
        text: "지금은 무리하지 마시고, 내일을 위해 충분히 쉬시는 것이 좋습니다.",
        audioFile: "onyu_late_night_03.mp3",
      },
    ],
  } satisfies CoachMessagesByTimeSlot,
};

export type CoachId = "haru" | "taeo" | "rumi" | "onyu";

export const coachMessagesMap = {
  haru: haruCoachMessages,
  taeo: taeoCoachMessages,
  rumi: rumiCoachMessages,
  onyu: onyuCoachMessages,
} as const;

export const allCoachMessages = [
  haruCoachMessages,
  taeoCoachMessages,
  rumiCoachMessages,
  onyuCoachMessages,
] as const;

export function getCurrentCoachTimeSlot(date: Date = new Date()): CoachTimeSlot {
  const hour = date.getHours();

  if (hour >= 6 && hour <= 10) {
    return "morning";
  }

  if (hour >= 11 && hour <= 13) {
    return "lunch";
  }

  if (hour >= 14 && hour <= 16) {
    return "afternoon";
  }

  if (hour >= 17 && hour <= 20) {
    return "evening";
  }

  if (hour >= 21 && hour <= 23) {
    return "night";
  }

  return "late_night";
}

export type SelectedCoachMessage = {
  coachId: CoachId;
  coachName: string;
  timeSlot: CoachTimeSlot;
  message: CoachMessage;
};

export function getRandomCoachMessage(
  coachId: CoachId,
  date: Date = new Date()
): SelectedCoachMessage {
  const coach = coachMessagesMap[coachId];
  const timeSlot = getCurrentCoachTimeSlot(date);
  const messages = coach.messages[timeSlot];

  const fallbackMessage = messages[0];

  if (!fallbackMessage) {
    throw new Error(`No coach messages found for ${coachId} in ${timeSlot}`);
  }

  const randomIndex = Math.floor(Math.random() * messages.length);
  const selectedMessage = messages[randomIndex] ?? fallbackMessage;

  return {
    coachId,
    coachName: coach.coachName,
    timeSlot,
    message: selectedMessage,
  };
}
