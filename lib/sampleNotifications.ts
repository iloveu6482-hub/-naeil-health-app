import type { MotivationMessage, NotificationSetting } from "@/types/notification";

export const sampleNotificationSettings: NotificationSetting[] = [
  { id: "noti-meal-lunch", type: "meal", title: "점심 식단 기록", description: "점심시간에 식사 사진 기록을 알려드려요.", enabled: true, time: "11:50" },
  { id: "noti-meal-dinner", type: "meal", title: "저녁 식단 기록", description: "저녁 식사 전 식단 기록을 알려드려요.", enabled: true, time: "18:00" },
  { id: "noti-steps", type: "steps", title: "걷기 목표 알림", description: "목표 걸음 수까지 얼마나 남았는지 알려드려요.", enabled: true, time: "20:00" },
  { id: "noti-water", type: "water", title: "물 마시기 알림", description: "수분 섭취를 잊지 않도록 알려드려요.", enabled: true, time: "15:00" },
  { id: "noti-sleep", type: "sleep", title: "수면 준비 알림", description: "규칙적인 수면 루틴을 도와드려요.", enabled: true, time: "22:00" },
  { id: "noti-challenge", type: "challenge", title: "챌린지 마감 알림", description: "함께 실천 중인 챌린지 마감을 알려드려요.", enabled: true, time: "19:30" },
  { id: "noti-report", type: "report", title: "주간 리포트 확인", description: "이번 주 건강관리 결과를 알려드려요.", enabled: true, time: "09:00" },
];

export const sampleMotivationMessages: MotivationMessage[] = [
  { id: "msg-lunch", type: "meal", title: "점심시간이에요", message: "식사 전 사진 한 장으로 오늘의 식단을 기록해보세요.", actionLabel: "식단 기록하기", actionHref: "/meals/new" },
  { id: "msg-steps", type: "steps", title: "조금만 더 걸어볼까요?", message: "오늘 5,800보 걸었어요. 1,200보만 더 걸으면 목표 달성이에요.", actionLabel: "습관 기록하기", actionHref: "/habits" },
  { id: "msg-water", type: "water", title: "물 한 잔 마실 시간이에요", message: "오늘 물 마시기 목표까지 2잔 남았어요. 건강이가 응원하고 있어요.", actionLabel: "기록하기", actionHref: "/habits" },
  { id: "msg-sleep", type: "sleep", title: "오늘은 조금 일찍 쉬어볼까요?", message: "규칙적인 수면은 건강관리의 시작입니다.", actionLabel: "수면 기록하기", actionHref: "/habits" },
];
