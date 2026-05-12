export type FitLevel = "高" | "中" | "低";

export type PurposeLabel =
  | "内容沉淀"
  | "IP显化"
  | "专业信任"
  | "私域引流"
  | "商业转化"
  | "方法论沉淀"
  | "观点表达";

export type ContentRadarHotspot = {
  id: string;
  sourceMode?: "web_search" | "platform_signal" | "ai_generated" | "mock";
  sourceChannel: string;
  sourceType: "AI 今日选题机会" | "模拟行业观察" | "用户导入热点";
  sourceDate: string;
  verifiedAt?: string;
  displayTag?: string;
  sourceCredibility?: "高" | "中" | "待验证";
  sourceWarning?: string;
  evidenceLinks?: {
    title: string;
    url: string;
    platform: string;
    date: string;
    summary: string;
    relevance: string;
  }[];
  sourceEvidence: string;
  isRealTimeSource: boolean;
  title: string;
  description: string;
  attentionReason: string;
  fit: FitLevel;
  fitPlatforms: string[];
  purposes: PurposeLabel[];
  reason: string;
};

export type ScoreItem = {
  label: string;
  value: number;
  explanation: string;
};

export type PlatformFit = {
  platform: "公众号" | "小红书" | "抖音/视频号口播" | "朋友圈";
  fit: FitLevel;
  reason: string;
  format: string;
};

export type ContentRadarTopic = {
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
};

export type DailyRadarTopic = ContentRadarTopic & {
  sourceHotspot: ContentRadarHotspot;
  platforms: string[];
  score: number;
  suggestedOutput: string;
  fitReason: string;
  scoring: {
    profileFit: number;
    depthValue: number;
    conversionPotential: number;
    multiPlatformValue: number;
    freshness: number;
  };
};

