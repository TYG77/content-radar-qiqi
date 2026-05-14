"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildTopics,
  getDefaultContentRadarHotspots,
  getHotspotKeyword,
  pickReader,
} from "@/app/lib/content-radar";
import { buildWechatArticleHtml } from "@/app/lib/wechat/layout";

const profileContext =
  "陈七七，大健康行业 IP 操盘手，也是一名女性营养师。主要服务营养师、中医/医馆、健康品牌和私域团队，帮助他们从 0 到 1 搭建内容、私域、发售和用户运营闭环。她既懂健康专业内容，也懂商业转化、课程发售、私域运营和 AI 工具落地。这个公众号的目标是帮助她持续深度思考、沉淀大健康 IP 操盘方法论、显化专业身份，并吸引同频的大健康从业者建立连接。";

const qiqiWritingStyle =
  "陈七七77 的公众号正文要像真实创作者表达：可以用 hi，我是七七 开头，带关系感和行业情绪；语言口语化、真诚、有判断，不像报告或 PPT；内容要体现大健康 IP 操盘手、女性健康管理师、热爱生活、喜欢摄影、做自流量创业咨询的复合视角；要加入项目观察和真实感案例，反对虚假人设、只追流量、只追工具和过度自动化；不要写学员、带班、教大家、你必须；小标题要像公众号文章，结尾自然引导关注和链接。";

type View =
  | "radar"
  | "hotspotDetail"
  | "contentTypeSelect"
  | "articleOutline"
  | "articleDraft"
  | "multiPlatform"
  | "xiaohongshu"
  | "videoScript"
  | "moments"
  | "publishPreview";

type ContentType = "articleOutline" | "xiaohongshu" | "videoScript" | "moments" | "multiPlatform";

type GenerationPhase = "not_started" | "generating" | "success" | "empty" | "error";

type CarrierGenKey = "xiaohongshu" | "videoScript" | "moments" | "multiPlatform";

type FitLevel = "高" | "中" | "低";
type PurposeLabel =
  | "内容沉淀"
  | "IP显化"
  | "专业信任"
  | "私域引流"
  | "商业转化"
  | "方法论沉淀"
  | "观点表达";

type Hotspot = {
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
};

type EvidenceLink = {
  title: string;
  url: string;
  platform: string;
  date: string;
  summary: string;
  relevance: string;
};

type TopicSource = {
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
  sourceType:
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
  verificationStatus?: SourceVerificationStatus;
  evidenceLinks?: EvidenceLink[];
  fitReasonForQiqi?: string;
  createdAt: string;
};

type SourceVerificationStatus =
  | "verified"
  | "pending"
  | "user_input"
  | "ai_initial"
  | "unsupported";

type PlatformFit = {
  platform: "公众号" | "小红书" | "抖音/视频号口播" | "朋友圈";
  fit: FitLevel;
  reason: string;
  format: string;
};

type ScoreItem = {
  label: string;
  value: number;
  explanation: string;
};

type WritingPlan = {
  angle: string;
  mainPoint: string;
  subheadings: string[];
  platformPriority: { platform: string; priority: string; reason: string }[];
  risks: string[];
};

type Topic = {
  title: string;
  angle: string;
  purpose: PurposeLabel;
  reason: string;
  totalScore: number;
  recommendLevel: RecommendationLevel;
  isPriority: boolean;
  recommendReason: string;
  scores: ScoreItem[];
  platformFits: PlatformFit[];
};

type RecommendationLevel = "优先写" | "可作为延展" | "暂缓观察" | "不建议优先" | "暂缓";

type ArticleOutline = {
  title: string;
  sections: { label: string; text: string }[];
  keywords: string[];
};

type ArticleDraft = {
  status: "正文生成中" | "已生成正文";
  title: string;
  intro: string;
  sections: { heading: string; paragraphs: string[] }[];
  ending: string;
};

type MultiPlatformPlan = {
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

type HotspotAnalysis = {
  totalScore?: number;
  recommendLevel?: RecommendationLevel;
  oneSentenceJudgment?: string;
  recommendReasons?: { label: string; text: string }[];
  writingPlan?: WritingPlan;
  reasons: { keyword: string; text: string }[];
  topics: Topic[];
};

type AiTask =
  | "testConnection"
  | "fetchTopicSources"
  | "generateTodayHotspots"
  | "generateHotspotsFromSources"
  | "enrichHotspotWithSources"
  | "hotspotDetail"
  | "generateOutline"
  | "generateDraft"
  | "optimizeDraft"
  | "generateXiaohongshu"
  | "generateVideoScript"
  | "generateMoments"
  | "generateMultiPlatform"
  | "optimizeXiaohongshu"
  | "optimizeVideoScript";

type AiApiError = {
  code: string;
  message: string;
  status?: number;
  type?: string;
  raw?: string;
  provider?: AiProvider;
  model?: string;
};

type AiProvider = "openai" | "deepseek";

type SearchProvider = "manual" | "none" | "openai" | "tavily" | "perplexity";

type AiProviderInfo = {
  provider: AiProvider;
  providerLabel: string;
  model: string;
  supportsWebSearch: boolean;
  modeDescription: string;
  searchProvider?: SearchProvider;
  searchProviderLabel?: string;
  searchModeDescription?: string;
  searchSupportsLiveSearch?: boolean;
};

type AiCallResult<T> =
  | ({ ok: true; data: T; task: AiTask } & AiProviderInfo)
  | {
      ok: false;
      error: AiApiError;
      task: AiTask;
      model: string;
      provider: AiProvider;
      providerLabel: string;
      supportsWebSearch: boolean;
      modeDescription: string;
      searchProvider?: SearchProvider;
      searchProviderLabel?: string;
      searchModeDescription?: string;
      searchSupportsLiveSearch?: boolean;
      fallback: true;
    };

type AiDiagnostic = {
  task: AiTask;
  model: string;
  provider?: AiProvider;
  code: string;
  message: string;
  fallback: boolean;
  connectionOk?: boolean;
};

type UploadedMaterial = {
  id: string;
  name: string;
  type: string;
  sizeLabel: string;
  status: string;
  previewUrl?: string;
};

type SpeechRecognitionAlternativeLike = {
  transcript: string;
};

type SpeechRecognitionEventLike = {
  resultIndex?: number;
  results: {
    length?: number;
    [index: number]: {
      [index: number]: SpeechRecognitionAlternativeLike;
    };
  };
};

type SpeechRecognitionErrorEventLike = {
  error?: string;
};

type SpeechRecognitionInstance = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives?: number;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  onnomatch?: (() => void) | null;
};

type WindowWithSpeechRecognition = Window &
  typeof globalThis & {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  };

const mockHotspots: Hotspot[] = getDefaultContentRadarHotspots();

const workflowSteps: { view: View; label: string; short: string }[] = [
  { view: "radar", label: "热点雷达", short: "雷达" },
  { view: "hotspotDetail", label: "选题拆解", short: "拆解" },
  { view: "contentTypeSelect", label: "内容形态", short: "形态" },
  { view: "articleOutline", label: "文章大纲", short: "大纲" },
  { view: "articleDraft", label: "公众号正文", short: "正文" },
  { view: "multiPlatform", label: "多平台矩阵", short: "矩阵" },
  { view: "publishPreview", label: "发布检查", short: "检查" },
];

