export type InspirationRecord = {
  id: string;
  title: string;
  content: string;
  type?: string;
  tags?: string[];
  source?: string;
  notes?: string;
  summary?: string;
  recommendedUse?: string;
  status?: string;
};

export type HotspotRecord = {
  id?: string;
  title: string;
  description?: string;
  reason?: string;
  attentionReason?: string;
  fitPlatforms?: string[];
  purposes?: string[];
  sourceChannel?: string;
};

export type InspirationMatch = {
  id: string;
  title: string;
  summary: string;
  type: string;
  tags: string[];
  recommendedUse: string;
  matchScore: number;
  matchReason: string;
  useAngle: string;
  articlePlacement: string;
  contentRole: string;
  suggestedExpression: string;
  caution: string;
  articleUsePlan: string;
  status: string;
};

export type InspirationMatchResult = {
  matchedInspirationIds: string[];
  matchedInspirations: InspirationMatch[];
  inspirationMatchScore: number;
  qiqiFitReason: string;
  howToUseInArticle: string;
  authenticityBoost: number;
  conversionBridge: string;
};

const ACTIVE_STATUSES = new Set(["draft", "topic_ready", "outline_ready"]);
const CORE_KEYWORDS = [
  "大健康",
  "健康",
  "营养师",
  "女性健康",
  "私域",
  "IP",
  "操盘",
  "内容",
  "选题",
  "公众号",
  "短视频",
  "小红书",
  "AI",
  "工具",
  "信任",
  "转化",
  "咨询",
  "客户",
  "沟通",
  "复盘",
  "案例",
  "观察",
  "服务",
];

export function matchInspirationsToHotspot(
  hotspot: HotspotRecord,
  inspirations: InspirationRecord[],
): InspirationMatchResult {
  const activeInspirations = inspirations.filter((item) => isActiveInspiration(item.status));

  const scored = activeInspirations
    .map((item) => scoreInspirationMatch(hotspot, item))
    .filter((item) => item.matchScore > 0)
    .sort((left, right) => right.matchScore - left.matchScore)
    .slice(0, 3);

  const matchedInspirationIds = scored.map((item) => item.id);
  const topScore = scored[0]?.matchScore ?? 0;
  const authenticityBoost = getAuthenticityBoost(topScore, scored.length);

  return {
    matchedInspirationIds,
    matchedInspirations: scored,
    inspirationMatchScore: topScore,
    qiqiFitReason: buildQiqiFitReason(hotspot, scored),
    howToUseInArticle: buildHowToUseInArticle(scored),
    authenticityBoost,
    conversionBridge: buildConversionBridge(hotspot, scored),
  };
}

export function collectInspirationUsage(
  hotspots: HotspotRecord[],
  inspirations: InspirationRecord[],
) {
  const usage: Record<string, string[]> = {};

  for (const hotspot of hotspots) {
    const match = matchInspirationsToHotspot(hotspot, inspirations);
    for (const inspirationId of match.matchedInspirationIds) {
      const titles = usage[inspirationId] ?? [];
      if (hotspot.title && !titles.includes(hotspot.title)) {
        titles.push(hotspot.title);
      }
      usage[inspirationId] = titles;
    }
  }

  return usage;
}

