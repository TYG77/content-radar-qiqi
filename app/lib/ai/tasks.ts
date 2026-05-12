import {
  AiTaskError,
  generateJsonWithAi,
  generateJsonWithAiMetadata,
  generateTextWithAi,
  getAiProviderConfig,
  getAiProviderMetadata,
  parseJsonFromAi,
  type OpenAIWebSource,
} from "./client";
import { buildPrompt } from "./prompts";
import {
  getSearchProviderConfig,
  searchTopicSources,
  type SearchSourceResult,
} from "@/app/lib/search/client";
import type {
  AiRequest,
  ArticleDraft,
  ArticleOutline,
  Hotspot,
  HotspotAnalysis,
  MultiPlatformPlan,
  TopicSource,
} from "./schemas";

const stringSchema = { type: "string" };
const numberSchema = { type: "number" };
const booleanSchema = { type: "boolean" };
const stringArraySchema = { type: "array", items: stringSchema };
const fitEnum = { type: "string", enum: ["高", "中", "低"] };
const purposeEnum = {
  type: "string",
  enum: ["内容沉淀", "IP显化", "专业信任", "私域引流", "商业转化", "方法论沉淀", "观点表达"],
};

const evidenceLinkSchema = objectSchema({
  title: stringSchema,
  url: stringSchema,
  platform: stringSchema,
  date: stringSchema,
  summary: stringSchema,
  relevance: stringSchema,
});

const hotspotSchema = objectSchema({
  id: stringSchema,
  sourceMode: { type: "string", enum: ["web_search", "platform_signal", "ai_generated", "mock", "user_sources"] },
  sourceChannel: stringSchema,
  sourceType: { type: "string", enum: ["AI 今日选题机会", "模拟行业观察", "用户导入热点"] },
  sourceDate: stringSchema,
  verifiedAt: stringSchema,
  displayTag: stringSchema,
  sourceCredibility: { type: "string", enum: ["高", "中", "待验证"] },
  sourceWarning: stringSchema,
  evidenceLinks: { type: "array", items: evidenceLinkSchema },
  sourceEvidence: stringSchema,
  isRealTimeSource: booleanSchema,
  title: stringSchema,
  description: stringSchema,
  attentionReason: stringSchema,
  fit: fitEnum,
  fitPlatforms: stringArraySchema,
  purposes: { type: "array", items: purposeEnum },
  reason: stringSchema,
});

const todayHotspotsSchema = namedSchema("today_hotspots", {
  hotspots: { type: "array", items: hotspotSchema },
});

const scoreSchema = objectSchema({
  label: stringSchema,
  value: numberSchema,
  explanation: stringSchema,
});

const platformFitSchema = objectSchema({
  platform: { type: "string", enum: ["公众号", "小红书", "抖音/视频号口播", "朋友圈"] },
  fit: fitEnum,
  reason: stringSchema,
  format: stringSchema,
});

const topicSchema = objectSchema({
  title: stringSchema,
  angle: stringSchema,
  purpose: purposeEnum,
  reason: stringSchema,
  totalScore: numberSchema,
  recommendLevel: { type: "string", enum: ["优先写", "可作为延展", "暂缓"] },
  isPriority: booleanSchema,
  recommendReason: stringSchema,
  scores: { type: "array", items: scoreSchema },
  platformFits: { type: "array", items: platformFitSchema },
});

const reasonSchema = objectSchema({
  keyword: stringSchema,
  text: stringSchema,
});

const recommendReasonSchema = objectSchema({
  label: stringSchema,
  text: stringSchema,
});

const platformPrioritySchema = objectSchema({
  platform: stringSchema,
  priority: stringSchema,
  reason: stringSchema,
});

const writingPlanSchema = objectSchema({
  angle: stringSchema,
  mainPoint: stringSchema,
  subheadings: stringArraySchema,
  platformPriority: { type: "array", items: platformPrioritySchema },
  risks: stringArraySchema,
});

const hotspotAnalysisSchema = namedSchema("hotspot_analysis", {
  totalScore: numberSchema,
  recommendLevel: { type: "string", enum: ["优先写", "可作为延展", "暂缓"] },
  oneSentenceJudgment: stringSchema,
  recommendReasons: { type: "array", items: recommendReasonSchema },
  writingPlan: writingPlanSchema,
  reasons: { type: "array", items: reasonSchema },
  topics: { type: "array", items: topicSchema },
});

const outlineSchema = namedSchema("article_outline", {
  title: stringSchema,
  sections: {
    type: "array",
    items: objectSchema({ label: stringSchema, text: stringSchema }),
  },
  keywords: stringArraySchema,
});

const draftSchema = namedSchema("article_draft", {
  status: { type: "string", enum: ["正文生成中", "已生成正文"] },
  title: stringSchema,
  intro: stringSchema,
  sections: {
    type: "array",
    items: objectSchema({
      heading: stringSchema,
      paragraphs: stringArraySchema,
    }),
  },
  ending: stringSchema,
});

const xiaohongshuSchema = objectSchema({
  titles: {
    type: "array",
    items: objectSchema({ type: stringSchema, text: stringSchema }),
  },
  covers: stringArraySchema,
  body: objectSchema({
    hook: stringSchema,
    pain: stringSchema,
    judgment: stringSchema,
    tips: stringArraySchema,
    ending: stringSchema,
  }),
  cards: {
    type: "array",
    items: objectSchema({
      title: stringSchema,
      body: stringSchema,
      layout: stringSchema,
      prompt: stringSchema,
      keyword: stringSchema,
    }),
  },
  tags: stringArraySchema,
  note: stringSchema,
  design: objectSchema({
    cover: stringSchema,
    style: stringSchema,
  }),
});

const videoSchema = objectSchema({
  platforms: stringSchema,
  title: stringSchema,
  hook: stringSchema,
  covers: stringArraySchema,
  cover: stringSchema,
  points: stringArraySchema,
  ending: stringSchema,
  duration: stringSchema,
  subtitles: stringArraySchema,
  script: {
    type: "array",
    items: objectSchema({
      label: stringSchema,
      text: stringSchema,
      shot: stringSchema,
      subtitle: stringSchema,
      sticker: stringSchema,
    }),
  },
  editingTips: stringArraySchema,
  keywords: stringArraySchema,
  bgm: stringSchema,
  soundEffects: stringArraySchema,
});

const multiPlatformSchema = namedSchema("multi_platform_plan", {
  xiaohongshu: xiaohongshuSchema,
  video: videoSchema,
  moments: {
    type: "array",
    items: objectSchema({ type: stringSchema, text: stringSchema }),
  },
  platformSummary: {
    type: "array",
    items: objectSchema({ platform: stringSchema, focus: stringSchema }),
  },
});

const xiaohongshuOnlySchema = { name: "xiaohongshu_content", schema: xiaohongshuSchema };
const videoOnlySchema = { name: "video_script", schema: videoSchema };
const articleDraftMaxTokens = 7000;

