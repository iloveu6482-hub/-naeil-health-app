export type NotificationType = "meal" | "steps" | "water" | "sleep" | "challenge" | "report";

export type NotificationSetting = {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  enabled: boolean;
  time: string;
};

export type MotivationMessage = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  actionLabel?: string;
  actionHref?: string;
};