export default function Home() {
  const [view, setView] = useState<View>("radar");
  const [hotspots, setHotspots] = useState<Hotspot[]>(mockHotspots);
  const [sourcePool, setSourcePool] = useState<TopicSource[]>([]);
  const [sourceManagerStatus, setSourceManagerStatus] = useState("");
  const [isGeneratingFromSources, setIsGeneratingFromSources] = useState(false);
  const [isPushingFeishu, setIsPushingFeishu] = useState(false);
  const [feishuPushStatus, setFeishuPushStatus] = useState("");
  const [hotspotRefreshStatus, setHotspotRefreshStatus] = useState(
    "AI 暂不可用，当前展示本地模拟选题机会。",
  );
  const [isRefreshingHotspots, setIsRefreshingHotspots] = useState(false);
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<HotspotAnalysis | null>(
    null,
  );
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [selectedContentType, setSelectedContentType] = useState<ContentType | null>(null);
  const [outlineNote, setOutlineNote] = useState("");
  const [generatedOutline, setGeneratedOutline] = useState<ArticleOutline | null>(
    null,
  );
  const [generatedDraft, setGeneratedDraft] = useState<ArticleDraft | null>(null);
  const [generatedMultiPlatformPlan, setGeneratedMultiPlatformPlan] =
    useState<MultiPlatformPlan | null>(null);
  const [draftNote, setDraftNote] = useState("");
  const [draftOptimizeStatus, setDraftOptimizeStatus] = useState("");
  const [aiStatus, setAiStatus] = useState("");
  const [aiDiagnostic, setAiDiagnostic] = useState<AiDiagnostic | null>(null);
  const [isTestingAi, setIsTestingAi] = useState(false);
  const [lastAiConnectionOk, setLastAiConnectionOk] = useState(false);
  const [isCheapMode, setIsCheapMode] = useState(true);
  const [currentModel, setCurrentModel] = useState("读取中");
  const [currentProvider, setCurrentProvider] = useState<AiProvider>("deepseek");
  const [currentProviderLabel, setCurrentProviderLabel] = useState("DeepSeek");
  const [supportsWebSearch, setSupportsWebSearch] = useState(false);
  const [currentSearchProvider, setCurrentSearchProvider] = useState<SearchProvider>("manual");
  const [currentSearchProviderLabel, setCurrentSearchProviderLabel] = useState("手动来源模式");
  const [currentSearchModeDescription, setCurrentSearchModeDescription] = useState("手动来源模式，不联网。");
  const [aiModeDescription, setAiModeDescription] = useState(
    "DeepSeek：低成本生成，适合开发测试、选题、大纲、小红书和短视频脚本。",
  );
  const [sessionAiCallCount, setSessionAiCallCount] = useState(0);
  const [hasHotspotCache, setHasHotspotCache] = useState(false);
  const [draftVersion, setDraftVersion] = useState(1);
  const [publishStatus, setPublishStatus] = useState("");
  const [showXiaohongshuDesign, setShowXiaohongshuDesign] = useState(false);
  const [xiaohongshuNote, setXiaohongshuNote] = useState("");
  const [xiaohongshuStatus, setXiaohongshuStatus] = useState("");
  const [videoNote, setVideoNote] = useState("");
  const [videoStatus, setVideoStatus] = useState("");
  const [momentsStatus, setMomentsStatus] = useState("");
  const [outlineGenPhase, setOutlineGenPhase] = useState<GenerationPhase>("not_started");
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [carrierGenByType, setCarrierGenByType] = useState<
    Partial<Record<CarrierGenKey, GenerationPhase>>
  >({});

  function applyAiProviderInfo(info: Partial<AiProviderInfo>) {
    if (info.provider) setCurrentProvider(info.provider);
    if (info.providerLabel) setCurrentProviderLabel(info.providerLabel);
    if (info.model) setCurrentModel(info.model);
    if (typeof info.supportsWebSearch === "boolean") {
      setSupportsWebSearch(info.supportsWebSearch);
    }
    if (info.modeDescription) setAiModeDescription(info.modeDescription);
    if (info.searchProvider) setCurrentSearchProvider(info.searchProvider);
    if (info.searchProviderLabel) setCurrentSearchProviderLabel(info.searchProviderLabel);
    if (info.searchModeDescription) setCurrentSearchModeDescription(info.searchModeDescription);
  }

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [view]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      ensureQiqiCacheVersion();
      const cachedHotspots = readLocalCache<Hotspot[]>(getTodayHotspotsCacheKey());
      if (cachedHotspots?.length) {
        setHotspots(
          cachedHotspots.map((hotspot, index) =>
            normalizeHotspotForToday(hotspot, getTodayDateLabel(), index),
          ),
        );
        setHasHotspotCache(true);
        setHotspotRefreshStatus("已读取今日缓存结果。你也可以刷新生成新的选题。");
      }

      const cachedSources = readLocalCache<TopicSource[]>(getTodaySourcesCacheKey());
      if (cachedSources?.length) {
        setSourcePool(cachedSources);
      }

      const cachedConnection = readLocalCache<{ ok: boolean; model: string }>(
        getAiConnectionCacheKey(),
      );
      if (cachedConnection?.ok) {
        setLastAiConnectionOk(true);
        setCurrentModel(cachedConnection.model);
      }

      void (async () => {
        try {
          const response = await fetch("/api/ai");
          const result = (await response.json()) as Partial<AiProviderInfo>;
          applyAiProviderInfo(result);
        } catch {
          // Metadata is diagnostic only; generation calls still report concrete errors.
        }
      })();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  const todayDate = useMemo(() => getTodayDateLabel(), []);

  async function refreshTodayHotspots() {
    setIsRefreshingHotspots(true);
    setAiDiagnostic(null);

    try {
      const supportsLiveSearch = currentSearchModeDescription.includes("支持");
      if (currentSearchProvider === "openai" || (currentSearchProvider === "tavily" && supportsLiveSearch)) {
        setHotspotRefreshStatus(
          currentSearchProvider === "tavily"
            ? "正在通过 Tavily 获取公开来源信号……预计需要 10-30 秒。"
            : "正在联网获取公开来源信号……预计需要 10-30 秒。",
        );
        setSourceManagerStatus(
          currentSearchProvider === "tavily"
            ? "正在通过 Tavily 获取公开来源信号……预计需要 10-30 秒。"
            : "正在联网获取公开来源信号……预计需要 10-30 秒。",
        );

        const fetched = await callAi<TopicSource[]>("fetchTopicSources", {
          profileContext,
        });

        if (!fetched.ok || !fetched.data.length) {
          setHotspotRefreshStatus("公开来源获取失败，请稍后重试，或手动添加来源。");
          setSourceManagerStatus("公开来源获取失败，请稍后重试，或手动添加来源。");
          if (!fetched.ok) {
            setAiDiagnostic(toAiDiagnostic(fetched, true, lastAiConnectionOk));
          }
          return;
        }

        const mergedSources = mergeTopicSources(sourcePool, fetched.data);
        const addedCount = mergedSources.length - sourcePool.length;
        saveSourcePool(mergedSources);
        setSourceManagerStatus(`已添加 ${addedCount} 条公开来源信号。`);
        setHotspotRefreshStatus("正在基于来源生成今日选题……预计需要 10-30 秒。");
        const generated = await generateHotspotsFromSources(mergedSources, {
          publicSourcesJustFetched: true,
        });
        if (generated) {
          setHotspotRefreshStatus("已基于公开来源信号生成今日选题。");
        }
        return;
      }

      if (sourcePool.length) {
        setHotspotRefreshStatus(
          currentSearchProvider === "tavily" && !supportsLiveSearch
            ? "Tavily API Key 未配置，正在基于已有来源生成今日选题……"
            : currentSearchProvider === "perplexity"
              ? "Perplexity 搜索 Provider 尚未接入，正在基于已有来源生成今日选题……"
              : currentSearchProvider === "none"
                ? "当前未启用搜索 Provider，正在基于已有来源生成今日选题……"
                : "当前为手动来源模式，正在基于已有来源生成今日选题……",
        );
        setSourceManagerStatus(
          currentSearchProvider === "tavily" && !supportsLiveSearch
            ? "Tavily API Key 未配置，正在基于已有来源生成今日选题。"
            : currentSearchProvider === "perplexity"
              ? "Perplexity 尚未接入，正在基于已有来源生成今日选题。"
              : currentSearchProvider === "none"
                ? "当前未启用搜索 Provider，正在基于已有来源生成今日选题。"
                : "当前为手动来源模式，正在基于已有来源生成今日选题。",
        );
        const generated = await generateHotspotsFromSources(sourcePool);
        setHotspotRefreshStatus(
          generated ? "已基于手动来源生成今日选题。" : "基于手动来源生成失败，请重试。",
        );
        return;
      }

      setHotspotRefreshStatus(
        currentSearchProvider === "tavily" && !supportsLiveSearch
          ? "Tavily API Key 未配置。请在 .env.local 中配置后重启项目，或先在选题来源管理器中添加来源。"
          : currentSearchProvider === "perplexity"
            ? "Perplexity 搜索 Provider 尚未接入。请切换 OpenAI 后刷新，或先在选题来源管理器中添加来源。"
            : currentSearchProvider === "none"
              ? "当前未启用搜索 Provider。请切换 OpenAI 后刷新，或先在选题来源管理器中添加来源。"
              : "当前为手动来源模式。请先在选题来源管理器中添加来源，或切换 OpenAI 后刷新。",
      );
      setSourceManagerStatus(
        currentSearchProvider === "tavily" && !supportsLiveSearch
          ? "Tavily API Key 未配置。请在 .env.local 中配置后重启项目，或先手动添加来源。"
          : currentSearchProvider === "perplexity"
            ? "Perplexity 尚未接入。请切换 OpenAI 或手动录入来源。"
            : currentSearchProvider === "none"
              ? "当前未启用搜索 Provider。请切换 OpenAI 或手动录入来源。"
              : "当前为手动来源模式。请先添加来源，或切换 OpenAI 后刷新。",
      );
    } catch (error) {
      console.error("[qiqi] refreshTodayHotspots", error);
      setHotspotRefreshStatus("刷新今日选题失败，请重试。");
      setSourceManagerStatus("刷新今日选题失败，请重试。");
      setAiDiagnostic({
        task: "generateTodayHotspots",
        model: currentModel,
        code: "REFRESH_FLOW_ERROR",
        message: "刷新今日选题流程执行失败。",
        fallback: true,
        connectionOk: lastAiConnectionOk,
      });
    } finally {
      setIsRefreshingHotspots(false);
    }
  }

  function saveSourcePool(nextSources: TopicSource[]) {
    setSourcePool(nextSources);
    writeLocalCache(getTodaySourcesCacheKey(), nextSources);
  }

  function mergeTopicSources(existingSources: TopicSource[], incomingSources: TopicSource[]) {
    const merged = [...incomingSources, ...existingSources];
    const seen = new Set<string>();
    return merged.filter((source) => {
      const key = `${source.sourceUrl?.trim() || ""}::${source.sourceTitle.trim().toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function addTopicSource(source: TopicSource) {
    saveSourcePool([source, ...sourcePool]);
    setSourceManagerStatus("已添加到来源池。");
  }

  function deleteTopicSource(sourceId: string) {
    saveSourcePool(sourcePool.filter((source) => source.id !== sourceId));
    setSourceManagerStatus("已删除来源。");
  }

  async function generateHotspotsFromSources(
    inputSources = sourcePool,
    options: { publicSourcesJustFetched?: boolean } = {},
  ) {
    const sources = inputSources.length ? inputSources : sourcePool;
    if (!sources.length) {
      setSourceManagerStatus("请先添加至少 1 条来源。");
      return false;
    }
    if (!confirmAiCost()) return false;
    setIsGeneratingFromSources(true);
    setSourceManagerStatus("正在基于来源生成今日选题……预计需要 10-30 秒。");
    setHotspotRefreshStatus("正在基于来源生成今日选题……预计需要 10-30 秒。");
    setAiDiagnostic(null);

    const result = await callAi<Hotspot[]>("generateHotspotsFromSources", {
      today: todayDate,
      sources,
      profileContext,
      qiqiWritingStyle,
    });

    if (result.ok && result.data.length) {
      setLastAiConnectionOk(true);
      const normalizedHotspots = result.data.slice(0, 4).map((hotspot, index) =>
        normalizeHotspotForToday(
          {
            ...hotspot,
            sourceMode: hotspot.sourceMode,
            sourceType: hotspot.sourceType,
            displayTag: hotspot.displayTag,
            sourceChannel: hotspot.sourceChannel,
            isRealTimeSource: hotspot.isRealTimeSource,
          },
          todayDate,
          index,
        ),
      );
      setHotspots(normalizedHotspots);
      writeLocalCache(getTodayHotspotsCacheKey(), normalizedHotspots);
      setHasHotspotCache(true);
      setSourceManagerStatus("已基于来源生成今日 4 个内容机会。");
      setHotspotRefreshStatus("已基于用户录入来源生成今日内容机会。当前不是平台真实热榜。");
    } else {
      if (!result.ok) {
        setAiDiagnostic(toAiDiagnostic(result, true, lastAiConnectionOk));
      }
      const failureMessage = options.publicSourcesJustFetched
        ? getSourceGenerationFailureMessage(result)
        : "基于来源生成失败，请稍后重试。";
      setSourceManagerStatus(failureMessage);
      setHotspotRefreshStatus(failureMessage);
    }

    setIsGeneratingFromSources(false);
    return result.ok && Boolean(result.data?.length);
  }

  function useCachedTodayHotspots() {
    const cachedHotspots = readLocalCache<Hotspot[]>(getTodayHotspotsCacheKey());
    if (!cachedHotspots?.length) return;
    setHotspots(cachedHotspots.map((hotspot, index) => normalizeHotspotForToday(hotspot, todayDate, index)));
    setHasHotspotCache(true);
    setHotspotRefreshStatus("已读取今日缓存结果。你也可以刷新生成新的选题。");
  }

  async function testAiConnection() {
    if (!confirmAiCost()) return;
    setIsTestingAi(true);
    setAiDiagnostic(null);
    setHotspotRefreshStatus("正在快速测试 AI 连接……预计 5-10 秒。");
    const result = await callAi<{ message: string; model: string }>(
      "testConnection",
      {},
      { timeoutMs: 15000 },
    );

    if (result.ok) {
      setLastAiConnectionOk(true);
      const model = result.data.model || result.model;
      setCurrentModel(model);
      writeLocalCache(getAiConnectionCacheKey(), { ok: true, model });
      setHotspotRefreshStatus("AI 连接成功。");
      setAiDiagnostic({
        task: "testConnection",
        model,
        code: "AI_CONNECTION_OK",
        message: result.data.message || "AI连接成功",
        fallback: false,
        connectionOk: true,
      });
    } else {
      setLastAiConnectionOk(false);
      const failureMessage = getAiConnectionFailureMessage(result);
      setHotspotRefreshStatus(
        result.error.code === "AI_CONNECTION_TIMEOUT"
          ? failureMessage
          : `AI 连接失败：${failureMessage}`,
      );
      setAiDiagnostic({
        task: result.task,
        model: result.model,
        code: result.error.code,
        message: failureMessage,
        fallback: true,
        connectionOk: false,
      });
    }

    setIsTestingAi(false);
  }

  async function testFeishuPush() {
    setIsPushingFeishu(true);
    setFeishuPushStatus("正在推送到飞书...");

    try {
      const featuredHotspots = [...hotspots]
        .sort(
          (left, right) =>
            buildUnifiedTopicScore(right).totalScore - buildUnifiedTopicScore(left).totalScore,
        )
        .slice(0, 4);
      const response = await fetch("/api/feishu/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "manual_test",
          hotspots: featuredHotspots,
        }),
      });
      const result = (await response.json()) as {
        ok?: boolean;
        message?: string;
      };

      setFeishuPushStatus(
        result.ok
          ? "已推送到飞书群，请查看消息。"
          : result.message || "飞书推送失败，请检查 webhook 配置。",
      );
    } catch {
      setFeishuPushStatus("飞书推送失败，请检查 webhook 配置。");
    } finally {
      setIsPushingFeishu(false);
    }
  }

  async function openHotspotDetail(hotspot: Hotspot) {
    const currentHotspot = normalizeHotspotForToday(hotspot, todayDate, hotspots.indexOf(hotspot));
    const rawCachedAnalysis = readLocalCache<HotspotAnalysis>(
      getHotspotAnalysisCacheKey(currentHotspot),
    );
    const cachedAnalysis = rawCachedAnalysis
      ? normalizeHotspotAnalysis(rawCachedAnalysis, currentHotspot)
      : null;
    setSelectedHotspot(currentHotspot);
    setSelectedAnalysis(cachedAnalysis ?? buildAnalysis(currentHotspot));
    setSelectedTopic(null);
    setSelectedContentType(null);
    setGeneratedOutline(null);
    setGeneratedDraft(null);
    setGeneratedMultiPlatformPlan(null);
    setOutlineNote("");
    setDraftNote("");
    setDraftOptimizeStatus("");
    setPublishStatus("");
    setShowXiaohongshuDesign(false);
    setXiaohongshuNote("");
    setXiaohongshuStatus("");
    setVideoNote("");
    setVideoStatus("");
    setMomentsStatus("");
    setOutlineGenPhase("not_started");
    setIsGeneratingDraft(false);
    setCarrierGenByType({});
    setView("hotspotDetail");
    setAiStatus(cachedAnalysis ? "已读取这个选题的拆解缓存。" : "正在用 AI 拆解当前选题…");

    if (cachedAnalysis) return;

    const analysis = await callAi<HotspotAnalysis>("hotspotDetail", {
      hotspot: {
        id: currentHotspot.id,
        title: currentHotspot.title,
        description: currentHotspot.description,
        fit: currentHotspot.fit,
        reason: currentHotspot.reason,
        attentionReason: currentHotspot.attentionReason,
        fitPlatforms: currentHotspot.fitPlatforms,
        purposes: currentHotspot.purposes,
        sourceMode: currentHotspot.sourceMode,
        sourceChannel: currentHotspot.sourceChannel,
        evidenceLinks: currentHotspot.evidenceLinks ?? [],
        sourceEvidence: currentHotspot.sourceEvidence,
      },
      profileContext,
      qiqiWritingStyle,
    });
    if (analysis.ok) {
      const normalizedAnalysis = normalizeHotspotAnalysis(analysis.data, currentHotspot);
      setSelectedAnalysis(normalizedAnalysis);
      writeLocalCache(getHotspotAnalysisCacheKey(currentHotspot), normalizedAnalysis);
      setAiStatus("AI 已完成当前选题拆解。");
    } else {
      setAiDiagnostic(toAiDiagnostic(analysis, true, lastAiConnectionOk));
      setAiStatus("生成失败，请重试。");
    }
  }

  function chooseTopic(topic: Topic) {
    setSelectedTopic(topic);
    setSelectedContentType(null);
    const cachedOutline = selectedHotspot
      ? readLocalCache<ArticleOutline>(getOutlineCacheKey(selectedHotspot, topic))
      : null;
    const cachedDraft = selectedHotspot
      ? readLocalCache<ArticleDraft>(getDraftCacheKey(selectedHotspot, topic))
      : null;
    const cachedMulti = selectedHotspot
      ? readLocalCache<MultiPlatformPlan>(getMultiPlatformCacheKey(selectedHotspot, topic, "multiPlatform"))
      : null;
    setGeneratedOutline(cachedOutline);
    setGeneratedDraft(cachedDraft);
    setGeneratedMultiPlatformPlan(
      cachedMulti ? normalizeMultiPlatformPlanForDisplay(cachedMulti) : null,
    );
    setOutlineNote("");
    setDraftNote("");
    setDraftOptimizeStatus("");
    setPublishStatus("");
    setShowXiaohongshuDesign(false);
    setXiaohongshuNote("");
    setXiaohongshuStatus("");
    setVideoNote("");
    setVideoStatus("");
    setMomentsStatus("");
    setOutlineGenPhase(
      cachedOutline && hasOutlineDisplayableContent(cachedOutline) ? "success" : "not_started",
    );
    setIsGeneratingDraft(false);
    if (cachedMulti) {
      const norm = normalizeMultiPlatformPlanForDisplay(cachedMulti);
      setCarrierGenByType({
        multiPlatform: carrierHasDisplayableContent("multiPlatform", norm) ? "success" : "empty",
      });
    } else {
      setCarrierGenByType({});
    }
    setView("contentTypeSelect");
  }

  async function generateOutline() {
    if (!selectedHotspot || !selectedTopic) return;
    setOutlineGenPhase("generating");
    setAiStatus("正在生成公众号文章大纲……");
    try {
      const outline = await callAi<ArticleOutline>("generateOutline", {
        hotspot: selectedHotspot,
        selectedHotspot,
        topic: selectedTopic,
        selectedAngle: selectedTopic,
        selectedContentType: "公众号文章大纲",
        userNote: outlineNote,
      });
      if (outline.ok && hasOutlineDisplayableContent(outline.data)) {
        const normalizedOutline = normalizeArticleOutlineForDisplay(outline.data);
        setGeneratedOutline(normalizedOutline);
        writeLocalCache(getOutlineCacheKey(selectedHotspot, selectedTopic), normalizedOutline);
        setOutlineGenPhase("success");
        setAiStatus("AI 已生成公众号文章大纲。");
      } else if (outline.ok) {
        const normalizedOutline = normalizeArticleOutlineForDisplay(outline.data);
        setGeneratedOutline(normalizedOutline);
        writeLocalCache(getOutlineCacheKey(selectedHotspot, selectedTopic), normalizedOutline);
        setOutlineGenPhase("empty");
        setAiStatus("生成结果为空，请重新生成。");
      } else {
        setAiDiagnostic(toAiDiagnostic(outline, true, lastAiConnectionOk));
        setGeneratedOutline(buildArticleOutline(selectedHotspot, selectedTopic, outlineNote));
        setOutlineGenPhase("error");
        setAiStatus("生成失败，请重试。");
      }
    } catch (e) {
      console.error("[qiqi] generateOutline", e);
      setGeneratedOutline(buildArticleOutline(selectedHotspot, selectedTopic, outlineNote));
      setOutlineGenPhase("error");
      setAiStatus("生成失败，请重试。");
    }
  }

  async function confirmOutline() {
    if (!selectedHotspot || !selectedTopic) return;
    if (isGeneratingDraft) return;
    if (!confirmAiCost()) return;
    const outline =
      generatedOutline ?? buildArticleOutline(selectedHotspot, selectedTopic, outlineNote);
    setGeneratedOutline(outline);
    setIsGeneratingDraft(true);
    setDraftOptimizeStatus("");
    setAiStatus("正在生成公众号正文……预计需要 20-60 秒，请不要重复点击。");
    try {
      const draft = await callAi<ArticleDraft>("generateDraft", {
        hotspot: selectedHotspot,
        selectedHotspot,
        topic: selectedTopic,
        selectedAngle: selectedTopic,
        selectedContentType: "公众号正文",
        outline,
        userNote: outlineNote,
      });
      if (draft.ok) {
        const next = normalizeArticleDraftFromAi(draft.data);
        if (isCompleteArticleDraft(next)) {
          setGeneratedDraft(next);
          writeLocalCache(getDraftCacheKey(selectedHotspot, selectedTopic), next);
          setAiStatus("AI 已生成公众号正文。");
          setView("articleDraft");
        } else if (hasArticleDraftContent(next)) {
          setAiStatus("生成内容过短，请重新生成。");
        } else {
          setAiStatus("生成内容过短，请重新生成。");
        }
      } else {
        setAiDiagnostic(toAiDiagnostic(draft, true, lastAiConnectionOk));
        setAiStatus(
          draft.error.code === "AI_OUTPUT_TRUNCATED"
            ? draft.error.message
            : draft.error.code === "ARTICLE_DRAFT_TOO_SHORT"
              ? "生成内容过短，请重新生成。"
              : "公众号正文生成失败，请重试。",
        );
      }
    } catch (e) {
      console.error("[qiqi] confirmOutline / generateDraft", e);
      setAiStatus("公众号正文生成失败，请重试。");
    } finally {
      setIsGeneratingDraft(false);
    }
  }

  async function optimizeDraft(extraOptimizeNote = "", successStatus = "已生成优化版") {
    if (!selectedHotspot || !selectedTopic) return false;
    if (!confirmAiCost()) return false;
    const outline =
      generatedOutline ?? buildArticleOutline(selectedHotspot, selectedTopic, outlineNote);
    const nextVersion = draftVersion + 1;
    const defaultOptimizeNote =
      "默认优化：更口语、更真实、更有项目观察感，少一点官方判断和说明文语气。";
    const userNote =
      typeof extraOptimizeNote === "string" && extraOptimizeNote.trim()
        ? extraOptimizeNote.trim()
        : draftNote.trim() || defaultOptimizeNote;
    const styleContext = `${outlineNote} ${userNote}`.trim();
    setDraftVersion(nextVersion);
    setGeneratedOutline(outline);
    setDraftOptimizeStatus("");
    setAiStatus("正在按七七语气优化...");
    setIsGeneratingDraft(true);
    let optimized = false;
    try {
      const draft = await callAi<ArticleDraft>("optimizeDraft", {
        hotspot: selectedHotspot,
        selectedHotspot,
        topic: selectedTopic,
        selectedAngle: selectedTopic,
        selectedContentType: "公众号正文优化",
        outline,
        draft: generatedDraft ?? undefined,
        userNote: styleContext,
      });
      const fallbackDraft = buildArticleDraft(
        selectedHotspot,
        selectedTopic,
        outline,
        styleContext,
        nextVersion,
      );
      if (draft.ok) {
        const next = normalizeArticleDraftFromAi(draft.data);
        if (isCompleteArticleDraft(next)) {
          setGeneratedDraft(next);
          writeLocalCache(getDraftCacheKey(selectedHotspot, selectedTopic), next);
          setAiStatus("AI 已完成正文优化。");
          optimized = true;
        } else if (hasArticleDraftContent(next)) {
          setGeneratedDraft(next);
          setAiStatus("当前正文结构不够完整，建议重新生成或继续优化。");
          optimized = true;
        } else {
          setAiStatus("生成内容过短，请重新生成。");
        }
      } else {
        setAiDiagnostic(toAiDiagnostic(draft, true, lastAiConnectionOk));
        if (!hasArticleDraftContent(generatedDraft)) {
          setGeneratedDraft(fallbackDraft);
        }
        setAiStatus(
          draft.error.code === "AI_OUTPUT_TRUNCATED"
            ? draft.error.message
            : draft.error.code === "ARTICLE_DRAFT_TOO_SHORT"
              ? "生成内容过短，请重新生成。"
              : "公众号正文生成失败，请重试。",
        );
      }
    } catch (e) {
      console.error("[qiqi] optimizeDraft", e);
      if (!hasArticleDraftContent(generatedDraft)) {
        setGeneratedDraft(
          buildArticleDraft(
            selectedHotspot,
            selectedTopic,
            outline,
            styleContext,
            nextVersion,
          ),
        );
      }
      setAiStatus("优化失败，请稍后重试。");
    }
    setIsGeneratingDraft(false);
    setDraftOptimizeStatus(optimized ? successStatus : "优化失败，请稍后重试。");
    return optimized;
  }

  async function generateMultiPlatform() {
    if (!selectedHotspot || !selectedTopic) {
      return;
    }
    if (!generatedDraft || !isCompleteArticleDraft(generatedDraft)) {
      setAiStatus("请先生成完整公众号正文，再进入多平台内容矩阵。");
      return;
    }
    const outline =
      generatedOutline ?? buildArticleOutline(selectedHotspot, selectedTopic, outlineNote);
    const draft =
      generatedDraft ??
      buildArticleDraft(selectedHotspot, selectedTopic, outline, outlineNote, draftVersion);
    setSelectedContentType("multiPlatform");
    setView("multiPlatform");
    setGeneratedOutline(outline);
    setGeneratedDraft(draft);
    const cachedXiaohongshu = readLocalCache<MultiPlatformPlan>(
      getMultiPlatformCacheKey(selectedHotspot, selectedTopic, "xiaohongshu"),
    );
    const cachedVideo = readLocalCache<MultiPlatformPlan>(
      getMultiPlatformCacheKey(selectedHotspot, selectedTopic, "videoScript"),
    );
    const cachedMoments = readLocalCache<MultiPlatformPlan>(
      getMultiPlatformCacheKey(selectedHotspot, selectedTopic, "moments"),
    );
    let nextPlan = createEmptyMultiPlatformPlan();
    if (cachedXiaohongshu) {
      nextPlan = mergeCarrierPlan(nextPlan, "xiaohongshu", normalizeMultiPlatformPlanForDisplay(cachedXiaohongshu));
    }
    if (cachedVideo) {
      nextPlan = mergeCarrierPlan(nextPlan, "videoScript", normalizeMultiPlatformPlanForDisplay(cachedVideo));
    }
    if (cachedMoments) {
      nextPlan = mergeCarrierPlan(nextPlan, "moments", normalizeMultiPlatformPlanForDisplay(cachedMoments));
    }
    setGeneratedMultiPlatformPlan(nextPlan);
    setCarrierGenByType({
      multiPlatform: carrierHasDisplayableContent("multiPlatform", nextPlan) ? "success" : "not_started",
      xiaohongshu: carrierHasDisplayableContent("xiaohongshu", nextPlan) ? "success" : "not_started",
      videoScript: carrierHasDisplayableContent("videoScript", nextPlan) ? "success" : "not_started",
      moments: carrierHasDisplayableContent("moments", nextPlan) ? "success" : "not_started",
    });
    setXiaohongshuStatus(carrierHasDisplayableContent("xiaohongshu", nextPlan) ? "已生成" : "");
    setVideoStatus(carrierHasDisplayableContent("videoScript", nextPlan) ? "已生成" : "");
    setMomentsStatus(carrierHasDisplayableContent("moments", nextPlan) ? "已生成" : "");
    setAiStatus("已进入多平台内容矩阵，请按需生成小红书、短视频或朋友圈内容。");
  }

  function setCarrierStatus(contentType: ContentType, status: string) {
    if (contentType === "xiaohongshu") setXiaohongshuStatus(status);
    if (contentType === "videoScript") setVideoStatus(status);
    if (contentType === "moments") setMomentsStatus(status);
  }

  async function startContentGeneration(contentType: ContentType) {
    if (!selectedHotspot || !selectedTopic) return;
    if (!confirmAiCost()) return;
    setSelectedContentType(contentType);

    if (contentType === "articleOutline") {
      setView("articleOutline");
      setOutlineGenPhase("generating");
      setAiStatus("正在生成公众号文章大纲……");
      void generateOutline();
      return;
    }

    const outline =
      generatedOutline ?? buildArticleOutline(selectedHotspot, selectedTopic, outlineNote);
    const draft =
      generatedDraft ??
      buildArticleDraft(selectedHotspot, selectedTopic, outline, outlineNote, draftVersion);
    const key = contentType as CarrierGenKey;
    setView(viewForContentType(contentType));
    setGeneratedOutline(outline);
    setGeneratedDraft(draft);
    setGeneratedMultiPlatformPlan(createEmptyMultiPlatformPlan());
    setCarrierGenByType((p) => ({ ...p, [key]: "generating" }));
    setAiStatus("");
    void generatePlatformContent(contentType);
  }

  async function generatePlatformContent(contentType: ContentType, stayOnMatrix = false) {
    if (!selectedHotspot || !selectedTopic) return;
    if (contentType === "articleOutline") return;
    const contentTypeLabel = getContentTypeLabel(contentType);
    const genKey = contentType as CarrierGenKey;
    const outline =
      generatedOutline ?? buildArticleOutline(selectedHotspot, selectedTopic, outlineNote);
    const draft =
      generatedDraft ??
      buildArticleDraft(selectedHotspot, selectedTopic, outline, outlineNote, draftVersion);
    const cachedPlan = readLocalCache<MultiPlatformPlan>(
      getMultiPlatformCacheKey(selectedHotspot, selectedTopic, contentType),
    );

    setSelectedContentType(contentType);
    setGeneratedOutline(outline);
    setGeneratedDraft(draft);

    if (contentType === "multiPlatform") {
      setCarrierGenByType((p) => ({ ...p, multiPlatform: "generating" }));
      await generateMultiPlatformMatrix(outline, draft);
      setView("multiPlatform");
      return;
    }

    if (cachedPlan) {
      const normalized = normalizeMultiPlatformPlanForDisplay(cachedPlan);
      const nextPlan = stayOnMatrix
        ? mergeCarrierPlan(
            normalizeMultiPlatformPlanForDisplay(generatedMultiPlatformPlan ?? {}),
            contentType as Exclude<ContentType, "articleOutline" | "multiPlatform">,
            normalized,
          )
        : normalized;
      setGeneratedMultiPlatformPlan(nextPlan);
      const has = carrierHasDisplayableContent(contentType, nextPlan);
      setCarrierGenByType((p) => ({
        ...p,
        [genKey]: has ? "success" : "empty",
      }));
      setAiStatus(
        has ? `已读取${contentTypeLabel}缓存。` : "AI 返回内容为空，请重新生成。",
      );
      setCarrierStatus(
        contentType,
        has ? "" : "AI 返回内容为空，请重新生成。",
      );
      setView(stayOnMatrix ? "multiPlatform" : viewForContentType(contentType));
      return;
    }

    setCarrierGenByType((p) => ({ ...p, [genKey]: "generating" }));

    await generateSingleCarrierContent(contentType, outline, draft);
    setView(stayOnMatrix ? "multiPlatform" : viewForContentType(contentType));
    return;
  }

  async function generateMultiPlatformMatrix(outline: ArticleOutline, draft: ArticleDraft) {
    if (!selectedHotspot || !selectedTopic) return;
    let nextPlan = normalizeMultiPlatformPlanForDisplay(generatedMultiPlatformPlan ?? {});
    const carriers: Exclude<ContentType, "articleOutline" | "multiPlatform">[] = [
      "xiaohongshu",
      "videoScript",
      "moments",
    ];

    for (const carrier of carriers) {
      const cached = readLocalCache<MultiPlatformPlan>(
        getMultiPlatformCacheKey(selectedHotspot, selectedTopic, carrier),
      );
      if (cached) {
        nextPlan = mergeCarrierPlan(nextPlan, carrier, normalizeMultiPlatformPlanForDisplay(cached));
      }
    }

    setGeneratedMultiPlatformPlan(nextPlan);

    for (const carrier of carriers) {
      const label = getContentTypeLabel(carrier);
      const genKey = carrier as CarrierGenKey;
      if (carrierHasDisplayableContent(carrier, nextPlan)) {
        setCarrierGenByType((p) => ({ ...p, [genKey]: "success" }));
        setCarrierStatus(carrier, "复用已有");
        continue;
      }

      setCarrierGenByType((p) => ({ ...p, [genKey]: "generating" }));
      setCarrierStatus(carrier, "生成中");
      try {
        const result = await callAi<
          MultiPlatformPlan["xiaohongshu"] | MultiPlatformPlan["video"] | MultiPlatformPlan["moments"]
        >(getSingleCarrierTask(carrier), {
          hotspot: selectedHotspot,
          selectedHotspot,
          topic: selectedTopic,
          selectedAngle: selectedTopic,
          selectedContentType: label,
          articleOutline: outline,
          outline,
          articleDraft: draft,
          draft,
          userNote: outlineNote,
        });

        if (!result.ok) {
          setAiDiagnostic(toAiDiagnostic(result, true, lastAiConnectionOk));
          setCarrierGenByType((p) => ({ ...p, [genKey]: "error" }));
          setCarrierStatus(carrier, "该平台内容生成失败，请稍后重试。");
          continue;
        }

        const carrierPlan = wrapSingleCarrierPlan(carrier, result.data);
        nextPlan = mergeCarrierPlan(nextPlan, carrier, carrierPlan);
        setGeneratedMultiPlatformPlan(nextPlan);
        if (carrierHasDisplayableContent(carrier, nextPlan)) {
          writeLocalCache(getMultiPlatformCacheKey(selectedHotspot, selectedTopic, carrier), carrierPlan);
          setCarrierGenByType((p) => ({ ...p, [genKey]: "success" }));
          setCarrierStatus(carrier, "已完成");
        } else {
          setCarrierGenByType((p) => ({ ...p, [genKey]: "error" }));
          setCarrierStatus(carrier, "该平台内容生成失败，请稍后重试。");
        }
      } catch (e) {
        console.error("[qiqi] generateMultiPlatformMatrix", e);
        setCarrierGenByType((p) => ({ ...p, [genKey]: "error" }));
        setCarrierStatus(carrier, "该平台内容生成失败，请稍后重试。");
      }
    }

    const hasAny = carrierHasDisplayableContent("multiPlatform", nextPlan);
    setGeneratedMultiPlatformPlan(nextPlan);
    setCarrierGenByType((p) => ({ ...p, multiPlatform: hasAny ? "success" : "error" }));
    if (hasAny) {
      writeLocalCache(getMultiPlatformCacheKey(selectedHotspot, selectedTopic, "multiPlatform"), nextPlan);
      setAiStatus("多平台内容矩阵已生成。");
    } else {
      setAiStatus("该平台内容生成失败，请稍后重试。");
    }
  }

  async function generateSingleCarrierContent(
    contentType: Exclude<ContentType, "articleOutline" | "multiPlatform">,
    outline: ArticleOutline,
    draft: ArticleDraft,
  ) {
    if (!selectedHotspot || !selectedTopic) return;
    const contentTypeLabel = getContentTypeLabel(contentType);
    const genKey = contentType as CarrierGenKey;
    const cacheKey = getMultiPlatformCacheKey(selectedHotspot, selectedTopic, contentType);
    const payload = {
      hotspot: selectedHotspot,
      selectedHotspot,
      topic: selectedTopic,
      selectedAngle: selectedTopic,
      selectedContentType: contentTypeLabel,
      articleOutline: outline,
      outline,
      articleDraft: hasArticleDraftContent(draft) ? draft : undefined,
      draft: hasArticleDraftContent(draft) ? draft : undefined,
      userNote: outlineNote,
    };

    setCarrierStatus(contentType, `正在生成${contentTypeLabel}……预计需要 10-30 秒，请不要重复点击。`);

    try {
      const result = await callAi<
        MultiPlatformPlan["xiaohongshu"] | MultiPlatformPlan["video"] | MultiPlatformPlan["moments"]
      >(getSingleCarrierTask(contentType), payload);

      if (!result.ok) {
        setAiDiagnostic(toAiDiagnostic(result, true, lastAiConnectionOk));
        setCarrierGenByType((p) => ({ ...p, [genKey]: "error" }));
        setCarrierStatus(contentType, "生成失败，请重试。");
        setAiStatus("生成失败，请重试。");
        return;
      }

      const nextPlan = mergeCarrierPlan(
        normalizeMultiPlatformPlanForDisplay(generatedMultiPlatformPlan ?? {}),
        contentType,
        wrapSingleCarrierPlan(contentType, result.data),
      );
      const has = carrierHasDisplayableContent(contentType, nextPlan);
      setGeneratedMultiPlatformPlan(nextPlan);
      setCarrierGenByType((p) => ({ ...p, [genKey]: has ? "success" : "empty" }));

      if (has) {
        writeLocalCache(cacheKey, nextPlan);
        setCarrierStatus(contentType, "");
        setAiStatus(`AI 已生成${contentTypeLabel}。`);
      } else {
        setCarrierStatus(contentType, "AI 返回内容为空，请重新生成。");
        setAiStatus("AI 返回内容为空，请重新生成。");
      }
    } catch (e) {
      console.error("[qiqi] generateSingleCarrierContent", e);
      setCarrierGenByType((p) => ({ ...p, [genKey]: "error" }));
      setCarrierStatus(contentType, "生成失败，请重试。");
      setAiStatus("生成失败，请重试。");
    }
  }

  async function optimizeXiaohongshu() {
    if (!selectedHotspot || !selectedTopic || !generatedMultiPlatformPlan) return;
    if (!confirmAiCost()) return;
    setXiaohongshuStatus("正在按你的意见优化小红书图文……");
    try {
      const xiaohongshu = await callAi<MultiPlatformPlan["xiaohongshu"]>(
        "optimizeXiaohongshu",
        {
          hotspot: selectedHotspot,
          selectedHotspot,
          topic: selectedTopic,
          selectedAngle: selectedTopic,
          selectedContentType: "小红书图文",
          xiaohongshu: generatedMultiPlatformPlan.xiaohongshu,
          userNote:
            xiaohongshuNote.trim() ||
            "默认优化：标题更抓人，正文更像真实分享，封面更适合女性营养师风格，不要像营销文案。",
        },
      );

      setGeneratedMultiPlatformPlan((current) => {
        if (!current) return current;
        const xhs = xiaohongshu.ok
          ? xiaohongshu.data
          : optimizeXiaohongshuLocally(
              normalizeMultiPlatformPlanForDisplay(current).xiaohongshu,
              xiaohongshuNote,
            );
        const merged = normalizeMultiPlatformPlanForDisplay({ ...current, xiaohongshu: xhs });
        if (!xiaohongshu.ok) {
          setAiDiagnostic(toAiDiagnostic(xiaohongshu, true, lastAiConnectionOk));
          setXiaohongshuStatus("生成失败，请重试。");
        } else if (hasXiaohongshuDisplayableContent(merged)) {
          writeLocalCache(
            getMultiPlatformCacheKey(selectedHotspot, selectedTopic, "xiaohongshu"),
            merged,
          );
          setXiaohongshuStatus("AI 已按意见优化小红书图文。");
        } else {
          setXiaohongshuStatus("生成结果为空，请重新生成。");
        }
        return merged;
      });
    } catch (e) {
      console.error("[qiqi] optimizeXiaohongshu", e);
      setXiaohongshuStatus("生成失败，请重试。");
    }
  }

  async function optimizeVideoScript() {
    if (!selectedHotspot || !selectedTopic || !generatedMultiPlatformPlan) return;
    if (!confirmAiCost()) return;
    setVideoStatus("正在按你的意见优化短视频口播脚本……");
    try {
      const video = await callAi<MultiPlatformPlan["video"]>("optimizeVideoScript", {
        hotspot: selectedHotspot,
        selectedHotspot,
        topic: selectedTopic,
        selectedAngle: selectedTopic,
        selectedContentType: "短视频口播稿",
        video: generatedMultiPlatformPlan.video,
        userNote:
          videoNote.trim() ||
          "默认优化：开头更抓人，语气更像陈七七本人，减少理论，多一点项目现场感。",
      });

      setGeneratedMultiPlatformPlan((current) => {
        if (!current) return current;
        const vd = video.ok
          ? video.data
          : optimizeVideoLocally(
              normalizeMultiPlatformPlanForDisplay(current).video,
              videoNote,
            );
        const merged = normalizeMultiPlatformPlanForDisplay({ ...current, video: vd });
        if (!video.ok) {
          setAiDiagnostic(toAiDiagnostic(video, true, lastAiConnectionOk));
          setVideoStatus("生成失败，请重试。");
        } else if (hasVideoDisplayableContent(merged)) {
          writeLocalCache(getMultiPlatformCacheKey(selectedHotspot, selectedTopic, "videoScript"), merged);
          setVideoStatus("AI 已按意见优化短视频脚本。");
        } else {
          setVideoStatus("生成结果为空，请重新生成。");
        }
        return merged;
      });
    } catch (e) {
      console.error("[qiqi] optimizeVideoScript", e);
      setVideoStatus("生成失败，请重试。");
    }
  }

  async function callAi<T>(
    task: AiTask,
    payload: Record<string, unknown>,
    options: { timeoutMs?: number } = {},
  ): Promise<AiCallResult<T>> {
    let timeout: number | null = null;
    try {
      const controller = new AbortController();
      timeout = options.timeoutMs
        ? window.setTimeout(() => controller.abort(), options.timeoutMs)
        : null;
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({ task, payload }),
      });
      if (timeout) window.clearTimeout(timeout);
      timeout = null;
      const result = (await response.json()) as {
        ok: boolean;
        data?: T;
        error?: AiApiError;
        task?: AiTask;
        model?: string;
        provider?: AiProvider;
        providerLabel?: string;
        supportsWebSearch?: boolean;
        modeDescription?: string;
        searchProvider?: SearchProvider;
        searchProviderLabel?: string;
        searchModeDescription?: string;
        searchSupportsLiveSearch?: boolean;
        fallback?: boolean;
      };
      setSessionAiCallCount((count) => count + 1);
      applyAiProviderInfo(result);

      if (response.ok && result.ok && result.data) {
        return {
          ok: true,
          data: result.data,
          task: result.task ?? task,
          model: result.model ?? "unknown",
          provider: result.provider ?? currentProvider,
          providerLabel: result.providerLabel ?? currentProviderLabel,
          supportsWebSearch: result.supportsWebSearch ?? supportsWebSearch,
          modeDescription: result.modeDescription ?? aiModeDescription,
          searchProvider: result.searchProvider ?? currentSearchProvider,
          searchProviderLabel: result.searchProviderLabel ?? currentSearchProviderLabel,
          searchModeDescription: result.searchModeDescription ?? currentSearchModeDescription,
          searchSupportsLiveSearch: result.searchSupportsLiveSearch ?? false,
        };
      }

      return {
        ok: false,
        error: result.error ?? {
          code: response.ok ? "EMPTY_AI_DATA" : `HTTP_${response.status}`,
          message: response.ok
            ? "AI 接口没有返回可用 data。"
            : `AI 接口请求失败，HTTP ${response.status}。`,
        },
        task: result.task ?? task,
        model: result.model ?? "unknown",
        provider: result.provider ?? currentProvider,
        providerLabel: result.providerLabel ?? currentProviderLabel,
        supportsWebSearch: result.supportsWebSearch ?? supportsWebSearch,
        modeDescription: result.modeDescription ?? aiModeDescription,
        searchProvider: result.searchProvider ?? currentSearchProvider,
        searchProviderLabel: result.searchProviderLabel ?? currentSearchProviderLabel,
        searchModeDescription: result.searchModeDescription ?? currentSearchModeDescription,
        searchSupportsLiveSearch: result.searchSupportsLiveSearch ?? false,
        fallback: true,
      };
    } catch (error) {
      if (timeout) window.clearTimeout(timeout);
      return {
        ok: false,
        error: {
          code:
            error instanceof Error && error.name === "AbortError"
              ? "AI_CONNECTION_TIMEOUT"
              : "AI_NETWORK_OR_CLIENT_ERROR",
          message:
            error instanceof Error && error.name === "AbortError"
              ? "AI 连接测试超时，请稍后重试；这不影响你使用本地来源池。"
              : "AI 服务暂时不可用，请稍后重试。",
        },
        task,
        model: "unknown",
        provider: currentProvider,
        providerLabel: currentProviderLabel,
        supportsWebSearch,
        modeDescription: aiModeDescription,
        fallback: true,
      };
    }
  }

  function getAiConnectionFailureMessage<T>(result: Extract<AiCallResult<T>, { ok: false }>) {
    if (result.error.code === "AI_CONNECTION_TIMEOUT") {
      return "AI 连接测试超时，请稍后重试。";
    }

    if (result.provider === "deepseek") {
      return "当前 Provider 暂时不可用，请稍后重试。";
    }

    return getSafeAiErrorMessage(result);
  }

  function getSourceGenerationFailureMessage<T>(result: AiCallResult<T>) {
    if (!result.ok && result.provider === "deepseek") {
      return "来源已获取，但 DeepSeek 暂时不可用，请稍后重试生成选题。";
    }

    return "来源已获取，但 AI 生成选题失败，请稍后重试。";
  }

  function getSafeAiErrorMessage<T>(result: Extract<AiCallResult<T>, { ok: false }>) {
    if (isUnsafeErrorText(result.error.message) || isUnsafeErrorText(result.error.raw)) {
      return result.provider === "deepseek"
        ? "DeepSeek 服务暂时不可用，请稍后重试。"
        : "AI 服务暂时不可用，请稍后重试。";
    }

    return result.error.message || "AI 服务暂时不可用，请稍后重试。";
  }

  function isUnsafeErrorText(value?: string) {
    return Boolean(
      value &&
        /<!doctype|<html|cloudfront|gateway timeout|504 error|request could not be satisfied|payload|stack/i.test(
          value,
        ),
    );
  }

  function toAiDiagnostic<T>(
    result: Extract<AiCallResult<T>, { ok: false }>,
    fallback: boolean,
    connectionOk?: boolean,
  ): AiDiagnostic {
    return {
      task: result.task,
      model: result.model,
      provider: result.provider,
      code: result.error.code,
      message: getSafeAiErrorMessage(result),
      fallback,
      connectionOk,
    };
  }

  if (view === "hotspotDetail" && selectedHotspot) {
    return (
      <HotspotDetailView
        hotspot={selectedHotspot}
        analysis={selectedAnalysis ?? buildAnalysis(selectedHotspot)}
        aiStatus={aiStatus}
        selectedTopic={selectedTopic}
        currentProvider={currentProvider}
        onBack={() => setView("radar")}
        onChooseTopic={chooseTopic}
      />
    );
  }

  if (view === "contentTypeSelect" && selectedHotspot) {
    return (
      <ContentTypeSelectView
        hotspot={selectedHotspot}
        topic={selectedTopic}
        onBack={() => setView("hotspotDetail")}
        onGenerateContent={startContentGeneration}
      />
    );
  }

  if (view === "articleOutline" && selectedHotspot && selectedTopic) {
    return (
      <ArticleOutlineView
        hotspot={selectedHotspot}
        topic={selectedTopic}
        note={outlineNote}
        outline={generatedOutline}
        outlineGenPhase={outlineGenPhase}
        isGeneratingDraft={isGeneratingDraft}
        aiStatus={aiStatus}
        onBack={() => setView("contentTypeSelect")}
        onNoteChange={setOutlineNote}
        onGenerateOutline={generateOutline}
        onConfirmOutline={confirmOutline}
      />
    );
  }

  if (view === "articleDraft" && selectedHotspot && selectedTopic && generatedDraft) {
    return (
      <ArticleDraftView
        hotspot={selectedHotspot}
        topic={selectedTopic}
        draft={generatedDraft}
        isGeneratingDraft={isGeneratingDraft}
        draftNote={draftNote}
        optimizeStatus={draftOptimizeStatus}
        aiStatus={aiStatus}
        onBack={() => setView("articleOutline")}
        onDraftNoteChange={setDraftNote}
        onOptimizeDraft={() => {
          void optimizeDraft("", "已生成优化版");
        }}
        onMultiPlatform={generateMultiPlatform}
        onPreview={() => setView("publishPreview")}
      />
    );
  }

  const carrierViews: View[] = ["multiPlatform", "xiaohongshu", "videoScript", "moments"];
  if (
    carrierViews.includes(view) &&
    selectedHotspot &&
    selectedTopic &&
    generatedOutline &&
    generatedMultiPlatformPlan
  ) {
    const focus: ContentType = selectedContentType ?? "multiPlatform";
    const genKey = focus as CarrierGenKey;
    const carrierPhase = carrierGenByType[genKey] ?? "not_started";
    return (
      <MultiPlatformView
        pageView={view}
        hotspot={selectedHotspot}
        topic={selectedTopic}
        plan={generatedMultiPlatformPlan}
        focusContentType={focus}
        carrierGenPhase={carrierPhase}
        onRetryCarrier={() => void generatePlatformContent(focus)}
        onGenerateCarrier={(contentType) => void generatePlatformContent(contentType, true)}
        showXiaohongshuDesign={showXiaohongshuDesign}
        xiaohongshuNote={xiaohongshuNote}
        xiaohongshuStatus={xiaohongshuStatus}
        videoNote={videoNote}
        videoStatus={videoStatus}
        momentsStatus={momentsStatus}
        onToggleXiaohongshuDesign={() =>
          setShowXiaohongshuDesign((current) => !current)
        }
        onXiaohongshuNoteChange={setXiaohongshuNote}
        onVideoNoteChange={setVideoNote}
        onOptimizeXiaohongshu={optimizeXiaohongshu}
        onOptimizeVideo={optimizeVideoScript}
        aiStatus={aiStatus}
        onBack={() =>
          setView(
            view === "multiPlatform" && selectedContentType === "multiPlatform"
              ? "articleDraft"
              : "contentTypeSelect",
          )
        }
        onPreview={() => setView("publishPreview")}
      />
    );
  }

  if (view === "publishPreview" && selectedHotspot && selectedTopic && generatedDraft) {
    return (
      <PublishPreviewView
        draft={generatedDraft}
        status={publishStatus}
        onBack={() => setView("articleDraft")}
        onCopy={() => {
          const content = formatDraftForCopy(generatedDraft);
          if (navigator.clipboard) {
            void navigator.clipboard
              .writeText(content)
              .then(() => setPublishStatus("已复制，可粘贴到公众号后台"))
              .catch(() => setPublishStatus("复制内容已准备好，请手动复制到公众号后台"));
          } else {
            setPublishStatus("复制内容已准备好，请手动复制到公众号后台");
          }
        }}
        onWechatHtmlCopyStatus={setPublishStatus}
        onMark={() =>
          setPublishStatus(
            "已完成本地待发布标记。请前往微信公众号后台手动创建草稿。",
          )
        }
        onOptimize={async () => {
          const suggestions = buildPublishChecks(generatedDraft).items
            .filter((item) => !item.passed)
            .map((item) => `${item.name}：${item.suggestion}`)
            .join("；");
          setPublishStatus("正在根据检测建议优化...");
          const ok = await optimizeDraft(
            `发布检查自动优化：当前待优化项和建议为：${suggestions || "优化引言、板块结构、金句、配图提示和公众号长文风格。"} 请不要推翻整篇文章主题，保留当前文章的核心观点和七七表达风格，并根据检测问题定向优化：标题不明确时重写标题，使其更清晰、有判断、有关键词；开头钩子不足时补充真实观察、问题意识或项目场景；专业判断不足时加入七七作为大健康 IP 操盘手 / 女性健康注册营养师的判断；私域引导不足时自然加入咨询、关注或私域承接；金句不足时补充完整判断句，不要只加粗零碎词。不要出现“学员”，不要过度说教，不要写成课程讲义。结尾可以自然引导：如果你也在做大健康内容转型 / 私域承接 / IP内容搭建，可以加我微信 chen-ccsq，一起看看你的内容卡在哪里。输出必须仍是完整公众号正文结构，不能只输出建议。`,
            "已根据检测建议生成优化版。",
          );
          setPublishStatus(ok ? "已根据检测建议生成优化版。" : "优化失败，请稍后重试。");
        }}
        isOptimizing={isGeneratingDraft}
      />
    );
  }

  return (
    <RadarView
      hotspots={hotspots}
      refreshStatus={hotspotRefreshStatus}
      aiDiagnostic={aiDiagnostic}
      isCheapMode={isCheapMode}
      currentModel={currentModel}
      currentProviderLabel={currentProviderLabel}
      currentSearchProviderLabel={currentSearchProviderLabel}
      currentSearchModeDescription={currentSearchModeDescription}
      aiModeDescription={aiModeDescription}
      sessionAiCallCount={sessionAiCallCount}
      hasHotspotCache={hasHotspotCache}
      lastAiConnectionOk={lastAiConnectionOk}
      isRefreshing={isRefreshingHotspots}
      sourcePool={sourcePool}
      sourceManagerStatus={sourceManagerStatus}
      isGeneratingFromSources={isGeneratingFromSources}
      isTestingAi={isTestingAi}
      isPushingFeishu={isPushingFeishu}
      feishuPushStatus={feishuPushStatus}
      onAddSource={addTopicSource}
      onCheapModeChange={setIsCheapMode}
      onDeleteSource={deleteTopicSource}
      onGenerateFromSources={generateHotspotsFromSources}
      onRefresh={refreshTodayHotspots}
      onTestAiConnection={testAiConnection}
      onTestFeishuPush={testFeishuPush}
      onUseCache={useCachedTodayHotspots}
      onOpenHotspot={openHotspotDetail}
    />
  );
}

function RadarView({
  hotspots,
  refreshStatus,
  aiDiagnostic,
  isCheapMode,
  currentModel,
  currentProviderLabel,
  currentSearchProviderLabel,
  currentSearchModeDescription,
  aiModeDescription,
  sessionAiCallCount,
  hasHotspotCache,
  lastAiConnectionOk,
  isRefreshing,
  sourcePool,
  sourceManagerStatus,
  isGeneratingFromSources,
  isTestingAi,
  isPushingFeishu,
  feishuPushStatus,
  onAddSource,
  onCheapModeChange,
  onDeleteSource,
  onGenerateFromSources,
  onRefresh,
  onTestAiConnection,
  onTestFeishuPush,
  onUseCache,
  onOpenHotspot,
}: {
  hotspots: Hotspot[];
  refreshStatus: string;
  aiDiagnostic: AiDiagnostic | null;
  isCheapMode: boolean;
  currentModel: string;
  currentProviderLabel: string;
  currentSearchProviderLabel: string;
  currentSearchModeDescription: string;
  aiModeDescription: string;
  sessionAiCallCount: number;
  hasHotspotCache: boolean;
  lastAiConnectionOk: boolean;
  isRefreshing: boolean;
  sourcePool: TopicSource[];
  sourceManagerStatus: string;
  isGeneratingFromSources: boolean;
  isTestingAi: boolean;
  isPushingFeishu: boolean;
  feishuPushStatus: string;
  onAddSource: (source: TopicSource) => void;
  onCheapModeChange: (value: boolean) => void;
  onDeleteSource: (sourceId: string) => void;
  onGenerateFromSources: () => void;
  onRefresh: () => void;
  onTestAiConnection: () => void;
  onTestFeishuPush: () => void;
  onUseCache: () => void;
  onOpenHotspot: (hotspot: Hotspot) => void;
}) {
  const featuredHotspots = [...hotspots]
    .sort(
      (left, right) =>
        buildUnifiedTopicScore(right).totalScore - buildUnifiedTopicScore(left).totalScore,
    )
    .slice(0, 4);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [showAiDiagnostic, setShowAiDiagnostic] = useState(false);

  function handleRefreshClick() {
    if (!hasHotspotCache) {
      void onRefresh();
      return;
    }

    const shouldRegenerate = window.confirm(
      "今天已有选题缓存，是否重新生成？\n\n确定：重新生成\n取消：使用缓存",
    );
    if (shouldRegenerate) {
      void onRefresh();
      return;
    }

    onUseCache();
  }

  return (
    <PageShell currentView="radar">
      <section className="rounded-lg border border-orange-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">
              Content Radar
            </p>
            <h1 className="mt-2 text-3xl font-semibold leading-tight text-stone-950 sm:text-4xl">
              陈七七77内容选题雷达工作台
            </h1>
            <p className="mt-3 text-base leading-7 text-stone-600">
              从大健康、AI、私域、IP 和内容平台信号中，筛出今天最值得深挖的 4 个选题。
            </p>
            <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-800 ring-1 ring-amber-100">
              {getHomeRefreshStatus(refreshStatus, currentProviderLabel, lastAiConnectionOk)}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleRefreshClick}
              disabled={isRefreshing || isTestingAi}
              className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-orange-300"
            >
              {isRefreshing ? "正在刷新…" : "刷新今日选题"}
            </button>
            <button
              type="button"
              onClick={() => setShowAdvancedSettings((current) => !current)}
              className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-800 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:text-orange-300"
            >
              高级设置
            </button>
          </div>
        </div>
        {showAdvancedSettings ? (
          <AdvancedSettingsPanel
            currentModel={currentModel}
            currentProviderLabel={currentProviderLabel}
            currentSearchProviderLabel={currentSearchProviderLabel}
            currentSearchModeDescription={currentSearchModeDescription}
            aiModeDescription={aiModeDescription}
            isCheapMode={isCheapMode}
            sessionAiCallCount={sessionAiCallCount}
            lastAiConnectionOk={lastAiConnectionOk}
            isTestingAi={isTestingAi}
            aiDiagnostic={aiDiagnostic}
            showAiDiagnostic={showAiDiagnostic}
            onCheapModeChange={onCheapModeChange}
            onTestAiConnection={onTestAiConnection}
            onToggleDiagnostic={() => setShowAiDiagnostic((current) => !current)}
            onRetry={onRefresh}
          />
        ) : null}
        <SourceManagerPanel
          sources={sourcePool}
          status={sourceManagerStatus}
          isGenerating={isGeneratingFromSources}
          isPushingFeishu={isPushingFeishu}
          feishuPushStatus={feishuPushStatus}
          searchProviderLabel={currentSearchProviderLabel}
          searchModeDescription={currentSearchModeDescription}
          onAddSource={onAddSource}
          onDeleteSource={onDeleteSource}
          onGenerateFromSources={onGenerateFromSources}
          onTestFeishuPush={onTestFeishuPush}
        />
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {featuredHotspots.map((hotspot) => {
            const homeScore = buildUnifiedTopicScore(hotspot);
            const sourceEvidence = buildHomeSourceEvidence(hotspot);

            return (
              <article
                key={hotspot.id}
                className="flex flex-col rounded-lg border border-orange-100 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Tag>{getHomeSourceStatus(hotspot)}</Tag>
                  <FitTag fit={hotspot.fit}>{hotspot.fit}适配</FitTag>
                </div>
                <h3 className="mt-4 text-xl font-semibold leading-8 text-stone-950">
                  {hotspot.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-stone-600">
                  {hotspot.description}
                </p>
                <p className="mt-3 rounded-lg bg-orange-50 p-3 text-xs leading-5 text-orange-900 ring-1 ring-orange-100">
                  来源信号：{hotspot.displayTag || getHomeSourceStatus(hotspot)} / {hotspot.sourceChannel} / 可信度：{sourceEvidence.credibility} / 验证状态：{sourceEvidence.verificationLabel}
                </p>
                <div className="mt-3 rounded-lg bg-white p-3 text-xs leading-5 text-stone-700 ring-1 ring-slate-200">
                  <p className="font-semibold text-stone-900">来源证据</p>
                  <p className="mt-1">来源平台：{sourceEvidence.platform}</p>
                  <p className="mt-1">来源标题：{sourceEvidence.title}</p>
                  <p className="mt-1">来源摘要：{sourceEvidence.summary}</p>
                  <p className="mt-1">适合七七：{sourceEvidence.fitReason}</p>
                  {sourceEvidence.url ? (
                    <a
                      href={sourceEvidence.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 block font-semibold text-orange-800"
                    >
                      查看来源链接
                    </a>
                  ) : (
                    <p className="mt-1 rounded bg-amber-50 px-2 py-1 text-amber-800">
                      暂无可验证链接，当前仅作为灵感/待验证来源。
                    </p>
                  )}
                </div>
                <div className="mt-4 rounded-lg bg-white p-3 ring-1 ring-slate-200">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-stone-500">综合推荐分</span>
                    <strong className="text-lg text-stone-950">{homeScore.totalScore} / 100</strong>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-orange-600"
                      style={{ width: `${homeScore.totalScore}%` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-stone-500">推荐等级</span>
                    <RecommendTag level={homeScore.recommendationLevel} />
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-stone-700">
                  <strong className="text-stone-950">为什么适合陈七七：</strong>
                  {homeScore.recommendedReason}
                </p>
                {homeScore.riskNotice ? (
                  <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-800 ring-1 ring-amber-100">
                    {homeScore.riskNotice}
                  </p>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  {hotspot.fitPlatforms.map((platform) => (
                    <Tag key={platform}>{platform}</Tag>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {hotspot.purposes.map((purpose) => (
                    <PurposeTag key={purpose}>{purpose}</PurposeTag>
                  ))}
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenHotspot(hotspot)}
                    className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-800"
                  >
                    查看选题拆解
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </PageShell>
  );
}

const SOURCE_PLATFORMS = [
  "Perplexity",
  "OpenAI web_search",
  "抖音指数",
  "巨量算数",
  "新榜",
  "星榜",
  "小红书观察",
  "视频号观察",
  "公众号观察",
  "社群观察",
  "手动灵感",
];

const SOURCE_TYPES: TopicSource["sourceType"][] = [
  "公开网页",
  "指数平台",
  "内容平台观察",
  "社群观察",
  "手动灵感",
];

function SourceManagerPanel({
  sources,
  status,
  isGenerating,
  isPushingFeishu,
  feishuPushStatus,
  searchProviderLabel,
  searchModeDescription,
  onAddSource,
  onDeleteSource,
  onGenerateFromSources,
  onTestFeishuPush,
}: {
  sources: TopicSource[]; 
  status: string;
  isGenerating: boolean;
  isPushingFeishu: boolean;
  feishuPushStatus: string;
  searchProviderLabel: string;
  searchModeDescription: string;
  onAddSource: (source: TopicSource) => void;
  onDeleteSource: (sourceId: string) => void;
  onGenerateFromSources: () => void;
  onTestFeishuPush: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [sourcePlatform, setSourcePlatform] = useState(SOURCE_PLATFORMS[0]);
  const [sourceTitle, setSourceTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceSummary, setSourceSummary] = useState("");
  const [keywordsText, setKeywordsText] = useState("");
  const [sourceCredibility, setSourceCredibility] =
    useState<TopicSource["sourceCredibility"]>("待验证");
  const [sourceType, setSourceType] = useState<TopicSource["sourceType"]>("手动灵感");
  const [fitReasonForQiqi, setFitReasonForQiqi] = useState("");
  const [formStatus, setFormStatus] = useState("");

  function clearForm() {
    setSourceTitle("");
    setSourceUrl("");
    setSourceSummary("");
    setKeywordsText("");
    setFitReasonForQiqi("");
    setFormStatus("");
  }

  function submitSource() {
    if (!sourcePlatform || !sourceTitle.trim() || !sourceSummary.trim() || !sourceCredibility || !sourceType) {
      setFormStatus("请填写来源平台、来源标题、来源摘要、可信度和来源类型。");
      return;
    }
    const nextSourceUrl = sourceUrl.trim();
    const nextSourceEvidence = nextSourceUrl
      ? `${sourcePlatform}：${sourceTitle.trim()}`
      : "暂无可验证链接，当前仅作为灵感/待验证来源。";

    onAddSource({
      id: `source-${Date.now()}`,
      sourcePlatform,
      sourceTitle: sourceTitle.trim(),
      sourceUrl: nextSourceUrl || undefined,
      sourceDate: new Date().toISOString(),
      sourceSummary: sourceSummary.trim(),
      sourceEvidence: nextSourceEvidence,
      keywords: parseSourceKeywords(keywordsText),
      sourceCredibility,
      credibility: sourceCredibility,
      sourceType,
      verificationStatus: nextSourceUrl ? "user_input" : "ai_initial",
      evidenceLinks: nextSourceUrl
        ? [
            {
              title: sourceTitle.trim(),
              url: nextSourceUrl,
              platform: sourcePlatform,
              date: new Date().toISOString(),
              summary: sourceSummary.trim(),
              relevance: fitReasonForQiqi.trim() || "用户录入来源，可用于后续人工判断和 AI 选题生成。",
            },
          ]
        : [],
      fitReasonForQiqi: fitReasonForQiqi.trim() || undefined,
      createdAt: new Date().toISOString(),
    });
    clearForm();
  }

  return (
    <section className="mt-5 rounded-lg border border-orange-100 bg-orange-50/60 p-4 ring-1 ring-orange-50">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-stone-950">选题来源管理器</h2>
          <p className="mt-1 text-sm text-stone-600">
            来源池用于承接公开网页检索结果或你手动添加的观察。刷新今日选题时，如果当前搜索 Provider 支持联网，会先自动获取公开来源；如果不支持，则可使用这里的手动来源生成选题。
          </p>
          <p className="mt-1 text-sm text-stone-600">当前已添加来源 {sources.length} 条。</p>
          <p className="mt-1 text-xs text-stone-500">
            当前搜索 Provider：{searchProviderLabel} · {searchModeDescription}
          </p>
          {!searchModeDescription.includes("支持") ? (
            <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-100">
              当前搜索 Provider 暂不支持联网检索，可切换 OpenAI 后刷新，或先手动添加来源。
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onTestFeishuPush}
            disabled={isPushingFeishu}
            className="rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm font-semibold text-orange-800 hover:bg-orange-50 disabled:cursor-not-allowed disabled:text-orange-300"
          >
            {isPushingFeishu ? "正在推送到飞书..." : "测试飞书推送"}
          </button>
          <button
            type="button"
            onClick={() => setIsOpen((current) => !current)}
            className="rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm font-semibold text-orange-800 hover:bg-orange-50"
          >
            {isOpen ? "收起来源管理器" : "选题来源管理器"}
          </button>
        </div>
      </div>
      {feishuPushStatus ? (
        <p className="mt-3 rounded-lg bg-white px-3 py-2 text-sm text-stone-700 ring-1 ring-orange-100">
          {feishuPushStatus}
        </p>
      ) : null}

      {isOpen ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-lg bg-white p-4 ring-1 ring-orange-100">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm font-medium text-stone-700">
                来源平台
                <select value={sourcePlatform} onChange={(event) => setSourcePlatform(event.target.value)} className="mt-1 w-full rounded-lg border border-orange-100 px-3 py-2">
                  {SOURCE_PLATFORMS.map((platform) => <option key={platform}>{platform}</option>)}
                </select>
              </label>
              <label className="text-sm font-medium text-stone-700">
                来源可信度
                <select value={sourceCredibility} onChange={(event) => setSourceCredibility(event.target.value as TopicSource["sourceCredibility"])} className="mt-1 w-full rounded-lg border border-orange-100 px-3 py-2">
                  {["高", "中", "待验证"].map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label className="text-sm font-medium text-stone-700">
                来源标题
                <input value={sourceTitle} onChange={(event) => setSourceTitle(event.target.value)} className="mt-1 w-full rounded-lg border border-orange-100 px-3 py-2" />
              </label>
              <label className="text-sm font-medium text-stone-700">
                来源链接（可选）
                <input value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} className="mt-1 w-full rounded-lg border border-orange-100 px-3 py-2" />
              </label>
              <label className="text-sm font-medium text-stone-700">
                来源类型
                <select value={sourceType} onChange={(event) => setSourceType(event.target.value as TopicSource["sourceType"])} className="mt-1 w-full rounded-lg border border-orange-100 px-3 py-2">
                  {SOURCE_TYPES.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label className="text-sm font-medium text-stone-700">
                热点关键词
                <input value={keywordsText} onChange={(event) => setKeywordsText(event.target.value)} placeholder="用顿号/逗号/空格分隔" className="mt-1 w-full rounded-lg border border-orange-100 px-3 py-2" />
              </label>
            </div>
            <label className="mt-3 block text-sm font-medium text-stone-700">
              来源摘要
              <textarea value={sourceSummary} onChange={(event) => setSourceSummary(event.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-orange-100 px-3 py-2" />
            </label>
            <label className="mt-3 block text-sm font-medium text-stone-700">
              适合陈七七的理由（可选）
              <textarea value={fitReasonForQiqi} onChange={(event) => setFitReasonForQiqi(event.target.value)} rows={2} className="mt-1 w-full rounded-lg border border-orange-100 px-3 py-2" />
            </label>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={submitSource} className="rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-700">添加到来源池</button>
              <button type="button" onClick={clearForm} className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50">清空表单</button>
            </div>
            {formStatus ? <p className="mt-2 text-sm text-amber-800">{formStatus}</p> : null}
          </div>

          <div className="rounded-lg bg-white p-4 ring-1 ring-orange-100">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-stone-950">来源列表</p>
              <button type="button" onClick={onGenerateFromSources} disabled={isGenerating} className="rounded-lg bg-stone-950 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-800 disabled:cursor-not-allowed disabled:bg-stone-300">
                {isGenerating ? "正在生成…" : "基于来源生成今日选题"}
              </button>
            </div>
            {status ? <p className="mt-2 rounded-lg bg-orange-50 p-2 text-sm text-orange-800">{status}</p> : null}
            {!sources.length ? (
              <p className="mt-2 rounded-lg bg-stone-50 p-3 text-sm text-stone-600">
                当前暂无来源，请先添加来源。若当前 Provider 支持 web_search，刷新今日选题会自动补充公开来源信号。
              </p>
            ) : null}
            <div className="mt-3 grid gap-3">
              {sources.length ? sources.map((source) => (
                <article key={source.id} className="rounded-lg border border-orange-100 bg-orange-50 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Tag>{source.sourcePlatform}</Tag>
                    <Tag>可信度：{source.credibility || source.sourceCredibility}</Tag>
                    <Tag>验证状态：{getVerificationStatusLabel(source.verificationStatus ?? (source.sourceUrl ? "user_input" : "ai_initial"))}</Tag>
                    <Tag>{source.sourceType}</Tag>
                  </div>
                  <h3 className="mt-2 text-sm font-semibold text-stone-950">{source.sourceTitle}</h3>
                  <p className="mt-1 text-xs leading-5 text-stone-700">{source.sourceSummary.slice(0, 120)}</p>
                  <p className="mt-1 text-xs leading-5 text-stone-500">
                    {source.sourceEvidence || "暂无可验证链接，当前仅作为灵感/待验证来源。"}
                  </p>
                  {source.sourceUrl ? <a href={source.sourceUrl} target="_blank" rel="noreferrer" className="mt-1 block text-xs font-semibold text-orange-800">查看来源摘要</a> : null}
                  {!source.sourceUrl ? (
                    <p className="mt-1 rounded bg-amber-50 px-2 py-1 text-xs text-amber-800">
                      暂无可验证链接，当前仅作为灵感/待验证来源。
                    </p>
                  ) : null}
                  {source.keywords.length ? <div className="mt-2 flex flex-wrap gap-1">{source.keywords.map((keyword) => <PurposeTag key={`${source.id}-${keyword}`}>{keyword}</PurposeTag>)}</div> : null}
                  <button type="button" onClick={() => onDeleteSource(source.id)} className="mt-2 text-xs font-semibold text-stone-500 hover:text-orange-800">删除</button>
                </article>
              )) : <p className="rounded-lg bg-stone-50 p-3 text-sm text-stone-600">暂无来源，请先添加用户录入来源。</p>}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function AiDiagnosticPanel({
  diagnostic,
  onRetry,
}: {
  diagnostic: AiDiagnostic | null;
  onRetry: () => void;
}) {
  if (!diagnostic) return null;

  const isSuccess = diagnostic.code === "AI_CONNECTION_OK";
  const structuredFailure =
    diagnostic.connectionOk &&
    diagnostic.task === "generateTodayHotspots" &&
    diagnostic.code !== "AI_CONNECTION_OK";

  return (
    <section className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold">
            {isSuccess ? "AI 连接成功" : `AI 请求失败：${diagnostic.code}`}
          </p>
          <p className="mt-2 leading-6">原因：{diagnostic.message}</p>
          {structuredFailure ? (
            <p className="mt-1 leading-6">
              AI Key 和模型连接正常，当前问题更可能出在热点生成的 JSON/schema 解析。
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg bg-amber-700 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-800"
        >
          重试 AI 生成
        </button>
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-2 lg:grid-cols-4">
        <InfoBox label="失败任务" value={diagnostic.task} />
        <InfoBox label="当前模型" value={diagnostic.model} />
        <InfoBox label="错误代码" value={diagnostic.code} />
        <InfoBox
          label="本地模拟"
          value={diagnostic.fallback ? "当前使用本地模拟内容" : "未使用本地模拟内容"}
        />
      </div>
    </section>
  );
}

function AdvancedSettingsPanel({
  currentModel,
  currentProviderLabel,
  currentSearchProviderLabel,
  currentSearchModeDescription,
  aiModeDescription,
  isCheapMode,
  sessionAiCallCount,
  lastAiConnectionOk,
  isTestingAi,
  aiDiagnostic,
  showAiDiagnostic,
  onCheapModeChange,
  onTestAiConnection,
  onToggleDiagnostic,
  onRetry,
}: {
  currentModel: string;
  currentProviderLabel: string;
  currentSearchProviderLabel: string;
  currentSearchModeDescription: string;
  aiModeDescription: string;
  isCheapMode: boolean;
  sessionAiCallCount: number;
  lastAiConnectionOk: boolean;
  isTestingAi: boolean;
  aiDiagnostic: AiDiagnostic | null;
  showAiDiagnostic: boolean;
  onCheapModeChange: (value: boolean) => void;
  onTestAiConnection: () => void;
  onToggleDiagnostic: () => void;
  onRetry: () => void;
}) {
  return (
    <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-stone-700">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-stone-950">高级设置</p>
          <p className="mt-1 text-xs text-stone-500">
            调整筛选模式、连接状态和诊断信息。
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold text-orange-800">
          <input
            type="checkbox"
            checked={isCheapMode}
            onChange={(event) => onCheapModeChange(event.target.checked)}
            className="h-4 w-4 accent-orange-600"
          />
          轻量筛选模式
        </label>
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <InfoBox
          label="当前模式"
          value={isCheapMode ? "轻量筛选模式" : "完整检索模式"}
        />
        <InfoBox label="当前 AI Provider" value={currentProviderLabel} />
        <InfoBox label="当前搜索 Provider" value={currentSearchProviderLabel} />
        <InfoBox label="当前模型" value={currentModel} />
        <InfoBox
          label="自动联网状态"
          value={currentSearchModeDescription}
        />
        <InfoBox label="本次会话调用次数" value={`${sessionAiCallCount}`} />
        <InfoBox
          label="连接状态"
          value={lastAiConnectionOk ? "AI 已连接" : "AI 连接未测试"}
        />
      </div>
      <p className="mt-3 rounded-lg bg-orange-50 px-3 py-2 text-xs leading-5 text-orange-800">
        {isCheapMode
          ? "适合日常选题筛选，优先使用低成本模型，不自动获取网页来源。"
          : "会尝试获取公开网页来源证据，可能产生额外 API 费用。"}
      </p>
      <p className="mt-2 text-xs leading-5 text-stone-500">{aiModeDescription}</p>
      <p className="mt-2 rounded-lg bg-slate-100 px-3 py-2 text-xs leading-5 text-stone-700">
        {currentSearchModeDescription}
      </p>
      <div className="mt-3 text-xs leading-5 text-stone-600">
        <p className="font-semibold text-stone-800">联网费用提醒</p>
        <p>
          搜索 Provider 负责联网找来源，AI Provider 负责生成内容。建议后续使用低成本搜索 Provider + DeepSeek 生成，OpenAI web_search 作为兜底。
        </p>
        <p className="mt-2 font-semibold text-stone-800">省钱建议</p>
        <p>1. 开发测试推荐 DeepSeek</p>
        <p>2. 不要频繁刷新今日选题</p>
        <p>3. 先用缓存结果检查页面</p>
        <p>4. 需要 web_search 或高质量润色时再切 OpenAI</p>
        <p>5. 来源证据只对最想写的 1-2 个选题获取</p>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onTestAiConnection}
          disabled={isTestingAi}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          {isTestingAi ? "正在测试…" : "测试 AI 连接"}
        </button>
        <button
          type="button"
          onClick={onToggleDiagnostic}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          {showAiDiagnostic ? "隐藏 AI 诊断" : "查看 AI 诊断"}
        </button>
      </div>
      {showAiDiagnostic ? (
        aiDiagnostic ? (
          <AiDiagnosticPanel diagnostic={aiDiagnostic} onRetry={onRetry} />
        ) : (
          <div className="mt-4 rounded-lg bg-white p-4 text-xs leading-5 text-stone-600 ring-1 ring-slate-200">
            暂无 AI 诊断信息。完成一次连接测试或生成后，这里会显示具体状态。
          </div>
        )
      ) : null}
    </div>
  );
}

function EvidenceLinksPanel({
  evidenceLinks,
}: {
  evidenceLinks: EvidenceLink[];
}) {
  if (!evidenceLinks.length) {
    return (
      <div className="mt-4 rounded-lg bg-amber-50 p-4 text-sm leading-6 text-amber-900 ring-1 ring-amber-100">
        当前暂无真实来源链接，后续可接入平台热榜或手动导入链接。
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3 rounded-lg bg-emerald-50 p-4 ring-1 ring-emerald-100">
      {evidenceLinks.map((link) => (
        <div key={`${link.url}-${link.title}`} className="rounded-lg bg-white p-4 ring-1 ring-emerald-100">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-stone-950">{link.title}</h4>
              <p className="mt-1 text-xs text-stone-500">
                {link.platform} / {link.date || "未标明"}
              </p>
            </div>
            <a
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
            >
              打开来源链接
            </a>
          </div>
          <p className="mt-3 text-sm leading-6 text-stone-700">
            <strong className="text-stone-950">来源摘要：</strong>
            {link.summary}
          </p>
          <p className="mt-2 text-sm leading-6 text-stone-700">
            <strong className="text-stone-950">相关性说明：</strong>
            {link.relevance}
          </p>
        </div>
      ))}
    </div>
  );
}

function HotspotDetailView({
  hotspot,
  analysis,
  aiStatus,
  selectedTopic,
  currentProvider,
  onBack,
  onChooseTopic,
}: {
  hotspot: Hotspot;
  analysis: HotspotAnalysis;
  aiStatus: string;
  selectedTopic: Topic | null;
  currentProvider: AiProvider;
  onBack: () => void;
  onChooseTopic: (topic: Topic) => void;
}) {
  const [showScoreDetails, setShowScoreDetails] = useState(false);
  const primaryTopic = analysis.topics[0] ?? buildTopicsForHotspot(hotspot)[0];
  const scoreItems = getAnalysisScores(analysis, primaryTopic).filter(hasScoreContent);
  const sourceStatus = getDetailSourceStatus(hotspot);
  const writingPlan = normalizeWritingPlanForDisplay(
    analysis.writingPlan ?? buildWritingPlan(hotspot, primaryTopic),
  );
  const hasWritingPlanContent =
    hasText(writingPlan.angle) ||
    hasText(writingPlan.mainPoint) ||
    writingPlan.subheadings.length > 0 ||
    writingPlan.platformPriority.length > 0 ||
    writingPlan.risks.length > 0;
  const detailTopics = (
    Array.isArray(analysis.topics) && analysis.topics.length ? analysis.topics : buildUnifiedTopics(hotspot)
  )
    .slice(0, 3)
    .sort((left, right) => right.totalScore - left.totalScore)
    .map((topic, index) => ({ ...topic, isPriority: index === 0 }));
  const detailFitPlatforms = normalizeStringArray(hotspot.fitPlatforms);
  const detailPurposes = normalizeHotspotPurposes(hotspot.purposes);
  const selectedTopicKey = selectedTopic ? getTopicKey(selectedTopic) : "";
  const recommendReasons = getRecommendReasons(analysis, hotspot).filter(
    (reason) => hasText(reason.label) && hasText(reason.text),
  );
  const unifiedScore = buildUnifiedTopicScore(hotspot);
  const totalScore = unifiedScore.totalScore;
  const recommendLevel = unifiedScore.recommendationLevel;
  const oneSentenceJudgment =
    analysis.oneSentenceJudgment || primaryTopic.recommendReason;

  return (
    <PageShell currentView="hotspotDetail">
      <BackButton onClick={onBack}>返回首页</BackButton>
      <section className="rounded-lg border border-orange-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">
              当前选题判断
            </p>
            <h1 className="mt-2 text-2xl font-semibold leading-9 text-stone-950 sm:text-3xl">
              {hotspot.title}
            </h1>
            <p className="mt-3 text-sm leading-7 text-stone-700">
              {hotspot.description}
            </p>
          </div>
          <div className="rounded-lg bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-800 ring-1 ring-orange-100">
            {sourceStatus}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {detailFitPlatforms.filter(hasText).map((platform) => (
            <Tag key={`platform-${platform}`}>{platform}</Tag>
          ))}
          {detailPurposes.map((purpose) => (
            <PurposeTag key={`purpose-${purpose}`}>{purpose}</PurposeTag>
          ))}
        </div>
      </section>
      <AiStatusBanner status={aiStatus} />
      <section className="rounded-lg border border-orange-100 bg-white p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
          <div className="rounded-lg bg-orange-50 p-5 ring-1 ring-orange-100">
            <p className="text-xs font-semibold text-orange-700">综合推荐分</p>
            <div className="mt-3 flex items-end gap-2">
              <span className="text-5xl font-semibold text-orange-950">
                {totalScore}
              </span>
              <span className="pb-2 text-sm font-medium text-orange-700">/ 100</span>
            </div>
            <div className="mt-4">
              <RecommendTag level={recommendLevel} />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-stone-950">一句话判断</h2>
            <p className="mt-3 text-base leading-8 text-stone-700">
              {oneSentenceJudgment}
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {recommendReasons.map((reason) => (
                <div key={`recommend-${reason.label}-${reason.text}`} className="rounded-lg bg-slate-50 p-4 ring-1 ring-slate-200">
                  <p className="text-sm font-semibold text-stone-950">{reason.label}</p>
                  <p className="mt-2 text-sm leading-6 text-stone-700">{reason.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="rounded-lg border border-orange-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-stone-950">评分依据</h2>
            {scoreItems.length ? (
              <p className="mt-1 text-sm text-stone-600">
                {scoreItems.map((score) => `${compactScoreLabel(score.label)} ${score.value}`).join("｜")}
              </p>
            ) : (
              <p className="mt-1 text-sm text-stone-600">当前暂无可展示内容，请先生成或重新生成。</p>
            )}
          </div>
          {scoreItems.length ? (
            <button
              type="button"
              onClick={() => setShowScoreDetails((current) => !current)}
              className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-800 hover:bg-orange-100"
            >
              {showScoreDetails ? "收起评分细节" : "展开评分细节"}
            </button>
          ) : null}
        </div>
        {showScoreDetails && scoreItems.length ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {scoreItems.map((score) => (
              <div key={`score-${score.label}`} className="rounded-lg bg-slate-50 p-4 ring-1 ring-slate-200">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-stone-950">
                    {compactScoreLabel(score.label)}
                  </p>
                  <strong className="text-sm text-orange-800">{score.value} / 10</strong>
                </div>
                <div className="mt-3 h-1.5 rounded-full bg-white">
                  <div
                    className="h-1.5 rounded-full bg-orange-600"
                    style={{ width: `${Math.min(score.value, 10) * 10}%` }}
                  />
                </div>
                <p className="mt-3 text-xs leading-5 text-stone-600">
                  {score.explanation}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </section>
      {hasText(hotspot.sourceEvidence) || Boolean(hotspot.evidenceLinks?.length) ? (
      <section className="rounded-lg border border-orange-100 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-950">来源证据</h2>
        <p className="mt-2 text-sm leading-6 text-stone-700">{hotspot.sourceEvidence}</p>
        {hotspot.evidenceLinks?.length ? (
          <EvidenceLinksPanel evidenceLinks={hotspot.evidenceLinks} />
        ) : (
          <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm leading-6 text-stone-700 ring-1 ring-slate-200">
            <p>当前暂无公开来源证据，可后续切换完整检索模式或接入平台数据源。</p>
            {currentProvider === "deepseek" ? (
              <p className="mt-2 text-stone-600">
                当前使用 DeepSeek 轻量筛选，不自动获取网页来源。需要来源证据时可切换 OpenAI 或后续接入国内平台数据源。
              </p>
            ) : null}
          </div>
        )}
      </section>
      ) : null}
      <section className="rounded-lg border border-orange-100 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-950">这篇内容怎么写</h2>
        {hasWritingPlanContent ? (
          <>
            <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
              {hasText(writingPlan.angle) ? (
                <div className="rounded-lg bg-orange-50 p-4 ring-1 ring-orange-100">
                  <p className="text-sm font-semibold text-stone-950">建议切入角度</p>
                  <p className="mt-2 text-sm leading-6 text-stone-700">{writingPlan.angle}</p>
                </div>
              ) : null}
              {hasText(writingPlan.mainPoint) ? (
                <div className="rounded-lg bg-slate-50 p-4 ring-1 ring-slate-200">
                  <p className="text-sm font-semibold text-stone-950">文章主观点</p>
                  <p className="mt-2 text-sm leading-6 text-stone-700">{writingPlan.mainPoint}</p>
                </div>
              ) : null}
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              {writingPlan.subheadings.length ? (
                <div className="rounded-lg bg-white p-4 ring-1 ring-slate-200 lg:col-span-1">
                  <p className="text-sm font-semibold text-stone-950">可展开小标题</p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-stone-700">
                    {writingPlan.subheadings.map((heading, index) => (
                      <li key={`heading-${index}-${heading}`}>- {heading}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {writingPlan.platformPriority.length ? (
                <div className="rounded-lg bg-white p-4 ring-1 ring-slate-200">
                  <p className="text-sm font-semibold text-stone-950">平台优先级</p>
                  <div className="mt-3 space-y-3">
                    {writingPlan.platformPriority.map((item) => (
                      <div
                        key={`priority-${item.platform}-${item.priority}`}
                        className="text-sm leading-6 text-stone-700"
                      >
                        <p className="font-semibold text-stone-950">
                          {item.platform}：{item.priority}
                        </p>
                        {hasText(item.reason) ? <p>{item.reason}</p> : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              {writingPlan.risks.length ? (
                <div className="rounded-lg bg-white p-4 ring-1 ring-slate-200">
                  <p className="text-sm font-semibold text-stone-950">内容风险提醒</p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-stone-700">
                    {writingPlan.risks.map((risk, index) => (
                      <li key={`risk-${index}-${risk}`}>- {risk}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </>
        ) : (
          <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm leading-6 text-stone-700 ring-1 ring-slate-200">
            当前暂无可展示内容，请重新生成。
          </p>
        )}
      </section>
      <section className="rounded-lg border border-orange-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-stone-950">这个选题的 3 个切入角度</h2>
            <p className="mt-1 text-sm leading-6 text-stone-600">
              先选一个更适合当前内容判断的切入角度，再进入内容类型选择。
            </p>
          </div>
          {selectedTopic ? (
            <div className="rounded-lg bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-800 ring-1 ring-orange-100">
              已选择切入角度：{selectedTopic.title}
            </div>
          ) : null}
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {detailTopics.map((topic, index) => (
            <TopicCard
              key={getTopicKey(topic)}
              topic={topic}
              index={index}
              selected={selectedTopicKey === getTopicKey(topic)}
              onChoose={() => onChooseTopic(topic)}
            />
          ))}
        </div>
      </section>
    </PageShell>
  );
}

function ContentTypeSelectView({
  hotspot,
  topic,
  onBack,
  onGenerateContent,
}: {
  hotspot: Hotspot;
  topic: Topic | null;
  onBack: () => void;
  onGenerateContent: (contentType: ContentType) => void;
}) {
  if (!topic) {
    const fallbackTitle = hasText(hotspot.title) ? hotspot.title : "当前选题";
    return (
      <PageShell currentView="contentTypeSelect">
        <BackButton onClick={onBack}>返回热点拆解</BackButton>
        <StageHeader
          stage="内容形态选择"
          title={fallbackTitle}
          subtitle="请先在选题拆解页选择一个切入角度，再生成对应平台内容。"
        />
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          请先返回选题拆解页，选择一个切入角度。
        </p>
      </PageShell>
    );
  }

  const angleTitle = hasText(topic.title) ? topic.title : "当前切入角度";
  const purposeLabel = topic.purpose ?? "—";

  return (
    <PageShell currentView="contentTypeSelect">
      <BackButton onClick={onBack}>返回热点拆解</BackButton>
      <StageHeader
        stage="内容形态选择"
        title={angleTitle || hotspot.title}
        subtitle={`基于「${angleTitle}」生成公众号、小红书、短视频或朋友圈内容。`}
      />
      <section className="rounded-lg border border-orange-100 bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <InfoBox label="已选择热点" value={hotspot.title || "—"} />
          <InfoBox label="已选择切入角度" value={angleTitle} />
          <InfoBox
            label="综合推荐分"
            value={`${typeof topic.totalScore === "number" ? topic.totalScore : "—"} / 100`}
          />
          <InfoBox label="内容目的标签" value={purposeLabel} />
        </div>
      </section>
      <section className="rounded-lg border border-orange-100 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-950">选择要生成的内容形态</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <button
            type="button"
            onClick={() => onGenerateContent("articleOutline")}
            className="rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-800"
          >
            生成公众号文章大纲
          </button>
          <button
            type="button"
            onClick={() => onGenerateContent("xiaohongshu")}
            className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-800 hover:bg-orange-100"
          >
            生成小红书图文
          </button>
          <button
            type="button"
            onClick={() => onGenerateContent("videoScript")}
            className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-800 hover:bg-orange-100"
          >
            生成短视频口播稿
          </button>
          <button
            type="button"
            onClick={() => onGenerateContent("moments")}
            className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-800 hover:bg-orange-100"
          >
            生成朋友圈文案
          </button>
        </div>
      </section>
    </PageShell>
  );
}

function ArticleOutlineView({
  hotspot,
  topic,
  note,
  outline,
  outlineGenPhase,
  isGeneratingDraft,
  aiStatus,
  onBack,
  onNoteChange,
  onGenerateOutline,
  onConfirmOutline,
}: {
  hotspot: Hotspot;
  topic: Topic;
  note: string;
  outline: ArticleOutline | null;
  outlineGenPhase: GenerationPhase;
  isGeneratingDraft: boolean;
  aiStatus: string;
  onBack: () => void;
  onNoteChange: (value: string) => void;
  onGenerateOutline: () => void;
  onConfirmOutline: () => void;
}) {
  const outlineReady =
    outlineGenPhase === "success" && outline && hasOutlineDisplayableContent(outline);

  return (
    <PageShell currentView="articleOutline">
      <BackButton onClick={onBack}>返回内容形态选择</BackButton>
      <StageHeader
        stage="公众号文章大纲"
        title={hasText(topic.title) ? topic.title : hotspot.title}
        subtitle="先把观点、证据和承接路径排清楚，再进入正文生成。"
      />
      <SelectionSummary hotspot={hotspot} topic={topic} mainPlatform="公众号" />
      <div className="mt-4 space-y-3">
        <ContentGenerationStatusBanner
          phase={outlineGenPhase}
          carrierLabel="公众号文章大纲"
          onRetry={onGenerateOutline}
        />
        {outlineGenPhase === "success" ? <AiStatusBanner status={aiStatus} /> : null}
      </div>
      <section className="rounded-lg border border-orange-200 bg-white p-5 shadow-sm">
        <CreativeNotePanel
          value={note}
          onChange={onNoteChange}
          title="补充你的想法 / 修改意见"
          description="可以打字、语音输入，或上传参考素材。这里会影响大纲结构和后续正文方向。"
          placeholder="例如：我希望这篇文章更强调 AI 不能替代专业判断，也要结合大健康 IP 的私域承接和商业闭环。"
          rows={4}
        />
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onGenerateOutline}
            className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
          >
            {outlineGenPhase === "success" ? "按七七语气再优化" : "生成七七版文章大纲"}
          </button>
        </div>
      </section>
      {outlineReady && outline ? (
        <OutlineResult
          outline={outline}
          isGeneratingDraft={isGeneratingDraft}
          onConfirmOutline={onConfirmOutline}
        />
      ) : null}
    </PageShell>
  );
}

function ArticleDraftView({
  hotspot,
  topic,
  draft,
  isGeneratingDraft,
  draftNote,
  optimizeStatus,
  aiStatus,
  onBack,
  onDraftNoteChange,
  onOptimizeDraft,
  onMultiPlatform,
  onPreview,
}: {
  hotspot: Hotspot;
  topic: Topic;
  draft: ArticleDraft;
  isGeneratingDraft: boolean;
  draftNote: string;
  optimizeStatus: string;
  aiStatus: string;
  onBack: () => void;
  onDraftNoteChange: (value: string) => void;
  onOptimizeDraft: () => void;
  onMultiPlatform: () => void;
  onPreview: () => void;
}) {
  const hasDraftContent = hasArticleDraftContent(draft);
  const safeDraft = {
    status: normalizeArticleDraftStatus(draft.status),
    title: hasText(draft.title) && (hasDraftContent || isGeneratingDraft)
      ? draft.title
      : "公众号正文未生成成功，请重新生成。",
    intro: hasText(draft.intro)
      ? draft.intro
      : hasDraftContent || isGeneratingDraft
        ? "当前暂无可展示内容，请重新生成。"
        : "公众号正文未生成成功，请重新生成。",
    sections: Array.isArray(draft.sections)
      ? draft.sections
          .map((section) => ({
            heading: typeof section?.heading === "string" ? section.heading : "",
            paragraphs: sectionParagraphs(section ?? {}),
          }))
          .filter((section) => hasText(section.heading) || section.paragraphs.length > 0)
      : [],
    ending: hasText(draft.ending)
      ? draft.ending
      : hasDraftContent || isGeneratingDraft
        ? "当前暂无可展示内容，请重新生成。"
        : "公众号正文未生成成功，请重新生成。",
  };

  return (
    <PageShell currentView="articleDraft">
      <BackButton onClick={onBack}>返回文章大纲</BackButton>
      <StageHeader
        stage="公众号正文"
        title={hasText(topic.title) ? topic.title : hotspot.title}
        subtitle={`当前文章状态：${displayDraftStatusLabel(safeDraft.status)}。重点检查语气是否像陈七七77，以及观点是否能接住私域和商业闭环。`}
      />
      <AiStatusBanner status={aiStatus} />
      <article className="rounded-lg border border-orange-100 bg-white p-6 shadow-sm">
        <h2 className="text-3xl font-semibold leading-10 text-stone-950">
          {displayContentText(safeDraft.title)}
        </h2>
        <p className="mt-5 text-base leading-8 text-stone-700">{displayContentText(safeDraft.intro)}</p>
        <div className="mt-6 space-y-6">
          {safeDraft.sections.map((section) => (
            <section key={section.heading}>
              <h3 className="text-xl font-semibold text-stone-950">
                {section.heading}
              </h3>
              <div className="mt-3 space-y-3">
                {section.paragraphs.map((paragraph, index) => (
                  <p key={`${section.heading}-${index}`} className="text-sm leading-7 text-stone-700">
                    {displayContentText(paragraph)}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
        <p className="mt-6 rounded-lg bg-orange-50 p-4 text-sm leading-7 text-stone-700">
          {displayContentText(safeDraft.ending)}
        </p>
      </article>
      <section className="rounded-lg border border-orange-100 bg-white p-5 shadow-sm">
        <CreativeNotePanel
          value={draftNote}
          onChange={onDraftNoteChange}
          title="补充你的想法 / 修改意见"
          description="可以打字、语音输入，或上传参考素材。点击优化后，会在当前页刷新正文，不会跳转。"
          placeholder="例如：我感觉还不像我，更真实一点，更口语化一点，少一点官方判断，多一点项目观察。"
          rows={3}
        />
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onOptimizeDraft}
            disabled={isGeneratingDraft}
            className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
          >
            {isGeneratingDraft
              ? "正在按七七语气优化..."
              : optimizeStatus === "已生成优化版"
                ? "已生成优化版"
                : "按七七语气再优化"}
          </button>
          <button
            type="button"
            onClick={onPreview}
            disabled={isGeneratingDraft}
            className="rounded-lg bg-orange-700 px-4 py-2 text-sm font-medium text-white hover:bg-orange-800"
          >
            进入公众号排版
          </button>
          <button
            type="button"
            onClick={onMultiPlatform}
            disabled={isGeneratingDraft}
            className="rounded-lg bg-stone-950 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800"
          >
            生成多平台内容矩阵
          </button>
        </div>
        {optimizeStatus ? (
          <p className="mt-4 rounded-lg bg-orange-50 p-3 text-sm font-medium text-orange-800 ring-1 ring-orange-100">
            {optimizeStatus}
          </p>
        ) : null}
      </section>
    </PageShell>
  );
}

function MultiPlatformView({
  pageView,
  hotspot,
  topic,
  plan,
  focusContentType,
  carrierGenPhase,
  onRetryCarrier,
  onGenerateCarrier,
  showXiaohongshuDesign,
  xiaohongshuNote,
  xiaohongshuStatus,
  videoNote,
  videoStatus,
  momentsStatus,
  onToggleXiaohongshuDesign,
  onXiaohongshuNoteChange,
  onVideoNoteChange,
  onOptimizeXiaohongshu,
  onOptimizeVideo,
  onBack,
  onPreview,
  aiStatus = "",
}: {
  pageView: View;
  hotspot: Hotspot;
  topic: Topic;
  plan: MultiPlatformPlan;
  focusContentType: ContentType;
  carrierGenPhase: GenerationPhase;
  onRetryCarrier: () => void;
  onGenerateCarrier: (contentType: Exclude<ContentType, "articleOutline" | "multiPlatform">) => void;
  showXiaohongshuDesign: boolean;
  xiaohongshuNote: string;
  xiaohongshuStatus: string;
  videoNote: string;
  videoStatus: string;
  momentsStatus: string;
  onToggleXiaohongshuDesign: () => void;
  onXiaohongshuNoteChange: (value: string) => void;
  onVideoNoteChange: (value: string) => void;
  onOptimizeXiaohongshu: () => void;
  onOptimizeVideo: () => void;
  onBack: () => void;
  onPreview: () => void;
  aiStatus?: string;
}) {
  const safePlan = normalizeMultiPlatformPlanForDisplay(plan);
  const xiaohongshuTitles = safePlan.xiaohongshu.titles;
  const xiaohongshuCovers = safePlan.xiaohongshu.covers;
  const xiaohongshuTags = safePlan.xiaohongshu.tags;
  const xiaohongshuTips = safePlan.xiaohongshu.body.tips;
  const xiaohongshuCards = safePlan.xiaohongshu.cards;
  const hasXiaohongshuContent = hasXiaohongshuDisplayableContent(safePlan);
  const videoScript = safePlan.video.script;
  const videoKeywords = safePlan.video.keywords;
  const videoCovers = safePlan.video.covers;
  const videoSoundEffects = safePlan.video.soundEffects;
  const hasVideoContent =
    hasText(safePlan.video.title) ||
    hasText(safePlan.video.hook) ||
    videoScript.length > 0;
  const moments = safePlan.moments;
  const hasMomentsContent = moments.length > 0;
  const platformSummary = safePlan.platformSummary;
  const isFocusedCarrier = focusContentType !== "multiPlatform";
  const carrierLabel = getContentTypeLabel(focusContentType);

  const showXiaohongshuSection =
    (focusContentType === "multiPlatform" || carrierGenPhase === "success") &&
    (focusContentType === "multiPlatform" || focusContentType === "xiaohongshu") &&
    hasXiaohongshuContent;
  const showVideoSection =
    (focusContentType === "multiPlatform" || carrierGenPhase === "success") &&
    (focusContentType === "multiPlatform" || focusContentType === "videoScript") &&
    hasVideoContent;
  const showMomentsSection =
    (focusContentType === "multiPlatform" || carrierGenPhase === "success") &&
    (focusContentType === "multiPlatform" || focusContentType === "moments") &&
    hasMomentsContent;
  const matrixCards = [
    {
      contentType: "xiaohongshu" as const,
      title: "小红书图文",
      hasContent: hasXiaohongshuContent,
      status: xiaohongshuStatus,
      button: hasXiaohongshuContent ? "重新生成小红书图文" : "生成小红书图文",
    },
    {
      contentType: "videoScript" as const,
      title: "短视频口播",
      hasContent: hasVideoContent,
      status: videoStatus,
      button: hasVideoContent ? "重新生成短视频口播" : "生成短视频口播",
    },
    {
      contentType: "moments" as const,
      title: "朋友圈文案",
      hasContent: hasMomentsContent,
      status: momentsStatus,
      button: hasMomentsContent ? "重新生成朋友圈文案" : "生成朋友圈文案",
    },
  ];

  return (
    <PageShell currentView={pageView}>
      <BackButton onClick={onBack}>
        {isFocusedCarrier ? "返回内容形态选择" : "返回公众号正文"}
      </BackButton>
      <StageHeader
        stage={isFocusedCarrier ? getContentTypeLabel(focusContentType) : "多平台延展"}
        title={topic.title}
        subtitle={`当前大选题：${hotspot.title}。当前选择的细分切入角度：${topic.title}。`}
      />

      <section className="rounded-lg border border-orange-100 bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg bg-orange-50 p-4 ring-1 ring-orange-100">
            <p className="text-xs font-semibold text-orange-700">当前选题</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-stone-950">
              {topic.title}
            </p>
          </div>
          <div className="rounded-lg bg-amber-50 p-4 ring-1 ring-amber-100">
            <p className="text-xs font-semibold text-amber-700">来源热点</p>
            <p className="mt-2 text-sm leading-6 text-stone-700">{hotspot.title}</p>
          </div>
          <div className="rounded-lg bg-stone-50 p-4 ring-1 ring-stone-200">
            <p className="text-xs font-semibold text-stone-500">当前内容状态</p>
            <p className="mt-2 text-sm font-semibold text-stone-950">
              {getContentTypeLabel(focusContentType)}
            </p>
          </div>
        </div>
      </section>

      <div className="space-y-3">
        <ContentGenerationStatusBanner
          phase={carrierGenPhase}
          carrierLabel={carrierLabel}
          onRetry={focusContentType === "multiPlatform" ? undefined : onRetryCarrier}
        />
        {carrierGenPhase === "success" ? <AiStatusBanner status={aiStatus} /> : null}
        {focusContentType === "multiPlatform" ? (
          <div className="grid gap-2 md:grid-cols-3">
            <PlatformStatusBadge label="小红书图文" status={xiaohongshuStatus} />
            <PlatformStatusBadge label="短视频口播稿" status={videoStatus} />
            <PlatformStatusBadge label="朋友圈文案" status={momentsStatus} />
          </div>
        ) : null}
      </div>

      {focusContentType === "multiPlatform" ? (
        <section className="rounded-lg border border-orange-100 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-stone-950">
            按需生成多平台内容
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {matrixCards.map((card) => {
              const isGenerating = card.status.includes("正在");
              return (
                <article key={card.contentType} className="rounded-lg border border-orange-100 bg-white p-4 shadow-sm">
                  <p className="text-base font-semibold text-stone-950">
                    {card.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    状态：{isGenerating ? "生成中" : card.hasContent ? "已生成" : "待生成"}
                  </p>
                  <button
                    type="button"
                    onClick={() => onGenerateCarrier(card.contentType)}
                    disabled={isGenerating}
                    className="mt-4 rounded-lg bg-orange-700 px-4 py-2 text-sm font-medium text-white hover:bg-orange-800 disabled:cursor-not-allowed disabled:bg-stone-300"
                  >
                    {isGenerating ? "生成中……" : card.button}
                  </button>
                  {card.status ? (
                    <p className="mt-3 text-sm leading-6 text-stone-600">
                      {card.status}
                    </p>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {carrierGenPhase === "success" && isFocusedCarrier ? (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onRetryCarrier}
            className="rounded-lg border border-orange-300 bg-white px-4 py-2 text-sm font-semibold text-orange-800 hover:bg-orange-50"
          >
            重新生成{isFocusedCarrier ? carrierLabel : "多平台内容矩阵"}
          </button>
        </div>
      ) : null}

      {showXiaohongshuSection ? (
      <section className="rounded-lg border border-orange-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-700">
              Xiaohongshu
            </p>
            <h2 className="mt-2 text-xl font-semibold text-stone-950">
              小红书完整图文
            </h2>
          </div>
          <Tag>完整成稿，不是提示词</Tag>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg bg-orange-50 p-4 ring-1 ring-orange-100">
            <p className="text-xs font-semibold text-stone-500">小红书标题备选</p>
            <div className="mt-2 space-y-2">
              {xiaohongshuTitles.map((title) => (
                <p
                  key={`xhs-title-${title.type}-${title.text}`}
                  className="rounded-lg bg-white p-3 text-sm font-medium leading-6 text-stone-800 ring-1 ring-slate-200"
                >
                  <strong className="text-orange-700">{title.type}：</strong>
                  {title.text}
                </p>
              ))}
            </div>
            <p className="mt-4 text-xs font-semibold text-stone-500">封面文案</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {xiaohongshuCovers.map((cover) => (
                <Tag key={`xhs-cover-${cover}`}>{cover}</Tag>
              ))}
            </div>
            <p className="mt-4 text-xs font-semibold text-stone-500">适合标签</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {xiaohongshuTags.map((tag) => (
                <Tag key={`xhs-tag-${tag}`}>{tag}</Tag>
              ))}
            </div>
            <p className="mt-4 text-xs font-semibold text-stone-500">
              表达注意事项
            </p>
            <p className="mt-2 text-sm leading-6 text-stone-700">
              {safePlan.xiaohongshu.note || "当前暂无可展示内容，请重新生成。"}
            </p>
          </div>
          <div className="grid gap-3">
            <article className="rounded-lg bg-orange-50 p-4 ring-1 ring-orange-100">
              <h3 className="text-base font-semibold text-stone-950">
                小红书正文文案
              </h3>
              <p className="mt-3 text-sm leading-6 text-stone-700">
                {safePlan.xiaohongshu.body.hook || "当前暂无可展示内容，请重新生成。"}
              </p>
              <p className="mt-3 text-sm leading-6 text-stone-700">
                {safePlan.xiaohongshu.body.pain || "当前暂无可展示内容，请重新生成。"}
              </p>
              <p className="mt-3 text-sm leading-6 text-stone-700">
                {safePlan.xiaohongshu.body.judgment || "当前暂无可展示内容，请重新生成。"}
              </p>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-stone-700">
                {xiaohongshuTips.map((tip) => (
                  <li key={`xhs-tip-${tip}`}>{tip}</li>
                ))}
              </ol>
              <p className="mt-3 text-sm leading-6 text-stone-700">
                {safePlan.xiaohongshu.body.ending || "当前暂无可展示内容，请重新生成。"}
              </p>
            </article>
            {xiaohongshuCards.map((card) => (
              <article
                key={`xhs-card-${card.title}-${card.keyword}`}
                className="rounded-lg bg-orange-50 p-4 ring-1 ring-slate-200"
              >
                <h3 className="mt-2 text-base font-semibold text-stone-950">
                  {card.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-stone-700">
                  {card.body}
                </p>
                <p className="mt-2 text-xs leading-5 text-stone-500">
                  排版提示：{card.layout}
                </p>
                {showXiaohongshuDesign ? (
                  <div className="mt-3 rounded-lg bg-white p-3 ring-1 ring-slate-200">
                    <p className="text-xs font-semibold text-stone-500">
                      配图提示词
                    </p>
                    <p className="mt-1 text-xs leading-5 text-stone-600">
                      {card.prompt}
                    </p>
                    <p className="mt-2 text-xs font-semibold text-stone-500">
                      突出关键词：{card.keyword}
                    </p>
                  </div>
                ) : null}
              </article>
            ))}
            {showXiaohongshuDesign ? (
              <article className="rounded-lg bg-amber-50 p-4 ring-1 ring-amber-100">
                <h3 className="text-base font-semibold text-stone-950">
                  小红书图片方案
                </h3>
                <p className="mt-2 text-sm leading-6 text-stone-700">
                  封面图设计方向：{safePlan.xiaohongshu.design.cover || "当前暂无可展示内容，请重新生成。"}
                </p>
                <p className="mt-2 text-sm leading-6 text-stone-700">
                  5 张图文卡片视觉风格：{safePlan.xiaohongshu.design.style || "当前暂无可展示内容，请重新生成。"}
                </p>
                <p className="mt-2 text-xs leading-5 text-amber-800">
                  当前只生成图片方案，不是真实图片生成。
                </p>
              </article>
            ) : null}
          </div>
        </div>
        <div className="mt-5 grid gap-4">
          <CreativeNotePanel
            value={xiaohongshuNote}
            onChange={onXiaohongshuNoteChange}
            title="对小红书图文的修改意见"
            description="可以打字、语音输入，或上传参考素材。"
            placeholder="例如：标题再抓人一点，正文更像真实分享，不要太像营销文案，封面更适合女性营养师风格。"
            rows={4}
          />
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onOptimizeXiaohongshu}
              className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
            >
              按意见优化小红书图文
            </button>
            <button
              type="button"
              onClick={onToggleXiaohongshuDesign}
              className="rounded-lg bg-stone-950 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800"
            >
              生成小红书图片方案
            </button>
          </div>
          {xiaohongshuStatus ? (
            <p className="rounded-lg bg-orange-50 p-3 text-sm font-medium text-orange-800 ring-1 ring-orange-100">
              {xiaohongshuStatus}
            </p>
          ) : null}
        </div>
      </section>
      ) : null}

      {focusContentType === "multiPlatform" && !hasXiaohongshuContent && xiaohongshuStatus.includes("失败") ? (
        <CarrierFailureNotice label="小红书图文" />
      ) : null}

      {showVideoSection ? (
      <section className="rounded-lg border border-orange-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-700">
              Video Script
            </p>
            <h2 className="mt-2 text-xl font-semibold text-stone-950">
              短视频完整口播脚本
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-800 ring-1 ring-orange-100">
              适合平台：{safePlan.video.platforms || "短视频平台"}
            </span>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-100">
              建议时长：{safePlan.video.duration || "暂无建议"}
            </span>
          </div>
        </div>

        <div className="mt-4 rounded-lg bg-stone-950 p-4 text-white">
          <p className="text-xs font-semibold text-orange-200">视频标题</p>
          <h3 className="mt-2 text-xl font-semibold leading-8">
            {safePlan.video.title || "当前暂无可展示内容，请重新生成。"}
          </h3>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.2fr_0.9fr]">
          <div className="rounded-lg bg-orange-50 p-4 ring-1 ring-orange-100">
            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-orange-800 ring-1 ring-orange-100">
              开头钩子
            </span>
            <p className="mt-3 text-base leading-7 text-stone-800">
              {safePlan.video.hook || "当前暂无可展示内容，请重新生成。"}
            </p>
          </div>
          <div className="rounded-lg bg-amber-50 p-4 ring-1 ring-amber-100">
            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-100">
              完整口播脚本
            </span>
            <ol className="mt-3 space-y-2 text-sm leading-6 text-stone-800">
              {videoScript.map((part, index) => (
                <li key={`video-inline-${index}-${part.label}-${part.text}`} className="flex gap-2">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-700 text-[11px] font-semibold text-white">
                    {index + 1}
                  </span>
                  <span>
                    <strong>{part.label}：</strong>
                    {part.text}
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-lg bg-orange-50 p-4 ring-1 ring-orange-100">
            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-orange-800 ring-1 ring-orange-100">
              结尾引导
            </span>
            <p className="mt-3 text-base leading-7 text-stone-800">
              {safePlan.video.ending || "当前暂无可展示内容，请重新生成。"}
            </p>
          </div>
        </div>

        {videoKeywords.length ? (
          <div className="mt-4 rounded-lg bg-orange-50 p-4 ring-1 ring-orange-100">
            <p className="text-xs font-semibold text-orange-700">屏幕字幕关键词</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {videoKeywords.map((keyword) => (
                <span
                  key={`video-keyword-${keyword}`}
                  className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-stone-800 ring-1 ring-orange-100"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-4 grid gap-3">
          {videoScript.map((part, index) => {
            const subtitleChips = normalizeStringArray(part.subtitle);
            const needsBroll =
              part.shot && (part.shot.includes("项目") || part.shot.includes("白板"));
            return (
              <article
                key={`video-part-${index}-${part.label}-${part.text}`}
                className="rounded-lg border border-orange-100 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-700 text-xs font-semibold text-white">
                    {index + 1}
                  </span>
                  <h3 className="text-base font-semibold text-stone-950">
                    {part.label || `段落 ${index + 1}`}
                  </h3>
                </div>
                <p className="mt-3 text-base leading-7 text-stone-800">{part.text}</p>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {hasText(part.shot) ? (
                    <div className="rounded-lg bg-orange-50 p-3 ring-1 ring-orange-100">
                      <span className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-orange-800 ring-1 ring-orange-100">
                        镜头建议
                      </span>
                      <p className="mt-2 text-xs leading-5 text-stone-700">{part.shot}</p>
                    </div>
                  ) : null}
                  {subtitleChips.length ? (
                    <div className="rounded-lg bg-amber-50 p-3 ring-1 ring-amber-100">
                      <span className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-100">
                        字幕关键词
                      </span>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {subtitleChips.map((chip) => (
                          <span
                            key={`subtitle-${index}-${chip}`}
                            className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-stone-800 ring-1 ring-amber-100"
                          >
                            {chip}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {hasText(part.sticker) ? (
                    <div className="rounded-lg bg-stone-50 p-3 ring-1 ring-stone-200">
                      <span className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-stone-700 ring-1 ring-stone-200">
                        贴纸/强调点
                      </span>
                      <p className="mt-2 text-xs leading-5 text-stone-700">{part.sticker}</p>
                    </div>
                  ) : null}
                  <div className="rounded-lg bg-stone-50 p-3 ring-1 ring-stone-200">
                    <span className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-stone-700 ring-1 ring-stone-200">
                      B-roll
                    </span>
                    <p className="mt-2 text-xs font-semibold text-stone-700">
                      {needsBroll ? "建议加入" : "可选"}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {safePlan.video.editingTips.length ? (
          <div className="mt-4 rounded-lg bg-orange-50 p-4 ring-1 ring-orange-100">
            <p className="text-xs font-semibold text-orange-700">剪辑与节奏建议</p>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {safePlan.video.editingTips.map((tip) => (
                <p key={`edit-tip-${tip}`} className="rounded-lg bg-white p-3 text-sm leading-6 text-stone-700 ring-1 ring-orange-100">
                  {tip}
                </p>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {videoCovers.length ? (
            <div className="rounded-lg bg-amber-50 p-4 ring-1 ring-amber-100">
              <p className="text-xs font-semibold text-amber-700">封面标题备选</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {videoCovers.map((cover) => (
                  <Tag key={`video-cover-${cover}`}>{cover}</Tag>
                ))}
              </div>
            </div>
          ) : null}
          <div className="rounded-lg bg-orange-50 p-4 ring-1 ring-orange-100">
            <p className="text-xs font-semibold text-orange-700">BGM 建议</p>
            <p className="mt-2 text-sm leading-6 text-stone-700">
              {safePlan.video.bgm || "暂无建议"}
            </p>
          </div>
          <div className="rounded-lg bg-stone-50 p-4 ring-1 ring-stone-200">
            <p className="text-xs font-semibold text-stone-500">音效建议</p>
            {videoSoundEffects.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {videoSoundEffects.map((item) => (
                  <span key={`video-sound-${item}`} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-stone-700 ring-1 ring-stone-200">
                    {item}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm leading-6 text-stone-600">暂无建议</p>
            )}
          </div>
        </div>
        <div className="mt-5 grid gap-4">
          <CreativeNotePanel
            value={videoNote}
            onChange={onVideoNoteChange}
            title="对短视频脚本的修改意见"
            description="可以打字、语音输入，或上传参考素材。"
            placeholder="例如：开头更抓人一点，语气更像我本人，减少理论，多一点项目现场感。"
            rows={4}
          />
          <button
            type="button"
            onClick={onOptimizeVideo}
            className="w-fit rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
          >
            按意见优化短视频脚本
          </button>
          {videoStatus ? (
            <p className="rounded-lg bg-orange-50 p-3 text-sm font-medium text-orange-800 ring-1 ring-orange-100">
              {videoStatus}
            </p>
          ) : null}
        </div>
      </section>
      ) : null}

      {focusContentType === "multiPlatform" && !hasVideoContent && videoStatus.includes("失败") ? (
        <CarrierFailureNotice label="短视频口播稿" />
      ) : null}

      {showMomentsSection ? (
      <section className="rounded-lg border border-orange-100 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-stone-950">朋友圈文案</h2>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {moments.map((item) => (
            <div key={`moment-${item.type}-${item.text}`} className="rounded-lg bg-orange-50 p-4 ring-1 ring-slate-200">
              <p className="text-xs font-semibold text-orange-700">{item.type}</p>
              <p className="mt-2 text-sm leading-6 text-stone-700">{item.text}</p>
            </div>
          ))}
        </div>
        {momentsStatus ? (
          <p className="mt-4 rounded-lg bg-orange-50 p-3 text-sm font-medium text-orange-800 ring-1 ring-orange-100">
            {momentsStatus}
          </p>
        ) : null}
      </section>
      ) : null}

      {focusContentType === "multiPlatform" && !hasMomentsContent && momentsStatus.includes("失败") ? (
        <CarrierFailureNotice label="朋友圈文案" />
      ) : null}

      {focusContentType === "multiPlatform" && platformSummary.length ? (
      <section className="rounded-lg border border-orange-100 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-stone-950">
          平台侧重点总结
        </h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {platformSummary.map((item) => (
            <div key={`platform-summary-${item.platform}-${item.focus}`} className="rounded-lg bg-orange-50 p-4 ring-1 ring-slate-200">
              <p className="text-sm font-semibold text-stone-950">
                {item.platform}
              </p>
              <p className="mt-2 text-sm leading-6 text-stone-700">
                {item.focus}
              </p>
            </div>
          ))}
        </div>
      </section>
      ) : null}

      {focusContentType === "multiPlatform" ? (
      <button
        type="button"
        onClick={onPreview}
        className="w-fit rounded-lg bg-orange-700 px-4 py-2 text-sm font-medium text-white hover:bg-orange-800"
      >
        进入公众号排版预览
      </button>
      ) : null}
    </PageShell>
  );
}

function PublishPreviewView({
  draft,
  status,
  onBack,
  onCopy,
  onWechatHtmlCopyStatus,
  onMark,
  onOptimize,
  isOptimizing,
}: {
  draft: ArticleDraft;
  status: string;
  onBack: () => void;
  onCopy: () => void;
  onWechatHtmlCopyStatus: (status: string) => void;
  onMark: () => void;
  onOptimize: () => void | Promise<void>;
  isOptimizing: boolean;
}) {
  const safeDraft = {
    title: hasText(draft.title) ? draft.title : "当前暂无可展示内容，请重新生成。",
    intro: hasText(draft.intro) ? draft.intro : "当前暂无可展示内容，请重新生成。",
    sections: Array.isArray(draft.sections)
      ? draft.sections
          .map((section) => ({
            heading: typeof section?.heading === "string" ? section.heading : "",
            paragraphs: sectionParagraphs(section ?? {}),
          }))
          .filter((section) => hasText(section.heading) || section.paragraphs.length > 0)
      : [],
    ending: hasText(draft.ending) ? draft.ending : "当前暂无可展示内容，请重新生成。",
  };
  const publishCheck = buildPublishChecks(draft);
  const wechatLayout = buildWechatArticleHtml(draft);
  const [htmlCopyState, setHtmlCopyState] = useState<
    "idle" | "copying" | "success" | "failed" | "unsupported"
  >("idle");
  const [wechatDraftState, setWechatDraftState] = useState<
    "idle" | "writing" | "success" | "failed"
  >("idle");
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const [coverUploadState, setCoverUploadState] = useState<
    "idle" | "compressing" | "uploading" | "success" | "failed"
  >("idle");
  const [selectedCoverFile, setSelectedCoverFile] = useState<File | null>(null);
  const [manualThumbMediaId, setManualThumbMediaId] = useState("");
  const [coverState, setCoverState] = useState<{
    thumbMediaId: string;
    source: "env" | "uploaded" | "manual" | "missing";
    message: string;
  }>({
    thumbMediaId: "",
    source: "missing",
    message: "当前还没有封面 media_id。",
  });
  const [wechatConfigStatus, setWechatConfigStatus] = useState({
    enabled: false,
    hasAppId: false,
    hasAppSecret: false,
    hasThumbMediaId: false,
  });
  const [wechatRuntimeMode, setWechatRuntimeMode] = useState<"local" | "online">("online");
  const copyButtonText =
    htmlCopyState === "copying"
      ? "正在复制..."
      : htmlCopyState === "success"
        ? "已复制"
        : htmlCopyState === "failed"
          ? "复制失败，手动复制"
          : htmlCopyState === "unsupported"
            ? "请手动复制"
            : "复制公众号 HTML";
  const draftButtonText =
    wechatDraftState === "writing"
      ? "正在写入草稿箱..."
      : wechatDraftState === "success"
        ? "已写入草稿箱"
        : wechatDraftState === "failed"
          ? "写入失败，请查看提示"
          : "写入公众号草稿箱";
  const hasAvailableThumbMediaId =
    Boolean(coverState.thumbMediaId.trim()) || wechatConfigStatus.hasThumbMediaId;
  const missingThumbMediaIdMessage =
    "请先上传封面图并获取 media_id，或手动填写 thumb_media_id。";
  const isCoverBusy = coverUploadState === "compressing" || coverUploadState === "uploading";
  const coverFileStatusText = selectedCoverFile
    ? coverUploadState === "uploading"
      ? "正在上传封面图到公众号素材库..."
      : coverUploadState === "compressing"
        ? "正在压缩封面图..."
      : coverUploadState === "success" && coverState.thumbMediaId
        ? `已获取封面 media_id：${coverState.thumbMediaId}。当前封面可用于写入公众号草稿箱。`
        : coverUploadState === "failed"
          ? `上传失败：${coverState.message}`
          : `已选择文件：${selectedCoverFile.name} · ${formatFileSize(selectedCoverFile.size)}，等待上传到公众号素材库。`
    : "未选择封面图。";
  const coverSourceLabel =
    coverState.source === "env"
      ? "已配置默认封面素材"
      : coverState.source === "uploaded"
        ? "已使用上传封面"
        : coverState.source === "manual"
          ? "已使用手动 media_id"
          : "未获取封面 media_id";
  const wechatRuntimeModeText =
    wechatRuntimeMode === "local"
      ? "当前为本地模式：公众号素材上传会从你的本机公网 IP 发起。若该 IP 已加入公众号白名单，通常可以上传封面并写入草稿箱。"
      : "当前为线上模式：公众号素材上传会从 Vercel 服务器出口 IP 发起，不等于你的本机公网 IP。若上传失败，建议回到 localhost:3000 完成封面上传和写入公众号草稿箱。";

  useEffect(() => {
    let ignore = false;

    void fetch("/api/wechat/draft")
      .then((response) => response.json())
      .then(
        (result: {
          enabled?: boolean;
          hasAppId?: boolean;
          hasAppSecret?: boolean;
          hasThumbMediaId?: boolean;
          message?: string;
        }) => {
          if (ignore) return;
          setWechatConfigStatus({
            enabled: Boolean(result.enabled),
            hasAppId: Boolean(result.hasAppId),
            hasAppSecret: Boolean(result.hasAppSecret),
            hasThumbMediaId: Boolean(result.hasThumbMediaId),
          });
          if (!result.hasThumbMediaId) return;
          setCoverState((current) =>
            current.thumbMediaId
              ? current
              : {
                  thumbMediaId: "",
                  source: "env",
                  message: result.message || "已配置默认封面素材。",
                },
          );
        },
      )
      .catch(() => {
        // The write route still performs the authoritative check.
      });

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const hostname = window.location.hostname;
      setWechatRuntimeMode(
        hostname === "localhost" || hostname === "127.0.0.1" ? "local" : "online",
      );
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  function resetHtmlCopyState() {
    window.setTimeout(() => setHtmlCopyState("idle"), 2500);
  }

  function handleCopyWechatHtml() {
    if (!navigator.clipboard) {
      setHtmlCopyState("unsupported");
      onWechatHtmlCopyStatus("当前浏览器不支持自动复制，请手动复制下方 HTML");
      resetHtmlCopyState();
      return;
    }

    setHtmlCopyState("copying");
    void navigator.clipboard
      .writeText(wechatLayout.html)
      .then(() => {
        setHtmlCopyState("success");
        onWechatHtmlCopyStatus("已复制公众号 HTML");
        resetHtmlCopyState();
      })
      .catch(() => {
        setHtmlCopyState("failed");
        onWechatHtmlCopyStatus("复制失败，请手动复制下方 HTML");
        resetHtmlCopyState();
      });
  }

  async function handleWechatDraftPrep() {
    if (!hasAvailableThumbMediaId) {
      setWechatDraftState("failed");
      setCoverState((current) => ({
        ...current,
        message: missingThumbMediaIdMessage,
      }));
      onWechatHtmlCopyStatus(missingThumbMediaIdMessage);
      window.setTimeout(() => setWechatDraftState("idle"), 2500);
      return;
    }

    setWechatDraftState("writing");
    try {
      const draftPayload = {
        ...wechatLayout.draftPayload,
        thumbMediaId: coverState.thumbMediaId,
      };
      const response = await fetch("/api/wechat/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draftPayload),
      });
      const result = (await response.json()) as {
        ok?: boolean;
        mediaId?: string;
        message?: string;
        reasonCode?: string;
        missingKeys?: string[];
      };

      setWechatDraftState(result.ok ? "success" : "failed");
      onWechatHtmlCopyStatus(
        result.ok
          ? "已写入公众号草稿箱，请进入公众号后台草稿箱查看并手动发布。"
          : getWechatDraftFailureMessage(result.reasonCode, result.message),
      );
    } catch {
      onWechatHtmlCopyStatus("写入公众号草稿箱失败，请检查公众号草稿箱接口权限。");
      setWechatDraftState("failed");
    } finally {
      window.setTimeout(() => setWechatDraftState("idle"), 2500);
    }
  }

  function getCoverFileValidationMessage(file: File) {
    const supportedType = file.type === "image/jpeg" || file.type === "image/png";
    const supportedName = /\.(jpe?g|png)$/i.test(file.name);

    if (!supportedType && !supportedName) {
      return "仅支持 jpg、jpeg、png 格式封面图。";
    }
    return "";
  }

  function getWechatDraftFailureMessage(reasonCode?: string, message?: string) {
    switch (reasonCode) {
      case "THUMB_MEDIA_ID_MISSING":
        return missingThumbMediaIdMessage;
      case "WECHAT_IP_NOT_ALLOWED":
        return "写入失败，可能是当前公网 IP 未加入公众号 IP 白名单。";
      case "WECHAT_CONFIG_INVALID":
        return "公众号 AppID 或 AppSecret 可能不正确，请检查配置。";
      case "WECHAT_TOKEN_FAILED":
        return "获取公众号 access_token 失败，请检查 AppID、AppSecret 和 IP 白名单。";
      case "WECHAT_DRAFT_ADD_FAILED":
        return "写入公众号草稿箱失败，请检查公众号草稿箱接口权限。";
      case "CONTENT_EMPTY":
        return "当前没有可写入的公众号排版内容，请先生成公众号排版。";
      default:
        if (message?.trim()) return message.trim();
        return "写入公众号草稿箱失败，请检查公众号草稿箱接口权限。";
    }
  }

  function getCoverUploadFailureMessage(reasonCode?: string, message?: string) {
    switch (reasonCode) {
      case "NO_FILE":
      case "MISSING_FILE":
        return "请先选择一张封面图。";
      case "INVALID_FILE_TYPE":
        return "上传失败：图片格式不支持，请使用 jpg/jpeg/png。";
      case "FILE_TOO_LARGE":
        return "上传失败：封面图片过大，请压缩后再上传。";
      case "WECHAT_CONFIG_INVALID":
        return "上传失败：公众号配置不完整，请检查 WECHAT_APP_ID / WECHAT_APP_SECRET。";
      case "WECHAT_IP_NOT_ALLOWED":
        return "上传失败：当前请求出口 IP 未加入微信公众号 IP 白名单。若你正在使用 Vercel 线上工作台，微信看到的是 Vercel 出口 IP，不是你的本机公网 IP。建议回到 localhost:3000 完成封面上传。";
      case "WECHAT_TOKEN_FAILED":
        return "上传失败：公众号 access_token 获取失败，请检查 AppID、AppSecret、IP 白名单和环境变量是否已重新部署生效。";
      case "WECHAT_MATERIAL_FAILED":
        return "上传失败：微信素材接口返回失败。若本地可上传但线上不可上传，大概率是 Vercel 出口 IP 不在公众号白名单。建议回到本地工作台完成上传。";
      case "UNKNOWN":
        return "上传失败：暂未识别具体原因。如果本地可以上传、线上不能上传，优先按 Vercel 出口 IP 白名单问题处理。";
      default:
        if (message?.trim()) return message.trim();
        return "上传失败：暂未识别具体原因。如果本地可以上传、线上不能上传，优先按 Vercel 出口 IP 白名单问题处理。";
    }
  }

  function handleSelectCoverFile(files: FileList | null) {
    const file = files?.[0] ?? null;

    if (!file) {
      setSelectedCoverFile(null);
      onWechatHtmlCopyStatus("请先选择一张封面图。");
      return;
    }

    setSelectedCoverFile(file);
    setCoverUploadState("idle");
    setCoverState((current) =>
      current.source === "env" || current.source === "manual"
        ? current
        : {
            thumbMediaId: "",
            source: "missing",
            message: `已选择文件：${file.name}，等待上传到公众号素材库。`,
          },
    );
    onWechatHtmlCopyStatus(
      `已选择文件：${file.name} · ${formatFileSize(file.size)}，等待上传到公众号素材库。`,
    );
  }

  async function handleUploadCover() {
    const file = selectedCoverFile;
    if (!file) {
      setCoverUploadState("failed");
      setCoverState((current) => ({
        ...current,
        message: "请先选择一张封面图。",
      }));
      onWechatHtmlCopyStatus("请先选择一张封面图。");
      return;
    }

    const validationMessage = getCoverFileValidationMessage(file);
    if (validationMessage) {
      setCoverUploadState("failed");
      setCoverState((current) => ({
        ...current,
        message: validationMessage,
      }));
      onWechatHtmlCopyStatus(validationMessage);
      return;
    }

    let uploadFile = file;

    if (file.size > WECHAT_COVER_TARGET_SIZE) {
      setCoverUploadState("compressing");
      setCoverState((current) => ({
        ...current,
        message: "正在压缩封面图...",
      }));
      onWechatHtmlCopyStatus("正在压缩封面图...");

      try {
        uploadFile = await compressWechatCoverImage(file);
      } catch {
        setCoverUploadState("failed");
        setCoverState((current) => ({
          ...current,
          message: "封面图压缩失败，请换一张更小的图片或手动压缩后再上传。",
        }));
        onWechatHtmlCopyStatus("封面图压缩失败，请换一张更小的图片或手动压缩后再上传。");
        return;
      }

      if (uploadFile.size > WECHAT_COVER_MAX_SIZE) {
        setCoverUploadState("failed");
        setCoverState((current) => ({
          ...current,
          message: "封面图仍然过大，请换一张更小的图片或手动压缩后再上传。",
        }));
        onWechatHtmlCopyStatus("封面图仍然过大，请换一张更小的图片或手动压缩后再上传。");
        return;
      }
    }

    const formData = new FormData();
    formData.append("image", uploadFile);
    setCoverUploadState("uploading");
    setCoverState((current) => ({
      ...current,
      message:
        uploadFile === file
          ? "正在上传封面图到公众号素材库..."
          : "已压缩封面图，正在上传到公众号素材库。",
    }));
    onWechatHtmlCopyStatus(
      uploadFile === file
        ? "正在上传封面图到公众号素材库..."
        : "已压缩封面图，正在上传到公众号素材库。",
    );

    try {
      const response = await fetch("/api/wechat/material", {
        method: "POST",
        body: formData,
      });
      const result = (await response.json()) as {
        ok?: boolean;
        mediaId?: string;
        message?: string;
        reasonCode?: string;
      };

      if (result.ok && result.mediaId) {
        setCoverState({
          thumbMediaId: result.mediaId,
          source: "uploaded",
          message: "已获取封面 media_id，可写入公众号草稿箱。",
        });
        setManualThumbMediaId(result.mediaId);
        setCoverUploadState("success");
        onWechatHtmlCopyStatus("已获取封面 media_id，可写入公众号草稿箱。");
        return;
      }

      setCoverUploadState("failed");
      const message = getCoverUploadFailureMessage(result.reasonCode, result.message);
      setCoverState((current) => ({
        ...current,
        message,
      }));
      onWechatHtmlCopyStatus(message);
    } catch {
      setCoverUploadState("failed");
      setCoverState((current) => ({
        ...current,
        message: "封面素材上传失败，请稍后重试或手动填写 media_id。",
      }));
      onWechatHtmlCopyStatus("封面素材上传失败，请稍后重试或手动填写 media_id。");
    }
  }

  function handleUseManualThumbMediaId() {
    const next = manualThumbMediaId.trim();
    if (!next) {
      setCoverState({
        thumbMediaId: "",
        source: "missing",
        message: "请先填写 thumb_media_id。",
      });
      onWechatHtmlCopyStatus("请先填写 thumb_media_id。");
      return;
    }

    setCoverState({
      thumbMediaId: next,
      source: "manual",
      message: "已使用手动填写的 media_id，可写入公众号草稿箱。",
    });
    onWechatHtmlCopyStatus("已使用手动填写的 media_id，可写入公众号草稿箱。");
  }

  return (
    <PageShell currentView="publishPreview">
      <BackButton onClick={onBack}>返回多平台延展</BackButton>
      <StageHeader
        stage="排版预览"
        title={safeDraft.title}
        subtitle="当前先做本地发布前检查：标题、引言、正文节奏、专业判断和私域引导是否都准备好。"
      />
      <section className="rounded-lg border border-orange-100 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-stone-950">
              公众号排版预览
            </h3>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              封面标题建议：{displayContentText(wechatLayout.coverTitle)}
            </p>
            <p className="mt-1 text-sm leading-6 text-stone-600">
              引言：{displayContentText(wechatLayout.articleIntro)}
            </p>
            <p className="mt-1 text-sm leading-6 text-stone-600">
              正文板块：{wechatLayout.bodySections.length} 个 · 全文约 {wechatLayout.wordCount} 字 · 阅读约 {wechatLayout.readMinutes} 分钟
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleCopyWechatHtml}
              disabled={htmlCopyState === "copying"}
              className="rounded-lg bg-orange-700 px-4 py-2 text-sm font-medium text-white hover:bg-orange-800 disabled:cursor-not-allowed disabled:bg-stone-300"
            >
              {copyButtonText}
            </button>
            <button
              type="button"
              onClick={() => void handleWechatDraftPrep()}
              disabled={wechatDraftState === "writing"}
              className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-stone-300"
            >
              {draftButtonText}
            </button>
          </div>
        </div>
        <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm leading-6 text-green-900">
          当前支持写入公众号草稿箱，不会自动发布。写入成功后，请进入公众号后台草稿箱人工微调并手动发布。
        </p>
        <p className="mt-3 rounded-lg bg-blue-50 p-3 text-sm leading-6 text-blue-900">
          {wechatRuntimeModeText}
        </p>
        <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm leading-6 text-amber-900">
          当前 V1 推荐：线上工作台用于内容生成和排版预览；公众号素材上传、封面 media_id、写入草稿箱建议在本地 localhost:3000 完成。因为微信公众号接口受 IP 白名单限制，Vercel 线上出口 IP 不等于本机公网 IP。
        </p>
        <div className="mt-3 grid gap-2 rounded-lg border border-green-100 bg-white p-3 text-xs leading-5 text-stone-600 sm:grid-cols-4">
          <p>草稿箱启用：{wechatConfigStatus.enabled ? "是" : "否"}</p>
          <p>AppID 已配置：{wechatConfigStatus.hasAppId ? "是" : "否"}</p>
          <p>AppSecret 已配置：{wechatConfigStatus.hasAppSecret ? "是" : "否"}</p>
          <p>默认封面已配置：{wechatConfigStatus.hasThumbMediaId ? "是" : "否"}</p>
        </div>
        <section className="mt-5 rounded-lg border border-green-100 bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-stone-950">
                公众号封面素材
              </h4>
              <p className="mt-2 rounded-lg bg-slate-50 p-3 text-xs leading-5 text-stone-600">
                {wechatRuntimeModeText}
              </p>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                {coverSourceLabel}。{coverState.message}
              </p>
              {coverState.thumbMediaId ? (
                <p className="mt-1 break-all text-xs leading-5 text-stone-500">
                  当前 media_id：{coverState.thumbMediaId}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => coverFileInputRef.current?.click()}
                disabled={isCoverBusy}
                className="rounded-lg border border-green-200 bg-white px-4 py-2 text-sm font-medium text-green-800 hover:bg-green-50 disabled:cursor-not-allowed disabled:bg-stone-100"
              >
                选择封面图
              </button>
              <button
                type="button"
                onClick={() => void handleUploadCover()}
                disabled={isCoverBusy}
                className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-stone-300"
              >
                {coverUploadState === "compressing"
                  ? "正在压缩封面..."
                  : coverUploadState === "uploading"
                  ? "正在上传封面..."
                  : coverUploadState === "success"
                    ? "已获取封面 media_id"
                    : coverUploadState === "failed"
                      ? "上传失败"
                      : "上传封面图"}
              </button>
            </div>
            <input
              ref={coverFileInputRef}
              type="file"
              accept="image/jpeg,image/png,.jpg,.jpeg,.png"
              onChange={(event) => handleSelectCoverFile(event.target.files)}
              className="hidden"
            />
          </div>
          <p className="mt-3 text-xs leading-5 text-stone-500">
            {coverFileStatusText}
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              value={manualThumbMediaId}
              onChange={(event) => setManualThumbMediaId(event.target.value)}
              placeholder="手动填写 thumb_media_id"
              className="min-w-0 flex-1 rounded-lg border border-green-100 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100"
            />
            <button
              type="button"
              onClick={handleUseManualThumbMediaId}
              className="rounded-lg border border-green-200 bg-white px-4 py-2 text-sm font-medium text-green-800 hover:bg-green-50"
            >
              使用当前 media_id
            </button>
          </div>
          <p className="mt-3 text-xs leading-5 text-stone-500">
            封面素材 media_id 仅用于写入公众号草稿箱，不会自动发布。
          </p>
        </section>
        {wechatLayout.layoutWarnings.length > 0 ? (
          <div className="mt-4 rounded-lg bg-yellow-50 p-4 text-sm leading-6 text-yellow-900">
            {wechatLayout.layoutWarnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </div>
        ) : null}
        <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div
            className="max-h-[520px] overflow-auto rounded bg-white p-4"
            dangerouslySetInnerHTML={{ __html: wechatLayout.html }}
          />
        </div>
        <div className="mt-5 rounded-lg border border-rose-100 bg-rose-50/70 p-4">
          <h4 className="text-sm font-semibold text-rose-950">
            如何使用 HTML
          </h4>
          <p className="mt-2 text-sm leading-6 text-stone-700">
            可直接复制下方 HTML，粘贴到公众号后台支持 HTML 的编辑入口，或用于后续草稿箱能力。
          </p>
          <p className="mt-1 text-sm leading-6 text-stone-700">
            当前页面可预览排版效果，本阶段仍是本地排版预览，不等于已发到公众号后台。
          </p>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-orange-100 bg-orange-50/70 p-4">
            <h4 className="text-sm font-semibold text-stone-950">
              建议配图说明
            </h4>
            <div className="mt-3 space-y-3">
              {wechatLayout.imageSuggestions.map((item) => (
                <div key={`${item.position}-${item.purpose}`} className="rounded-lg bg-white p-3 ring-1 ring-orange-100">
                  <p className="text-sm font-semibold text-stone-900">
                    {item.position}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-stone-700">
                    用途：{item.purpose}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-stone-700">
                    类型：{item.imageType}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-stone-700">
                    配色：{item.colorAdvice}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-orange-100 bg-white p-4">
            <h4 className="text-sm font-semibold text-stone-950">
              当前排版参数说明
            </h4>
            <dl className="mt-3 grid gap-2 text-sm leading-6 text-stone-700">
              <div className="flex justify-between gap-4">
                <dt>正文字体</dt>
                <dd className="text-right">{wechatLayout.layoutSpec.bodyFont}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>正文字号</dt>
                <dd>{wechatLayout.layoutSpec.bodyFontSize}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>正文字色</dt>
                <dd>{wechatLayout.layoutSpec.bodyColor}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>标题字号</dt>
                <dd>{wechatLayout.layoutSpec.titleFontSize}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>标题字重</dt>
                <dd>{wechatLayout.layoutSpec.titleWeight}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>行间距</dt>
                <dd>{wechatLayout.layoutSpec.lineHeight}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>段间距</dt>
                <dd>{wechatLayout.layoutSpec.paragraphSpacing}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>板块间距</dt>
                <dd>{wechatLayout.layoutSpec.sectionSpacing}</dd>
              </div>
              <div>
                <dt>引言样式</dt>
                <dd className="mt-1 text-stone-600">{wechatLayout.layoutSpec.introStyle}</dd>
              </div>
              <div>
                <dt>重点句样式</dt>
                <dd className="mt-1 text-stone-600">{wechatLayout.layoutSpec.quoteStyle}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>主题色</dt>
                <dd>{wechatLayout.layoutSpec.themeColor}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>辅助色</dt>
                <dd>{wechatLayout.layoutSpec.accentColor}</dd>
              </div>
            </dl>
          </div>
        </div>
        <label className="mt-5 block text-sm font-semibold text-stone-950">
          可复制 HTML
        </label>
        <textarea
          readOnly
          value={wechatLayout.html}
          className="mt-2 h-44 w-full resize-y rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs leading-5 text-stone-700"
        />
        <p className="mt-2 text-xs leading-5 text-stone-500">
          本地复制 HTML 中的介绍图为本地路径，写入公众号草稿箱时系统会自动转为公众号可访问图片。
        </p>
      </section>
      <section className="rounded-lg border border-orange-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-stone-950">
              公众号排版自动检测
            </h3>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              公众号发布准备度：{publishCheck.scoreLabel}
            </p>
          </div>
          <span
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              publishCheck.score >= 85
                ? "bg-orange-100 text-orange-800"
                : publishCheck.score >= 60
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-slate-200 text-stone-700"
            }`}
          >
            {publishCheck.score} / 100
          </span>
        </div>
        <p className="mt-4 rounded-lg bg-orange-50 p-4 text-sm leading-6 text-stone-700">
          {publishCheck.advice}
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {publishCheck.items.map((item) => (
            <article
              key={item.name}
              className="rounded-lg bg-orange-50 p-4 ring-1 ring-slate-200"
            >
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-sm font-semibold text-stone-950">
                  {item.name}
                </h4>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    item.passed
                      ? "bg-orange-100 text-orange-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {item.passed ? "通过" : "待优化"}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-stone-700">
                {item.description}
              </p>
              {!item.passed ? (
                <p className="mt-2 text-xs leading-5 text-stone-500">
                  优化建议：{item.suggestion}
                </p>
              ) : null}
            </article>
          ))}
        </div>
        <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50/70 p-4">
          <h4 className="text-sm font-semibold text-blue-950">当前阶段说明</h4>
          <p className="mt-2 text-sm leading-6 text-stone-700">
            本页面暂未对接微信公众号草稿箱 API。「标记为待发布」只是本地状态标记，用于表示这篇文章已完成排版检查，准备手动复制到公众号后台。下一步仍需要人工打开公众号后台，新建图文，粘贴标题、引言和正文。
          </p>
          <p className="mt-2 text-sm font-medium text-stone-700">
            当前状态：{status || "待复制到公众号后台"}
          </p>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onCopy}
            className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            复制排版内容
          </button>
          <button
            type="button"
            onClick={onMark}
            className="rounded-lg bg-orange-700 px-4 py-2 text-sm font-medium text-white hover:bg-orange-800"
          >
            标记为待发布
          </button>
          {publishCheck.score < 85 ? (
            <button
              type="button"
              onClick={onOptimize}
              disabled={isOptimizing}
              className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-stone-300"
            >
              {isOptimizing ? "正在根据检测建议优化..." : "按检测建议自动优化"}
            </button>
          ) : null}
        </div>
        {status ? (
          <p className="mt-4 rounded-lg bg-orange-50 p-3 text-sm text-orange-800">
            {status}
          </p>
        ) : null}
      </section>
    </PageShell>
  );
}

