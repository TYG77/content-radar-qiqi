export type SearchProvider = "manual" | "none" | "openai" | "tavily" | "perplexity";

export type SearchRequest = {
  keyword?: string;
  profileContext?: string;
  limit?: number;
};

export type SearchSourceResult = {
  title: string;
  url?: string;
  summary: string;
  keywords: string[];
  provider: SearchProvider;
  credibility: "高" | "中" | "待验证";
  sourceType: "公开网页" | "指数平台" | "内容平台观察" | "社群观察" | "手动灵感";
  sourceEvidence?: string;
  verificationStatus?: "verified" | "pending" | "user_input" | "ai_initial" | "unsupported";
  evidenceLinks?: Array<{
    title: string;
    url: string;
    platform?: string;
    summary?: string;
  }>;
  publishedAt?: string;
};

export type SearchProviderConfig = {
  provider: SearchProvider;
  providerLabel: string;
  modeDescription: string;
  supportsLiveSearch: boolean;
};

export type SearchResult = {
  provider: SearchProvider;
  items: SearchSourceResult[];
  message: string;
  supportsLiveSearch: boolean;
};

export function getSearchProviderConfig(): SearchProviderConfig {
  const provider = normalizeSearchProvider(process.env.SEARCH_PROVIDER);

  if (provider === "openai") {
    return {
      provider,
      providerLabel: "OpenAI web_search",
      modeDescription: "支持 OpenAI web_search 兜底。",
      supportsLiveSearch: true,
    };
  }

  if (provider === "tavily") {
    const apiKey = process.env.TAVILY_API_KEY;
    return {
      provider,
      providerLabel: "Tavily",
      modeDescription: apiKey
        ? "支持低成本公开网页检索。"
        : "Tavily API Key 未配置，请在 .env.local 中配置 TAVILY_API_KEY。",
      supportsLiveSearch: Boolean(apiKey),
    };
  }

  if (provider === "perplexity") {
    return {
      provider,
      providerLabel: "Perplexity",
      modeDescription: "Perplexity 搜索 Provider 尚未接入。",
      supportsLiveSearch: false,
    };
  }

  if (provider === "none") {
    return {
      provider,
      providerLabel: "未启用搜索",
      modeDescription: "当前未启用搜索 Provider。",
      supportsLiveSearch: false,
    };
  }

  return {
    provider: "manual",
    providerLabel: "手动来源模式",
    modeDescription: "手动来源模式，不联网。",
    supportsLiveSearch: false,
  };
}

export async function searchTopicSources(request: SearchRequest): Promise<SearchResult> {
  const config = getSearchProviderConfig();

  if (config.provider === "manual" || config.provider === "none") {
    return {
      provider: config.provider,
      items: [],
      message: "当前为手动来源模式，不进行联网搜索。",
      supportsLiveSearch: false,
    };
  }

  if (config.provider === "tavily") {
    return searchWithTavily(request);
  }

  if (config.provider === "perplexity") {
    return {
      provider: config.provider,
      items: [],
      message: "Perplexity 搜索 Provider 尚未接入。",
      supportsLiveSearch: false,
    };
  }

  return searchWithOpenAIWebSearch(request);
}

