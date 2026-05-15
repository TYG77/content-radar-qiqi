import type { InspirationMatch } from "@/app/lib/inspiration";

export type FitLevel = "高" | "中" | "低";

export type PurposeLabel =
  | "内容沉淀"
  | "IP显化"
  | "专业信任"
  | "私域引流"
  | "商业转化"
  | "方法论沉淀"
  | "观点表达";

export type SourceVerificationStatus =
  | "verified"
  | "pending"
  | "user_input"
  | "ai_initial"
  | "unsupported";

export type SourceType =
  | "公开网页"
  | "指数平台"
  | "内容平台观察"
  | "社群观察"
  | "手动灵感"
  | "public_web"
  | "user_inspiration"
  | "platform_signal"
  | "manual_observation"
  | "ai_generated";

export type EvidenceLink = {
  title: string;
  url: string;
  platform: string;
  date: string;
  summary: string;
  relevance: string;
};

export type Hotspot = {
  id: string;
  sourceMode?: "web_search" | "platform_signal" | "ai_generated" | "mock" | "user_sources";
  sourceChannel: string;
  sourceType: "AI 今日选题机会" | "模拟行业观察" | "用户导入热点";
  sourceDate: string;
  verifiedAt?: string;
  displayTag?: string;
  sourceCredibility?: "高" | "中" | "待验证";
  credibility?: "高" | "中" | "待验证";
  verificationStatus?: SourceVerificationStatus;
  sourceTitle?: string;
  sourceUrl?: string;
  sourceSummary?: string;
  fitReasonForQiqi?: string;
  sourceWarning?: string;
  evidenceLinks?: EvidenceLink[];
  sourceEvidence: string;
  isRealTimeSource: boolean;
  title: string;
  description: string;
  attentionReason: string;
  fit: FitLevel;
  fitPlatforms: string[];
  purposes: PurposeLabel[];
  reason: string;
  matchedInspirationIds?: string[];
  matchedInspirations?: InspirationMatch[];
  inspirationMatchScore?: number;
  qiqiFitReason?: string;
  howToUseInArticle?: string;
  authenticityBoost?: number;
  conversionBridge?: string;
  useAngle?: string;
  articlePlacement?: string;
  contentRole?: string;
  suggestedExpression?: string;
  caution?: string;
};

export type TopicSource = {
  id: string;
  sourcePlatform: string;
  sourceTitle: string;
  sourceUrl?: string;
  sourceDate?: string;
  sourceSummary: string;
  sourceEvidence?: string;
  keywords: string[];
  sourceCredibility: "高" | "中" | "待验证";
  credibility?: "高" | "中" | "待验证";
  sourceType: SourceType;
  verificationStatus?: SourceVerificationStatus;
  evidenceLinks?: EvidenceLink[];
  fitReasonForQiqi?: string;
  createdAt: string;
};

export type PlatformFit = {
  platform: "公众号" | "小红书" | "抖音/视频号口播" | "朋友圈";
  fit: FitLevel;
  reason: string;
  format: string;
};

export type ScoreItem = {
  label: string;
  value: number;
  explanation: string;
};

export type WritingPlan = {
  angle: string;
  mainPoint: string;
  subheadings: string[];
  platformPriority: { platform: string; priority: string; reason: string }[];
  risks: string[];
};

export type Topic = {
  title: string;
  angle: string;
  purpose: PurposeLabel;
  reason: string;
  totalScore: number;
  recommendLevel: "优先写" | "可作为延展" | "暂缓";
  isPriority: boolean;
  recommendReason: string;
  scores: ScoreItem[];
  platformFits: PlatformFit[];
  matchedInspirationIds?: string[];
  matchedInspirations?: InspirationMatch[];
  inspirationMatchScore?: number;
  qiqiFitReason?: string;
  howToUseInArticle?: string;
  authenticityBoost?: number;
  conversionBridge?: string;
  articleUsePlan?: string;
  useAngle?: string;
  articlePlacement?: string;
  contentRole?: string;
  suggestedExpression?: string;
  caution?: string;
};