function TopicCard({
  topic,
  index,
  selected,
  onChoose,
}: {
  topic: Topic;
  index: number;
  selected: boolean;
  onChoose: () => void;
}) {
  const safeScores = Array.isArray(topic.scores) ? topic.scores : [];
  const safePlatformFits = Array.isArray(topic.platformFits) ? topic.platformFits : [];

  return (
    <article
      className={`flex flex-col rounded-lg border p-4 shadow-sm ${
        topic.isPriority
          ? "border-orange-300 bg-orange-50"
          : selected
            ? "border-blue-300 bg-blue-50/50"
            : "border-orange-100 bg-white"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold text-orange-700">切入角度 0{index + 1}</p>
        {topic.isPriority ? (
          <span className="rounded-full bg-orange-700 px-3 py-1 text-xs font-semibold text-white">
            推荐优先写
          </span>
        ) : null}
      </div>
      <h3 className="mt-2 text-base font-semibold leading-7 text-stone-950">
        {topic.title}
      </h3>
      <div className="mt-3 rounded-lg bg-white p-3 ring-1 ring-slate-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-stone-500">综合推荐分</span>
          <strong className="text-lg text-stone-950">{topic.totalScore} / 100</strong>
        </div>
        <div className="mt-2 h-2 rounded-full bg-slate-100">
          <div
            className="h-2 rounded-full bg-orange-600"
            style={{ width: `${topic.totalScore}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-stone-500">推荐等级</span>
          <RecommendTag level={topic.recommendLevel} />
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-stone-700">
        <strong className="text-stone-950">切入角度：</strong>
        {topic.angle}
      </p>
      <div className="mt-3">
        <PurposeTag>{topic.purpose}</PurposeTag>
      </div>
      <p className="mt-3 text-sm leading-6 text-stone-700">{topic.reason}</p>
      <p className="mt-3 text-sm leading-6 text-stone-700">
        <strong className="text-stone-950">为什么适合陈七七：</strong>
        {topic.recommendReason}
      </p>
      <p className="mt-3 rounded-lg bg-white p-3 text-xs leading-5 text-stone-600 ring-1 ring-slate-200">
        {safeScores.length
          ? safeScores
              .map((score) => `${compactScoreLabel(score.label)} ${score.value}`)
              .join("｜")
          : "当前暂无可展示内容，请重新生成。"}
      </p>
      <div className="mt-4 rounded-lg bg-white p-3 ring-1 ring-slate-200">
        <p className="text-xs font-semibold text-stone-500">平台适配</p>
        <div className="mt-2 space-y-2">
          {safePlatformFits.length ? (
            safePlatformFits.map((platform) => (
              <div
                key={platform.platform}
                className="flex items-center justify-between gap-3 text-xs"
              >
                <span className="font-medium text-stone-700">{platform.platform}</span>
                <FitTag fit={platform.fit}>{platform.fit}适配</FitTag>
              </div>
            ))
          ) : (
            <p className="text-xs text-stone-600">当前暂无可展示内容，请重新生成。</p>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onChoose}
        className="mt-auto w-full rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-800"
      >
        选择这个切入角度
      </button>
    </article>
  );
}

function PlatformStatusBadge({ label, status }: { label: string; status: string }) {
  const text = status || "等待生成";
  const isFailed = text.includes("失败");
  const isDone = text.includes("已完成") || text.includes("复用");
  return (
    <div
      className={`rounded-lg p-3 text-sm ring-1 ${
        isFailed
          ? "bg-amber-50 text-amber-900 ring-amber-100"
          : isDone
            ? "bg-orange-50 text-orange-900 ring-orange-100"
            : "bg-stone-50 text-stone-700 ring-stone-200"
      }`}
    >
      <p className="text-xs font-semibold">{label}</p>
      <p className="mt-1 font-medium">{text}</p>
    </div>
  );
}

function CarrierFailureNotice({ label }: { label: string }) {
  return (
    <section className="rounded-lg border border-amber-100 bg-amber-50 p-4 text-sm font-medium text-amber-900">
      {label}生成失败，请重试。
    </section>
  );
}

function SelectionSummary({
  hotspot,
  topic,
  mainPlatform,
}: {
  hotspot: Hotspot;
  topic: Topic;
  mainPlatform?: string;
}) {
  return (
    <section className="rounded-lg border border-orange-100 bg-white p-5 shadow-sm">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <InfoBox label="已选择热点" value={hotspot.title} />
        <InfoBox label="已选择选题" value={topic.title} />
        <InfoBox label="综合推荐分" value={`${topic.totalScore} / 100`} />
        <InfoBox label="内容目的标签" value={topic.purpose} />
      </div>
      {mainPlatform ? (
        <div className="mt-3">
          <Tag>推荐主平台：{mainPlatform}</Tag>
        </div>
      ) : null}
    </section>
  );
}

function normalizeMultiPlatformPlanForDisplay(plan: unknown): MultiPlatformPlan {
  const root = plan && typeof plan === "object" ? (plan as Record<string, unknown>) : {};
  const xh =
    root.xiaohongshu && typeof root.xiaohongshu === "object"
      ? (root.xiaohongshu as Record<string, unknown>)
      : {};
  const body =
    xh.body && typeof xh.body === "object" ? (xh.body as Record<string, unknown>) : {};
  const design =
    xh.design && typeof xh.design === "object" ? (xh.design as Record<string, unknown>) : {};
  const vd =
    root.video && typeof root.video === "object" ? (root.video as Record<string, unknown>) : {};

  const titlesRaw = xh.titles ?? xh.titleOptions ?? xh.title;
  const titleList = Array.isArray(titlesRaw)
    ? titlesRaw
    : titlesRaw && typeof titlesRaw === "object"
      ? [titlesRaw]
      : [];

  const xhsTitles = titleList
    .map((item, index) => {
      if (typeof item === "string") return { type: `标题 ${index + 1}`, text: item.trim() };
      if (!item || typeof item !== "object") return { type: "", text: "" };
      const o = item as Record<string, unknown>;
      const type = typeof o.type === "string" ? o.type.trim() : "";
      const text = typeof o.text === "string" ? o.text.trim() : "";
      return { type, text };
    })
    .filter((item) => hasText(item.type) || hasText(item.text));

  const cardsRaw = xh.cards ?? xh.imagePlan;
  const cardList = Array.isArray(cardsRaw)
    ? cardsRaw
    : cardsRaw && typeof cardsRaw === "object"
      ? [cardsRaw]
      : [];

  const xhsCards = cardList
    .map((card, index) => {
      if (typeof card === "string") {
        return { title: `图文卡片 ${index + 1}`, body: card.trim(), layout: "", prompt: "", keyword: "" };
      }
      if (!card || typeof card !== "object") {
        return { title: "", body: "", layout: "", prompt: "", keyword: "" };
      }
      const c = card as Record<string, unknown>;
      return {
        title: typeof c.title === "string" ? c.title.trim() : "",
        body: typeof c.body === "string" ? c.body.trim() : "",
        layout: typeof c.layout === "string" ? c.layout.trim() : "",
        prompt: typeof c.prompt === "string" ? c.prompt.trim() : "",
        keyword: typeof c.keyword === "string" ? c.keyword.trim() : "",
      };
    })
    .filter((card) => hasText(card.title) || hasText(card.body));

  const scriptRaw = vd.script ?? vd.content ?? vd.text;
  const scriptList = Array.isArray(scriptRaw)
    ? scriptRaw
    : scriptRaw && typeof scriptRaw === "object"
      ? [scriptRaw]
      : typeof scriptRaw === "string"
        ? splitArticleTextParagraphs(scriptRaw)
      : [];

  const videoScript = scriptList
    .map((part, index) => {
      if (typeof part === "string") {
        return { label: `段落 ${index + 1}`, text: part.trim(), shot: "", subtitle: "", sticker: "" };
      }
      if (!part || typeof part !== "object") {
        return { label: "", text: "", shot: "", subtitle: "", sticker: "" };
      }
      const p = part as Record<string, unknown>;
      return {
        label: typeof p.label === "string" ? p.label.trim() : "",
        text: typeof p.text === "string" ? p.text.trim() : "",
        shot: typeof p.shot === "string" ? p.shot.trim() : "",
        subtitle: typeof p.subtitle === "string" ? p.subtitle.trim() : "",
        sticker: typeof p.sticker === "string" ? p.sticker.trim() : "",
      };
    })
    .filter((part) => hasText(part.label) || hasText(part.text));

  const momentsRaw = root.moments;
  const momentList = Array.isArray(momentsRaw)
    ? momentsRaw
    : momentsRaw && typeof momentsRaw === "object"
      ? [momentsRaw]
      : [];

  const moments = momentList
    .map((item) => {
      if (!item || typeof item !== "object") return { type: "", text: "" };
      const o = item as Record<string, unknown>;
      return {
        type: typeof o.type === "string" ? o.type.trim() : "",
        text: typeof o.text === "string" ? o.text.trim() : "",
      };
    })
    .filter((item) => hasText(item.type) || hasText(item.text));

  const psRaw = root.platformSummary;
  const psList = Array.isArray(psRaw)
    ? psRaw
    : psRaw && typeof psRaw === "object"
      ? [psRaw]
      : [];

  const platformSummary = psList
    .map((item) => {
      if (!item || typeof item !== "object") return { platform: "", focus: "" };
      const o = item as Record<string, unknown>;
      return {
        platform: typeof o.platform === "string" ? o.platform.trim() : "",
        focus: typeof o.focus === "string" ? o.focus.trim() : "",
      };
    })
    .filter((item) => hasText(item.platform) || hasText(item.focus));

  return {
    xiaohongshu: {
      titles: xhsTitles,
      covers: normalizeStringArray(xh.covers),
      body: {
        hook: coerceLocalizedString(body.hook ?? xh.hook ?? xh.content ?? xh.text),
        pain: coerceLocalizedString(body.pain ?? xh.pain),
        judgment: coerceLocalizedString(body.judgment ?? xh.judgment),
        tips: normalizeStringArray(body.tips),
        ending: coerceLocalizedString(body.ending ?? xh.ending ?? xh.cta),
      },
      cards: xhsCards,
      tags: normalizeStringArray(xh.tags ?? xh.hashtags),
      note: coerceLocalizedString(xh.note),
      design: {
        cover: coerceLocalizedString(design.cover),
        style: coerceLocalizedString(design.style),
      },
    },
    video: {
      platforms: coerceLocalizedString(vd.platforms),
      title: coerceLocalizedString(vd.title),
      hook: coerceLocalizedString(vd.hook),
      covers: normalizeStringArray(vd.covers ?? vd.coverTitles ?? vd.coverTitle),
      cover: coerceLocalizedString(vd.cover),
      points: normalizeStringArray(vd.points),
      ending: coerceLocalizedString(vd.ending),
      duration: coerceLocalizedString(vd.duration),
      subtitles: normalizeStringArray(vd.subtitles),
      script: videoScript,
      editingTips: normalizeStringArray(vd.editingTips),
      keywords: normalizeStringArray(vd.keywords),
      bgm: coerceLocalizedString(vd.bgm),
      soundEffects: normalizeStringArray(vd.soundEffects),
    },
    moments,
    platformSummary,
  };
}

function createEmptyMultiPlatformPlan(): MultiPlatformPlan {
  return normalizeMultiPlatformPlanForDisplay({});
}

function normalizeArticleOutlineForDisplay(outline: ArticleOutline): ArticleOutline {
  const sections = Array.isArray(outline.sections)
    ? outline.sections
        .filter((section) => hasText(section?.label) || hasText(section?.text))
        .map((section) => ({
          label: stripLeadingSectionNumber(section.label || "正文板块"),
          text: section.text || "",
        }))
    : [];

  return {
    ...outline,
    sections: mergeOutlineSectionsToLimit(sections, 6),
  };
}

function mergeOutlineSectionsToLimit(
  sections: ArticleOutline["sections"],
  maxCount: number,
): ArticleOutline["sections"] {
  if (sections.length <= maxCount) {
    return sections;
  }

  const merged = sections.slice(0, maxCount).map((section) => ({ ...section }));
  sections.slice(maxCount).forEach((section, index) => {
    const target = merged[index % maxCount];
    target.text = [target.text, section.text].filter(Boolean).join(" ");
  });
  return merged;
}

function stripLeadingSectionNumber(value: string): string {
  return value.replace(/^\s*(?:0?[1-9]|[一二三四五六七八九十]+)[\.、\s-]+/, "").trim();
}

function hasOutlineDisplayableContent(outline: ArticleOutline | null): boolean {
  if (!outline) return false;
  if (hasText(outline.title)) return true;
  if (Array.isArray(outline.keywords) && outline.keywords.some((k) => hasText(k))) return true;
  if (Array.isArray(outline.sections)) {
    return outline.sections.some((s) => hasText(s?.label) || hasText(s?.text));
  }
  return false;
}

function isCompleteArticleDraft(draft: ArticleDraft | null): boolean {
  const stats = getArticleDraftStats(draft);

  return stats.textLength >= 800 || (
    stats.paragraphCount >= 6 &&
    stats.hasOpening &&
    stats.bodyParagraphCount >= 3 &&
    stats.hasEnding
  );
}

function hasArticleDraftContent(draft: ArticleDraft | null): boolean {
  const stats = getArticleDraftStats(draft);
  return stats.textLength > 0 && (
    stats.paragraphCount > 0 ||
    stats.bodyParagraphCount > 0 ||
    stats.hasOpening ||
    stats.hasEnding
  );
}

function getArticleDraftStats(draft: ArticleDraft | null) {
  if (!draft) {
    return {
      textLength: 0,
      paragraphCount: 0,
      bodyParagraphCount: 0,
      hasOpening: false,
      hasEnding: false,
    };
  }
  const intro = hasText(draft.intro) ? draft.intro.trim() : "";
  const ending = hasText(draft.ending) ? draft.ending.trim() : "";
  const bodyParagraphs = Array.isArray(draft.sections)
    ? draft.sections.flatMap((section) => sectionParagraphs(section ?? {}).filter(hasText))
    : [];
  const paragraphCount = [intro, ...bodyParagraphs, ending].filter(hasText).length;
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

function hasXiaohongshuDisplayableContent(plan: MultiPlatformPlan): boolean {
  const p = normalizeMultiPlatformPlanForDisplay(plan);
  const categories = [
    p.xiaohongshu.titles.length > 0,
    p.xiaohongshu.covers.length > 0,
    hasText(p.xiaohongshu.body.hook) ||
      hasText(p.xiaohongshu.body.pain) ||
      hasText(p.xiaohongshu.body.judgment) ||
      hasText(p.xiaohongshu.body.ending),
    p.xiaohongshu.cards.length > 0,
    p.xiaohongshu.tags.length > 0,
    p.xiaohongshu.body.tips.length > 0,
    hasText(p.xiaohongshu.note),
    hasText(p.xiaohongshu.design.cover) || hasText(p.xiaohongshu.design.style),
  ];
  return categories.filter(Boolean).length >= 2;
}

function hasVideoDisplayableContent(plan: MultiPlatformPlan): boolean {
  const p = normalizeMultiPlatformPlanForDisplay(plan);
  const categories = [
    hasText(p.video.title),
    hasText(p.video.hook),
    p.video.script.length > 0,
    p.video.editingTips.length > 0 || p.video.points.length > 0,
    hasText(p.video.bgm) || p.video.soundEffects.length > 0,
    p.video.covers.length > 0 || hasText(p.video.cover),
  ];
  return categories.filter(Boolean).length >= 2;
}

function hasMomentsDisplayableContent(plan: MultiPlatformPlan): boolean {
  return normalizeMultiPlatformPlanForDisplay(plan).moments.length > 0;
}

function carrierHasDisplayableContent(contentType: ContentType, plan: MultiPlatformPlan): boolean {
  if (contentType === "xiaohongshu") return hasXiaohongshuDisplayableContent(plan);
  if (contentType === "videoScript") return hasVideoDisplayableContent(plan);
  if (contentType === "moments") return hasMomentsDisplayableContent(plan);
  if (contentType === "multiPlatform") {
    return (
      hasXiaohongshuDisplayableContent(plan) ||
      hasVideoDisplayableContent(plan) ||
      hasMomentsDisplayableContent(plan)
    );
  }
  return false;
}

function viewForContentType(contentType: ContentType): View {
  if (contentType === "xiaohongshu") return "xiaohongshu";
  if (contentType === "videoScript") return "videoScript";
  if (contentType === "moments") return "moments";
  return "multiPlatform";
}

function getSingleCarrierTask(
  contentType: Exclude<ContentType, "articleOutline" | "multiPlatform">,
): AiTask {
  if (contentType === "xiaohongshu") return "generateXiaohongshu";
  if (contentType === "videoScript") return "generateVideoScript";
  return "generateMoments";
}

function wrapSingleCarrierPlan(
  contentType: Exclude<ContentType, "articleOutline" | "multiPlatform">,
  data: MultiPlatformPlan["xiaohongshu"] | MultiPlatformPlan["video"] | MultiPlatformPlan["moments"],
): MultiPlatformPlan {
  if (contentType === "xiaohongshu") {
    return normalizeMultiPlatformPlanForDisplay({ xiaohongshu: data });
  }
  if (contentType === "videoScript") {
    return normalizeMultiPlatformPlanForDisplay({ video: data });
  }
  return normalizeMultiPlatformPlanForDisplay({ moments: data });
}

function mergeCarrierPlan(
  base: MultiPlatformPlan,
  contentType: Exclude<ContentType, "articleOutline" | "multiPlatform">,
  carrierPlan: MultiPlatformPlan,
): MultiPlatformPlan {
  const current = normalizeMultiPlatformPlanForDisplay(base);
  const next = normalizeMultiPlatformPlanForDisplay(carrierPlan);
  if (contentType === "xiaohongshu") {
    return normalizeMultiPlatformPlanForDisplay({ ...current, xiaohongshu: next.xiaohongshu });
  }
  if (contentType === "videoScript") {
    return normalizeMultiPlatformPlanForDisplay({ ...current, video: next.video });
  }
  return normalizeMultiPlatformPlanForDisplay({ ...current, moments: next.moments });
}

function normalizeArticleDraftStatus(
  status: ArticleDraft["status"] | undefined,
): ArticleDraft["status"] {
  if (status === "正文生成中" || status === "已生成正文") return status;
  return "已生成正文";
}

function normalizeArticleDraftFromAi(draft: ArticleDraft): ArticleDraft {
  const raw = draft as ArticleDraft & {
    article?: unknown;
    body?: unknown;
    content?: unknown;
    conclusion?: unknown;
    cta?: unknown;
    draft?: unknown;
    markdown?: unknown;
    paragraphs?: unknown;
    sections?: unknown;
    text?: unknown;
  };
  const root = unwrapArticleDraftRecord(raw);
  const longText = coerceLongDraftText(
    root.content,
    root.body,
    root.text,
    root.markdown,
    root.article,
    root.draft,
    root.paragraphs,
  );
  const sections = Array.isArray(root.sections)
    ? root.sections
        .map((section) => {
          if (!section || typeof section !== "object") {
            return { heading: "", paragraphs: [] };
          }
          const record = section as Record<string, unknown>;
          return {
            heading: coerceLocalizedString(
              record.heading ?? record.title ?? record.label,
            ),
            paragraphs: normalizeDraftParagraphs(
              record.paragraphs ?? record.body ?? record.content,
            ),
          };
        })
        .filter((section) => hasText(section.heading) || section.paragraphs.length > 0)
    : [];

  const normalized = {
    status: normalizeArticleDraftStatus(
      typeof root.status === "string" ? root.status as ArticleDraft["status"] : undefined,
    ),
    title: coerceLocalizedString(root.title),
    intro: coerceLocalizedString(root.intro ?? root.opening ?? root.lead),
    sections,
    ending: coerceLocalizedString(root.ending ?? root.conclusion ?? root.cta),
  };

  if (!hasArticleDraftContent(normalized) && longText) {
    return parseArticleDraftTextForDisplay(longText);
  }

  if (!isCompleteArticleDraft(normalized) && longText) {
    const fromText = parseArticleDraftTextForDisplay(longText);
    return {
      status: "已生成正文",
      title: normalized.title || fromText.title,
      intro: normalized.intro || fromText.intro,
      sections: normalized.sections.length ? normalized.sections : fromText.sections,
      ending: normalized.ending || fromText.ending,
    };
  }

  return normalized;
}

function normalizeDraftParagraphs(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => {
        if (typeof item === "string") {
          const trimmed = item.trim();
          return trimmed ? [trimmed] : [];
        }
        if (item && typeof item === "object") {
          const text = coerceLocalizedString(item);
          return text ? [text] : [];
        }
        return [];
      })
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return splitArticleTextParagraphs(value);
  }

  const text = coerceLocalizedString(value);
  return text ? [text] : [];
}

function unwrapArticleDraftRecord(value: Record<string, unknown>): Record<string, unknown> {
  for (const key of ["article_draft", "draft", "articleDraft", "article", "content", "body"]) {
    const nested = value[key];
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      return nested as Record<string, unknown>;
    }
  }
  return value;
}

