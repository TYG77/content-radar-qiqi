import type { DailyRadarFeishuMessageInput, FeishuRadarHotspot } from "./types";

const MAX_HOTSPOTS = 4;
const MAX_TITLE_LENGTH = 44;
const MAX_REASON_LENGTH = 86;
const MAX_SOURCE_LENGTH = 86;
const MAX_PLATFORM_COUNT = 5;

type DecisionScore = {
  hotScore: number;
  ipFitScore: number;
  articleScore: number;
  conversionScore: number;
  sourceScore: number;
  totalScore: number;
};

type ScoredHotspot = FeishuRadarHotspot & {
  decisionScore: DecisionScore;
  originalIndex: number;
};

export function buildDailyRadarFeishuMessage(input: DailyRadarFeishuMessageInput) {
  const scoredHotspots = input.hotspots
    .slice(0, MAX_HOTSPOTS)
    .map((hotspot, index) => ({
      ...hotspot,
      originalIndex: index,
      decisionScore: scoreHotspot(hotspot),
    }));
  const recommended = pickRecommendedHotspot(scoredHotspots);
  const workspaceUrl = withQuery(input.appUrl, { from: "feishu" });
  const todayUrl = withQuery(input.appUrl, {
    from: "feishu",
    view: "today",
    recommended: "1",
  });
  const elements = [
    {
      tag: "div",
      text: {
        tag: "lark_md",
        content: `**日期**：${safeText(input.date, "今日")}\n**生成时间**：${safeText(
          input.generatedAt,
          "刚刚",
        )}\n今天为你筛选出 ${scoredHotspots.length || 0} 个值得深挖的内容机会。`,
      },
    },
    { tag: "hr" },
    recommended ? buildRecommendationBlock(recommended) : buildEmptyHotspotBlock(),
    { tag: "hr" },
    ...(scoredHotspots.length
      ? scoredHotspots.map(formatHotspotCardBlock)
      : [buildEmptyHotspotBlock()]),
    { tag: "hr" },
    {
      tag: "action",
      actions: [
        {
          tag: "button",
          text: {
            tag: "plain_text",
            content: "打开内容雷达工作台",
          },
          url: workspaceUrl,
          type: "primary",
        },
        {
          tag: "button",
          text: {
            tag: "plain_text",
            content: "查看今日推荐选题",
          },
          url: todayUrl,
          type: "default",
        },
      ],
    },
  ];

  return {
    msg_type: "interactive",
    card: {
      config: {
        wide_screen_mode: true,
      },
      header: {
        template: "orange",
        title: {
          tag: "plain_text",
          content: "陈七七77 今日内容选题雷达",
        },
      },
      elements,
    },
  };
}

function buildRecommendationBlock(hotspot: ScoredHotspot) {
  const title = truncate(safeText(hotspot.title, "未命名选题"), MAX_TITLE_LENGTH);
  const reason = buildRecommendationReason(hotspot);

  return {
    tag: "div",
    text: {
      tag: "lark_md",
      content: [
        `<font color="orange">**今日优先推荐：第 ${hotspot.originalIndex + 1} 条《${escapeLarkMd(
          title,
        )}》**</font>`,
        `推荐原因：${escapeLarkMd(reason)}`,
      ].join("\n"),
    },
  };
}

function formatHotspotCardBlock(hotspot: ScoredHotspot) {
  const title = truncate(safeText(hotspot.title, "未命名选题"), MAX_TITLE_LENGTH);
  const reason = truncate(
    safeText(
      hotspot.recommendReason || hotspot.reason || hotspot.attentionReason,
      "适合继续拆解为今日内容选题。",
    ),
    MAX_REASON_LENGTH,
  );
  const source = truncate(
    safeText(hotspot.sourceEvidence || hotspot.sourceChannel, "内容雷达选题信号。"),
    MAX_SOURCE_LENGTH,
  );
  const platforms = formatPlatforms(hotspot.fitPlatforms);
  const verification = formatVerification(hotspot);
  const action = buildActionSuggestion(hotspot);
  const score = hotspot.decisionScore;

  return {
    tag: "div",
    text: {
      tag: "lark_md",
      content: [
        `<font color="orange">**${String(hotspot.originalIndex + 1).padStart(
          2,
          "0",
        )}｜${escapeLarkMd(title)}**</font>`,
        `**综合推荐分：${score.totalScore} / 100｜${getScoreLevel(score.totalScore)}**`,
        `热点相关度 ${score.hotScore}｜七七IP匹配度 ${score.ipFitScore}｜公众号成文价值 ${score.articleScore}`,
        `私域转化价值 ${score.conversionScore}｜来源可信度 ${score.sourceScore}`,
        "",
        `推荐理由：${escapeLarkMd(reason)}`,
        "",
        `> 【来源信号】${escapeLarkMd(source)}`,
        `> 【适合平台】${escapeLarkMd(platforms)}`,
        `> 【验证状态】${escapeLarkMd(verification)}`,
        `> 【操作建议】${escapeLarkMd(action)}`,
      ].join("\n"),
    },
  };
}