export type ArticleOutline = {
  title: string;
  sections: { label: string; text: string }[];
  keywords: string[];
};

export type ArticleDraft = {
  status: "正文生成中" | "已生成正文";
  title: string;
  intro: string;
  sections: { heading: string; paragraphs: string[] }[];
  ending: string;
};

export type MultiPlatformPlan = {
  xiaohongshu: {
    titles: { type: string; text: string }[];
    covers: string[];
    body: {
      hook: string;
      pain: string;
      judgment: string;
      tips: string[];
      ending: string;
    };
    cards: {
      title: string;
      body: string;
      layout: string;
      prompt: string;
      keyword: string;
    }[];
    tags: string[];
    note: string;
    design: {
      cover: string;
      style: string;
    };
  };
  video: {
    platforms: string;
    title: string;
    hook: string;
    covers: string[];
    cover: string;
    points: string[];
    ending: string;
    duration: string;
    subtitles: string[];
    script: { label: string; text: string; shot: string; subtitle: string; sticker: string }[];
    editingTips: string[];
    keywords: string[];
    bgm: string;
    soundEffects: string[];
  };
  moments: { type: string; text: string }[];
  platformSummary: { platform: string; focus: string }[];
};

export type InspirationType =
  | "客户沟通"
  | "行业观察"
  | "女性健康"
  | "私域运营"
  | "IP操盘"
  | "短视频选题"
  | "公众号切入点"
  | "金句片段"
  | "AI工具观察"
  | "私域转化话题"
  | "其他";

export type InspirationRecommendedUse =
  | "公众号选题"
  | "短视频口播"
  | "小红书图文"
  | "朋友圈观点"
  | "私域素材"
  | "暂存观察";

export type InspirationCandidate = {
  title: string;
  content: string;
  type: InspirationType;
  tags: string[];
  source: string;
  summary: string;
  recommendedUse: InspirationRecommendedUse;
  reason: string;
  status: "draft";
};

export type InspirationAnalysisResult = {
  inspirations: InspirationCandidate[];
};

export type HotspotAnalysis = {
  totalScore?: number;
  recommendLevel?: "优先写" | "可作为延展" | "暂缓";
  oneSentenceJudgment?: string;
  recommendReasons?: { label: string; text: string }[];
  writingPlan?: WritingPlan;
  reasons: { keyword: string; text: string }[];
  topics: Topic[];
};

export type AiTask =
  | "testConnection"
  | "fetchTopicSources"
  | "generateTodayHotspots"
  | "generateHotspotsFromSources"
  | "enrichHotspotWithSources"
  | "hotspotDetail"
  | "analyzeHotspot"
  | "recommendTopics"
  | "breakdownTopic"
  | "generateOutline"
  | "generateDraft"
  | "optimizeDraft"
  | "generateXiaohongshu"
  | "generateVideoScript"
  | "generateMoments"
  | "generateMultiPlatform"
  | "optimizeXiaohongshu"
  | "optimizeVideoScript"
  | "inspirationAnalyze";

export type AiRequest = {
  task: AiTask;
  payload: {
    keyword?: string;
    profileContext?: string;
    sourceType?: string;
    sourcePlatform?: string;
    hotspot?: Hotspot;
    selectedHotspot?: Hotspot;
    topic?: Topic;
    selectedAngle?: Topic;
    selectedContentType?: string;
    outline?: ArticleOutline;
    draft?: ArticleDraft;
    xiaohongshu?: MultiPlatformPlan["xiaohongshu"];
    video?: MultiPlatformPlan["video"];
    today?: string;
    costMode?: string;
    userNote?: string;
    uploadedTextMaterials?: string;
    sources?: TopicSource[];
    rawText?: string;
    matchedInspirationIds?: string[];
    matchedInspirations?: InspirationMatch[];
    inspirationMatchScore?: number;
    qiqiFitReason?: string;
    howToUseInArticle?: string;
    authenticityBoost?: number;
    conversionBridge?: string;
    useAngle?: string;
    articlePlacement?: string;
    contentRole?: string;
    suggestedExpression?: string;
    caution?: string;
  };
};