export async function runAiTask(request: AiRequest) {
  const prompt = buildPrompt(request.task, request.payload);
  const aiMetadata = getAiProviderMetadata();

  if (request.task === "testConnection") {
    const message = await generateTextWithAi({
      prompt: "请只回复 OK",
      timeoutMs: 10000,
      maxTokens: 8,
    });

    return {
      message:
        message.trim().toUpperCase().includes("OK")
          ? "AI 连接成功。"
          : "AI 连接成功。",
      model: aiMetadata.model,
      provider: aiMetadata.provider,
    };
  }

  if (request.task === "generateTodayHotspots") {
    const verifiedAt = typeof request.payload.today === "string" ? request.payload.today : getTodayLabel();
    const result = await generateJsonWithAi<
      { hotspots?: Partial<Hotspot>[] } | Partial<Hotspot>[]
    >({
      prompt: `${prompt}

当前为轻量筛选或基础生成流程：不要调用或声称调用 web_search。请生成 6 个今日选题机会。顶层必须是 {"hotspots": [...]}，不要使用 topics、items 或其他字段名。每个选题 evidenceLinks 必须返回空数组。每个选题 sourceMode 使用 ai_generated，isRealTimeSource 为 false，displayTag 使用“${
        aiMetadata.provider === "deepseek"
          ? "AI 初筛 / 公开来源待验证"
          : "AI 生成选题机会"
      }”，sourceCredibility 使用“待验证”，sourceWarning 返回空字符串。verifiedAt 使用：${verifiedAt}。不要写“小红书真实热榜”“抖音实时热榜”“视频号官方热榜”。`,
      schema: todayHotspotsSchema,
    });
    const hotspots = extractHotspotArray(result);

    if (!hotspots?.length) {
      throw new AiTaskError({
        code: "SCHEMA_OR_PARSE_ERROR",
        message: "AI 返回内容没有包含可用的热点数组，已回退到本地模拟热点。",
        raw: JSON.stringify(result).slice(0, 300),
      });
    }

    return hotspots.map((hotspot, index) =>
      normalizeGeneratedHotspot(
        {
          ...hotspot,
          sourceMode: "ai_generated",
          isRealTimeSource: false,
          evidenceLinks: [],
          displayTag:
            aiMetadata.provider === "deepseek"
              ? "AI 初筛 / 公开来源待验证"
              : "AI 生成选题机会",
          sourceCredibility: "待验证",
          sourceWarning: "",
        },
        verifiedAt,
        index,
      ),
    );
  }

  if (request.task === "fetchTopicSources") {
    const searchConfig = getSearchProviderConfig();
    const searchResult = await searchTopicSources({
      keyword: stringValue(request.payload.keyword, ""),
      profileContext: stringValue(request.payload.profileContext, ""),
      limit: 5,
    });

    if (searchConfig.provider === "manual" || searchConfig.provider === "none") {
      return [];
    }

    if (searchConfig.provider === "perplexity") {
      throw new AiTaskError({
        code: "SEARCH_PROVIDER_NOT_READY",
        message: searchResult.message,
        provider: aiMetadata.provider,
        model: aiMetadata.model,
      });
    }

    if (!searchResult.items.length) {
      throw new AiTaskError({
        code: "SEARCH_PROVIDER_EMPTY",
        message: searchResult.message,
        provider: aiMetadata.provider,
        model: aiMetadata.model,
      });
    }

    return searchResult.items
      .slice(0, 5)
      .map((source, index) => normalizeSearchSource(source, searchConfig.providerLabel, index));
  }

  if (request.task === "generateHotspotsFromSources") {
    const verifiedAt = typeof request.payload.today === "string" ? request.payload.today : getTodayLabel();
    const sources = Array.isArray(request.payload.sources) ? request.payload.sources : [];
    if (!sources.length) {
      throw new AiTaskError({
        code: "SOURCE_POOL_EMPTY",
        message: "请先添加至少 1 条来源。",
      });
    }
    const hasPublicWebSource = sources.some(isPublicWebSource);
    const sourceMode = hasPublicWebSource ? "web_search" : "user_sources";
    const displayTag = hasPublicWebSource ? "公开网页佐证" : "用户录入来源";
    const sourceType = hasPublicWebSource ? "AI 今日选题机会" : "用户导入热点";
    const sourceChannel = buildSourceChannelFromSources(sources, hasPublicWebSource);
    const result = await generateJsonWithAi<
      { hotspots?: Partial<Hotspot>[] } | Partial<Hotspot>[]
    >({
      prompt: `${prompt}

请基于用户录入的 sources 生成 4 个适合陈七七77的内容机会。
不要伪装为平台真实热榜，不要写官方热榜、实时热榜、平台已验证。
如果 sources 里包含公开网页来源信号，请把公开网页佐证写清楚；如果主要是手动来源，也要保留来源信号，不要写成真实热榜。
顶层必须是 {"hotspots": [...]}。
每个热点必须返回：id、sourceMode、sourceChannel、sourceType、sourceDate、verifiedAt、displayTag、sourceCredibility、sourceWarning、evidenceLinks、sourceEvidence、isRealTimeSource、title、description、attentionReason、fit、fitPlatforms、purposes、reason。
sourceMode 使用 ${sourceMode}，sourceType 使用 ${sourceType}，isRealTimeSource 固定 false，displayTag 使用 ${displayTag}，sourceChannel 使用 ${sourceChannel}，sourceDate/verifiedAt 使用 ${verifiedAt}。
sourceCredibility 只能使用“中”或“待验证”，不要写“高”、真实热榜、官方热榜、平台已验证。
如果来源里有链接，可转成 evidenceLinks；没有链接则 evidenceLinks 返回空数组。sourceWarning 没有风险时返回空字符串。`,
      schema: todayHotspotsSchema,
    });
    const hotspots = extractHotspotArray(result);

    if (!hotspots?.length) {
      throw new AiTaskError({
        code: "SCHEMA_OR_PARSE_ERROR",
        message: "AI 返回内容没有包含可用的来源选题。",
        raw: JSON.stringify(result).slice(0, 300),
      });
    }

    return hotspots.slice(0, 4).map((hotspot, index) =>
      normalizeGeneratedHotspot(
        {
          ...hotspot,
          sourceMode,
          sourceType,
          isRealTimeSource: false,
          displayTag,
          sourceChannel,
          sourceCredibility:
            hasPublicWebSource && hotspot.sourceCredibility === "高"
              ? "中"
              : hotspot.sourceCredibility,
          sourceWarning: stringValue(hotspot.sourceWarning, ""),
          sourceEvidence: stringValue(
            hotspot.sourceEvidence,
            buildSourceEvidenceSummary(sources),
          ),
        },
        verifiedAt,
        index,
      ),
    );
  }

  if (request.task === "enrichHotspotWithSources") {
    const verifiedAt = typeof request.payload.today === "string" ? request.payload.today : getTodayLabel();
    const hotspot = request.payload.hotspot;
    const config = getAiProviderConfig();

    if (!hotspot) {
      throw new Error("Missing hotspot payload for source enrichment.");
    }

    if (!config.supportsWebSearch) {
      throw new AiTaskError({
        code: "WEB_SEARCH_UNSUPPORTED_PROVIDER",
        message:
          "当前模型不支持内置 web_search，可切换 OpenAI 或后续接入国内搜索/平台数据源。",
        provider: config.provider,
        model: config.model,
      });
    }

    const result = await generateJsonWithAiMetadata<
      { hotspots?: Partial<Hotspot>[] } | Partial<Hotspot>[]
    >({
      prompt: `${buildPrompt("enrichHotspotWithSources", request.payload)}

请只围绕这个单个热点搜索公开网页来源，不要扩展到其它热点。
标题：${hotspot.title}
描述：${hotspot.description}
关注理由：${hotspot.attentionReason}

如果找到真实公开网页来源，返回一个热点对象并带 evidenceLinks。如果没有找到可用来源，不要编造链接，evidenceLinks 返回空数组，sourceWarning 写 WEB_SEARCH_NO_SOURCES。verifiedAt 使用：${verifiedAt}。`,
      schema: todayHotspotsSchema,
      tools: [{ type: "web_search" }],
      include: ["web_search_call.action.sources"],
      timeoutMs: 45000,
    });
    const hotspots = extractHotspotArray(result.data);
    const normalized = normalizeWebSearchHotspots(
      hotspots?.length ? [hotspots[0]] : [hotspot],
      result.sources,
      verifiedAt,
    );

    return normalized[0];
  }

  if (
    request.task === "hotspotDetail" ||
    request.task === "analyzeHotspot" ||
    request.task === "recommendTopics" ||
    request.task === "breakdownTopic"
  ) {
    return await generateJsonWithAi<HotspotAnalysis>({
      prompt,
      schema: hotspotAnalysisSchema,
    });
  }

  if (request.task === "generateOutline") {
    return await generateJsonWithAi<ArticleOutline>({ prompt, schema: outlineSchema });
  }

  if (request.task === "generateDraft" || request.task === "optimizeDraft") {
    return await generateArticleDraftWithAi(prompt);
  }

  if (request.task === "generateXiaohongshu") {
    return await generateXiaohongshuWithAi(appendUserNotePrompt(prompt, request.payload.userNote));
  }

  if (request.task === "generateVideoScript") {
    return await generateVideoScriptWithAi(prompt);
  }

  if (request.task === "generateMoments") {
    return await generateMomentsWithAi(prompt);
  }

  if (request.task === "generateMultiPlatform") {
    return await generateJsonWithAi<MultiPlatformPlan>({ prompt, schema: multiPlatformSchema });
  }

  if (request.task === "optimizeXiaohongshu") {
    return await generateJsonWithAi<MultiPlatformPlan["xiaohongshu"]>({
      prompt,
      schema: xiaohongshuOnlySchema,
    });
  }

  if (request.task === "optimizeVideoScript") {
    return await generateJsonWithAi<MultiPlatformPlan["video"]>({
      prompt,
      schema: videoOnlySchema,
    });
  }

  throw new Error(`Unsupported task: ${request.task}`);
}