async function searchWithTavily(request: SearchRequest): Promise<SearchResult> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    return {
      provider: "tavily",
      items: [],
      message: "Tavily API Key 未配置，请在 .env.local 中配置 TAVILY_API_KEY。",
      supportsLiveSearch: false,
    };
  }

  const keyword =
    request.keyword?.trim() ||
    "大健康 IP 健康直播转化 营养师小红书 私域承接 AI 健康助手 公众号深度内容";
  const limit = Math.max(3, Math.min(request.limit || 5, 5));
  const query = [
    `围绕关键词「${keyword}」获取公开网页来源，聚焦陈七七77的大健康 IP、健康直播转化、营养师小红书、私域承接、AI 健康助手、公众号深度内容信号。`,
    request.profileContext ? `背景：${request.profileContext}` : "",
    "只返回公开网页来源信号，不要伪装真实热榜。",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        max_results: limit,
        search_depth: "basic",
        include_answer: false,
        include_images: false,
        include_raw_content: false,
      }),
    });

    if (!response.ok) {
      return {
        provider: "tavily",
        items: [],
        message: `Tavily 公开来源获取失败，请稍后重试，或切换 OpenAI web_search / 手动录入来源。HTTP ${response.status}。`,
        supportsLiveSearch: true,
      };
    }

    const data = (await response.json()) as {
      results?: Array<{
        title?: string;
        url?: string;
        content?: string;
        snippet?: string;
        raw_content?: string;
        published_date?: string;
      }>;
    };
    const results = Array.isArray(data.results) ? data.results.slice(0, limit) : [];

    if (!results.length) {
      return {
        provider: "tavily",
        items: [],
        message: "暂未获取到可用公开来源，请换一个关键词或手动录入来源。",
        supportsLiveSearch: true,
      };
    }

    const fallbackKeywords = splitKeywords(keyword);
    const items: SearchSourceResult[] = results.map((item, index) => {
      const summarySource =
        item.content || item.snippet || item.raw_content || "Tavily 命中的公开网页来源，可用于后续归纳。";
      return {
        title: item.title || `公开网页来源 ${index + 1}`,
        url: item.url,
        summary: truncateSummary(summarySource, 80, 160),
        keywords: uniqueKeywords([
          ...fallbackKeywords,
          ...splitKeywords(`${item.title || ""} ${summarySource}`),
        ]),
        provider: "tavily",
        credibility: item.url ? "中" : "待验证",
        sourceType: "公开网页",
        sourceEvidence: item.url
          ? `Tavily 公开网页来源：${item.title || `公开网页来源 ${index + 1}`}`
          : "暂无可验证链接，当前仅作为灵感/待验证来源。",
        verificationStatus: item.url ? "pending" : "ai_initial",
        evidenceLinks: item.url
          ? [
              {
                title: item.title || `公开网页来源 ${index + 1}`,
                url: item.url,
                platform: "Tavily",
                summary: truncateSummary(summarySource, 80, 160),
              },
            ]
          : [],
        publishedAt: item.published_date,
      };
    });

    return {
      provider: "tavily",
      items,
      message: "Tavily 已获取公开网页来源。",
      supportsLiveSearch: true,
    };
  } catch {
    return {
      provider: "tavily",
      items: [],
      message: "Tavily 公开来源获取失败，请稍后重试，或切换 OpenAI web_search / 手动录入来源。",
      supportsLiveSearch: true,
    };
  }
}

async function searchWithOpenAIWebSearch(request: SearchRequest): Promise<SearchResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      provider: "openai",
      items: [],
      message: "OpenAI web_search API Key 未配置。",
      supportsLiveSearch: true,
    };
  }

  const baseUrl = trimTrailingSlash(process.env.OPENAI_BASE_URL || "https://api.openai.com/v1");
  const model = process.env.OPENAI_MODEL || "gpt-5.4-mini";
  const keyword =
    request.keyword?.trim() || "大健康 IP、女性营养师、大健康私域、AI 健康助手、内容选题";
  const limit = Math.max(3, Math.min(request.limit || 5, 5));
  const prompt = [
    `围绕关键词「${keyword}」检索公开网页来源，优先找到适合陈七七77的大健康 IP、女性营养师、私域承接和内容选题信号。`,
    request.profileContext ? `背景：${request.profileContext}` : "",
    "返回尽量简短的公开网页来源摘要，方便后续归纳成来源池。",
  ]
    .filter(Boolean)
    .join("\n");

  const response = await fetch(`${baseUrl}/responses`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [{ role: "user", content: [{ type: "input_text", text: prompt }] }],
      tools: [{ type: "web_search" }],
      include: ["web_search_call.action.sources"],
    }),
  });

  if (!response.ok) {
    return {
      provider: "openai",
      items: [],
      message: `OpenAI web_search 请求失败，HTTP ${response.status}。`,
      supportsLiveSearch: true,
    };
  }

  const data = (await response.json()) as Record<string, unknown>;
  const text = extractResponseText(data);
  const sources = extractWebSources(data).slice(0, limit);
  const fallbackKeywords = splitKeywords(keyword);

  return {
    provider: "openai",
    items: sources.map((source, index) => ({
      title: source.title || `公开网页来源 ${index + 1}`,
      url: source.url,
      summary: text ? truncateSummary(text, 80, 160) : "OpenAI web_search 命中的公开网页来源，可用于后续归纳。",
      keywords: fallbackKeywords,
      provider: "openai",
      credibility: source.url ? "中" : "待验证",
      sourceType: "公开网页",
      sourceEvidence: source.url
        ? `OpenAI web_search 公开网页来源：${source.title || `公开网页来源 ${index + 1}`}`
        : "暂无可验证链接，当前仅作为灵感/待验证来源。",
      verificationStatus: source.url ? "pending" : "ai_initial",
      evidenceLinks: source.url
        ? [
            {
              title: source.title || `公开网页来源 ${index + 1}`,
              url: source.url,
              platform: "OpenAI web_search",
              summary: text ? truncateSummary(text, 80, 160) : "OpenAI web_search 命中的公开网页来源。",
            },
          ]
        : [],
      publishedAt: undefined,
    })),
    message: sources.length
      ? "OpenAI web_search 已获取公开网页来源。"
      : "OpenAI web_search 未返回可用来源。",
    supportsLiveSearch: true,
  };
}