function scoreInspirationMatch(
  hotspot: HotspotRecord,
  inspiration: InspirationRecord,
): InspirationMatch {
  const hotspotSignals = buildSignals(hotspot);
  const inspirationSignals = buildSignals(inspiration);
  const sharedKeywords = CORE_KEYWORDS.filter(
    (keyword) => hotspotSignals.includes(keyword) && inspirationSignals.includes(keyword),
  );
  const sharedTitlePieces = splitMeaningfulParts(inspiration.title).filter((part) =>
    hotspotSignals.includes(part),
  );
  const sharedSourcePieces = splitMeaningfulParts(inspiration.source ?? "").filter((part) =>
    hotspotSignals.includes(part),
  );

  let score = 0;
  score += Math.min(sharedKeywords.length * 8, 32);
  score += Math.min(sharedTitlePieces.length * 10, 20);
  score += Math.min(sharedSourcePieces.length * 6, 12);
  score += getTypeAlignmentBonus(hotspotSignals, inspiration);
  score += getUseAlignmentBonus(hotspotSignals, inspiration);
  score += getFormatAlignmentBonus(hotspotSignals, inspiration);

  const summary = inspiration.summary?.trim() || trimSummary(inspiration.content);
  const useAngle = buildUseAngle(hotspot, inspiration, sharedKeywords, sharedTitlePieces);
  const articlePlacement = buildArticlePlacement(inspiration, sharedKeywords, sharedTitlePieces);
  const contentRole = buildContentRole(inspiration, sharedKeywords, sharedTitlePieces);
  const suggestedExpression = buildSuggestedExpression(inspiration, useAngle, articlePlacement);
  const caution = buildCaution(inspiration, score);

  return {
    id: inspiration.id,
    title: inspiration.title,
    summary,
    type: inspiration.type || "其他",
    tags: normalizeTags(inspiration.tags),
    recommendedUse: inspiration.recommendedUse || "暂存观察",
    matchScore: Math.min(100, Math.round(score)),
    matchReason: buildMatchReason(sharedKeywords, sharedTitlePieces, inspiration, useAngle, articlePlacement),
    useAngle,
    articlePlacement,
    contentRole,
    suggestedExpression,
    caution,
    articleUsePlan: `${articlePlacement}：${contentRole}`,
    status: inspiration.status || "draft",
  };
}

function buildSignals(value: {
  title?: string;
  content?: string;
  description?: string;
  reason?: string;
  attentionReason?: string;
  sourceChannel?: string;
  source?: string;
  notes?: string;
  summary?: string;
  type?: string;
  recommendedUse?: string;
  fitPlatforms?: string[];
  purposes?: string[];
  tags?: string[];
}) {
  return [
    value.title,
    value.content,
    value.description,
    value.reason,
    value.attentionReason,
    value.sourceChannel,
    value.source,
    value.notes,
    value.summary,
    value.type,
    value.recommendedUse,
    ...(value.fitPlatforms ?? []),
    ...(value.purposes ?? []),
    ...(value.tags ?? []),
  ]
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .join(" ");
}

function splitMeaningfulParts(value: string) {
  return value
    .split(/[\s，。；;、|/]+/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 2)
    .slice(0, 12);
}

function trimSummary(value: string) {
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned.length > 110 ? `${cleaned.slice(0, 110)}...` : cleaned;
}

function normalizeTags(tags?: string[]) {
  return Array.isArray(tags) ? tags.filter((tag) => typeof tag === "string" && tag.trim()).slice(0, 8) : [];
}

function isActiveInspiration(status?: string) {
  return ACTIVE_STATUSES.has(status ?? "draft");
}

function getTypeAlignmentBonus(hotspotSignals: string, inspiration: InspirationRecord) {
  const type = inspiration.type ?? "";
  if (!type) return 0;
  if (hotspotSignals.includes("AI") && type.includes("AI")) return 14;
  if (hotspotSignals.includes("私域") && (type.includes("私域") || type.includes("转化"))) return 12;
  if (hotspotSignals.includes("女性健康") && type.includes("女性健康")) return 14;
  if (hotspotSignals.includes("营养师") && (type.includes("客户沟通") || type.includes("女性健康"))) return 8;
  if (hotspotSignals.includes("公众号") && type.includes("公众号")) return 10;
  return 0;
}

function getUseAlignmentBonus(hotspotSignals: string, inspiration: InspirationRecord) {
  const use = inspiration.recommendedUse ?? "";
  if (!use) return 0;
  if (hotspotSignals.includes("公众号") && use.includes("公众号")) return 10;
  if (hotspotSignals.includes("短视频") && use.includes("短视频")) return 8;
  if (hotspotSignals.includes("小红书") && use.includes("小红书")) return 8;
  if (hotspotSignals.includes("私域") && use.includes("私域")) return 10;
  if (use.includes("暂存观察")) return 2;
  return 0;
}