function coerceLongDraftText(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (Array.isArray(value)) {
      const text = value
        .flatMap((item) => {
          if (typeof item === "string") return item.trim();
          if (item && typeof item === "object") {
            const record = item as Record<string, unknown>;
            return coerceLocalizedString(
              record.text ?? record.content ?? record.body ?? record.paragraph,
            );
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

function parseArticleDraftTextForDisplay(text: string): ArticleDraft {
  const cleaned = text
    .replace(/```(?:json|markdown)?/gi, "")
    .replace(/```/g, "")
    .trim();
  const blocks = splitArticleTextParagraphs(cleaned);
  const title = normalizeMarkdownTitle(blocks[0] ?? "");
  const withoutTitle = title && blocks[0] && normalizeMarkdownTitle(blocks[0]) === title
    ? blocks.slice(1)
    : blocks;
  const intro = withoutTitle[0] ?? "";
  const bodyBlocks = withoutTitle.slice(1);
  const ending = bodyBlocks.length > 1 ? bodyBlocks[bodyBlocks.length - 1] : "";
  const sectionBlocks = ending ? bodyBlocks.slice(0, -1) : bodyBlocks;

  return {
    status: "已生成正文",
    title: title || "公众号正文",
    intro,
    sections: chunkDraftParagraphsIntoSections(sectionBlocks),
    ending,
  };
}

function splitArticleTextParagraphs(text: string): string[] {
  const paragraphs = text
    .replace(/\r\n/g, "\n")
    .replace(/^\s*#{1,4}\s+/gm, "")
    .split(/\n+|(?<=。)\s+(?=[^\s])/)
    .map((paragraph) => paragraph.replace(/^[\s>*-]+/, "").trim())
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

function chunkDraftParagraphsIntoSections(paragraphs: string[]): ArticleDraft["sections"] {
  const chunkSize = Math.max(2, Math.ceil(paragraphs.length / 4));
  const sections: ArticleDraft["sections"] = [];

  for (let index = 0; index < paragraphs.length; index += chunkSize) {
    sections.push({
      heading: `0${sections.length + 1} 正文小节`,
      paragraphs: paragraphs.slice(index, index + chunkSize),
    });
  }

  return sections;
}

function normalizeMarkdownTitle(value: string) {
  return value.replace(/^#{1,4}\s*/, "").trim();
}

function displayDraftStatusLabel(status: unknown): string {
  if (status === "正文生成中" || status === "已生成正文") return status;
  if (typeof status === "string" && status.trim()) return status.trim();
  return "待生成";
}

function sanitizePublicStatusMessage(message: string): string {
  const t = message.trim();
  if (!t) return "";
  if (/undefined|null/i.test(t)) return "";
  if (/[\[{]\s*"/.test(t) && /"\s*:/.test(t)) return "生成失败，请重试。";
  return t;
}

function OutlineResult({
  outline,
  isGeneratingDraft,
  onConfirmOutline,
}: {
  outline: ArticleOutline;
  isGeneratingDraft: boolean;
  onConfirmOutline: () => void;
}) {
  const safeOutline = {
    title: hasText(outline.title) ? outline.title : "当前暂无可展示内容，请重新生成。",
    sections: Array.isArray(outline.sections)
      ? outline.sections.filter((section) => hasText(section?.label) || hasText(section?.text))
      : [],
    keywords: Array.isArray(outline.keywords) ? outline.keywords.filter(hasText) : [],
  };

  return (
    <section className="rounded-lg border border-orange-100 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-stone-950">
        文章标题：{safeOutline.title}
      </h2>
      <div className="mt-4 grid gap-3">
        {safeOutline.sections.map((section, index) => (
          <div
            key={`${section.label}-${index}`}
            className="grid gap-3 rounded-lg border border-orange-100 bg-orange-50 p-4 sm:grid-cols-[48px_1fr]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-700 text-sm font-semibold text-white">
              {index + 1}
            </span>
            <div>
              <h3 className="text-base font-semibold text-stone-950">
                {section.label}
              </h3>
              <p className="mt-1 text-sm leading-6 text-stone-700">
                {section.text}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {safeOutline.keywords.map((keyword) => (
          <PurposeTag key={keyword}>{keyword}</PurposeTag>
        ))}
      </div>
      <button
        type="button"
        onClick={onConfirmOutline}
        disabled={isGeneratingDraft}
        className="mt-5 rounded-lg bg-orange-700 px-4 py-2 text-sm font-medium text-white hover:bg-orange-800 disabled:cursor-not-allowed disabled:bg-stone-300"
      >
        {isGeneratingDraft
          ? "正在生成公众号正文……预计需要 20-60 秒，请不要重复点击。"
          : "生成公众号正文"}
      </button>
    </section>
  );
}

function ContentGenerationStatusBanner({
  phase,
  carrierLabel,
  onRetry,
}: {
  phase: GenerationPhase;
  carrierLabel: string;
  onRetry?: () => void;
}) {
  if (phase === "success") return null;

  if (phase === "not_started") {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-stone-700">
        尚未生成，请点击生成按钮。
      </div>
    );
  }

  if (phase === "generating") {
    return (
      <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-medium leading-6 text-orange-900">
        正在生成{carrierLabel}……预计需要 10-30 秒，请不要重复点击。
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-900">
        <p>生成失败，请重试。</p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 rounded-lg bg-red-800 px-3 py-2 text-xs font-semibold text-white hover:bg-red-900"
          >
            重试
          </button>
        ) : null}
      </div>
    );
  }

  if (phase === "empty") {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
        <p>AI 返回内容为空，请重新生成。</p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 rounded-lg bg-amber-800 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-900"
          >
            重试
          </button>
        ) : null}
      </div>
    );
  }

  return null;
}

function AiStatusBanner({ status }: { status: string }) {
  const safe = sanitizePublicStatusMessage(status);
  if (!safe) return null;

  return (
    <div className="rounded-lg border border-orange-100 bg-white px-4 py-3 text-sm font-medium text-orange-800 shadow-sm">
      {safe}
    </div>
  );
}

function startSpeechInput({
  onText,
  onStart,
  onEnd,
  onSuccess,
  onError,
}: {
  onText: (text: string) => void;
  onStart: () => void;
  onEnd: () => void;
  onSuccess: () => void;
  onError: (message: string) => void;
}) {
  if (typeof window === "undefined") {
    onError("当前浏览器不支持语音识别，请手动输入。");
    return null;
  }

  const speechWindow = window as WindowWithSpeechRecognition;
  const Recognition =
    speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;

  if (!Recognition) {
    onError("当前浏览器不支持语音识别，请手动输入。");
    return null;
  }

  const recognition = new Recognition();
  recognition.lang = "zh-CN";
  recognition.interimResults = false;
  recognition.continuous = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    const transcript = getSpeechTranscript(event);
    if (transcript) {
      onText(transcript);
      onSuccess();
    } else {
      onError("没有识别到语音，请再试一次。");
    }
  };
  recognition.onerror = (event) => {
    onError(getSpeechErrorMessage(event.error));
  };
  recognition.onnomatch = () => {
    onError("没有识别到语音，请再试一次。");
  };
  recognition.onend = () => {
    onEnd();
  };

  try {
    onStart();
    recognition.start();
    return recognition;
  } catch {
    onEnd();
    onError("语音识别失败，请重试或手动输入。");
    return null;
  }
}

function getSpeechTranscript(event: SpeechRecognitionEventLike) {
  const startIndex = event.resultIndex ?? 0;
  const resultCount = event.results.length ?? startIndex + 1;
  const transcripts: string[] = [];

  for (let index = startIndex; index < resultCount; index += 1) {
    const transcript = event.results[index]?.[0]?.transcript?.trim();
    if (transcript) transcripts.push(transcript);
  }

  return transcripts.join(" ").trim();
}

function getSpeechErrorMessage(error?: string) {
  if (error === "not-allowed" || error === "service-not-allowed") {
    return "麦克风权限被拒绝，请允许浏览器使用麦克风后重试。";
  }
  if (error === "no-speech") return "没有识别到语音，请再试一次。";
  if (error === "network") return "语音识别网络异常，请稍后重试。";
  return "语音识别失败，请重试或手动输入。";
}

function CreativeNotePanel({
  value,
  onChange,
  title,
  description,
  placeholder,
  rows,
}: {
  value: string;
  onChange: (value: string) => void;
  title: string;
  description: string;
  placeholder: string;
  rows: number;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [panelStatus, setPanelStatus] = useState("");
  const [materials, setMaterials] = useState<UploadedMaterial[]>([]);

  function appendNote(text: string) {
    const spacer = value.trim() ? "\n\n" : "";
    onChange(`${value}${spacer}${text}`);
  }

  function startVoiceInput() {
    if (isListening) return;

    recognitionRef.current?.stop();
    recognitionRef.current = startSpeechInput({
      onText: appendNote,
      onStart: () => {
        setIsListening(true);
        setPanelStatus("正在听你说...");
      },
      onEnd: () => {
        setIsListening(false);
        recognitionRef.current = null;
      },
      onSuccess: () => {
        setPanelStatus("已识别，已加入输入框");
      },
      onError: (message) => {
        setIsListening(false);
        setPanelStatus(message);
      },
    });
  }

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;

    const nextMaterials: UploadedMaterial[] = [];
    let nextValue = value;

    for (const file of Array.from(files)) {
      const id = `${file.name}-${file.size}-${file.lastModified}`;
      const baseMaterial = {
        id,
        name: file.name,
        type: file.type || getFileExtensionLabel(file.name),
        sizeLabel: formatFileSize(file.size),
      };

      if (isTextMaterial(file)) {
        const content = await readFileAsText(file);
        const spacer = nextValue.trim() ? "\n\n" : "";
        nextValue = `${nextValue}${spacer}【上传文本素材】\n${content}`;
        nextMaterials.push({
          ...baseMaterial,
          status: "已上传，文本内容已追加到补充意见中。",
        });
      } else if (file.type.startsWith("image/")) {
        nextMaterials.push({
          ...baseMaterial,
          previewUrl: await readFileAsDataUrl(file),
          status: "已上传，等待后续 AI 解析能力接入。当前仅展示图片，后续接入 AI 后可识别图片内容。",
        });
      } else {
        nextMaterials.push({
          ...baseMaterial,
          status: "已上传，等待后续 AI 解析能力接入。当前仅记录文件，后续接入文档解析后可读取内容。",
        });
      }
    }

    onChange(nextValue);
    setMaterials((current) => [...current, ...nextMaterials]);
    setPanelStatus("素材已上传，当前不会影响原有流程。");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div className="rounded-lg border border-orange-100 bg-gradient-to-br from-orange-50 to-white p-4 ring-1 ring-orange-50">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-700">
            Creative Input
          </p>
          <h3 className="mt-2 text-base font-semibold text-stone-950">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-stone-600">{description}</p>
        </div>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
          创作补充面板
        </span>
      </div>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="mt-4 min-h-28 w-full resize-none rounded-lg border border-orange-100 bg-white px-4 py-3 text-sm leading-6 text-stone-800 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
      />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={startVoiceInput}
          disabled={isListening}
          className="rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-stone-300"
        >
          {isListening ? "正在听你说..." : "语音输入"}
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm font-semibold text-orange-800 hover:bg-orange-50"
        >
          上传素材
        </button>
        <button
          type="button"
          onClick={() => {
            onChange("");
            setPanelStatus("补充意见已清空。");
          }}
          className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
        >
          清空
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,text/plain,text/markdown,application/pdf,.md,.doc,.docx"
          onChange={(event) => void handleFiles(event.target.files)}
          className="hidden"
        />
      </div>
      {panelStatus ? (
        <p className="mt-3 rounded-lg bg-white px-3 py-2 text-sm text-orange-800 ring-1 ring-orange-100">
          {panelStatus}
        </p>
      ) : null}
      {materials.length ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {materials.map((material) => (
            <article
              key={material.id}
              className="rounded-lg border border-orange-100 bg-white p-3"
            >
              {material.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={material.previewUrl}
                  alt={material.name}
                  className="mb-3 h-28 w-full rounded-lg object-cover"
                />
              ) : null}
              <p className="text-sm font-semibold text-stone-950">{material.name}</p>
              <p className="mt-1 text-xs text-stone-500">
                {material.type} · {material.sizeLabel}
              </p>
              <p className="mt-2 text-xs leading-5 text-stone-600">
                {material.status}
              </p>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function PageShell({
  children,
  currentView,
}: {
  children: React.ReactNode;
  currentView: View;
}) {
  return (
    <main className="min-h-screen bg-orange-50 px-4 py-6 text-stone-950 sm:px-6 sm:py-8">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <WorkflowNav currentView={currentView} />
        {children}
      </section>
    </main>
  );
}

function WorkflowNav({ currentView }: { currentView: View }) {
  const navKey: View =
    currentView === "xiaohongshu" ||
    currentView === "videoScript" ||
    currentView === "moments"
      ? "multiPlatform"
      : currentView;
  const currentIndex = Math.max(
    0,
    workflowSteps.findIndex((step) => step.view === navKey),
  );

  return (
    <nav className="rounded-lg border border-orange-100 bg-white/90 p-3 shadow-sm backdrop-blur">
      <div className="flex gap-2 overflow-x-auto">
        {workflowSteps.map((step, index) => {
          const isActive = step.view === navKey;
          const isDone = index < currentIndex;

          return (
            <div
              key={step.view}
              className={`flex min-w-fit items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${
                isActive
                  ? "bg-slate-950 text-white"
                  : isDone
                    ? "bg-orange-50 text-orange-800"
                    : "bg-orange-50 text-stone-500"
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                  isActive
                    ? "bg-white text-stone-950"
                    : isDone
                      ? "bg-orange-700 text-white"
                      : "bg-white text-stone-500 ring-1 ring-slate-200"
                }`}
              >
                {index + 1}
              </span>
              <span className="hidden sm:inline">{step.label}</span>
              <span className="sm:hidden">{step.short}</span>
            </div>
          );
        })}
      </div>
    </nav>
  );
}

function StageHeader({
  stage,
  title,
  subtitle,
  meta,
}: {
  stage: string;
  title: string;
  subtitle: string;
  meta?: string;
}) {
  return (
    <header className="rounded-lg border border-orange-100 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 ring-1 ring-orange-100">
          {stage}
        </span>
        {meta ? (
          <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-stone-600 ring-1 ring-slate-200">
            {meta}
          </span>
        ) : null}
      </div>
      <h1 className="mt-5 max-w-4xl text-3xl font-semibold leading-10 text-stone-950 sm:text-4xl sm:leading-[1.18]">
        {title}
      </h1>
      <p className="mt-5 max-w-3xl text-base leading-8 text-stone-600">
        {subtitle}
      </p>
    </header>
  );
}

function BackButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-fit rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 shadow-sm hover:bg-orange-50"
    >
      ← {children}
    </button>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-orange-50 p-4 ring-1 ring-slate-200">
      <p className="text-xs font-semibold text-stone-500">{label}</p>
      <p className="mt-2 text-sm leading-6 text-stone-800">{value}</p>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-stone-700 ring-1 ring-slate-200">
      {children}
    </span>
  );
}

function PurposeTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 ring-1 ring-orange-100">
      {children}
    </span>
  );
}

function FitTag({
  fit,
  children,
}: {
  fit: FitLevel;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getFitClass(
        fit,
      )}`}
    >
      {children}
    </span>
  );
}

function RecommendTag({ level }: { level: Topic["recommendLevel"] }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${getRecommendClass(
        level,
      )}`}
    >
      {level}
    </span>
  );
}

function buildAnalysis(hotspot: Hotspot) {
  const primaryReader = pickReader(hotspot.title);
  const unified = buildUnifiedTopicScore(hotspot);
  const topics = buildUnifiedTopics(hotspot);
  const primaryTopic = topics[0];

  return {
    totalScore: unified.totalScore,
    recommendLevel: unified.recommendationLevel,
    oneSentenceJudgment: `这个选题适合陈七七，因为它能把「${hotspot.title}」背后的行业变化，拆成大健康专业判断、内容表达和私域承接的具体方法。`,
    recommendReasons: [
      {
        label: "为什么适合陈七七",
        text: unified.recommendedReason,
      },
      {
        label: "为什么适合目标读者",
        text: `${primaryReader}需要的不只是热点信息，而是能直接用于内容和业务承接的判断。`,
      },
      {
        label: "为什么适合后续转化",
        text: "它可以自然延展到公众号方法论、私域沟通和项目咨询场景。",
      },
    ],
    writingPlan: buildWritingPlan(hotspot, primaryTopic),
    reasons: unified.scoreReasons.map((score) => ({
      keyword: score.label,
      text: score.explanation,
    })),
    topics,
  };
}

function buildUnifiedTopics(hotspot: Hotspot): Topic[] {
  return buildTopicsForHotspot(hotspot).map((topic, index) => applyUnifiedScoreToTopic(topic, hotspot, index));
}

function buildTopicsForHotspot(hotspot: Hotspot) {
  return buildTopics({
    ...hotspot,
    sourceMode: hotspot.sourceMode === "user_sources" ? "ai_generated" : hotspot.sourceMode,
  });
}

function applyUnifiedScoreToTopic(topic: Topic, hotspot: Hotspot, index: number): Topic {
  const unified = buildUnifiedTopicScore(hotspot, index);
  return {
    ...topic,
    totalScore: unified.totalScore,
    recommendLevel: unified.recommendationLevel,
    isPriority: index === 0,
    recommendReason: unified.recommendedReason,
    scores: unified.scores,
  };
}

function buildUnifiedTopicScore(hotspot: Hotspot, topicIndex = 0) {
  const text = `${hotspot.title} ${hotspot.description} ${hotspot.attentionReason} ${hotspot.reason}`.toLowerCase();
  const platforms = normalizeStringArray(hotspot.fitPlatforms);
  const purposes = normalizeHotspotPurposes(hotspot.purposes);
  const has = (keywords: string[]) => keywords.some((keyword) => text.includes(keyword.toLowerCase()));
  const platformCount = platforms.length;
  const sourceBonus = hotspot.sourceCredibility === "高" ? 1 : hotspot.sourceCredibility === "中" ? 0.5 : 0;
  const baseFit = hotspot.fit === "高" ? 8 : hotspot.fit === "中" ? 6 : 4;

  const scores = [
    {
      label: "身份匹配度",
      value: clampDimensionScore(baseFit + (has(["大健康", "营养师", "中医", "健康"]) ? 1 : 0) + (has(["ip", "私域", "操盘"]) ? 1 : 0)),
      explanation: "判断选题是否贴合陈七七的大健康 IP 操盘手和女性营养师身份。",
    },
    {
      label: "读者痛点强度",
      value: clampDimensionScore(5 + (has(["焦虑", "信任", "不会", "困难", "痛点", "转化"]) ? 2 : 0) + (hotspot.attentionReason?.length > 28 ? 1 : 0)),
      explanation: "判断目标读者是否会觉得这个问题具体、迫切、值得点开。",
    },
    {
      label: "方法论价值",
      value: clampDimensionScore(5 + (has(["方法", "闭环", "路径", "拆解", "模型", "流程"]) ? 2 : 0) + (purposes.includes("方法论沉淀") ? 1.5 : 0)),
      explanation: "判断它能否沉淀成公众号方法论，而不是一次性追热点。",
    },
    {
      label: "商业转化潜力",
      value: clampDimensionScore(5 + (has(["私域", "转化", "发售", "咨询", "课程", "服务"]) ? 2 : 0) + (purposes.includes("商业转化") || purposes.includes("私域引流") ? 1.5 : 0)),
      explanation: "判断它是否容易自然接到私域沟通、咨询或服务承接。",
    },
    {
      label: "内容差异化",
      value: clampDimensionScore(5 + (has(["ai", "反对", "误区", "判断", "不是"]) ? 1.5 : 0) + (hotspot.title.length >= 14 ? 1 : 0)),
      explanation: "判断它是否能写出陈七七自己的观点，而不是平台通用内容。",
    },
    {
      label: "平台适配度",
      value: clampDimensionScore(4 + Math.min(platformCount, 4) + (platforms.includes("公众号") ? 1 : 0) + sourceBonus),
      explanation: "判断它是否适合从首页继续延展到公众号、小红书、短视频和朋友圈。",
    },
  ];
  const rawTotal = Math.round(scores.reduce((sum, item) => sum + item.value, 0) / scores.length * 10);
  const stableOffset = getStableScoreOffset(hotspot, topicIndex);
  const totalScore = clampScore(rawTotal + stableOffset, 60);
  const recommendationLevel = getRecommendationLevelByScore(totalScore);
  const strongest = [...scores].sort((a, b) => b.value - a.value)[0]?.label ?? "身份匹配度";
  const weakest = [...scores].sort((a, b) => a.value - b.value)[0];

  return {
    totalScore,
    level: recommendationLevel,
    recommendationLevel,
    scores,
    scoreReasons: scores,
    recommendedReason: `${strongest}较强，适合先判断是否能沉淀成陈七七的专业观点和私域承接方法。`,
    riskNotice: weakest && weakest.value <= 6 ? `风险提醒：${weakest.label}偏弱，写作时需要补足具体场景和判断。` : "",
  };
}

function clampDimensionScore(value: number) {
  return Math.max(0, Math.min(10, Math.round(value)));
}

function getStableScoreOffset(hotspot: Hotspot, topicIndex: number) {
  const seed = `${hotspot.id}${hotspot.title}${topicIndex}`;
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return [-6, -3, 0, 2, 4][hash % 5];
}

function getRecommendationLevelByScore(score: number): RecommendationLevel {
  if (score >= 90) return "优先写";
  if (score >= 80) return "可作为延展";
  if (score >= 70) return "暂缓观察";
  return "不建议优先";
}

function splitDelimitedString(raw: string): string[] {
  const s = raw.replace(/\r\n/g, "\n").trim();
  if (!s) return [];
  return s
    .split(/[\r\n;；]+|、+/)
    .map((part) => part.replace(/^[\s•·\-\*・]+/, "").trim())
    .filter(Boolean);
}

function normalizeStringArray(value: unknown): string[] {
  if (value == null) return [];
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => {
        if (item == null) return [];
        if (typeof item === "string") {
          const t = item.trim();
          return t ? splitDelimitedString(t) : [];
        }
        if (typeof item === "object") {
          const o = item as Record<string, unknown>;
          const t = o.text ?? o.title ?? o.content ?? o.label;
          if (typeof t === "string" && t.trim()) return [t.trim()];
          return [];
        }
        const t = String(item).trim();
        return t ? [t] : [];
      })
      .map((t) => t.trim())
      .filter(Boolean);
  }
  if (typeof value === "object") {
    const o = value as Record<string, unknown>;
    const t = o.text ?? o.title ?? o.content ?? o.label;
    if (typeof t === "string" && t.trim()) return [t.trim()];
    return [];
  }
  if (typeof value === "string") return splitDelimitedString(value);
  return [];
}

function coerceLocalizedString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (value && typeof value === "object") {
    const o = value as Record<string, unknown>;
    const t = o.text ?? o.title ?? o.content ?? o.label;
    if (typeof t === "string") return t.trim();
  }
  return "";
}

const QIQI_PURPOSE_LABELS = new Set<string>([
  "内容沉淀",
  "IP显化",
  "专业信任",
  "私域引流",
  "商业转化",
  "方法论沉淀",
  "观点表达",
]);

function normalizeHotspotPurposes(value: unknown): PurposeLabel[] {
  const strings = normalizeStringArray(value);
  const valid = strings.filter((s): s is PurposeLabel => QIQI_PURPOSE_LABELS.has(s));
  return valid.length ? valid : (["观点表达", "专业信任"] satisfies PurposeLabel[]);
}

function normalizePlatformPriorityList(value: unknown): WritingPlan["platformPriority"] {
  if (value == null) return [];
  const list = Array.isArray(value) ? value : typeof value === "object" ? [value] : [];
  const out: WritingPlan["platformPriority"] = [];
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const platform = typeof o.platform === "string" ? o.platform.trim() : "";
    const priority = typeof o.priority === "string" ? o.priority.trim() : "";
    const reason = typeof o.reason === "string" ? o.reason.trim() : "";
    if (!platform && !priority) continue;
    out.push({ platform, priority, reason });
  }
  return out;
}

function sectionParagraphs(section: { paragraphs?: unknown }): string[] {
  if (Array.isArray(section?.paragraphs)) {
    return section.paragraphs.filter(
      (p): p is string => typeof p === "string" && p.trim().length > 0,
    );
  }
  return normalizeStringArray(section?.paragraphs);
}

function normalizeHotspotAnalysis(analysis: HotspotAnalysis, hotspot: Hotspot): HotspotAnalysis {
  const fallback = buildAnalysis(hotspot);
  const topics = Array.isArray(analysis.topics) && analysis.topics.length
    ? analysis.topics.map((topic, index) => normalizeTopic(topic, hotspot, index))
    : fallback.topics;
  const primaryTopic = topics[0] ?? fallback.topics[0];

  const recommendReasons =
    Array.isArray(analysis.recommendReasons) && analysis.recommendReasons.length
      ? analysis.recommendReasons.slice(0, 3)
      : fallback.recommendReasons;

  const reasons =
    Array.isArray(analysis.reasons) && analysis.reasons.length
      ? analysis.reasons
      : fallback.reasons;

  return {
    totalScore: fallback.totalScore,
    recommendLevel: fallback.recommendLevel,
    oneSentenceJudgment:
      coerceLocalizedString(analysis.oneSentenceJudgment) || fallback.oneSentenceJudgment,
    recommendReasons,
    writingPlan: normalizeWritingPlan(analysis.writingPlan, hotspot, primaryTopic),
    reasons,
    topics,
  };
}

function normalizeTopic(topic: Topic, hotspot: Hotspot, index: number): Topic {
  const fallback = buildUnifiedTopics(hotspot)[index] ?? buildUnifiedTopics(hotspot)[0];
  const rawTitle = typeof topic.title === "string" ? topic.title : "";

  return {
    title: rawTitle && !isGenericOldTopic(rawTitle) ? rawTitle : fallback.title,
    angle: typeof topic.angle === "string" && topic.angle.trim() ? topic.angle : fallback.angle,
    purpose: QIQI_PURPOSE_LABELS.has(String(topic.purpose))
      ? (topic.purpose as PurposeLabel)
      : fallback.purpose,
    reason: typeof topic.reason === "string" && topic.reason.trim() ? topic.reason : fallback.reason,
    totalScore: fallback.totalScore,
    recommendLevel: fallback.recommendLevel,
    isPriority: index === 0 ? true : Boolean(topic.isPriority),
    recommendReason: topic.recommendReason || fallback.recommendReason,
    scores: normalizeUnifiedScores(topic.scores, fallback.scores),
    platformFits:
      Array.isArray(topic.platformFits) && topic.platformFits.length
        ? topic.platformFits
        : fallback.platformFits,
  };
}

function isGenericOldTopic(title: string) {
  return [
    "AI不能替代专业判断",
    "专业信任从哪里开始建立",
    "热点如何接到私域闭环",
  ].includes(title);
}

function buildWritingPlan(hotspot: Hotspot, topic: Topic): WritingPlan {
  const keyword = getHotspotKeyword({
    ...hotspot,
    sourceMode: hotspot.sourceMode === "user_sources" ? "ai_generated" : hotspot.sourceMode,
  });

  return {
    angle: topic.angle,
    mainPoint: `不要把「${hotspot.title}」写成泛泛趋势，而要写成陈七七对${keyword}、专业信任和私域承接的判断。`,
    subheadings: [
      `为什么${keyword}会被大健康从业者关注`,
      "普通内容容易写偏在哪里",
      "陈七七会怎么判断这个机会",
      "大健康 IP 可以怎么接到私域和服务",
      "这件事能沉淀成什么方法论",
    ],
    platformPriority: [
      { platform: "公众号", priority: "最高", reason: "适合深度沉淀判断、案例感和方法论。" },
      { platform: "朋友圈", priority: "高", reason: "适合提炼个人观察，承接私域沟通。" },
      { platform: "小红书", priority: "中", reason: "适合拆成场景化图文，但要避免太理论。" },
      { platform: "短视频", priority: "中", reason: "适合做一个强观点口播，引发讨论。" },
    ],
    risks: [
      "不要写成泛泛 AI 工具清单。",
      "不要只讲观点，要结合大健康项目、私域和用户信任。",
      "不要过度医疗化表达，避免具体诊疗承诺。",
    ],
  };
}

function normalizeWritingPlan(
  plan: WritingPlan | undefined,
  hotspot: Hotspot,
  topic: Topic,
): WritingPlan {
  const fallback = buildWritingPlan(hotspot, topic);
  const subheadings = normalizeStringArray(plan?.subheadings);
  const risks = normalizeStringArray(plan?.risks);
  const platformPriority = normalizePlatformPriorityList(plan?.platformPriority);

  return {
    angle: coerceLocalizedString(plan?.angle) || fallback.angle,
    mainPoint: coerceLocalizedString(plan?.mainPoint) || fallback.mainPoint,
    subheadings: subheadings.length ? subheadings.slice(0, 5) : fallback.subheadings,
    platformPriority: platformPriority.length ? platformPriority : fallback.platformPriority,
    risks: risks.length ? risks : fallback.risks,
  };
}

function getAnalysisScores(analysis: HotspotAnalysis, topic: Topic) {
  const topicScores = Array.isArray(topic.scores) ? topic.scores : [];
  if (!Array.isArray(analysis.reasons) || analysis.reasons.length < 6) {
    return topicScores;
  }
  return topicScores.map((score, index) => ({
    label: score.label,
    value: topicScores[index]?.value ?? 4,
    explanation:
      typeof analysis.reasons[index]?.text === "string"
        ? analysis.reasons[index].text
        : score.explanation,
  }));
}

function normalizeUnifiedScores(
  scores: ScoreItem[] | undefined,
  fallbackScores: ScoreItem[],
): ScoreItem[] {
  const source = Array.isArray(scores) && scores.length ? scores : [];
  return fallbackScores.map((fallback, index) => {
    const score = source[index];
    const rawValue = typeof score?.value === "number" ? score.value : fallback.value;
    return {
      label: fallback.label,
      value: rawValue <= 5 ? clampDimensionScore(rawValue * 2) : clampDimensionScore(rawValue),
      explanation:
        typeof score?.explanation === "string" && score.explanation.trim()
          ? score.explanation
          : fallback.explanation,
    };
  });
}

function normalizeWritingPlanForDisplay(plan: WritingPlan): WritingPlan {
  return {
    angle: coerceLocalizedString(plan?.angle),
    mainPoint: coerceLocalizedString(plan?.mainPoint),
    subheadings: normalizeStringArray(plan?.subheadings),
    platformPriority: normalizePlatformPriorityList(plan?.platformPriority).filter(
      (item) => hasText(item.platform) && hasText(item.priority),
    ),
    risks: normalizeStringArray(plan?.risks),
  };
}

function getRecommendReasons(analysis: HotspotAnalysis, hotspot: Hotspot) {
  if (Array.isArray(analysis.recommendReasons) && analysis.recommendReasons.length) {
    return analysis.recommendReasons
      .slice(0, 3)
      .map((reason) => ({
        label: typeof reason?.label === "string" ? reason.label : "",
        text: typeof reason?.text === "string" ? reason.text : "",
      }))
      .filter((reason) => hasText(reason.label) && hasText(reason.text));
  }

  return buildAnalysis(hotspot).recommendReasons ?? [];
}

function hasScoreContent(score: ScoreItem) {
  return hasText(score.label) && typeof score.value === "number";
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function displayContentText(value: string) {
  const text = value.trim();
  if (!text) return "当前暂无可展示内容，请先生成或重新生成。";
  if (
    text.includes("```") ||
    /\"?(payload|raw|stack|error|response)\"?\s*:/i.test(text) ||
    /^\s*[{[]/.test(text)
  ) {
    return "生成失败，请重试。";
  }
  return text;
}

function getTopicKey(topic: Topic) {
  return `${topic.title}-${topic.angle}-${topic.purpose}`;
}

function compactScoreLabel(label: string) {
  return label
    .replace("强度", "痛点")
    .replace("沉淀价值", "价值")
    .replace("潜力", "")
    .replace("匹配度", "匹配")
    .replace("身份匹配", "身份匹配")
    .replace("读者痛点", "读者痛点")
    .replace("方法论", "方法论");
}

function getDetailSourceStatus(hotspot: Hotspot) {
  if (hotspot.evidenceLinks?.length) return "已有来源证据";
  if (hotspot.sourceMode === "web_search") return "公开来源待验证";
  return "AI 初筛";
}

function getContentTypeLabel(contentType: ContentType) {
  if (contentType === "articleOutline") return "公众号文章大纲";
  if (contentType === "xiaohongshu") return "小红书图文";
  if (contentType === "videoScript") return "短视频口播稿";
  if (contentType === "moments") return "朋友圈文案";
  return "多平台内容矩阵";
}

function clampScore(value: number | undefined, fallback: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function buildArticleOutline(
  hotspot: Hotspot,
  topic: Topic,
  note: string,
): ArticleOutline {
  const noteText = note.trim()
    ? `同时回应你的补充方向：${note.trim()}`
    : "同时保持陈七七一贯的专业判断和操盘视角。";

  return {
    title: `${topic.title}：陈七七的大健康 IP 判断`,
    sections: [
      {
        label: "如何引入这个热点",
        text: `从「${hotspot.title}」切入，写出这个现象为什么最近会被大健康从业者反复看见。${noteText}`,
      },
      {
        label: "这个现象说明了什么",
        text: `这个现象说明：${hotspot.description} 背后是用户需求、平台趋势和专业服务方式正在变化。`,
      },
      {
        label: "很多人误解了什么",
        text: "很多人会把它理解成流量机会或工具红利，却忽略专业信任、用户决策和私域承接才是关键。",
      },
      {
        label: "陈七七的核心判断",
        text: `围绕「${topic.title}」提出判断：${topic.angle}这才是大健康 IP 真正需要补上的能力。`,
      },
      {
        label: "大健康 IP 可以怎么做",
        text: "给出行动路径：判断热点适配度，提炼公众号观点，设计私域承接，再把内容接到服务和发售，并自然回到专业信任、私域连接或进一步咨询。",
      },
    ],
    keywords: ["热点适配判断", "专业信任建立", "私域承接路径", "课程发售闭环", "AI工具边界"],
  };
}

function buildArticleDraft(
  hotspot: Hotspot,
  topic: Topic,
  outline: ArticleOutline,
  note: string,
  version: number,
): ArticleDraft {
  const styleSignal = qiqiWritingStyle.includes("hi，我是七七");
  const openingName = styleSignal ? "hi，我是七七。" : "你好，我是七七。";
  const wantsMoreReal =
    note.includes("不像我") ||
    note.includes("真实") ||
    note.includes("口语") ||
    note.includes("少一点官方") ||
    note.includes("官方判断") ||
    note.includes("说明文");
  const tone =
    version > 1
      ? wantsMoreReal
        ? "这一版我会说得更像我自己平时做项目后的复盘，少一点正确废话，少一点官方腔，多一点真实判断和现场感。"
        : "这一版我会说得更像项目复盘，少一点标准答案，多一点操盘手的真实判断。"
      : "这篇我想先用一个真实观察，把这件事讲透一点。";
  const cleanNote = note.trim().replace(/[。！？\s]+$/u, "");
  const noteText = note
    ? `你补充的方向我也会放进去，尤其是：${cleanNote}。`
    : "我会尽量把专业判断、私域承接和长期信任放在一起讲。";
  const realExpressionParagraph = wantsMoreReal
    ? "如果说得再直白一点，我不想把这篇写成一篇看起来很完整、但读完没有人的文章。七七的内容应该有自己的判断、有项目里的真实观察，也要让读者感觉到：这是一个真的陪大健康从业者跑过内容和私域闭环的人在说话。"
    : "健康内容背后，本质上还是信任。用户愿不愿意相信你，不是因为你用了最新的工具，而是因为他能不能从你的表达里感受到：你懂专业，也懂他真实卡在哪里。";

  return {
    status: "已生成正文",
    title: outline.title,
    intro: `${openingName}我是一名大健康行业 IP 操盘手，也是一名女性营养师。最近我越来越明显地感觉到，很多大健康从业者不是不努力做内容，而是越做越像在追热点。看到「${hotspot.title}」这个现象时，我第一反应不是它有多热，而是它背后暴露了一个很现实的问题：专业内容、用户信任和商业闭环，不能再被拆开看了。${tone}${noteText}`,
    sections: [
      {
        heading: "01 AI 工具越热，大健康 IP 越不能丢掉判断力",
        paragraphs: [
          `表面看，大家讨论的是「${hotspot.description}」。但放到大健康行业里，我看到的不是一个简单的新工具、新平台或新玩法，而是专业服务正在被重新定义。`,
          "很多人以为问题出在工具上，但我觉得不是。尤其是在大健康行业，这件事会更明显。工具可以帮你写得更快、剪得更快、发得更勤，但它不能替你判断什么内容该说、什么边界不能碰、什么承诺不能随便给。",
          realExpressionParagraph,
        ],
      },
      {
        heading: "02 很多人追的是效率，但用户真正买单的是信任",
        paragraphs: [
          "我在项目里经常看到一种情况：一个营养师学会用 AI 写笔记了，标题也更顺了，配图也更快了，但内容发出去以后，依然没有人咨询。为什么？因为用户看完只觉得这是一篇还不错的健康笔记，却不知道为什么要找她做长期调理。",
          "还有一些中医馆，每天都在做科普，讲湿气、脾胃、睡眠、体质，但用户看完并不知道：我为什么要信任这家医馆？为什么这个医生适合我？我下一步该怎么和他建立关系？",
          wantsMoreReal
            ? "所以我想说得更真实一点：效率不是不重要，但效率只能放大你原本就清楚的东西。如果定位、判断、服务路径都没想明白，工具只会让你更快地产出一堆看起来勤奋、其实没有承接的内容。"
            : "所以我必须说几句真话：效率不是不重要，但效率只能放大你原本就清楚的东西。如果你的定位、判断、服务路径都不清楚，工具只会让你更快地产出一堆没有承接的内容。",
        ],
      },
      {
        heading: "03 私域不是收割池，而是专业交付的最后一百米",
        paragraphs: [
          `围绕「${topic.title}」，我的判断是：${topic.angle}`,
          "很多大健康品牌开始重视私域，但也有一个很大的误区：把私域当成交池。好像只要把人导进群、加到微信、每天发一发产品和案例，就能转化。",
          "但在我看来，私域不是收割池，而是专业交付的最后一百米。用户进入私域以后，真正发生的是更具体的信任建立：你怎么回应他的困惑，怎么判断他的问题，怎么把你的专业变成他听得懂、愿意执行的方案。",
          "这也是为什么陈七七77 这个公众号不会只讲工具。我更关心的是，一个大健康 IP 怎么把内容、私域、课程发售和用户运营连成一条真实能跑通的路径。",
        ],
      },
      {
        heading: "04 真正能长期变现的 IP，靠的是专业和真实",
        paragraphs: [
          "我不太相信虚假人设，也不相信靠几条爆款就能撑起一个长期 IP。尤其是在大健康行业，用户会越来越敏感。他们能感觉到你是真的懂，还是只是把热门词重新包装了一遍。",
          "真正能长期变现的 IP，一定不是只会讲专业名词的人，也不是只会追平台流量的人，而是能把专业判断翻译成用户能理解的表达，再把表达接到真实服务里的人。",
          "所以大健康 IP 可以先做三件事：第一，明确自己最擅长解决哪类问题；第二，把内容写成自己的判断，而不是平台上的通用答案；第三，每一篇内容都想清楚，它后面如何承接到私域、咨询、课程或陪跑服务。",
        ],
      },
      {
        heading: "05 先跑通闭环，再谈自动化",
        paragraphs: [
          "AI 可以帮我们提效，这一点我完全认同。但我更想提醒的是：先跑通闭环，再谈自动化。没有闭环的自动化，只是在更快地制造噪音。",
          "一个健康品牌做了很多内容，但私域没有承接路径；一个 IP 账号追热点很勤快，但没有自己的判断和方法论；一个营养师每天更新，但用户看完不知道下一步该做什么。这些问题，都不是靠多一个工具就能解决的。",
          "对陈七七来说，一篇真正值得写的内容，最后都应该沉淀成方法：看见现象，判断适配，提炼观点，设计承接，复盘闭环。这样内容才不是一次性消耗，而是慢慢长成自己的专业资产。",
        ],
      },
    ],
    ending:
      "如果你也是营养师、中医馆、健康品牌或大健康 IP，正在思考怎么把专业内容变成稳定的信任和转化，可以先从一个选题开始，把它写深、写透，写成自己的方法。我是七七，一名大健康 IP 操盘手、女性营养师。如果你也在探索大健康内容、私域运营、IP 陪跑或 AI 工具落地，欢迎关注「陈七七77」。如果你也在做大健康内容转型、私域承接或 IP 内容搭建，可以加我微信 chen-ccsq，一起看看你的内容卡在哪里。",
  };
}

// Kept as local fallback reference for future matrix recovery flows.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function buildMultiPlatformPlan(
  hotspot: Hotspot,
  topic: Topic,
  note: string,
): MultiPlatformPlan {
  const noteText = note ? `并结合「${note}」这个补充方向。` : "";

  return {
    xiaohongshu: {
      titles: [
        { type: "痛点型", text: "营养师别只追AI工具，真正重要的是信任" },
        { type: "观点型", text: getXiaohongshuTitle(topic) },
        { type: "搜索关键词型", text: "大健康IP做内容，不能只靠工具提效" },
      ],
      covers: ["AI不能替你建立信任", "专业IP别只追热点", "先有信任再谈转化"],
      body: {
        hook: `最近很多人在讨论「${hotspot.title}」，但我想提醒一句：热点本身不是机会，能不能把它变成你的专业表达，才是关键。`,
        pain: "很多营养师、中医馆和健康品牌会卡在这里：内容发了很多，工具也学了不少，但用户看完还是不知道为什么要信任你、为什么要找你咨询。",
        judgment: `我的判断是，围绕「${topic.title}」，不要只讲工具或流量，而要讲清楚专业判断、用户信任和私域承接怎么连起来。${noteText}`,
        tips: [
          "先判断这个热点是否服务你的定位，不要所有热点都追。",
          "把观点写成用户能听懂的场景，而不是一堆专业名词。",
          "每篇内容都要想清楚后面怎么接私域、咨询或服务。",
        ],
        ending: "如果你也在做大健康 IP，可以先从一个选题开始，把它写深、写透，写成自己的方法论。",
      },
      cards: [
        {
          title: "抛出问题",
          body: `很多人都在讨论「${hotspot.title}」，但大健康 IP 真正要问的是：这个热点能不能帮你建立信任？`,
          layout: "大标题放中间，下面放一句反问，背景保持干净。",
          prompt: "极简白底，中心大字问题句，辅助元素为健康内容笔记和 AI 工具界面轮廓。",
          keyword: "信任",
        },
        {
          title: "拆解误区",
          body: "会用 AI、会追热点、会做模板内容，不等于用户会信任你，更不等于有人愿意咨询你。",
          layout: "左侧列出误区，右侧用醒目的叉号或对比色强调。",
          prompt: "左右对比版式，左边是工具和流量图标，右边是信任和咨询路径，突出反差。",
          keyword: "误区",
        },
        {
          title: "陈七七的判断",
          body: `围绕「${topic.title}」，重点不是多发内容，而是把专业判断、用户关系和商业承接连起来。`,
          layout: "用三段式结构：专业判断 / 用户信任 / 私域承接。",
          prompt: "三栏信息卡，分别写专业判断、用户信任、私域承接，配细线连接。",
          keyword: "判断",
        },
        {
          title: "大健康 IP 应该怎么做",
          body: "先判断热点适不适合自己，再拆成公众号深度文章、朋友圈观点、短视频口播和小红书图文。",
          layout: "做成流程图，从热点到内容矩阵再到私域连接。",
          prompt: "流程图风格，从热点雷达到公众号、朋友圈、短视频、小红书，再到私域连接。",
          keyword: "闭环",
        },
        {
          title: "总结方法论和引导链接",
          body: "真正能长期变现的 IP，不是追得最快，而是能把每一次热点沉淀成自己的方法论。",
          layout: "结尾放一句方法论金句，并留出关注/私信提示区域。",
          prompt: "收束页，橙色强调方法论关键词，底部留关注和私信提示。",
          keyword: "方法论",
        },
      ],
      tags: [
        "#大健康IP",
        "#营养师IP",
        "#私域运营",
        "#AI工具",
        "#内容方法论",
        "#女性营养师",
      ],
      note: "小红书要更场景化、更轻一点，不要写得像公众号长文。多用痛点、对比和收藏型结构，少讲抽象概念。",
      design: {
        cover: "封面建议使用暖白或浅橙底，主标题控制在 12-20 字，突出“AI / 大健康IP / 信任”其中一个核心词。",
        style: "整体视觉保持干净、专业、轻运营工具感；每张卡只放一个核心观点，避免塞满长段文字。",
      },
    },
    video: {
      platforms: "抖音 / 视频号",
      title: "AI不能替代大健康IP的专业判断",
      hook: "如果你是营养师或者大健康 IP，千万别以为会用 AI 就能做好内容。",
      covers: [
        "会用AI不等于会做内容",
        "大健康IP别只追工具",
        "用户信任不是AI生成的",
      ],
      cover: "会用AI不等于会做内容",
      points: [
        "第一点，AI 能提效，但不能替你判断专业边界。健康内容不能只追速度，什么能说、什么不能承诺，还是要靠你的专业判断。",
        "第二点，大健康内容真正成交的是信任。用户不是因为你发得多就找你，而是因为他觉得你懂他的处境，也有能力解决问题。",
        `第三点，内容必须接到私域和服务闭环。围绕「${topic.title}」，要想清楚文章、朋友圈、短视频和咨询入口怎么连接。${noteText}`,
      ],
      ending: "如果你也在做大健康 IP，先别急着追工具，先把内容到私域的闭环跑清楚。",
      duration: "60-90 秒",
      subtitles: [
        "专业判断",
        "用户信任",
        "私域承接",
        "商业闭环",
        "AI工具观",
        "内容方法论",
      ],
      script: [
        {
          label: "开头钩子",
          text: "如果你是营养师，或者正在做大健康 IP，千万别以为会用 AI，就能把内容做好。",
          shot: "正面半身，开场直接看镜头，语速稍快。",
          subtitle: "会用AI ≠ 做好内容",
          sticker: "放大“专业判断”四个字。",
        },
        {
          label: "为什么重要",
          text: "我在项目里经常看到，很多人工具学得很快，笔记也发得很勤，但用户看完并不知道为什么要信任你。",
          shot: "切到项目复盘感镜头，可以配电脑、笔记或白板。",
          subtitle: "内容多，不等于有信任",
          sticker: "贴纸：项目观察。",
        },
        {
          label: "误区拆解",
          text: "大健康内容不是越快越好，也不是越像爆款越好。健康内容背后，本质上还是专业边界和用户关系。",
          shot: "镜头稍微拉近，强调“不是……而是……”。",
          subtitle: "不是效率，而是信任",
          sticker: "放大“不是工具问题”。",
        },
        {
          label: "核心判断",
          text: `围绕「${topic.title}」，我的判断是：先把专业内容、私域承接和服务闭环想清楚，再谈工具提效。`,
          shot: "正面稳定输出，配三点关键词字幕。",
          subtitle: "内容 + 私域 + 服务闭环",
          sticker: "关键词三连：内容 / 私域 / 闭环。",
        },
        {
          label: "结尾引导",
          text: "如果你也在做大健康 IP，先别急着追热点。把一个选题写深、写透，写成自己的方法论，才是长期有效的路径。",
          shot: "语速放慢，结尾自然微笑。",
          subtitle: "把选题写成方法论",
          sticker: "关注陈七七77。",
        },
      ],
      editingTips: [
        "开头 3 秒直接看镜头，先抛判断，不铺垫概念。",
        "中段用项目复盘感画面承接，避免像读公众号文章。",
        "每个转折点只强调一个字幕关键词，节奏留出停顿。",
      ],
      keywords: ["专业判断", "用户信任", "私域承接", "商业闭环", "项目观察"],
      bgm: "轻快知识感 / 温暖真实感 / 稍微有力量感的观点表达。",
      soundEffects: [
        "关键词出现时用轻提示音。",
        "误区转折处用轻敲击音。",
        "结尾引导处用柔和提示音。",
      ],
    },
    moments: [
      {
        type: "个人思考型朋友圈",
        text: `我最近在项目里越来越明显地感受到，大健康 IP 真正难的不是不会发内容，而是不知道怎么把内容接到信任和转化。看到「${hotspot.title}」这个现象，我第一反应不是热点来了，而是很多从业者又会开始追工具、追效率，却忘了用户最后买单的还是专业判断和真实关系。`,
      },
      {
        type: "专业观点型朋友圈",
        text: `AI 可以提效，但不能替代专业判断和用户信任。尤其在大健康行业，内容不是写得越快越好，而是要让用户看完知道你是谁、你怎么看问题、为什么可以信任你。围绕「${topic.title}」，我更想讲的是：专业内容、私域运营和商业闭环必须放在一起看。`,
      },
      {
        type: "链接咨询型朋友圈",
        text: "如果你也是营养师、中医馆、健康品牌或大健康 IP，正在思考怎么把内容接到私域和转化，可以找我聊聊。不是简单帮你追热点，而是一起看清楚：哪些选题值得写，怎么写出你的专业判断，以及内容后面怎么承接到用户关系和服务闭环。",
      },
    ],
    platformSummary: [
      { platform: "公众号", focus: "深度沉淀。" },
      { platform: "小红书", focus: "场景化图文和搜索承接。" },
      { platform: "短视频", focus: "观点破圈和信任建立。" },
      { platform: "朋友圈", focus: "身份显化和私域链接。" },
    ],
  };
}

function getTodayDateLabel() {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

const QIQI_CACHE_VERSION_KEY = "qiqi_cache_version";
const QIQI_CACHE_VERSION = "v3.1-1B";

function ensureQiqiCacheVersion() {
  if (typeof window === "undefined") return;
  try {
    if (window.localStorage.getItem(QIQI_CACHE_VERSION_KEY) === QIQI_CACHE_VERSION) {
      return;
    }
    const prefixes = ["qiqi_today_hotspots_", "qiqi_hotspot_analysis_", "qiqi_content_"];
    const toRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (!key) continue;
      if (prefixes.some((p) => key.startsWith(p))) {
        toRemove.push(key);
      }
    }
    for (const key of toRemove) {
      window.localStorage.removeItem(key);
    }
    window.localStorage.setItem(QIQI_CACHE_VERSION_KEY, QIQI_CACHE_VERSION);
  } catch {
    // ignore
  }
}

/** 测试阶段为 true：跳过费用确认，便于连续跳转与联调；正式上线前请改为 false */
const QIQI_SKIP_AI_COST_CONFIRM = true;

function confirmAiCost() {
  if (QIQI_SKIP_AI_COST_CONFIRM) return true;
  return window.confirm("本操作会调用当前 AI 模型并可能产生费用，是否继续？");
}

function getTodayHotspotsCacheKey() {
  return `qiqi_today_hotspots_${getTodayDateLabel().replaceAll("/", "-")}`;
}

function getTodaySourcesCacheKey() {
  return `qiqi_sources_${getTodayDateLabel().replaceAll("/", "-")}`;
}

function getAiConnectionCacheKey() {
  return `qiqi_ai_connection_${getTodayDateLabel().replaceAll("/", "-")}`;
}

function getHotspotAnalysisCacheKey(hotspot: Hotspot) {
  return `qiqi_hotspot_analysis_${getTodayDateLabel().replaceAll("/", "-")}_${simpleCacheId(`${hotspot.id}_${hotspot.title}`)}`;
}

function getOutlineCacheKey(hotspot: Hotspot, topic: Topic) {
  return getContentCacheKey(hotspot, topic, "wechat_outline");
}

function getDraftCacheKey(hotspot: Hotspot, topic: Topic) {
  return getContentCacheKey(hotspot, topic, "wechat_draft");
}

function getMultiPlatformCacheKey(hotspot: Hotspot, topic: Topic, contentType: ContentType) {
  return getContentCacheKey(hotspot, topic, contentType);
}

function getContentCacheKey(hotspot: Hotspot, topic: Topic, contentType: string) {
  return `qiqi_content_${getTodayDateLabel().replaceAll("/", "-")}_${simpleCacheId(`${hotspot.id}_${hotspot.title}`)}_${simpleCacheId(topic.title)}_${contentType}`;
}

function simpleCacheId(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash.toString(36);
}

function parseSourceKeywords(value: string) {
  return value
    .split(/[、,\s，]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function readLocalCache<T>(key: string): T | null {
  if (typeof window === "undefined") return null;

  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
}

function writeLocalCache(key: string, value: unknown) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage failures; the app should still work without cache.
  }
}

function normalizeHotspotForToday(
  hotspot: Hotspot,
  todayDate: string,
  index: number,
): Hotspot {
  const evidenceLinks = normalizeEvidenceLinks(hotspot.evidenceLinks);
  const sourceMode = hotspot.sourceMode ?? (evidenceLinks.length ? "web_search" : "ai_generated");
  const isMock = hotspot.sourceType === "模拟行业观察";
  const hasEvidence = evidenceLinks.length > 0 || Boolean(hotspot.sourceUrl);
  const verificationStatus =
    hotspot.verificationStatus ??
    (hasEvidence
      ? sourceMode === "web_search"
        ? "pending"
        : "user_input"
      : sourceMode === "user_sources"
        ? "user_input"
        : "ai_initial");
  const displayTag =
    hotspot.displayTag ??
    (isMock
      ? "本地模拟观察"
      : sourceMode === "user_sources"
        ? "用户录入来源"
      : sourceMode === "platform_signal"
        ? "平台信号待接入"
      : sourceMode === "web_search"
        ? "公开网页佐证"
        : "AI 生成选题机会");
  const sourceCredibility = hotspot.sourceCredibility ?? getDefaultCredibility({
    ...hotspot,
    sourceMode: isMock ? "mock" : sourceMode,
    displayTag,
    evidenceLinks,
  });

  return {
    ...hotspot,
    id: hotspot.id || `today-opportunity-${index + 1}`,
    sourceMode: isMock ? "mock" : sourceMode,
    sourceType: hotspot.sourceType ?? ("AI 今日选题机会" as const),
    sourceDate: todayDate,
    verifiedAt: hotspot.verifiedAt || todayDate,
    displayTag,
    sourceCredibility,
    credibility: hotspot.credibility || sourceCredibility,
    verificationStatus,
    sourceTitle: hotspot.sourceTitle || evidenceLinks[0]?.title || "",
    sourceUrl: hotspot.sourceUrl || evidenceLinks[0]?.url || "",
    sourceSummary: hotspot.sourceSummary || evidenceLinks[0]?.summary || "",
    fitReasonForQiqi: hotspot.fitReasonForQiqi || hotspot.reason || "",
    evidenceLinks,
    sourceEvidence:
      hotspot.sourceEvidence ||
      (evidenceLinks.length
        ? "AI 结合公开网页来源生成今日选题机会，当前不是平台官方榜单数据。"
        : "AI 观察：基于陈七七77的定位生成今日选题机会，当前暂无真实来源链接，不代表平台热榜。"),
    isRealTimeSource: sourceMode === "web_search" && evidenceLinks.length > 0,
    attentionReason: hotspot.attentionReason || hotspot.reason || hotspot.description,
    fitPlatforms: (() => {
      const list = normalizeStringArray(hotspot.fitPlatforms);
      return list.length ? list : ["公众号", "小红书"];
    })(),
    purposes: (() => {
      const list = normalizeHotspotPurposes(hotspot.purposes);
      return list.length ? list : (["观点表达", "专业信任"] satisfies PurposeLabel[]);
    })(),
  };
}

function normalizeEvidenceLinks(evidenceLinks: Hotspot["evidenceLinks"]) {
  if (!Array.isArray(evidenceLinks)) return [];

  return evidenceLinks.filter(
    (link) =>
      typeof link?.url === "string" &&
      /^https?:\/\//i.test(link.url) &&
      typeof link.title === "string",
  );
}

function getHomeRefreshStatus(
  refreshStatus: string,
  currentProviderLabel: string,
  lastAiConnectionOk: boolean,
) {
  if (refreshStatus.includes("已读取今日缓存结果")) {
    return "已读取今日缓存结果。你也可以刷新生成新的选题。";
  }

  if (refreshStatus) return refreshStatus;

  if (lastAiConnectionOk) {
    return currentProviderLabel === "DeepSeek"
      ? "DeepSeek 已连接，当前为轻量筛选模式。"
      : "AI 已连接，今日选题由 AI 初筛生成。";
  }

  return "AI 已为你完成初筛。";
}

function getHomeSourceStatus(hotspot: Hotspot) {
  if (hotspot.evidenceLinks?.length) return "已有来源证据";
  if (hotspot.sourceMode === "user_sources") return "用户录入来源";
  if (hotspot.sourceMode === "web_search") return "公开网页佐证";
  if (hotspot.sourceMode === "ai_generated") return hotspot.evidenceLinks?.length ? "公开网页佐证" : "AI 初筛";
  return "AI 初筛";
}

function buildHomeSourceEvidence(hotspot: Hotspot) {
  const firstLink = hotspot.evidenceLinks?.[0];
  const hasUrl = Boolean(hotspot.sourceUrl || firstLink?.url);
  const verificationStatus =
    hotspot.verificationStatus ??
    (hasUrl
      ? hotspot.sourceMode === "web_search"
        ? "pending"
        : "user_input"
      : hotspot.sourceMode === "user_sources"
        ? "user_input"
        : "ai_initial");

  return {
    platform: hotspot.sourceChannel || firstLink?.platform || "内容雷达",
    credibility: hotspot.credibility || hotspot.sourceCredibility || "待验证",
    verificationLabel: getVerificationStatusLabel(verificationStatus),
    title: hotspot.sourceTitle || firstLink?.title || hotspot.displayTag || "来源标题待补充",
    url: hotspot.sourceUrl || firstLink?.url || "",
    summary:
      hotspot.sourceSummary ||
      firstLink?.summary ||
      hotspot.sourceEvidence ||
      "暂无可验证链接，当前仅作为灵感/待验证来源。",
    fitReason: hotspot.fitReasonForQiqi || hotspot.reason || "适合继续由陈七七77视角拆解。",
  };
}

function getVerificationStatusLabel(status: SourceVerificationStatus) {
  if (status === "verified") return "已验证";
  if (status === "pending") return "待验证";
  if (status === "user_input") return "用户录入";
  if (status === "unsupported") return "暂不支持验证";
  return "AI 初筛";
}

function getDefaultCredibility(hotspot: Hotspot): "高" | "中" | "待验证" {
  if (hotspot.sourceMode === "web_search" && hotspot.evidenceLinks?.length) {
    return "高";
  }
  if (hotspot.sourceMode === "platform_signal") return "中";
  if (hotspot.sourceMode === "user_sources") return hotspot.sourceCredibility ?? "中";
  return "待验证";
}

function optimizeXiaohongshuLocally(
  xiaohongshu: MultiPlatformPlan["xiaohongshu"],
  note: string,
) {
  const noteText = note.trim() || "默认优化：更像真实分享，减少营销感。";

  return {
    ...xiaohongshu,
    titles: xiaohongshu.titles.map((title, index) => ({
      ...title,
      text:
        index === 0
          ? `别再这样做大健康内容了`
          : index === 1
            ? `我为什么不建议营养师只追热点`
            : `${title.text}｜真实项目观察`,
    })),
    covers: ["别把内容做成说明书", "营养师内容要有真实感", "专业信任这样建立"],
    body: {
      ...xiaohongshu.body,
      hook: `${xiaohongshu.body.hook} 我会更直白一点说：用户不是讨厌专业，而是讨厌看不懂、感受不到真实的专业。`,
      judgment: `${xiaohongshu.body.judgment} 这次按你的意见调整方向：${noteText}`,
      ending: "如果你也在做大健康内容，可以先别急着套模板。把一个真实观察说清楚，比堆十个热点更有用。",
    },
    note: `${xiaohongshu.note} 已按修改意见增强真实分享感：${noteText}`,
  };
}

function optimizeVideoLocally(video: MultiPlatformPlan["video"], note: string) {
  const noteText = note.trim() || "默认优化：更抓人、更口语、更有项目现场感。";

  return {
    ...video,
    title: "别再把大健康内容拍成说明书了",
    hook: "如果你做大健康内容，开头 3 秒还在解释概念，用户大概率已经划走了。",
    script: video.script.map((part, index) => ({
      ...part,
      text:
        index === 0
          ? "如果你做大健康 IP，先别急着讲一堆专业概念。镜头前第一句话，要让用户觉得：这说的不就是我吗？"
          : `${part.text} 这版我会更口语一点，也更贴近项目现场：${noteText}`,
    })),
    covers: ["开头别再讲概念了", "大健康内容要像真人说话", "专业感不是端着说"],
    editingTips: [
      "开头 3 秒直接抛痛点，不做自我介绍式铺垫。",
      "中段每 15 秒给一个停顿，配一个项目现场关键词。",
      "结尾用自然咨询引导，不要像硬广。",
    ],
  };
}

function getXiaohongshuTitle(topic: Topic) {
  if (topic.title.includes("AI")) {
    return "AI再火，大健康IP也别丢掉判断力";
  }

  if (topic.title.includes("信任")) {
    return "营养师别只追AI工具，真正重要的是信任";
  }

  return "大健康IP做内容，不能只靠工具提效";
}

function getFitClass(fit: FitLevel) {
  if (fit === "高") return "bg-orange-100 text-orange-800";
  if (fit === "中") return "bg-blue-100 text-blue-800";
  return "bg-slate-200 text-stone-700";
}

function getRecommendClass(level: Topic["recommendLevel"]) {
  if (level === "优先写") return "bg-orange-100 text-orange-800";
  if (level === "可作为延展") return "bg-blue-100 text-blue-800";
  if (level === "暂缓观察" || level === "暂缓") return "bg-amber-100 text-amber-800";
  return "bg-slate-200 text-stone-700";
}

function isTextMaterial(file: File) {
  const fileName = file.name.toLowerCase();
  return (
    file.type === "text/plain" ||
    file.type === "text/markdown" ||
    fileName.endsWith(".txt") ||
    fileName.endsWith(".md")
  );
}

function getFileExtensionLabel(fileName: string) {
  const extension = fileName.split(".").pop();
  return extension ? `.${extension}` : "未知类型";
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function readFileAsText(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

const WECHAT_COVER_TARGET_SIZE = 1.8 * 1024 * 1024;
const WECHAT_COVER_MAX_SIZE = 2 * 1024 * 1024;
const WECHAT_COVER_MAX_WIDTH = 900;
const WECHAT_COVER_QUALITIES = [0.85, 0.8, 0.75, 0.7, 0.65];

async function compressWechatCoverImage(file: File) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, WECHAT_COVER_MAX_WIDTH / bitmap.width);
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  if (!context) {
    bitmap.close();
    throw new Error("Canvas is unavailable.");
  }

  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let bestBlob: Blob | null = null;
  for (const quality of WECHAT_COVER_QUALITIES) {
    const blob = await canvasToBlob(canvas, "image/jpeg", quality);
    if (!bestBlob || blob.size < bestBlob.size) {
      bestBlob = blob;
    }
    if (blob.size <= WECHAT_COVER_TARGET_SIZE) {
      return blobToCoverFile(blob, file.name);
    }
  }

  if (!bestBlob) {
    throw new Error("Cover compression failed.");
  }
  return blobToCoverFile(bestBlob, file.name);
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }
        reject(new Error("Canvas export failed."));
      },
      type,
      quality,
    );
  });
}