function normalizeGeneratedHotspot(
  hotspot: Partial<Hotspot>,
  verifiedAt: string,
  index: number,
): Hotspot {
  const title = stringValue(hotspot.title, `今日大健康内容选题机会 ${index + 1}`);
  const description = stringValue(
    hotspot.description,
    "AI 生成了一个适合陈七七77继续深化的内容方向。",
  );
  const evidenceLinks = normalizeEvidenceLinks(hotspot.evidenceLinks);
  const hasEvidence = evidenceLinks.length > 0;
  const requestedSourceMode =
    hotspot.sourceMode === "user_sources" ||
    hotspot.sourceMode === "platform_signal" ||
    hotspot.sourceMode === "mock" ||
    hotspot.sourceMode === "ai_generated" ||
    hotspot.sourceMode === "web_search"
      ? hotspot.sourceMode
      : undefined;
  const sourceMode = requestedSourceMode ?? (hasEvidence ? "web_search" : "ai_generated");
  const sourceWarning = stringValue(
    hotspot.sourceWarning,
    hasEvidence ? "" : "WEB_SEARCH_NO_SOURCES",
  );
  const firstEvidence = evidenceLinks[0];
  const verificationStatus = hasEvidence
    ? sourceMode === "web_search"
      ? "pending"
      : "user_input"
    : sourceMode === "user_sources"
      ? "user_input"
      : "ai_initial";
  const sourceCredibility = normalizeCredibility(hotspot.sourceCredibility ?? hotspot.credibility, hasEvidence);

  return {
    id: stringValue(hotspot.id, `ai-generated-${index + 1}`),
    sourceMode,
    sourceChannel: stringValue(
      hotspot.sourceChannel,
      hasEvidence ? "新闻网页 / 行业观察" : "AI + 大健康",
    ),
    sourceType:
      hotspot.sourceType === "用户导入热点" ||
      hotspot.sourceType === "模拟行业观察" ||
      hotspot.sourceType === "AI 今日选题机会"
        ? hotspot.sourceType
        : "AI 今日选题机会",
    sourceDate: stringValue(hotspot.sourceDate, verifiedAt),
    verifiedAt,
    displayTag: hasEvidence
      ? "公开网页佐证"
      : stringValue(hotspot.displayTag, "AI 生成选题机会"),
    sourceCredibility,
    credibility: sourceCredibility,
    verificationStatus,
    sourceTitle: stringValue(hotspot.sourceTitle, firstEvidence?.title ?? ""),
    sourceUrl: stringValue(hotspot.sourceUrl, firstEvidence?.url ?? ""),
    sourceSummary: stringValue(hotspot.sourceSummary, firstEvidence?.summary ?? ""),
    fitReasonForQiqi: stringValue(hotspot.fitReasonForQiqi, ""),
    sourceWarning,
    evidenceLinks,
    sourceEvidence: stringValue(
      hotspot.sourceEvidence,
      hasEvidence
        ? "AI 结合公开网页来源生成今日选题机会，当前不是平台官方榜单数据。"
        : "AI 观察：基于陈七七77的定位生成今日选题机会，当前暂无真实来源链接，不代表平台热榜。",
    ),
    isRealTimeSource: sourceMode === "web_search" && hasEvidence,
    title,
    description,
    attentionReason: stringValue(hotspot.attentionReason, hotspot.reason || description),
    fit: normalizeFit(hotspot.fit),
    fitPlatforms: stringArrayValue(hotspot.fitPlatforms, ["公众号", "小红书"]),
    purposes: stringArrayValue(hotspot.purposes, ["观点表达", "专业信任"]) as Hotspot["purposes"],
    reason: stringValue(hotspot.reason, description),
  };
}

function buildSourceEvidenceSummary(sources: TopicSource[]) {
  return sources
    .slice(0, 3)
    .map((source) =>
      source.sourceEvidence?.trim()
        ? source.sourceEvidence
        : `${source.sourcePlatform}：${source.sourceTitle}${
            source.sourceUrl ? `（${source.sourceUrl}）` : "（暂无可验证链接，当前仅作为灵感/待验证来源）"
          }`,
    )
    .join("；") || "基于用户录入来源生成，当前不是平台真实热榜。";
}