function getFormatAlignmentBonus(hotspotSignals: string, inspiration: InspirationRecord) {
  const content = buildSignals(inspiration);
  if (hotspotSignals.includes("案例") || hotspotSignals.includes("观察")) {
    if (content.includes("客户") || content.includes("复盘") || content.includes("项目")) return 8;
  }
  if (hotspotSignals.includes("转化") || hotspotSignals.includes("服务")) {
    if (content.includes("私域") || content.includes("咨询") || content.includes("服务")) return 8;
  }
  return 0;
}

function buildUseAngle(
  hotspot: HotspotRecord,
  inspiration: InspirationRecord,
  sharedKeywords: string[],
  sharedTitlePieces: string[],
) {
  const title = inspiration.title.trim();
  const summary = trimSummary(inspiration.summary || inspiration.content);
  const type = inspiration.type ?? "";
  const hasServiceSignal =
    buildSignals(inspiration).includes("私域") ||
    buildSignals(inspiration).includes("咨询") ||
    buildSignals(inspiration).includes("服务");

  if (type.includes("客户沟通")) {
    return "大健康 IP 不缺知识，缺的是把专业判断翻成用户听得懂、愿意相信的表达。";
  }
  if (type.includes("行业观察")) {
    return "这个热点背后真正值得写的，不是热度本身，而是行业判断和用户心智的变化。";
  }
  if (type.includes("女性健康")) {
    return "真正能打动用户的，不是生硬科普，而是把专业和真实场景连起来的表达。";
  }
  if (type.includes("私域运营") || type.includes("私域转化")) {
    return "内容不是写完就结束，真正的价值在于它怎么自然接到信任和服务。";
  }
  if (type.includes("IP操盘")) {
    return "这个角度更适合当作操盘观察，帮助文章从工具讨论转向方法论判断。";
  }
  if (sharedKeywords.length || sharedTitlePieces.length) {
    return `从「${title}」里提炼出的可用角度是：${summary}。`;
  }
  if (hasServiceSignal) {
    return "这条灵感适合用来讲七七如何从内容过渡到咨询、陪跑或私域承接。";
  }
  return `可以把这条灵感当作「${hotspot.title}」的背景观察，作为文章的一个真实切口。`;
}

function buildArticlePlacement(
  inspiration: InspirationRecord,
  sharedKeywords: string[],
  sharedTitlePieces: string[],
) {
  const type = inspiration.type ?? "";
  if (type.includes("客户沟通") || type.includes("私域转化")) return "引言 / 第一部分";
  if (type.includes("行业观察")) return "第二部分 / 观点论证";
  if (type.includes("女性健康")) return "案例段 / 反差段";
  if (type.includes("AI工具观察")) return "转折段 / 方法对比";
  if (type.includes("金句片段")) return "标题 / 小标题 / 结尾金句";
  if (type.includes("私域运营") || type.includes("IP操盘")) return "结尾服务承接 / 方法论总结";
  if (sharedKeywords.length || sharedTitlePieces.length) return "引言 / 第一部分";
  return "背景观察 / 正文案例段";
}

function buildContentRole(
  inspiration: InspirationRecord,
  sharedKeywords: string[],
  sharedTitlePieces: string[],
) {
  const type = inspiration.type ?? "";
  if (type.includes("客户沟通")) return "真实案例";
  if (type.includes("行业观察")) return "操盘观察";
  if (type.includes("女性健康")) return "痛点证明";
  if (type.includes("私域运营")) return "服务承接";
  if (type.includes("IP操盘")) return "观点支撑";
  if (type.includes("金句片段")) return "金句提炼";
  if (sharedKeywords.length || sharedTitlePieces.length) return "反差切入";
  return "背景观察";
}