export function getDefaultContentRadarHotspots(date = getTodayDateLabel()): ContentRadarHotspot[] {
  return [
    {
      id: "ai-health-assistant",
      sourceChannel: "AI + 大健康",
      sourceType: "模拟行业观察",
      sourceDate: date,
      sourceEvidence:
        "模拟观察：近期多个平台都在讨论 AI 工具如何提升健康内容生产效率，但很少有人讲清专业判断如何保留。",
      isRealTimeSource: false,
      title: "AI 健康助手爆火，大健康从业者如何重新定位自己的价值",
      description: "用户开始用 AI 问健康问题，专业服务者需要重新说明自己的不可替代性。",
      attentionReason:
        "AI 正在改变用户获取健康信息的入口，专业服务者需要重新说明自己的价值边界。",
      fit: "高",
      fitPlatforms: ["公众号", "私域", "视频号"],
      purposes: ["观点表达", "专业信任", "方法论沉淀"],
      reason:
        "这个现象能帮助陈七七表达 AI 不是替代营养师，而是倒逼大健康 IP 建立判断力和服务闭环。",
    },
    {
      id: "xiaohongshu-food-notes",
      sourceChannel: "小红书",
      sourceType: "模拟行业观察",
      sourceDate: date,
      sourceEvidence:
        "内容趋势：健康类图文内容同质化明显，专业差异和信任表达变得更重要。",
      isRealTimeSource: false,
      title: "小红书食养笔记越来越同质化，营养师内容如何做出专业差异",
      description: "食谱、打卡、轻养生笔记大量重复，专业营养师很容易被平台模板淹没。",
      attentionReason:
        "平台内容越模板化，越需要陈七七从专业信任和内容操盘角度拆出差异。",
      fit: "高",
      fitPlatforms: ["公众号", "小红书", "私域"],
      purposes: ["内容沉淀", "IP显化", "专业信任"],
      reason: "适合拆解大健康内容如何从好看走向可信，让陈七七显化内容操盘能力。",
    },
    {
      id: "video-live-conversion",
      sourceChannel: "视频号",
      sourceType: "模拟行业观察",
      sourceDate: date,
      sourceEvidence:
        "模拟观察：健康直播间越来越依赖前置内容教育和私域承接，单场流量不再稳定决定成交。",
      isRealTimeSource: false,
      title: "视频号健康直播转化变难，私域承接比单场流量更重要",
      description: "健康直播间的即时成交难度上升，用户更需要长期教育和私域关系承接。",
      attentionReason:
        "直播成交难度上升时，内容教育、用户信任和私域承接会变成核心竞争力。",
      fit: "高",
      fitPlatforms: ["公众号", "视频号", "私域", "直播"],
      purposes: ["私域引流", "商业转化", "方法论沉淀"],
      reason: "这个热点能自然连接内容、私域和发售闭环，是陈七七的核心操盘场景。",
    },
    {
      id: "tcm-personal-ip",
      sourceChannel: "行业观察",
      sourceType: "模拟行业观察",
      sourceDate: date,
      sourceEvidence:
        "行业现象：中医馆和医生 IP 开始增加，但多数内容仍停留在科普，缺少转化和运营闭环。",
      isRealTimeSource: false,
      title: "中医馆开始做个人 IP，但很多账号只会科普不会转化",
      description: "不少中医馆开始推医生和主理人账号，但内容停留在知识科普，缺少业务承接。",
      attentionReason:
        "越来越多机构开始做 IP，但真正稀缺的是把专业表达接到服务闭环的能力。",
      fit: "高",
      fitPlatforms: ["公众号", "视频号", "私域"],
      purposes: ["方法论沉淀", "商业转化", "专业信任"],
      reason: "适合输出陈七七对大健康 IP 从内容到私域再到成交的系统判断。",
    },
    {
      id: "brand-private-domain",
      sourceChannel: "行业观察",
      sourceType: "模拟行业观察",
      sourceDate: date,
      sourceEvidence:
        "模拟观察：不少大健康品牌已经开始做私域，但常把私域当渠道，没有内容和用户运营节奏。",
      isRealTimeSource: false,
      title: "大健康品牌开始重视私域，但缺少内容和用户运营闭环",
      description: "品牌愿意做社群和私域，却常把私域当渠道，没有形成内容教育和用户运营节奏。",
      attentionReason:
        "私域不是单独渠道，而是内容、关系、服务和成交共同跑起来的系统。",
      fit: "高",
      fitPlatforms: ["公众号", "私域", "直播"],
      purposes: ["商业转化", "私域引流", "方法论沉淀"],
      reason: "非常适合沉淀陈七七的大健康私域运营方法论，并指向服务和项目转化。",
    },
    {
      id: "wechat-depth-content",
      sourceChannel: "公众号",
      sourceType: "模拟行业观察",
      sourceDate: date,
      sourceEvidence:
        "模拟观察：专业型 IP 重新重视公众号长文，因为复杂观点和高信任关系需要内容根据地。",
      isRealTimeSource: false,
      title: "公众号深度内容回暖，专业 IP 需要自己的内容根据地",
      description: "短内容带来曝光，但深度内容更适合沉淀观点、方法论和高信任关系。",
      attentionReason:
        "越复杂的专业判断越需要深度内容承载，公众号仍然适合沉淀方法论。",
      fit: "高",
      fitPlatforms: ["公众号", "私域"],
      purposes: ["内容沉淀", "IP显化", "方法论沉淀"],
      reason: "这个热点直接服务陈七七当前公众号定位，适合解释为什么专业 IP 需要深度内容阵地。",
    },
  ];
}