function blobToCoverFile(blob: Blob, originalName: string) {
  const baseName = originalName.replace(/\.[^.]+$/, "") || "wechat-cover";
  return new File([blob], `${baseName}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

function formatDraftForCopy(draft: ArticleDraft) {
  const safeSections = Array.isArray(draft.sections) ? draft.sections : [];
  const sections = safeSections
    .map((section) => {
      const heading = hasText(section?.heading) ? section.heading : "未命名小节";
      const paragraphs = sectionParagraphs(section ?? {}).filter(hasText);
      return `${heading}\n\n${paragraphs.join("\n\n")}`;
    })
    .join("\n\n");

  const title = hasText(draft.title) ? draft.title : "当前暂无可展示内容，请重新生成。";
  const intro = hasText(draft.intro) ? draft.intro : "当前暂无可展示内容，请重新生成。";
  const ending = hasText(draft.ending) ? draft.ending : "当前暂无可展示内容，请重新生成。";

  return `${title}\n\n${intro}\n\n${sections}\n\n${ending}`;
}

function buildPublishChecks(draft: ArticleDraft) {
  const safeDraft = {
    title: hasText(draft.title) ? draft.title : "",
    intro: hasText(draft.intro) ? draft.intro : "",
    sections: Array.isArray(draft.sections)
      ? draft.sections.map((section) => ({
          heading: hasText(section?.heading) ? section.heading : "",
          paragraphs: sectionParagraphs(section ?? {}).filter(hasText),
        }))
      : [],
    ending: hasText(draft.ending) ? draft.ending : "",
  };
  const fullText = formatDraftForCopy(draft);
  const openingText = `${safeDraft.intro} ${safeDraft.sections
    .slice(0, 1)
    .flatMap((section) => section.paragraphs)
    .join(" ")}`.slice(0, 300);
  const endingText = `${safeDraft.sections
    .slice(-1)
    .flatMap((section) => section.paragraphs)
    .join(" ")} ${safeDraft.ending}`.slice(-500);

  const titleKeywords = [
    "AI",
    "大健康",
    "IP",
    "专业判断",
    "私域",
    "信任",
    "商业闭环",
  ];
  const hookKeywords = [
    "最近",
    "我发现",
    "我越来越感觉到",
    "我最近越来越明显地感觉到",
    "为什么",
    "很多人以为",
    "我必须说",
  ];
  const judgmentKeywords = [
    "我看到的现象",
    "我做项目时发现",
    "我作为大健康 IP 操盘手的判断",
    "我的判断",
    "我认为",
    "我更关注",
    "我会建议",
    "作为大健康 IP 操盘手",
    "作为女性营养师",
    "女性健康注册营养师",
    "在项目里",
    "私域",
    "信任",
    "转化",
    "内容承接",
    "用户关系",
    "商业闭环",
    "专业判断",
    "大健康 IP",
  ];
  const linkKeywords = [
    "欢迎链接",
    "找我聊聊",
    "咨询",
    "私域",
    "陪跑",
    "chen-ccsq",
    "加我微信",
    "关注「陈七七77」",
    "关注陈七七77",
  ];
  const shareablePatterns = [
    "不是",
    "而是",
    "真正重要的是",
    "我越来越觉得",
    "核心不是",
  ];

  const hasTitleKeyword = titleKeywords.some((keyword) =>
    safeDraft.title.includes(keyword),
  );
  const titlePassed =
    safeDraft.title.length >= 12 &&
    safeDraft.title.length <= 32 &&
    hasTitleKeyword;
  const hookPassed = hookKeywords.some((keyword) =>
    openingText.includes(keyword),
  );
  const naturalHeadingCount = safeDraft.sections.filter((section, index) => {
    const heading = section.heading.trim();
    const expectedNumber = String(index + 1).padStart(2, "0");
    return (
      heading.length >= 4 ||
      new RegExp(`^${expectedNumber}[\\s、.-]`).test(heading) ||
      /^0[1-9][\s、.-]/.test(heading)
    );
  }).length;
  const headingsPassed =
    safeDraft.sections.length >= 3 && naturalHeadingCount >= 3;
  const judgmentHitCount = judgmentKeywords.filter((keyword) =>
    fullText.includes(keyword),
  ).length;
  const hasPersonalView = /我(?:看到|发现|认为|更关注|会建议|的判断|做项目|在项目)/.test(fullText);
  const hasOperatorView = /(私域|信任|转化|内容承接|用户关系|商业闭环|专业判断|大健康 IP|女性健康注册营养师)/.test(fullText);
  const judgmentPassed = judgmentHitCount >= 2 || (hasPersonalView && hasOperatorView);
  const linkPassed = linkKeywords.some((keyword) =>
    endingText.includes(keyword),
  );
  const sharePassed =
    fullText.includes("不是") && fullText.includes("而是")
      ? true
      : shareablePatterns.some((keyword) => fullText.includes(keyword));

  const items = [
    {
      name: "标题是否明确",
      passed: titlePassed,
      description: titlePassed
        ? "标题长度和关键词都符合公众号发布前检查。"
        : "标题需要控制在 12-32 字，并包含 AI、大健康、IP、私域、信任等核心关键词。",
      suggestion: "把标题压缩成一个明确判断，并补上大健康 IP 或信任闭环关键词。",
    },
    {
      name: "开头是否有钩子",
      passed: hookPassed,
      description: hookPassed
        ? "开头有最近观察、问题意识或真实表达，能把读者带进来。"
        : "开头 300 字内缺少真实观察或强问题意识。",
      suggestion: "用“最近我发现”“很多人以为”或一个项目观察作为开头。",
    },
    {
      name: "小标题是否清晰",
      passed: headingsPassed,
      description: headingsPassed
        ? "正文已经有清晰编号小标题，适合公众号阅读。"
        : "正文分段不够清楚，读者快速扫读会比较吃力。",
      suggestion: "至少保留 3 个带 01、02、03 的自然小标题。",
    },
    {
      name: "是否有陈七七的专业判断",
      passed: judgmentPassed,
      description: judgmentPassed
        ? "正文能看出陈七七作为大健康 IP 操盘手和女性营养师的判断。"
        : "正文里陈七七的个人判断和项目视角还不够明显。",
      suggestion: "增加“我的判断是”或“作为大健康 IP 操盘手，我更关注”的表达。",
    },
    {
      name: "是否有私域链接或咨询引导",
      passed: linkPassed,
      description: linkPassed
        ? "结尾已经有私域、咨询或关注链接的自然引导。"
        : "结尾还没有把专业信任自然接到链接或下一步行动。",
      suggestion: "增加关注、私域链接、咨询或陪跑相关的温和引导。",
    },
    {
      name: "是否适合转发到朋友圈",
      passed: sharePassed,
      description: sharePassed
        ? "正文中有可摘出来转发的观点句，适合二次传播。"
        : "正文观点句还不够有记忆点，不利于朋友圈转发。",
      suggestion: "补一句“核心不是……而是……”或“真正重要的是……”的判断句。",
    },
  ];

  const passedCount = items.filter((item) => item.passed).length;
  const score =
    passedCount === 6
      ? 95
      : passedCount === 5
        ? 85
        : passedCount === 4
          ? 75
          : passedCount === 3
            ? 60
            : 45;

  return {
    score,
    scoreLabel: passedCount < 3 ? "待优化" : `${score} 分`,
    advice:
      score >= 85
        ? "这篇文章已具备进入公众号草稿箱的基础，可以进行人工细修。"
        : "建议先优化标题、开头、专业判断和结尾引导，再进入公众号后台。",
    items,
  };
}
