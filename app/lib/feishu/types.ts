export type FeishuRadarHotspot = {
  title: string;
  reason?: string;
  sourceEvidence?: string;
  attentionReason?: string;
  fitPlatforms?: string[];
  sourceChannel?: string;
  verificationStatus?: string;
  sourceCredibility?: string;
  credibility?: string;
  totalScore?: number;
  recommendReason?: string;
  recommendLevel?: string;
  useAngle?: string;
  matchReason?: string;
  articlePlacement?: string;
  contentRole?: string;
  suggestedExpression?: string;
  caution?: string;
  scores?: {
    label: string;
    value: number;
    explanation?: string;
  }[];
};

export type DailyRadarFeishuMessageInput = {
  date: string;
  appUrl: string;
  generatedAt: string;
  mode: "manual_test" | "scheduled";
  hotspots: FeishuRadarHotspot[];
};

export type FeishuSendResult = {
  ok: boolean;
  message: string;
};

export type DailyRadarFeishuPushInput = {
  hotspots?: unknown;
  mode?: "manual_test" | "scheduled";
};