export function buildTopics(hotspot: ContentRadarHotspot): ContentRadarTopic[] {
  const reader = pickReader(hotspot.title);
  const keyword = getHotspotKeyword(hotspot);
  const businessTopic = makeTopic({
    title: `${keyword}如何接到私域信任闭环`,
    angle: `不只讨论「${hotspot.title}」本身，而是拆解内容如何把读者带到信任和服务承接。`,
    purpose: hotspot.purposes.includes("商业转化") ? "商业转化" : "私域引流",
    reason: `${reader}最容易卡在看见趋势但接不住咨询，这个角度能补上承接路径。`,
    scoreType: "business",
    totalScore: 92,
    level: "优先写",
    isPriority: true,
  });
  const trustTopic = makeTopic({
    title: `${keyword}背后的专业信任怎么建立`,
    angle: `从读者为什么愿意相信这个健康 IP 讲起，拆「${hotspot.description}」背后的关系建立。`,
    purpose: "专业信任",
    reason: "大健康行业的转化先发生在信任，而不是购买动作。",
    scoreType: "trust",
    totalScore: 86,
    level: "可作为延展",
  });
  const methodTopic = makeTopic({
    title: `把${keyword}变成可复用的选题方法`,
    angle: `把「${hotspot.title}」拆成可复用的选题判断标准，沉淀陈七七的操盘框架。`,
    purpose: "方法论沉淀",
    reason: "它能把一次热点判断变成长期可复用的公众号资产。",
    scoreType: "method",
    totalScore: 88,
    level: "可作为延展",
  });

  if (hotspot.id.includes("ai")) {
    return [
      makeTopic({
        title: `${keyword}不能替代专业判断`,
        angle: `从工具提效和健康服务边界切入，讲「${hotspot.title}」里哪些环节不能被自动化。`,
        purpose: "观点表达",
        reason: "它能建立陈七七清醒、不追工具热闹的 AI 工具观。",
        scoreType: "ai",
        totalScore: 94,
        level: "优先写",
        isPriority: true,
      }),
      { ...trustTopic, totalScore: 87 },
      {
        ...businessTopic,
        totalScore: 89,
        recommendLevel: "可作为延展",
        isPriority: false,
      },
    ];
  }

  if (hotspot.id.includes("private") || hotspot.id.includes("live")) {
    return [businessTopic, trustTopic, methodTopic];
  }

  return [methodTopic, trustTopic, businessTopic];
}

export function generateDailyRadarTopTopics(limit = 3): DailyRadarTopic[] {
  return getDefaultContentRadarHotspots()
    .flatMap((hotspot) =>
      buildTopics(hotspot).map((topic) => toDailyRadarTopic(topic, hotspot)),
    )
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
}

export function pickReader(title: string) {
  if (/中医|医馆/.test(title)) return "中医馆主理人和医生 IP";
  if (/品牌|私域/.test(title)) return "健康品牌和私域团队";
  if (/营养师|食养|健康管理师/.test(title)) return "独立营养师和健康管理师";
  if (/AI|工具/.test(title)) return "大健康内容创作者和 AI 共创实践者";
  return "大健康从业者";
}

export function getHotspotKeyword(hotspot: ContentRadarHotspot) {
  if (hotspot.title.includes("AI")) return "AI 工具热";
  if (hotspot.title.includes("小红书") || hotspot.title.includes("食养")) return "食养内容同质化";
  if (hotspot.title.includes("直播")) return "健康直播转化";
  if (hotspot.title.includes("中医")) return "中医馆个人 IP";
  if (hotspot.title.includes("品牌") || hotspot.title.includes("私域")) return "大健康私域";
  if (hotspot.title.includes("公众号")) return "公众号深度内容";
  return "这个行业信号";
}

function makeTopic({
  title,
  angle,
  purpose,
  reason,
  scoreType,
  totalScore,
  level,
  isPriority = false,
}: {
  title: string;
  angle: string;
  purpose: PurposeLabel;
  reason: string;
  scoreType: "ai" | "business" | "trust" | "method";
  totalScore: number;
  level: ContentRadarTopic["recommendLevel"];
  isPriority?: boolean;
}): ContentRadarTopic {
  return {
    title,
    angle,
    purpose,
    reason,
    totalScore,
    recommendLevel: level,
    isPriority,
    recommendReason:
      "这个选题特别适合陈七七，因为它不是单纯讲健康科普，也不是单纯讲 AI 工具，而是能把专业内容、私域运营、用户信任、课程发售和商业闭环联系起来，体现懂专业、懂运营、懂商业、懂 AI 判断的复合能力。",
    scores: buildScores(scoreType),
    platformFits: buildPlatformFits(scoreType),
  };
}

