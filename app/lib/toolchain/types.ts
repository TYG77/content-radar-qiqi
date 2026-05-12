export type ToolchainTask =
  | "source_search"
  | "source_verify"
  | "topic_rank"
  | "angle_generate"
  | "outline_generate"
  | "article_write"
  | "style_rewrite"
  | "layout_render"
  | "cover_generate"
  | "draft_publish"
  | "feishu_push";

export type ToolchainProvider =
  | "manual"
  | "manual_source"
  | "tavily"
  | "openai"
  | "openai_web_search"
  | "deepseek"
  | "wechat_html_template"
  | "manual_upload"
  | "ai_cover"
  | "wechat_draft_api"
  | "feishu_webhook"
  | "newrank"
  | "douyin_index"
  | "xiaohongshu_observation"
  | "oceanengine_trend"
  | "feishu_inspiration"
  | "douyin_official"
  | "video_account_signal";

export type CostLevel = "free" | "low" | "medium" | "high";

export type ToolchainTaskConfig = {
  task: ToolchainTask;
  defaultProvider: ToolchainProvider;
  fallbackProvider?: ToolchainProvider;
  costLevel: CostLevel;
  requiresEvidence: boolean;
  notes: string;
};

export type ToolchainProviderStatus = "connected" | "not_connected" | "reserved";

export type ToolchainProviderConfig = {
  provider: ToolchainProvider;
  status: ToolchainProviderStatus;
  priority: number;
  notes: string;
};