function buildSuggestedExpression(
  inspiration: InspirationRecord,
  useAngle: string,
  articlePlacement: string,
) {
  const type = inspiration.type ?? "";
  if (type.includes("客户沟通")) {
    return "可以写成“我在服务客户时发现……”或“我最近和一位营养师聊天时意识到……”";
  }
  if (type.includes("行业观察")) {
    return "可以写成“我最近在行业里看到一个很明显的变化……”";
  }
  if (type.includes("女性健康")) {
    return "可以写成“这个问题在女性健康内容里很常见，关键不是知识量，而是怎么讲给用户听……”";
  }
  if (type.includes("私域运营") || type.includes("IP操盘")) {
    return "可以写成“从操盘视角看，这件事真正决定成败的不是工具，而是表达和承接……”";
  }
  if (type.includes("金句片段")) {
    return "适合压缩成一句判断句，放在标题、小标题或结尾收束。";
  }
  return `可以先用一句判断把它接到「${useAngle}」，再放到 ${articlePlacement}，避免整段硬塞案例。`;
}

function buildCaution(inspiration: InspirationRecord, score: number) {
  const base = score < 35 ? "可作为背景观察，不建议作为主案例。" : "不要把单个案例包装成行业普遍结论。";
  if ((inspiration.source ?? "").includes("待验证")) {
    return `${base} 记得用“我在项目里观察到”这类表达，不要写成真实行业数据。`;
  }
  return `${base} 如果只是个人观察，只能表达为“我在项目里观察到”。`;
}

function buildMatchReason(
  sharedKeywords: string[],
  sharedTitlePieces: string[],
  inspiration: InspirationRecord,
  useAngle: string,
  articlePlacement: string,
) {
  const parts: string[] = [];
  if (sharedKeywords.length) {
    parts.push(`和热点共享了 ${sharedKeywords.slice(0, 3).join("、")} 这些判断信号`);
  }
  if (sharedTitlePieces.length) {
    parts.push(`标题里能直接提炼出 ${sharedTitlePieces.slice(0, 2).join("、")} 这样的可用角度`);
  }
  if (inspiration.type) {
    parts.push(`它更像一个${inspiration.type}场景下的真实操盘观察`);
  }
  if (useAngle) {
    parts.push(`可以把它转成“${useAngle}”这样的文章角度`);
  }
  if (articlePlacement) {
    parts.push(`适合放在 ${articlePlacement}`);
  }
  return parts.length ? parts.join("，") : "和当前热点有基础语义重合，适合作为背景观察。";
}

function buildHowToUseInArticle(matches: InspirationMatch[]) {
  if (!matches.length) return "暂无强相关灵感，可先作为外部热点观察。";
  return matches
    .map((match) => `${match.title}：${match.useAngle}；${match.articlePlacement}`)
    .slice(0, 3)
    .join("；");
}

function buildQiqiFitReason(hotspot: HotspotRecord, matches: InspirationMatch[]) {
  if (!matches.length) {
    return "目前没有强相关灵感，适合作为外部热点观察，后续再补真实项目角度。";
  }

  const top = matches[0];
  const parts = [
    `这个热点可以借助「${top.useAngle}」补上七七真实操盘视角`,
    hotspot.title ? `并把「${hotspot.title}」写得更像七七会写的内容` : "",
    top.matchReason,
  ].filter(Boolean);

  return parts.join("，");
}

function buildConversionBridge(hotspot: HotspotRecord, matches: InspirationMatch[]) {
  const signal = buildSignals(hotspot);
  if (signal.includes("私域") || signal.includes("咨询")) {
    return "可自然承接到私域诊断、内容陪跑或咨询服务。";
  }
  if (signal.includes("AI") || signal.includes("工具")) {
    return "可承接到 AI 工具落地、选题方法和提效服务。";
  }
  if (signal.includes("营养师") || signal.includes("健康")) {
    return "可承接到大健康内容陪跑、专业表达和转化服务。";
  }
  if (matches.length) {
    return "可承接到选题共创、内容打磨和私域转化咨询。";
  }
  return "适合作为普通热点观察，不强行承接服务。";
}

function getAuthenticityBoost(topScore: number, matchCount: number) {
  if (topScore >= 70) return Math.min(20, 12 + matchCount * 2);
  if (topScore >= 50) return Math.min(16, 8 + matchCount * 2);
  if (topScore >= 35) return Math.min(10, 5 + matchCount);
  if (topScore >= 20) return 3;
  return 0;
}