function extractResponseText(data: Record<string, unknown>) {
  const output = Array.isArray(data.output) ? data.output : [];
  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const content = Array.isArray(record.content) ? record.content : [];
    for (const part of content) {
      if (!part || typeof part !== "object") continue;
      const piece = part as Record<string, unknown>;
      if (piece.type === "output_text" && typeof piece.text === "string") {
        return piece.text;
      }
    }
  }
  return "";
}

function extractWebSources(data: Record<string, unknown>) {
  const sources = new Map<string, { title?: string; url?: string; source?: string }>();
  const output = Array.isArray(data.output) ? data.output : [];

  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const action = record.action && typeof record.action === "object" ? (record.action as Record<string, unknown>) : null;
    const actionSources = Array.isArray(action?.sources) ? action?.sources : [];
    for (const source of actionSources) {
      if (!source || typeof source !== "object") continue;
      const recordSource = source as Record<string, unknown>;
      const url = typeof recordSource.url === "string" ? recordSource.url : "";
      if (url) {
        sources.set(url, {
          title: typeof recordSource.title === "string" ? recordSource.title : undefined,
          url,
          source: typeof recordSource.source === "string" ? recordSource.source : undefined,
        });
      }
    }

    const content = Array.isArray(record.content) ? record.content : [];
    for (const part of content) {
      if (!part || typeof part !== "object") continue;
      const piece = part as Record<string, unknown>;
      const annotations = Array.isArray(piece.annotations) ? piece.annotations : [];
      for (const annotation of annotations) {
        if (!annotation || typeof annotation !== "object") continue;
        const recordAnnotation = annotation as Record<string, unknown>;
        const url = typeof recordAnnotation.url === "string" ? recordAnnotation.url : "";
        if (url) {
          sources.set(url, {
            title: typeof recordAnnotation.title === "string" ? recordAnnotation.title : undefined,
            url,
            source: typeof recordAnnotation.type === "string" ? recordAnnotation.type : undefined,
          });
        }
      }
    }
  }

  return [...sources.values()];
}

function splitKeywords(value: string) {
  return value
    .split(/[\s,，、/|]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function uniqueKeywords(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].slice(0, 6);
}

function truncateSummary(value: string, minLength: number, maxLength: number) {
  const compact = value.replace(/\s+/g, " ").trim();
  if (compact.length <= maxLength) return compact;
  const trimmed = compact.slice(0, maxLength).trim();
  return trimmed.length < minLength ? compact.slice(0, minLength) : trimmed;
}

function normalizeSearchProvider(value: string | undefined): SearchProvider {
  if (value === "manual" || value === "none" || value === "openai" || value === "tavily" || value === "perplexity") {
    return value;
  }
  return "manual";
}

function trimTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}
