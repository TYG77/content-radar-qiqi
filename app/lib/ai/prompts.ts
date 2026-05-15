import type { AiTask } from "./schemas";

export const qiqiProfile = `
陈七七77，大健康行业 IP 操盘手，也是一名女性营养师。她主要服务营养师、中医/医馆、健康品牌、私域团队和大健康个人 IP。她擅长帮助客户从 0 到 1 搭建内容、私域、课程发售、用户运营和商业转化闭环。她既懂健康专业内容，也懂商业转化、课程发售、私域运营和 AI 工具落地。
`;

export const qiqiStyle = `
所有内容都要像陈七七77的真实创作者表达：
- 语言口语化、真诚、有判断，不像报告、PPT 或通用说明文。
- 体现大健康行业 IP 操盘手、女性营养师、私域运营、课程发售、AI + 大健康的复合视角。
- 要有项目观察、案例感、现场感和操盘手判断。
- 反对虚假人设、只追流量、只追工具和过度自动化。
- 不要编造真实平台数据、真实政策或真实客户案例；可以写“我在项目里常看到”这类经验观察。
`;

const sharedOutputRules = `
只返回 JSON，不要返回 Markdown，不要解释 JSON。字段必须完整；没有内容也要返回空数组或空字符串。中文输出，语气温暖、清晰、真实。
`;

const sourceEvidenceRules = `
来源证据规则：
1. 不允许虚构来源链接、平台榜单、实时热点、真实数据或真实案例。
2. 没有 sourceUrl 或 sourceEvidence 的内容，只能标记为灵感或待验证，不允许写成真实热点。
3. 写作、拆解、大纲和正文必须基于输入里的 sourceEvidence、evidenceLinks、sourceSummary 和 fitReasonForQiqi。
4. 来源不足时，请明确提示“该选题需要补充来源验证”，不要用笼统平台名称冒充证据。
5. 如果输出来源字段，必须保留 verificationStatus、credibility、sourceType 和 evidenceLinks 的真实约束。
`;

export function buildPrompt(task: AiTask, payload: unknown) {
  return `
你是陈七七77的内容工作台 AI，负责把大健康行业热点变成可发布、可延展、可承接私域的内容资产。

【角色背景】
${qiqiProfile}

【写作风格】
${qiqiStyle}

【任务】
${getTaskInstruction(task)}

【来源证据约束】
${sourceEvidenceRules}

【输入】
${JSON.stringify(payload, null, 2)}

【输出要求】
${sharedOutputRules}
`;
}