function buildEmptyHotspotBlock() {
  return {
    tag: "div",
    text: {
      tag: "lark_md",
      content: "今日暂未生成选题。\n你可以打开内容雷达工作台，先刷新今日选题或添加来源。",
    },
  };
}

function pickRecommendedHotspot(hotspots: ScoredHotspot[]) {
  return [...hotspots].sort((left, right) => {
    const scoreDiff = right.decisionScore.totalScore - left.decisionScore.totalScore;
    if (scoreDiff !== 0) return scoreDiff;
    return right.decisionScore.articleScore - left.decisionScore.articleScore;
  })[0];
}

function scoreHotspot(hotspot: FeishuRadarHotspot): DecisionScore {
  const existingTotal = normalizeExistingTotalScore(hotspot.totalScore);
  const hotScore = getExistingDimensionScore(hotspot, ["热点", "热度", "相关"]) ?? buildHotScore(hotspot);
  const ipFitScore =
    getExistingDimensionScore(hotspot, ["匹配", "IP", "身份"]) ?? buildIpFitScore(hotspot);
  const articleScore =
    getExistingDimensionScore(hotspot, ["公众号", "成文", "表达"]) ?? buildArticleScore(hotspot);
  const conversionScore =
    getExistingDimensionScore(hotspot, ["私域", "转化", "商业"]) ?? buildConversionScore(hotspot);
  const sourceScore =
    getExistingDimensionScore(hotspot, ["来源", "可信", "验证"]) ?? buildSourceScore(hotspot);
  const computedTotal = Math.round(
    hotScore * 0.2 +
      ipFitScore * 0.3 +
      articleScore * 0.25 +
      conversionScore * 0.15 +
      sourceScore * 0.1,
  );

  return {
    hotScore,
    ipFitScore,
    articleScore,
    conversionScore,
    sourceScore,
    totalScore: existingTotal ?? computedTotal,
  };
}

function normalizeExistingTotalScore(value: number | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  return clampScore(value <= 10 ? Math.round(value * 10) : Math.round(value));
}

function getExistingDimensionScore(hotspot: FeishuRadarHotspot, labels: string[]) {
  const matched = hotspot.scores?.find((score) =>
    labels.some((label) => score.label.includes(label)),
  );
  if (!matched || typeof matched.value !== "number") return undefined;
  return clampScore(matched.value <= 10 ? Math.round(matched.value * 10) : Math.round(matched.value));
}

function buildHotScore(hotspot: FeishuRadarHotspot) {
  const text = hotspotText(hotspot);
  let score = 68;
  if (hasAny(text, ["热点", "趋势", "AI", "搜索", "公开网页", "Tavily", "平台信号"])) score += 14;
  if (hotspot.sourceEvidence || hotspot.sourceChannel) score += 8;
  return clampScore(score);
}

function buildIpFitScore(hotspot: FeishuRadarHotspot) {
  const text = hotspotText(hotspot);
  let score = 66;
  if (hasAny(text, ["大健康", "健康", "营养师", "女性健康"])) score += 12;
  if (hasAny(text, ["IP", "内容", "操盘", "私域", "商业闭环"])) score += 14;
  return clampScore(score);
}

function buildArticleScore(hotspot: FeishuRadarHotspot) {
  const text = hotspotText(hotspot);
  let score = hasPlatform(hotspot, "公众号") ? 78 : 68;
  if (hasAny(text, ["方法", "观点", "拆解", "案例", "信任", "策略"])) score += 10;
  return clampScore(score);
}