function extractHotspotArray(
  result: { hotspots?: Partial<Hotspot>[]; topics?: Partial<Hotspot>[] } | Partial<Hotspot>[],
) {
  if (Array.isArray(result)) return result;
  return result.hotspots ?? result.topics;
}

function normalizeWebSearchHotspots(
  hotspots: Partial<Hotspot>[],
  webSources: OpenAIWebSource[],
  verifiedAt: string,
) {
  const fallbackEvidence = normalizeWebSources(webSources);

  return hotspots.map((hotspot, index) => {
    const existingEvidence = normalizeEvidenceLinks(hotspot.evidenceLinks);
    const evidenceLinks = existingEvidence.length
      ? existingEvidence
      : fallbackEvidence.slice(index, index + 1);
    const sourceWarning = evidenceLinks.length
      ? stringValue(hotspot.sourceWarning, "")
      : "WEB_SEARCH_NO_SOURCES";

    return normalizeGeneratedHotspot(
      {
        ...hotspot,
        sourceMode: evidenceLinks.length ? "web_search" : "ai_generated",
        isRealTimeSource: evidenceLinks.length > 0,
        displayTag: evidenceLinks.length ? "公开网页佐证" : "AI 生成选题机会",
        sourceCredibility: evidenceLinks.length ? hotspot.sourceCredibility : "待验证",
        sourceWarning,
        evidenceLinks,
      },
      verifiedAt,
      index,
    );
  });
}