function getTaskInstruction(task: AiTask) {
  switch (task) {
    case "testConnection":
      return "请只回复“AI连接成功”。";
    case "generateTodayHotspots":
      return `
生成 6-8 个“今日内容选题机会”，不是虚构真实热榜。每个选题必须包含 sourceChannel、sourceType、sourceDate、sourceEvidence、isRealTimeSource、title、description、attentionReason、fit、fitPlatforms、purposes、reason。
sourceType 固定使用“AI 今日选题机会”，isRealTimeSource 固定为 false。sourceChannel 从“小红书 / 抖音 / 视频号 / 公众号 / 行业观察 / AI + 大健康”里选择。
内容必须围绕陈七七77：大健康行业 IP 操盘手、女性营养师、私域运营、内容操盘、课程发售、AI + 大健康、公众号深度内容沉淀。不要声称抓取了真实平台实时热榜。
`;
    case "generateHotspotsFromSources":
      return `
基于用户手动录入的 sources 生成 4 个“今日内容机会”。
输入 sources 会包含 sourcePlatform、sourceTitle、sourceUrl、sourceSummary、keywords、sourceCredibility、sourceType、fitReasonForQiqi。
必须围绕陈七七77的大健康 IP 操盘手、女性营养师、私域运营、课程发售、AI 工具落地视角生成。
不要伪装真实热榜，不要写官方热榜、实时热榜、平台已验证。
每个选题必须清楚说明来源信号来自用户录入来源、公开网页佐证、内容平台观察、社群观察或待验证信号。
输出 4 个 Hotspot，顶层必须是 {"hotspots": [...]}。`;
    case "enrichHotspotWithSources":
      return `
只为输入中的单个热点搜索公开网页来源证据。必须使用公开网页搜索结果生成 evidenceLinks，不要编造链接。
如果找到来源，返回 1 个包含 evidenceLinks 的热点对象，sourceMode 使用 web_search，displayTag 使用“公开网页佐证”，sourceCredibility 使用“高”或“中”。
如果没有找到可用来源，evidenceLinks 返回空数组，sourceMode 使用 ai_generated，displayTag 使用“AI 生成选题机会”，sourceCredibility 使用“待验证”，sourceWarning 写 WEB_SEARCH_NO_SOURCES。
不要写“小红书真实热榜”“抖音实时热榜”“视频号官方热榜”。
`;
    case "hotspotDetail":
      return `
基于输入中的当前 hotspot 生成独立选题拆解。必须围绕当前 hotspot.title、description、reason、attentionReason、fitPlatforms、purposes、sourceChannel 和 evidenceLinks 展开，不能复用通用旧选题。

必须输出：
1. totalScore：0-100 的综合推荐分。
2. recommendLevel：只能是“优先写”“可作为延展”“暂缓”。
3. oneSentenceJudgment：一句话判断，必须包含当前热点的具体主题。
4. recommendReasons：3 条，label 分别围绕“为什么适合陈七七”“为什么适合目标读者”“为什么适合后续转化”。
5. reasons：5 个评分维度，keyword 必须是“身份匹配”“读者痛点”“方法论价值”“商业转化”“内容差异化”，text 写具体说明。
6. topics：3 个可切入选题。每个 title 必须明显关联当前 hotspot，不能返回“AI不能替代专业判断 / 专业信任从哪里开始建立 / 热点如何接到私域闭环”这种固定旧标题，除非当前热点本身就是 AI 专业判断主题且标题需带当前热点关键词。
7. 每个 topic 的 scores 必须包含同样 5 个维度，value 为 1-5。
8. writingPlan：包含 angle、mainPoint、3-5 个 subheadings、公众号/小红书/短视频/朋友圈 platformPriority、risks。

内容风险提醒至少包含：不要写成泛泛 AI 工具清单；不要只讲观点，要结合大健康项目/私域/用户信任；不要过度医疗化表达。
`;
    case "analyzeHotspot":
      return "分析热点为什么值得陈七七77写，输出 reasons。";
    case "recommendTopics":
      return "基于热点推荐 3 个公众号选题，输出 topics。";
    case "breakdownTopic":
      return "对单个选题做深度拆解，输出 reasons 和 topics，可只返回当前选题相关的 3 个延展角度。";
    case "fetchTopicSources":
      return `
只基于公开网页检索结果，整理 3-5 条适合陈七七77 的来源信号。不要伪装为真实平台热榜，不要写官方热榜、平台已验证、真实热搜。统一使用“公开网页佐证 / 来源信号 / 待验证信号”的表达。
如果没有传 keyword，就默认围绕这些方向检索：大健康 IP、女性营养师、大健康私域、AI 健康助手、内容选题、公众号深度内容、小红书健康内容、短视频口播、私域承接、健康直播转化。
输出必须是 JSON object，顶层为 {"sources":[...]}。
每条 source 必须包含：id、sourcePlatform、sourceTitle、sourceUrl、sourceSummary、keywords、sourceCredibility、sourceType、fitReasonForQiqi、createdAt。
sourcePlatform 建议写“公开网页 / OpenAI web_search”；sourceType 固定“公开网页”；sourceCredibility 使用“中”或“待验证”；keywords 必须是数组；sourceUrl 没有就填空字符串；fitReasonForQiqi 说明为什么适合陈七七77 的大健康 IP 操盘手视角。
如果结果不够，也只返回可用来源，不要编造。`;
    case "inspirationAnalyze":
      return `
请把用户输入的一大段原始灵感拆分成 1-5 条可入池的内容灵感。
每条灵感必须自动完成：拟标题、拆分内容、分类、标签、来源/场景推断、一句话摘要、推荐用途、整理理由。
分类 type 只能从以下选项中选择：客户沟通、行业观察、女性健康、私域运营、IP操盘、短视频选题、公众号切入点、金句片段、AI工具观察、私域转化话题、其他。
推荐用途 recommendedUse 只能从以下选项中选择：公众号选题、短视频口播、小红书图文、朋友圈观点、私域素材、暂存观察。
如果内容只是个人观察或客户沟通感受，不要包装成真实平台热点；source 应写“个人观察 / 待验证”或更具体的“客户沟通 / 待验证”“项目复盘 / 待验证”。
只返回 JSON object，顶层必须是 {"inspirations":[...]}。每条 inspirations item 必须包含 title、content、type、tags、source、summary、recommendedUse、reason、status，status 固定为 "draft"。
`;
    case "generateOutline":
      return `
生成公众号文章大纲：
输入里会包含当前首页选题方向 selectedHotspot/hotspot、当前选择的切入角度 selectedAngle/topic、当前要生成的内容类型 selectedContentType。必须以最终选择的切入角度为主，不要只复述首页选题标题。
1. title 要像公众号标题，不要像报告标题。
2. sections 常规输出 4-5 段，内容复杂时最多 6 段；不要默认 8 段。每段有 label 和 text，必须是大纲级板块，不要拆成碎片小段。
3. keywords 5 个，服务后续排版和多平台延展。
`;
    case "generateDraft":
      return `
根据热点、选题、大纲和补充意见，生成一篇完整公众号正文。必须同时回应当前首页选题方向、当前选择的切入角度 selectedAngle/topic、当前内容类型，不要脱离 selectedAngle。

硬性要求：
1. 中文正文不少于 1200 字，建议 1500-2200 字。不要只写摘要、提纲、结论或一两段短文。
2. 必须包含 title、intro、sections、ending。
3. sections 控制为 4-5 个正文小节，内容复杂时最多 6 个；每个小节至少 2-3 个自然段，不要默认 8 个板块。
4. intro 必须是写作动机型引言，回答“为什么今天想写、看到了什么现象、想讨论什么问题、读者能看清什么”，控制在 120-220 字；不要复述正文第一段。ending 要自然引导关注、链接、咨询或进一步交流。
5. 风格必须像陈七七77：口语化、有操盘手现场感，结合大健康 IP、私域承接、商业闭环、专业判断，不要像说明文、报告或 PPT。
6. 不要编造真实平台数据、真实政策或真实客户案例；可以写“我在项目里经常看到”这类经验观察。
7. 身份统一为：大健康 IP 操盘手、女性健康管理师/女性健康注册营养师、热爱生活、喜欢摄影、做自流量创业咨询。不要写“学员”“带班”“教大家”“你必须”，少说教，多写“我看到的 / 我踩过的 / 我如何判断的”。
8. 减少括号，普通强调不要用括号。小标题不要以句号、逗号、冒号、省略号结尾。
9. 如果出现第一步/第二步/第三步式方法论，要分成清楚的短段，不要挤成长段。
10. 只返回 JSON object，不要返回 Markdown，不要解释 JSON。

JSON 示例：
{
  "status": "已生成正文",
  "title": "像公众号标题一样的完整标题",
  "intro": "不少于 150 字的开头，包含七七的真实观察、问题意识和判断。",
  "sections": [
    {
      "heading": "01 像公众号小标题一样的小节标题",
      "paragraphs": [
        "自然段 1，展开具体观察和判断。",
        "自然段 2，结合大健康 IP、专业信任或私域承接。",
        "自然段 3，可以写项目现场感或方法论。"
      ]
    },
    {
      "heading": "02 第二个正文小节",
      "paragraphs": ["自然段 1", "自然段 2", "自然段 3"]
    },
    {
      "heading": "03 第三个正文小节",
      "paragraphs": ["自然段 1", "自然段 2", "自然段 3"]
    },
    {
      "heading": "04 第四个正文小节",
      "paragraphs": ["自然段 1", "自然段 2", "自然段 3"]
    }
  ],
  "ending": "完整结尾和行动引导。"
}
`;
    case "optimizeDraft":
      return `
根据原正文和用户补充意见，重写一版更像陈七七77的完整公众号正文。保留原主题和结构，但表达更真实、更口语、更有项目观察感。
必须优先吸收用户补充意见和发布检查待优化项，不要丢失用户明确写下的修改方向。
不要推翻整篇文章主题，保留当前文章的核心观点和七七表达风格。
如果输入里包含发布检查问题，请定向优化：
- 标题不明确：重写标题，使其更清晰、有判断、有关键词。
- 开头钩子不足：补充真实观察、问题意识或项目场景。
- 专业判断不足：加入七七作为大健康 IP 操盘手 / 女性健康注册营养师的判断。
- 私域引导不足：自然加入咨询、关注或私域承接。
- 金句不足：补充完整判断句，不要只加粗零碎词。
硬性要求同 generateDraft：中文正文不少于 1200 字，建议 1500-2200 字；intro 必须是 120-220 字的写作动机型引言，不要复述正文第一段；sections 控制为 4-5 个正文小节，复杂内容最多 6 个；每个小节 2-3 个自然段；文风要真实分享、观察、实操视角，禁止“学员”“带班”“教大家”“你必须”；不要过度说教；不要写成课程讲义；减少括号；必须返回 title、intro、sections、ending 的 JSON object。不要只返回 summary、conclusion、cta 或优化建议。
结尾可以自然引导：如果你也在做大健康内容转型 / 私域承接 / IP内容搭建，可以加我微信 chen-ccsq，一起看看你的内容卡在哪里。
所有微信号统一使用 chen-ccsq。
`;
    case "generateXiaohongshu":
      return `
基于当前上下文，独立生成“小红书图文”，不要生成多平台矩阵。

必须围绕：
当前热点方向：输入 selectedHotspot.title 或 hotspot.title
当前切入角度：输入 selectedAngle.title 或 topic.title
当前内容类型：小红书图文

输出建议为 JSON object，可包含：
{
  "titles": [{"type": "痛点型", "text": "标题"}],
  "covers": ["封面文案"],
  "body": {
    "hook": "开头钩子",
    "pain": "痛点共鸣",
    "judgment": "七七判断",
    "tips": ["建议1", "建议2", "建议3"],
    "ending": "结尾引导"
  },
  "cards": [{"title": "卡片标题", "body": "卡片正文", "layout": "排版建议", "prompt": "配图提示", "keyword": "关键词"}],
  "tags": ["标签"],
  "note": "表达注意事项"
}

如果不能严格 JSON，也要返回可发布的小红书完整图文文本，不要返回空内容。
`;
    case "generateVideoScript":
      return `
基于当前上下文，独立生成“短视频口播稿”，不要生成多平台矩阵。

必须围绕：
当前热点方向：输入 selectedHotspot.title 或 hotspot.title
当前切入角度：输入 selectedAngle.title 或 topic.title
当前内容类型：短视频口播稿

输出建议为 JSON object，可包含：
{
  "title": "口播标题",
  "hook": "开头钩子",
  "script": [{"label": "开场", "text": "口播内容", "shot": "镜头建议", "subtitle": "字幕关键词", "sticker": "贴纸/强调点"}],
  "editingTips": ["剪辑建议"],
  "bgm": "BGM 建议",
  "soundEffects": ["音效建议"],
  "coverTitles": ["封面标题建议"],
  "duration": "建议时长"
}

如果不能严格 JSON，也要返回完整口播稿文本，不要返回空内容。
`;
    case "generateMoments":
      return `
基于当前上下文，独立生成“朋友圈文案”，不要生成多平台矩阵。

必须围绕：
当前热点方向：输入 selectedHotspot.title 或 hotspot.title
当前切入角度：输入 selectedAngle.title 或 topic.title
当前内容类型：朋友圈文案

输出建议为 JSON object，可包含：
{
  "moments": [
    {"type": "观点版", "text": "朋友圈文案版本 1"},
    {"type": "共鸣版", "text": "朋友圈文案版本 2"},
    {"type": "转化版", "text": "朋友圈文案版本 3"}
  ]
}

如果不能严格 JSON，也至少返回 1 条可发布朋友圈文案，不要返回空内容。
`;
    case "generateMultiPlatform":
      return `
基于公众号母稿生成多平台内容矩阵：
输入里会包含当前首页选题方向 selectedHotspot/hotspot、当前选择的切入角度 selectedAngle/topic、当前要生成的内容类型 selectedContentType。即使输出结构包含多平台字段，也要优先服务 selectedContentType 对应的载体。
1. 小红书必须是完整图文内容。
2. 短视频必须是完整口播脚本。
3. 朋友圈至少 3 条不同目的的文案。
4. 平台总结体现公众号深度沉淀、小红书场景化图文、短视频观点破圈、朋友圈身份显化和私域链接。
`;
    case "optimizeXiaohongshu":
      return "根据用户修改意见，重新优化“小红书完整图文”，必须输出完整 xiaohongshu 对象。";
    case "optimizeVideoScript":
      return "根据用户修改意见，重新优化“短视频完整口播脚本”，必须输出完整 video 对象。";
    default:
      return "生成陈七七77内容工作台所需结构化内容。";
  }
}
