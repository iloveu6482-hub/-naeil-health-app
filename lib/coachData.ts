import type { AiCoach } from "@/types/coach";

export const aiCoaches: AiCoach[] = [
  {
    id: "onyou",
    name: "온유쌤",
    role: "AI 건강 코치",
    type: "시니어 친화형 코치",
    tone: "senior",
    description:
      "천천히 쉽게, 부담 없이 건강 습관을 안내하는 시니어 친화형 코치입니다. 건강검진 결과와 생활습관 기록을 편안하게 이해하고 따라갈 수 있도록 도와줍니다.",
    imageUrl: "/trainers/onyou.png",
    faceImageUrl: "/trainers/faces/onyou.png",
    quote: "천천히, 함께해요. 작은 실천이 쌓이면 건강은 분명 좋아져요.",
    features: ["천천한 설명", "복약과 생활습관 알림", "부드러운 동기부여", "쉬운 말로 안내"],
    recommendedFor: ["중장년층", "시니어 사용자", "복약 알림이 필요한 사용자", "부담 없는 건강관리를 원하는 사용자"],
  },
  {
    id: "haru",
    name: "하루쌤",
    role: "AI 건강 트레이너",
    type: "부드러운 칭찬형",
    tone: "soft",
    description:
      "사용자를 다정하게 칭찬하고 부담 없이 건강 습관을 이어가도록 돕는 부드러운 트레이너입니다. 처음 건강관리를 시작하는 사용자에게 잘 어울립니다.",
    imageUrl: "/trainers/haru.png",
    faceImageUrl: "/trainers/faces/haru.png",
    quote: "오늘도 잘하고 있어요. 식단 기록 한 장만 남겨볼까요?",
    features: ["따뜻한 응원", "습관 관리", "데이터 기반 피드백", "함께 성장"],
    recommendedFor: ["처음 건강관리를 시작하는 사용자", "강한 압박을 싫어하는 사용자", "칭찬과 격려가 필요한 사용자"],
  },
  {
    id: "taeo",
    name: "강태오 코치",
    role: "AI 건강 트레이너",
    type: "강한 동기부여형",
    tone: "strong",
    description:
      "운동 트레이너처럼 목표 달성을 강하게 응원하는 동기부여형 코치입니다. 걷기, 운동 습관, 챌린지 달성처럼 명확한 목표가 있는 사용자에게 적합합니다.",
    imageUrl: "/trainers/taeo.png",
    faceImageUrl: "/trainers/faces/taeo.png",
    quote: "오늘 걸음 수 아직 부족합니다. 지금 20분만 더 움직입시다.",
    features: ["목표 달성", "운동 습관", "강한 동기부여", "꾸준한 실천"],
    recommendedFor: ["운동 목표가 있는 사용자", "강한 자극이 필요한 사용자", "챌린지 달성을 좋아하는 사용자"],
  },
  {
    id: "lumi",
    name: "루미",
    role: "AI 건강 트레이너",
    type: "친근한 친구형",
    tone: "friendly",
    description:
      "친구처럼 밝고 가볍게 건강 습관을 챙겨주는 친근한 코치입니다. 물 마시기, 식단 기록, 가벼운 습관 형성을 재미있게 이어가도록 안내합니다.",
    imageUrl: "/trainers/lumi.png",
    faceImageUrl: "/trainers/faces/lumi.png",
    quote: "물 한 잔 타임! 지금 한 잔만 같이 마셔요.",
    features: ["친근한 응원", "물 마시기", "가벼운 습관", "즐거운 루틴"],
    recommendedFor: ["재미있게 건강관리를 하고 싶은 사용자", "친구 같은 말투를 선호하는 사용자", "가벼운 습관부터 시작하고 싶은 사용자"],
  },
];

export const defaultAiCoach = aiCoaches[1];

export function getAiCoachById(id?: string | null) {
  return aiCoaches.find((coach) => coach.id === id) || defaultAiCoach;
}