function normalizeWebSources(
  sources: OpenAIWebSource[],
): NonNullable<Hotspot["evidenceLinks"]> {
  return sources
    .map((source) => {
      const url = stringValue(source.url, "");
      if (!/^https?:\/\//i.test(url)) return null;

      return {
        title: stringValue(source.title, "公开网页来源"),
        url,
        platform: stringValue(source.source, getPlatformFromUrl(url)),
        date: "未标明",
        summary: "OpenAI web_search 返回的公开网页来源，可作为热点信号参考。",
        relevance: "该来源参与了今日选题机会生成，可辅助判断选题是否值得陈七七77关注。",
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
}

function normalizeEvidenceLinks(value: unknown): NonNullable<Hotspot["evidenceLinks"]> {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const url = stringValue(record.url, "");
      if (!/^https?:\/\//i.test(url)) return null;

      return {
        title: stringValue(record.title, "未标明标题"),
        url,
        platform: stringValue(record.platform, "公开网页"),
        date: stringValue(record.date, "未标明"),
        summary: stringValue(record.summary, "该来源提供了与选题相关的公开信息。"),
        relevance: stringValue(record.relevance, "该来源可作为选题值得关注的公开网页佐证。"),
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
}

function stringValue(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function stringArrayValue(value: unknown, fallback: string[]) {
  return Array.isArray(value)
    ? value.filter(
        (item): item is string => typeof item === "string" && Boolean(item.trim()),
      )
    : fallback;
}

function normalizeTopicSource(source: Partial<TopicSource>, index: number): TopicSource {
  const sourceUrl = stringValue(source.sourceUrl, "");
  const sourceEvidence = stringValue(
    source.sourceEvidence,
    sourceUrl
      ? `${stringValue(source.sourcePlatform, "公开网页")}：${stringValue(source.sourceTitle, `来源信号 ${index + 1}`)}`
      : "暂无可验证链接，当前仅作为灵感/待验证来源。",
  );
  const sourceCredibility =
    source.sourceCredibility === "高" || source.sourceCredibility === "中" || source.sourceCredibility === "待验证"
      ? source.sourceCredibility
      : source.credibility === "高" || source.credibility === "中" || source.credibility === "待验证"
        ? source.credibility
        : "待验证";
  const verificationStatus =
    source.verificationStatus ??
    (sourceUrl
      ? source.sourceType === "公开网页" || source.sourceType === "public_web"
        ? "pending"
        : "user_input"
      : "ai_initial");
  const evidenceLinks = normalizeEvidenceLinks(source.evidenceLinks);

  return {
    id: stringValue(source.id, `source-${index + 1}`),
    sourcePlatform: stringValue(source.sourcePlatform, "公开网页 / OpenAI web_search"),
    sourceTitle: stringValue(source.sourceTitle, `来源信号 ${index + 1}`),
    sourceUrl: sourceUrl || undefined,
    sourceDate: stringValue(source.sourceDate, source.createdAt || "") || undefined,
    sourceSummary: stringValue(source.sourceSummary, "来源摘要待补充。"),
    sourceEvidence,
    keywords: stringArrayValue(source.keywords, []),
    sourceCredibility,
    credibility: sourceCredibility,
    sourceType:
      source.sourceType === "公开网页" ||
      source.sourceType === "指数平台" ||
      source.sourceType === "内容平台观察" ||
      source.sourceType === "社群观察" ||
      source.sourceType === "手动灵感" ||
      source.sourceType === "public_web" ||
      source.sourceType === "user_inspiration" ||
      source.sourceType === "platform_signal" ||
      source.sourceType === "manual_observation" ||
      source.sourceType === "ai_generated"
        ? source.sourceType
        : "公开网页",
    verificationStatus,
    evidenceLinks:
      evidenceLinks.length > 0
        ? evidenceLinks
        : sourceUrl
          ? [
              {
                title: stringValue(source.sourceTitle, `来源信号 ${index + 1}`),
                url: sourceUrl,
                platform: stringValue(source.sourcePlatform, "公开网页"),
                date: stringValue(source.sourceDate, source.createdAt || "未标明"),
                summary: stringValue(source.sourceSummary, "来源摘要待补充。"),
                relevance: stringValue(source.fitReasonForQiqi, "该来源可用于后续人工判断和 AI 选题生成。"),
              },
            ]
          : [],
    fitReasonForQiqi: stringValue(source.fitReasonForQiqi, "") || undefined,
    createdAt: stringValue(source.createdAt, new Date().toISOString()),
  };
}

function normalizeSearchSource(
  source: SearchSourceResult,
  providerLabel: string,
  index: number,
): TopicSource {
  return normalizeTopicSource(
    {
      id: `${source.provider}-source-${index + 1}`,
      sourcePlatform: providerLabel,
      sourceTitle: source.title,
      sourceUrl: source.url,
      sourceSummary: source.summary,
      sourceEvidence: source.url
        ? `${providerLabel}：${source.title}`
        : "暂无可验证链接，当前仅作为灵感/待验证来源。",
      keywords: source.keywords,
      sourceCredibility: source.credibility,
      credibility: source.credibility,
      sourceType: source.sourceType,
      verificationStatus: source.url ? "pending" : "ai_initial",
      fitReasonForQiqi: "公开网页来源信号，可用于后续人工判断和 AI 选题生成。",
      createdAt: source.publishedAt || new Date().toISOString(),
    },
    index,
  );
}

function isPublicWebSource(source: Partial<TopicSource>) {
  return (
    source.sourceType === "公开网页" ||
    source.sourceType === "public_web" ||
    /web_search|公开网页|网页/i.test(source.sourcePlatform || "")
  );
}

function buildSourceChannelFromSources(sources: TopicSource[], hasPublicWebSource: boolean) {
  const platforms = [...new Set(sources.map((source) => source.sourcePlatform).filter(Boolean))];
  if (hasPublicWebSource) {
    return platforms.slice(0, 2).join(" / ") || "公开网页";
  }
  return platforms.slice(0, 2).join(" / ") || "用户录入来源";
}

function normalizeFit(value: unknown): Hotspot["fit"] {
  return value === "高" || value === "中" || value === "低" ? value : "高";
}

function normalizeCredibility(value: unknown, hasEvidence: boolean): "高" | "中" | "待验证" {
  if (value === "高" || value === "中" || value === "待验证") return value;
  return hasEvidence ? "中" : "待验证";
}

function getPlatformFromUrl(url: string) {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    if (hostname.includes("xiaohongshu")) return "小红书公开网页信号";
    if (hostname.includes("douyin")) return "抖音公开网页信号";
    if (hostname.includes("weixin") || hostname.includes("qq.com")) return "公众号公开内容信号";
    return hostname || "公开网页";
  } catch {
    return "公开网页";
  }
}

function getTodayLabel() {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

async function generateXiaohongshuWithAi(
  prompt: string,
): Promise<MultiPlatformPlan["xiaohongshu"]> {
  const text = await generateTextWithAi({ prompt, timeoutMs: 60000, maxTokens: 4000 });
  const xiaohongshu = normalizeXiaohongshuOutput(text);

  if (!hasGeneratedXiaohongshuContent(xiaohongshu)) {
    throw new AiTaskError({
      code: "EMPTY_AI_OUTPUT",
      message: "AI 返回内容为空，请重新生成。",
      raw: text.slice(0, 300),
      ...getAiProviderMetadata(),
    });
  }

  return xiaohongshu;
}

async function generateVideoScriptWithAi(prompt: string): Promise<MultiPlatformPlan["video"]> {
  const text = await generateTextWithAi({ prompt, timeoutMs: 60000, maxTokens: 4000 });
  const video = normalizeVideoOutput(text);

  if (!hasGeneratedVideoContent(video)) {
    throw new AiTaskError({
      code: "EMPTY_AI_OUTPUT",
      message: "AI 返回内容为空，请重新生成。",
      raw: text.slice(0, 300),
      ...getAiProviderMetadata(),
    });
  }

  return video;
}

async function generateMomentsWithAi(prompt: string): Promise<MultiPlatformPlan["moments"]> {
  const text = await generateTextWithAi({ prompt, timeoutMs: 60000, maxTokens: 3000 });
  const moments = normalizeMomentsOutput(text);

  if (!moments.length) {
    throw new AiTaskError({
      code: "EMPTY_AI_OUTPUT",
      message: "AI 返回内容为空，请重新生成。",
      raw: text.slice(0, 300),
      ...getAiProviderMetadata(),
    });
  }

  return moments;
}

function normalizeXiaohongshuOutput(text: string): MultiPlatformPlan["xiaohongshu"] {
  const value = parseAiValue(text);
  const root = unwrapXiaohongshuRoot(value);
  const bodyValue = root.body;
  const body = bodyValue && typeof bodyValue === "object" && !Array.isArray(bodyValue)
    ? bodyValue as Record<string, unknown>
    : {};
  const longText = firstString(root.content, root.text, root.markdown, bodyValue, value);
  const paragraphs = splitArticleParagraphs(longText);
  const fallback = parseXiaohongshuTextFallback(longText);
  const designValue = root.design && typeof root.design === "object" && !Array.isArray(root.design)
    ? root.design as Record<string, unknown>
    : {};

  return stabilizeXiaohongshuPlan({
    titles: normalizeTitleOptions(root.titles ?? root.titleOptions ?? root.title).concat(fallback.titles),
    covers: normalizeParagraphList(root.covers ?? root.coverText ?? root.coverTitles ?? root.cover).concat(fallback.covers),
    body: {
      hook: firstString(body.hook, root.hook, fallback.body.hook, paragraphs[0]),
      pain: firstString(body.pain, root.pain, fallback.body.pain, paragraphs[1]),
      judgment: firstString(body.judgment, root.judgment, fallback.body.judgment, paragraphs[2]),
      tips: normalizeParagraphList(body.tips ?? root.tips ?? root.points).concat(fallback.body.tips).slice(0, 6),
      ending: firstString(body.ending, root.ending, root.cta, fallback.body.ending, paragraphs[paragraphs.length - 1]),
    },
    cards: normalizeXiaohongshuCards(root.cards ?? root.imagePlan ?? root.images).concat(fallback.cards),
    tags: normalizeParagraphList(root.tags ?? root.hashtags).concat(fallback.tags),
    note: firstString(root.note, root.remark, fallback.note),
    design: {
      cover: firstString(designValue.cover, root.designCover, root.coverDesign, fallback.design.cover),
      style: firstString(designValue.style, root.designStyle, root.visualStyle, fallback.design.style),
    },
  }, longText);
}

function unwrapXiaohongshuRoot(value: unknown): Record<string, unknown> {
  if (typeof value === "string") return { text: value };
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const root = value as Record<string, unknown>;
  if (hasXiaohongshuShape(root)) return root;

  for (const key of ["xiaohongshu", "content", "draft"]) {
    const nested = root[key];
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      return nested as Record<string, unknown>;
    }
  }
  return root;
}

function hasXiaohongshuShape(root: Record<string, unknown>) {
  const directKeys = [
    "titles",
    "titleOptions",
    "title",
    "covers",
    "coverText",
    "coverTitles",
    "cover",
    "cards",
    "imagePlan",
    "images",
    "tags",
    "hashtags",
    "note",
    "design",
    "tips",
  ];
  if (directKeys.some((key) => key in root)) return true;

  const body = root.body;
  return Boolean(
    body &&
      typeof body === "object" &&
      !Array.isArray(body) &&
      ["hook", "pain", "judgment", "tips", "ending"].some((key) => key in (body as Record<string, unknown>)),
  );
}

function parseXiaohongshuTextFallback(text: string): MultiPlatformPlan["xiaohongshu"] {
  const paragraphs = splitArticleParagraphs(
    text
      .replace(/```(?:json|markdown)?/gi, "")
      .replace(/```/g, "")
      .trim(),
  );
  const lines = text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/^[\s#>*-]+/, "").trim())
    .filter(Boolean);
  const tags = Array.from(new Set((text.match(/#[\u4e00-\u9fa5A-Za-z0-9_-]+/g) ?? []).slice(0, 8)));
  const titles = lines
    .filter((line) => /标题|题目|title/i.test(line) || /^《.+》$/.test(line))
    .map((line) => line.replace(/^(标题|题目|title)\s*[：:、-]?\s*/i, "").trim())
    .filter(Boolean)
    .slice(0, 3);
  const covers = lines
    .filter((line) => /封面|cover/i.test(line))
    .map((line) => line.replace(/^(封面文案|封面|cover)\s*[：:、-]?\s*/i, "").trim())
    .filter(Boolean)
    .slice(0, 3);
  const cardLines = lines.filter((line) => /卡片|第[一二三四五六七八九十0-9]+张|图文/.test(line)).slice(0, 6);
  const tips = lines
    .filter((line) => /建议|注意|发布|tips?/i.test(line))
    .map((line) => line.replace(/^(发布建议|注意事项|建议|tips?)\s*[：:、-]?\s*/i, "").trim())
    .filter(Boolean)
    .slice(0, 5);
  const bodyParagraphs = paragraphs.filter((paragraph) => !tags.includes(paragraph)).slice(0, 5);

  return {
    titles: titles.length
      ? titles.map((title, index) => ({ type: `标题 ${index + 1}`, text: title }))
      : bodyParagraphs[0]
        ? [{ type: "标题 1", text: bodyParagraphs[0].slice(0, 40) }]
        : [],
    covers: covers.length ? covers : bodyParagraphs[1] ? [bodyParagraphs[1].slice(0, 24)] : [],
    body: {
      hook: bodyParagraphs[0] ?? "",
      pain: bodyParagraphs[1] ?? "",
      judgment: bodyParagraphs[2] ?? "",
      tips,
      ending: bodyParagraphs[bodyParagraphs.length - 1] ?? "",
    },
    cards: cardLines.map((line, index) => ({
      title: `图文卡片 ${index + 1}`,
      body: line,
      layout: "",
      prompt: "",
      keyword: "",
    })),
    tags,
    note: tips.join("；"),
    design: {
      cover: covers[0] ?? "",
      style: "",
    },
  };
}

function stabilizeXiaohongshuPlan(
  plan: MultiPlatformPlan["xiaohongshu"],
  rawText: string,
): MultiPlatformPlan["xiaohongshu"] {
  const fallback = parseReadableXiaohongshuFallback(rawText);
  const titles = plan.titles
    .map((item) => ({
      type: cleanGeneratedText(item.type) || "标题",
      text: cleanGeneratedText(item.text),
    }))
    .filter((item) => item.text)
    .slice(0, 4);
  const cards = plan.cards
    .map((card, index) => ({
      title: cleanGeneratedText(card.title) || `图文卡片 ${index + 1}`,
      body: cleanGeneratedText(card.body),
      layout: cleanGeneratedText(card.layout),
      prompt: cleanGeneratedText(card.prompt),
      keyword: cleanGeneratedText(card.keyword),
    }))
    .filter((card) => card.body || card.title);

  return {
    titles: titles.length ? titles : fallback.titles,
    covers: cleanGeneratedList(plan.covers).slice(0, 4),
    body: {
      hook: cleanGeneratedText(plan.body.hook) || fallback.body.hook,
      pain: cleanGeneratedText(plan.body.pain) || fallback.body.pain,
      judgment: cleanGeneratedText(plan.body.judgment) || fallback.body.judgment,
      tips: cleanGeneratedList(plan.body.tips).slice(0, 6),
      ending: cleanGeneratedText(plan.body.ending) || fallback.body.ending,
    },
    cards: cards.length ? cards : fallback.cards,
    tags: cleanGeneratedList(plan.tags).slice(0, 8),
    note: cleanGeneratedText(plan.note) || fallback.note,
    design: {
      cover: cleanGeneratedText(plan.design.cover) || fallback.design.cover,
      style: cleanGeneratedText(plan.design.style) || fallback.design.style,
    },
  };
}

function parseReadableXiaohongshuFallback(rawText: string): MultiPlatformPlan["xiaohongshu"] {
  const text = cleanGeneratedText(rawText);
  if (!text) {
    return {
      titles: [{ type: "标题 1", text: "这件事，大健康 IP 真的要认真看" }],
      covers: ["别只追热点，要接住信任"],
      body: {
        hook: "这篇内容已生成，但原始结构不稳定，已转成可读版本。",
        pain: "建议重新生成一次，或在当前基础上手动微调。",
        judgment: "重点仍然是把专业判断、用户信任和私域承接讲清楚。",
        tips: ["先讲现象", "再讲判断", "最后给行动建议"],
        ending: "适合作为小红书图文初稿继续调整。",
      },
      cards: [
        {
          title: "图文卡片 1",
          body: "大健康内容不是追热点，而是借热点讲清自己的判断。",
          layout: "白底大标题，少字清晰。",
          prompt: "",
          keyword: "判断",
        },
      ],
      tags: ["#大健康IP", "#女性营养师"],
      note: "已使用稳态 fallback，避免展示原始结构。",
      design: { cover: "白底加深色标题", style: "干净、专业、生活方式感" },
    };
  }
  return parseXiaohongshuTextFallback(text);
}

function cleanGeneratedList(value: string[]) {
  return value.map(cleanGeneratedText).filter(Boolean);
}

function cleanGeneratedText(value: string) {
  const text = value.replace(/```(?:json|markdown)?/gi, "").replace(/```/g, "").trim();
  if (!text) return "";
  if (/^\s*[{[]/.test(text)) return "";
  if (/"(?:titles|type|body|cards|payload|raw|stack)"\s*:/.test(text)) return "";
  return text.replace(/[{}"]/g, "").trim();
}

function normalizeVideoOutput(text: string): MultiPlatformPlan["video"] {
  const value = parseAiValue(text);
  const root = unwrapObject(value, ["video", "videoScript", "script", "content", "body"]);
  const longText = firstString(root.content, root.text, root.markdown, root.script, value);
  const paragraphs = splitArticleParagraphs(longText);

  return {
    platforms: firstString(root.platforms, root.platform) || "短视频平台",
    title: firstString(root.title, root.headline) || paragraphs[0] || "短视频口播稿",
    hook: firstString(root.hook, root.opening) || paragraphs[1] || paragraphs[0] || "",
    covers: normalizeParagraphList(root.covers ?? root.coverTitles ?? root.coverTitle ?? root.cover),
    cover: firstString(root.cover, root.coverTitle),
    points: normalizeParagraphList(root.points ?? root.keyPoints),
    ending: firstString(root.ending, root.cta, root.conclusion) || paragraphs[paragraphs.length - 1] || "",
    duration: firstString(root.duration) || "60-90 秒",
    subtitles: normalizeParagraphList(root.subtitles ?? root.subtitleKeywords),
    script: normalizeVideoScript(root.script ?? root.content ?? root.text ?? root.markdown),
    editingTips: normalizeParagraphList(root.editingTips ?? root.shots ?? root.shotList),
    keywords: normalizeParagraphList(root.keywords ?? root.tags),
    bgm: firstString(root.bgm, root.music),
    soundEffects: normalizeParagraphList(root.soundEffects ?? root.sfx),
  };
}

function normalizeMomentsOutput(text: string): MultiPlatformPlan["moments"] {
  const value = parseAiValue(text);
  const root = unwrapObject(value, ["moments", "posts", "versions", "content", "body"]);
  const source = root.moments ?? root.versions ?? root.posts ?? root.texts ?? root.content ?? root.text ?? value;
  const items = Array.isArray(source) ? source : splitArticleParagraphs(firstString(source));

  return items
    .map((item, index) => {
      if (typeof item === "string") {
        return { type: `朋友圈文案版本 ${index + 1}`, text: item.trim() };
      }
      if (!item || typeof item !== "object") return { type: "", text: "" };
      const record = item as Record<string, unknown>;
      return {
        type: firstString(record.type, record.label, record.title) || `朋友圈文案版本 ${index + 1}`,
        text: firstString(record.text, record.content, record.body),
      };
    })
    .filter((item) => item.text.trim());
}

function parseAiValue(text: string): unknown {
  try {
    return parseJsonFromAi<unknown>(text);
  } catch {
    return text;
  }
}

function unwrapObject(value: unknown, keys: string[]): Record<string, unknown> {
  if (typeof value === "string") return { text: value };
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const root = value as Record<string, unknown>;
  for (const key of keys) {
    const nested = root[key];
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      return nested as Record<string, unknown>;
    }
  }
  return root;
}

function normalizeTitleOptions(value: unknown): { type: string; text: string }[] {
  const list = Array.isArray(value) ? value : value ? [value] : [];
  return list
    .map((item, index) => {
      if (typeof item === "string") {
        return { type: `标题 ${index + 1}`, text: item.trim() };
      }
      if (!item || typeof item !== "object") return { type: "", text: "" };
      const record = item as Record<string, unknown>;
      return {
        type: firstString(record.type, record.label) || `标题 ${index + 1}`,
        text: firstString(record.text, record.title, record.content),
      };
    })
    .filter((item) => item.text.trim());
}

function normalizeXiaohongshuCards(value: unknown): MultiPlatformPlan["xiaohongshu"]["cards"] {
  const list = Array.isArray(value) ? value : value ? [value] : [];
  return list
    .map((item, index) => {
      if (typeof item === "string") {
        return {
          title: `图文卡片 ${index + 1}`,
          body: item.trim(),
          layout: "",
          prompt: "",
          keyword: "",
        };
      }
      if (!item || typeof item !== "object") {
        return { title: "", body: "", layout: "", prompt: "", keyword: "" };
      }
      const record = item as Record<string, unknown>;
      return {
        title: firstString(record.title, record.heading, record.label) || `图文卡片 ${index + 1}`,
        body: firstString(record.body, record.text, record.content),
        layout: firstString(record.layout),
        prompt: firstString(record.prompt, record.imagePrompt),
        keyword: firstString(record.keyword),
      };
    })
    .filter((card) => card.title.trim() || card.body.trim());
}

function normalizeVideoScript(value: unknown): MultiPlatformPlan["video"]["script"] {
  const list = Array.isArray(value) ? value : splitArticleParagraphs(firstString(value));
  return list
    .map((item, index) => {
      if (typeof item === "string") {
        return {
          label: `段落 ${index + 1}`,
          text: item.trim(),
          shot: "",
          subtitle: "",
          sticker: "",
        };
      }
      if (!item || typeof item !== "object") {
        return { label: "", text: "", shot: "", subtitle: "", sticker: "" };
      }
      const record = item as Record<string, unknown>;
      return {
        label: firstString(record.label, record.title, record.stage) || `段落 ${index + 1}`,
        text: firstString(record.text, record.content, record.body),
        shot: firstString(record.shot, record.shots),
        subtitle: firstString(record.subtitle),
        sticker: firstString(record.sticker),
      };
    })
    .filter((part) => part.text.trim() || part.label.trim());
}

function hasGeneratedXiaohongshuContent(value: MultiPlatformPlan["xiaohongshu"]) {
  const categories = [
    value.titles.length > 0,
    value.covers.length > 0,
    Boolean(value.body.hook || value.body.pain || value.body.judgment || value.body.ending),
    value.cards.length > 0,
    value.tags.length > 0,
    value.body.tips.length > 0,
    Boolean(value.note),
    Boolean(value.design.cover || value.design.style),
  ];
  return categories.filter(Boolean).length >= 2;
}

function appendUserNotePrompt(prompt: string, userNote: unknown) {
  if (typeof userNote !== "string" || !userNote.trim()) return prompt;
  return `${prompt}

【用户补充意见 / 修改意见】
${userNote.trim()}

生成小红书图文时必须优先回应以上补充意见。`;
}

function hasGeneratedVideoContent(value: MultiPlatformPlan["video"]) {
  const categories = [
    Boolean(value.title),
    Boolean(value.hook),
    value.script.length > 0,
    value.editingTips.length > 0,
    Boolean(value.bgm) || value.soundEffects.length > 0,
    value.covers.length > 0,
  ];
  return categories.filter(Boolean).length >= 2;
}

async function generateArticleDraftWithAi(prompt: string): Promise<ArticleDraft> {
  const text = await generateTextWithAi({
    prompt,
    schema: draftSchema,
    timeoutMs: 90000,
    maxTokens: articleDraftMaxTokens,
  });
  const draft = normalizeArticleDraftOutput(text);

  if (!isCompleteArticleDraft(draft)) {
    throw new AiTaskError({
      code: "ARTICLE_DRAFT_TOO_SHORT",
      message: "生成内容过短，请重新生成。",
      raw: text.slice(0, 300),
      ...getAiProviderMetadata(),
    });
  }

  return draft;
}

function normalizeArticleDraftOutput(text: string): ArticleDraft {
  try {
    return normalizeArticleDraftObject(parseJsonFromAi<unknown>(text), text);
  } catch {
    return parseArticleDraftText(text);
  }
}

function normalizeArticleDraftObject(value: unknown, rawText: string): ArticleDraft {
  if (typeof value === "string") return parseArticleDraftText(value);
  if (!value || typeof value !== "object") return parseArticleDraftText(rawText);

  const root = unwrapDraftObject(value as Record<string, unknown>);
  const longText = firstString(
    root.content,
    root.body,
    root.article,
    root.markdown,
    root.text,
    root.paragraphs,
  );
  const rawSections = root.sections;
  const sections = Array.isArray(rawSections)
    ? rawSections
        .map((section, index) => normalizeArticleSection(section, index))
        .filter((section) => section.heading || section.paragraphs.length)
    : [];

  if (!sections.length && longText) {
    return parseArticleDraftText(longText);
  }

  const draft: ArticleDraft = {
    status: "已生成正文",
    title: firstString(root.title, root.headline) || inferTitleFromText(rawText),
    intro: firstString(root.intro, root.opening, root.lead),
    sections: mergeArticleSectionsToLimit(sections, 6),
    ending: firstString(root.ending, root.conclusion, root.cta),
  };

  return !isCompleteArticleDraft(draft) && longText
    ? mergeStructuredDraftWithText(draft, longText)
    : draft;
}

function unwrapDraftObject(root: Record<string, unknown>): Record<string, unknown> {
  for (const key of ["article_draft", "draft", "articleDraft", "article", "content", "body"]) {
    const nested = root[key];
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      return nested as Record<string, unknown>;
    }
  }
  return root;
}

function normalizeArticleSection(section: unknown, index: number) {
  if (typeof section === "string") {
    const paragraphs = splitArticleParagraphs(section);
    return {
      heading: `正文小节 ${index + 1}`,
      paragraphs,
    };
  }

  if (!section || typeof section !== "object") {
    return { heading: "", paragraphs: [] };
  }

  const record = section as Record<string, unknown>;
  const heading = stripLeadingSectionNumber(firstString(record.heading, record.title, record.label));
  const paragraphs = normalizeParagraphList(
    record.paragraphs ?? record.body ?? record.content ?? record.text,
  );

  return {
    heading,
    paragraphs,
  };
}

function parseArticleDraftText(text: string): ArticleDraft {
  const cleaned = text
    .replace(/```(?:json|markdown)?/gi, "")
    .replace(/```/g, "")
    .trim();
  const blocks = splitArticleParagraphs(cleaned);
  const title = inferTitleFromText(cleaned);
  const withoutTitle = blocks[0] === title ? blocks.slice(1) : blocks;
  const intro = withoutTitle[0] ?? "";
  const bodyBlocks = withoutTitle.slice(1);
  const ending = bodyBlocks.length > 1 ? bodyBlocks[bodyBlocks.length - 1] : "";
  const sectionBlocks = ending ? bodyBlocks.slice(0, -1) : bodyBlocks;
  const sections: ArticleDraft["sections"] = [];
  let current: ArticleDraft["sections"][number] | null = null;

  for (const block of sectionBlocks) {
    const heading = normalizeMarkdownHeading(block);
    if (heading) {
      if (current) sections.push(current);
      current = { heading, paragraphs: [] };
      continue;
    }

    if (!current) {
      current = { heading: `正文小节 ${sections.length + 1}`, paragraphs: [] };
    }
    current.paragraphs.push(block);
  }

  if (current) sections.push(current);

  return {
    status: "已生成正文",
    title,
    intro,
    sections: mergeArticleSectionsToLimit(
      sections.length < 3 && sectionBlocks.length
        ? chunkParagraphsIntoSections(sectionBlocks)
        : sections,
      6,
    ),
    ending,
  };
}

function chunkParagraphsIntoSections(paragraphs: string[]): ArticleDraft["sections"] {
  const chunkSize = Math.max(2, Math.ceil(paragraphs.length / 4));
  const sections: ArticleDraft["sections"] = [];

  for (let index = 0; index < paragraphs.length; index += chunkSize) {
    sections.push({
      heading: `正文小节 ${sections.length + 1}`,
      paragraphs: paragraphs.slice(index, index + chunkSize),
    });
  }

  return sections;
}

function mergeArticleSectionsToLimit(
  sections: ArticleDraft["sections"],
  maxCount: number,
): ArticleDraft["sections"] {
  if (sections.length <= maxCount) return sections;

  const merged = sections.slice(0, maxCount).map((section) => ({
    heading: stripLeadingSectionNumber(section.heading),
    paragraphs: [...section.paragraphs],
  }));

  sections.slice(maxCount).forEach((section, index) => {
    merged[index % maxCount].paragraphs.push(...section.paragraphs);
  });

  return merged;
}

function stripLeadingSectionNumber(value: string) {
  return value.replace(/^\s*(?:0?[1-9]|[一二三四五六七八九十]+)[\.、\s-]+/, "").trim();
}

function inferTitleFromText(text: string) {
  const first = splitArticleParagraphs(text)[0] ?? "";
  return normalizeMarkdownHeading(first) || first.replace(/^#+\s*/, "").trim();
}

function normalizeMarkdownHeading(value: string) {
  const trimmed = value.trim();
  const markdown = trimmed.match(/^#{1,4}\s+(.+)$/);
  if (markdown?.[1]) return markdown[1].trim();
  if (/^(第?[一二三四五六七八九十0-9]+[、：:.-]|0[1-9]\s+)/.test(trimmed)) {
    return trimmed;
  }
  return "";
}

function normalizeParagraphList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      if (typeof item === "string") return splitArticleParagraphs(item);
      if (item && typeof item === "object") {
        const record = item as Record<string, unknown>;
        return splitArticleParagraphs(
          firstString(record.text, record.content, record.body, record.paragraph),
        );
      }
      return [];
    });
  }
  if (typeof value === "string") return splitArticleParagraphs(value);
  return [];
}

function splitArticleParagraphs(text: string) {
  const paragraphs = text
    .replace(/\r\n/g, "\n")
    .replace(/^\s*#{1,4}\s+/gm, "")
    .split(/\n+|(?<=。)\s+(?=[^\s])/)
    .map((part) => part.replace(/^[\s>*-]+/, "").trim())
    .filter(Boolean);

  if (paragraphs.length > 1) return paragraphs;

  const only = paragraphs[0] ?? "";
  if (only.length < 500) return paragraphs;

  const sentences =
    only.match(/[^。！？!?]+[。！？!?]?/g)?.map((part) => part.trim()).filter(Boolean) ?? [];
  if (sentences.length < 6) return paragraphs;

  const chunks: string[] = [];
  for (let index = 0; index < sentences.length; index += 3) {
    chunks.push(sentences.slice(index, index + 3).join(""));
  }
  return chunks.filter(Boolean);
}

function firstString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (Array.isArray(value)) {
      const text = value
        .flatMap((item) => {
          if (typeof item === "string") return item.trim();
          if (item && typeof item === "object") {
            const record = item as Record<string, unknown>;
            return firstString(record.text, record.content, record.body, record.paragraph);
          }
          return "";
        })
        .filter(Boolean)
        .join("\n\n");
      if (text.trim()) return text.trim();
    }
  }
  return "";
}

function isCompleteArticleDraft(draft: ArticleDraft) {
  const stats = getArticleDraftStats(draft);

  return stats.textLength >= 800 || (
    stats.paragraphCount >= 6 &&
    stats.hasOpening &&
    stats.bodyParagraphCount >= 3 &&
    stats.hasEnding
  );
}

function getArticleDraftStats(draft: ArticleDraft) {
  const intro = draft.intro?.trim() ?? "";
  const ending = draft.ending?.trim() ?? "";
  const bodyParagraphs = draft.sections.flatMap((section) =>
    Array.isArray(section.paragraphs) ? section.paragraphs.filter((p) => p.trim()) : [],
  );
  const paragraphCount = [intro, ...bodyParagraphs, ending].filter(Boolean).length;
  const textLength = [draft.title, intro, ...bodyParagraphs, ending]
    .join("")
    .replace(/\s/g, "").length;

  return {
    textLength,
    paragraphCount,
    bodyParagraphCount: bodyParagraphs.length,
    hasOpening: Boolean(intro || bodyParagraphs[0]),
    hasEnding: Boolean(ending),
  };
}

function mergeStructuredDraftWithText(draft: ArticleDraft, text: string): ArticleDraft {
  const fromText = parseArticleDraftText(text);

  return {
    status: "已生成正文",
    title: draft.title || fromText.title,
    intro: draft.intro || fromText.intro,
    sections: draft.sections.length ? draft.sections : fromText.sections,
    ending: draft.ending || fromText.ending,
  };
}


function objectSchema(properties: Record<string, unknown>) {
  return {
    type: "object",
    properties,
    required: Object.keys(properties),
    additionalProperties: false,
  };
}

function namedSchema(name: string, properties: Record<string, unknown>) {
  return {
    name,
    schema: objectSchema(properties),
  };
}