function buildScores(type: "ai" | "business" | "trust" | "method"): ScoreItem[] {
  const presets = {
    ai: [10, 9, 8, 9, 10],
    business: [10, 9, 10, 9, 8],
    trust: [9, 9, 8, 8, 8],
    method: [9, 9, 8, 9, 9],
  }[type];
  const labels = ["人设匹配度", "深度价值", "转化潜力", "一鱼多吃价值", "新鲜度"];
  const explanations = [
    "能同时体现陈七七懂大健康专业、懂私域转化，也懂 AI 或内容工具落地。",
    "击中营养师、中医/医馆、健康品牌和私域团队正在面对的真实困境。",
    "能自然连接后续咨询、陪跑、私域链接或服务转化。",
    "适合拆成公众号、小红书、短视频口播和朋友圈内容，不只服务单篇文章。",
    "能区别于普通 AI 工具分享或泛泛的大健康科普，形成陈七七自己的判断。",
  ];

  return labels.map((label, index) => ({
    label,
    value: presets[index],
    explanation: explanations[index],
  }));
}

function buildPlatformFits(type: "ai" | "business" | "trust" | "method"): PlatformFit[] {
  const highWechat =
    type === "business"
      ? "这个选题需要讲清内容、私域和商业闭环之间的关系，最适合公众号深度沉淀。"
      : "这个选题需要讲清判断逻辑和方法论，适合公众号长文展开。";

  return [
    {
      platform: "公众号",
      fit: "高",
      reason: highWechat,
      format: "深度文章 / 方法论长文",
    },
    {
      platform: "朋友圈",
      fit: type === "method" ? "中" : "高",
      reason: "适合用更个人化的表达显化陈七七的判断和操盘手身份。",
      format: "个人观察 / 专业判断 / 链接型文案",
    },
    {
      platform: "小红书",
      fit: "中",
      reason: "可以拆成图文观点卡，但需要降低理论密度，突出场景和痛点。",
      format: "图文观点卡 / 清单卡 / 场景拆解",
    },
    {
      platform: "抖音/视频号口播",
      fit: "中",
      reason: "适合做成 60-90 秒观点口播，重点表达一个强观点。",
      format: "60-90 秒观点口播",
    },
  ];
}

function toDailyRadarTopic(
  topic: ContentRadarTopic,
  sourceHotspot: ContentRadarHotspot,
): DailyRadarTopic {
  const score = Number((topic.totalScore / 10).toFixed(1));

  return {
    ...topic,
    sourceHotspot,
    platforms: topic.platformFits
      .filter((platformFit) => platformFit.fit === "高" || platformFit.platform === "公众号")
      .map((platformFit) => platformFit.platform),
    score,
    suggestedOutput: buildSuggestedOutput(topic),
    fitReason: topic.recommendReason,
    scoring: {
      profileFit: getScoreValue(topic, "人设匹配度"),
      depthValue: getScoreValue(topic, "深度价值"),
      conversionPotential: getScoreValue(topic, "转化潜力"),
      multiPlatformValue: getScoreValue(topic, "一鱼多吃价值"),
      freshness: getScoreValue(topic, "新鲜度"),
    },
  };
}

function buildSuggestedOutput(topic: ContentRadarTopic) {
  const highPlatforms = topic.platformFits
    .filter((platformFit) => platformFit.fit === "高")
    .map((platformFit) => platformFit.platform);

  if (highPlatforms.includes("朋友圈")) {
    return "公众号深度文一篇，拆成朋友圈项目观察一条，小红书图文或短视频口播各一版。";
  }

  return "公众号方法论文章一篇，拆成小红书图文一组、短视频口播一条。";
}

function getScoreValue(topic: ContentRadarTopic, label: string) {
  return topic.scores.find((score) => score.label === label)?.value ?? 0;
}

function getTodayDateLabel() {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