function buildConversionScore(hotspot: FeishuRadarHotspot) {
  const text = hotspotText(hotspot);
  let score = hasPlatform(hotspot, "私域") ? 78 : 66;
  if (hasAny(text, ["咨询", "陪跑", "承接", "转化", "私域", "服务", "商业"])) score += 12;
  return clampScore(score);
}

function buildSourceScore(hotspot: FeishuRadarHotspot) {
  const credibility = safeText(hotspot.credibility || hotspot.sourceCredibility, "");
  const status = safeText(hotspot.verificationStatus, "");
  if (credibility === "高" || status === "verified") return 90;
  if (credibility === "中" || status === "user_input") return 78;
  if (status === "pending" || credibility === "待验证") return 68;
  return hotspot.sourceEvidence || hotspot.sourceChannel ? 72 : 60;
}

function buildRecommendationReason(hotspot: ScoredHotspot) {
  const score = hotspot.decisionScore;
  const strengths = [];
  if (score.hotScore >= 82) strengths.push("热点强");
  if (score.ipFitScore >= 82) strengths.push("与七七的大健康IP操盘手定位匹配度高");
  if (score.articleScore >= 82) strengths.push("适合发展成公众号深度文");
  if (score.conversionScore >= 80) strengths.push("能自然承接内容陪跑/咨询服务");

  return strengths.length
    ? `${strengths.slice(0, 3).join("，")}。建议优先拆成公众号主文，再延展到多平台。`
    : "综合分最高，适合先判断是否能沉淀成陈七七的专业观点和私域承接方法。";
}

function buildActionSuggestion(hotspot: ScoredHotspot) {
  if (hasPlatform(hotspot, "公众号") && hotspot.decisionScore.articleScore >= 78) {
    return "优先写公众号深度文，再拆成小红书/视频号素材。";
  }
  if (hasPlatform(hotspot, "视频") || hasPlatform(hotspot, "视频号")) return "适合短视频口播切入。";
  if (hasPlatform(hotspot, "小红书")) return "适合小红书图文做收藏型表达。";
  if (hasPlatform(hotspot, "私域")) return "适合作为私域转化素材。";
  return "适合先在工作台拆解角度，再决定内容载体。";
}

function formatPlatforms(value: string[] | undefined) {
  const platforms = Array.isArray(value)
    ? value.map((item) => safeText(item, "")).filter(Boolean).slice(0, MAX_PLATFORM_COUNT)
    : [];

  return platforms.length ? platforms.join(" / ") : "公众号 / 小红书 / 视频号 / 朋友圈";
}

function formatVerification(hotspot: FeishuRadarHotspot) {
  const status = normalizeVerificationStatus(hotspot.verificationStatus);
  const credibility = safeText(hotspot.credibility || hotspot.sourceCredibility, "");

  if (credibility) return `可信度：${credibility}`;
  return status;
}

function normalizeVerificationStatus(value: string | undefined) {
  const status = safeText(value, "待验证");
  if (status === "pending") return "待验证";
  if (status === "verified") return "已验证";
  if (status === "user_input") return "用户录入";
  if (status === "ai_initial") return "AI 初筛";
  if (status === "unsupported") return "暂不支持验证";
  return status;
}

function getScoreLevel(score: number) {
  if (score >= 85) return "高推荐";
  if (score >= 70) return "可写";
  return "备选";
}

function hotspotText(hotspot: FeishuRadarHotspot) {
  return [
    hotspot.title,
    hotspot.reason,
    hotspot.recommendReason,
    hotspot.attentionReason,
    hotspot.sourceEvidence,
    hotspot.sourceChannel,
    ...(hotspot.fitPlatforms ?? []),
  ]
    .filter(Boolean)
    .join(" ");
}

function hasAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function hasPlatform(hotspot: FeishuRadarHotspot, platform: string) {
  return hotspot.fitPlatforms?.some((item) => item.includes(platform)) ?? false;
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function withQuery(appUrl: string, params: Record<string, string>) {
  const query = new URLSearchParams(params).toString();
  const separator = appUrl.includes("?") ? "&" : "?";
  return `${appUrl}${separator}${query}`;
}

function safeText(value: string | undefined, fallback: string) {
  const text = typeof value === "string" ? value.trim() : "";
  return text && text !== "undefined" && text !== "null" ? text : fallback;
}

function truncate(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;
}

function escapeLarkMd(value: string) {
  return value.replace(/</g, "< ").replace(/>/g, " >");
}
