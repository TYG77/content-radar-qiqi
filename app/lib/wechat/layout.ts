import type { ReactNode } from "react";

export type WechatArticleLayoutInput =
  | string
  | {
      title?: unknown;
      summary?: unknown;
      digest?: unknown;
      intro?: unknown;
      sections?: unknown;
      ending?: unknown;
      cta?: unknown;
      tags?: unknown;
    }
  | null
  | undefined;

export type WechatImageSuggestion = {
  position: string;
  purpose: string;
  imageType: string;
  colorAdvice: string;
};

export type WechatLayoutSpec = {
  bodyFont: string;
  bodyFontSize: string;
  bodyColor: string;
  titleFontSize: string;
  titleWeight: string;
  lineHeight: string;
  paragraphSpacing: string;
  sectionSpacing: string;
  introStyle: string;
  quoteStyle: string;
  themeColor: string;
  accentColor: string;
};

export type WechatArticleLayout = {
  html: string;
  digest: string;
  coverTitle: string;
  fixedIntroBlock: string;
  articleIntro: string;
  wordCount: number;
  readMinutes: number;
  bodySections: NormalizedSection[];
  fixedOutroBlock: string;
  imageSuggestions: WechatImageSuggestion[];
  layoutSpec: WechatLayoutSpec;
  layoutWarnings: string[];
  draftPayload: {
    title: string;
    digest: string;
    contentHtml: string;
    author: string;
    thumbMediaId: string;
    needOpenComment: boolean;
    onlyFansCanComment: boolean;
  };
};

type NormalizedSection = {
  heading: string;
  paragraphs: string[];
};

type HighlightSentence = {
  text: string;
  level: "special" | "normal";
};

const DEFAULT_TITLE = "陈七七77公众号文章";
const DEFAULT_AUTHOR = "";
const DEFAULT_THUMB_MEDIA_ID = "";
const INTRO_CARD_IMAGE_SRC = "/qiqi/intro-card.png";
const FIXED_INTRO_TEXT =
  "hi，我是七七，一名热爱生活的大健康IP操盘手、女性健康注册营养师，很开心你看到这篇文章，欢迎你关注【陈七七77】，主动链接我，围观好友圈。";
const FIXED_OUTRO_PROFILE_TEXT =
  "我是七七，一名热爱生活的大健康IP操盘手、女性健康注册营养师，很开心你看到这篇文章，欢迎你关注【陈七七77】，主动链接我，围观好友圈。";
const FIXED_OUTRO_TEXT =
  "如果这篇内容对你有启发，欢迎转发给需要的人。如果你也在做大健康内容转型 / 私域承接 / IP内容搭建，可以加我微信 chen-ccsq，一起看看你的内容卡在哪里。";

const THEME = {
  background: "#ffffff",
  paper: "#ffffff",
  title: "#333333",
  body: "#333333",
  muted: "#666A6D",
  theme: "#5F7D57",
  accent: "#6B8A62",
  imageHint: "#8F8F8F",
  introBg: "#ffffff",
  methodBg: "#ffffff",
  border: "#E1E8DE",
};

const LAYOUT_SPEC: WechatLayoutSpec = {
  bodyFont: "-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  bodyFontSize: "16px",
  bodyColor: THEME.body,
  titleFontSize: "28px",
  titleWeight: "700",
  lineHeight: "1.95",
  paragraphSpacing: "22px",
  sectionSpacing: "86px",
  introStyle: "白底轻量引言，使用留白和标题区分",
  quoteStyle: "完整判断句加粗，并使用低饱和绿色强调",
  themeColor: "低饱和橄榄绿",
  accentColor: "柔和草本绿",
};

export default function WechatLayout({ children }: { children: ReactNode }) {
  return children;
}

export function buildWechatArticleHtml(
  articleDraft: WechatArticleLayoutInput,
): WechatArticleLayout {
  const layoutWarnings: string[] = [];
  const normalized = normalizeArticle(articleDraft);
  const title = normalized.title || DEFAULT_TITLE;
  const bodySections = shapeBodySections(normalized.sections, normalized.intro);
  const articleIntro = normalized.intro || buildMotivationIntro(title, normalized.intro, bodySections);
  const conclusion = normalized.ending || normalized.cta || "";
  const wordCount = estimateWordCount(articleIntro, bodySections, conclusion);
  const readMinutes = Math.max(1, Math.ceil(wordCount / 450));
  const digest = normalized.digest || normalized.summary || createDigest(articleIntro);
  const coverTitle = truncate(title, 32);
  const fixedIntroBlock = buildFixedIntroBlock(articleIntro, wordCount, readMinutes);
  const fixedOutroBlock = buildFixedOutroBlock(conclusion);
  const imageSuggestions = buildImageSuggestions(bodySections);

  if (!normalized.title) layoutWarnings.push("缺少标题，已使用默认封面标题。");
  if (!normalized.intro) layoutWarnings.push("缺少明确引言，已生成写作动机型引言。");
  if (bodySections.length < 4) layoutWarnings.push("正文板块不足 4 个，可人工补充。");

  const html = [
    `<section style="max-width:677px;margin:0 auto;padding:30px 18px;color:${THEME.body};font-family:${LAYOUT_SPEC.bodyFont};font-size:${LAYOUT_SPEC.bodyFontSize};line-height:${LAYOUT_SPEC.lineHeight};background:${THEME.background};">`,
    buildTitleBlock(title),
    fixedIntroBlock,
    ...bodySections.map((section, index) => buildSectionBlock(section, index)),
    buildConclusionBlock(conclusion),
    fixedOutroBlock,
    `</section>`,
  ]
    .filter(Boolean)
    .join("");

  return {
    html,
    digest,
    coverTitle,
    fixedIntroBlock,
    articleIntro,
    wordCount,
    readMinutes,
    bodySections,
    fixedOutroBlock,
    imageSuggestions,
    layoutSpec: LAYOUT_SPEC,
    layoutWarnings,
    draftPayload: {
      title: coverTitle,
      digest,
      contentHtml: html,
      author: DEFAULT_AUTHOR,
      thumbMediaId: DEFAULT_THUMB_MEDIA_ID,
      needOpenComment: false,
      onlyFansCanComment: false,
    },
  };
}

function normalizeArticle(articleDraft: WechatArticleLayoutInput) {
  if (typeof articleDraft === "string") {
    const paragraphs = splitParagraphs(articleDraft);
    return {
      title: "",
      summary: "",
      digest: "",
      intro: "",
      sections: paragraphs.length > 0 ? [{ heading: "正文判断", paragraphs }] : [],
      ending: "",
      cta: "",
      tags: [] as string[],
    };
  }

  const draft = articleDraft ?? {};
  return {
    title: cleanIdentityText(toCleanText(draft.title)),
    summary: toCleanText(draft.summary),
    digest: toCleanText(draft.digest),
    intro: cleanIdentityText(toCleanText(draft.intro)),
    sections: normalizeSections(draft.sections),
    ending: cleanIdentityText(toCleanText(draft.ending)),
    cta: cleanIdentityText(toCleanText(draft.cta)),
    tags: normalizeTags(draft.tags),
  };
}

function normalizeSections(value: unknown): NormalizedSection[] {
  if (!Array.isArray(value)) {
    const text = cleanIdentityText(toCleanText(value));
    return text ? [{ heading: "正文判断", paragraphs: splitLongParagraph(text) }] : [];
  }

  return value
    .map((section, index) => {
      if (typeof section === "string") {
        return {
          heading: `关键判断 ${index + 1}`,
          paragraphs: splitLongParagraph(cleanIdentityText(section)),
        };
      }
      if (!section || typeof section !== "object") return null;

      const record = section as Record<string, unknown>;
      const heading =
        toCleanText(record.heading) ||
        toCleanText(record.title) ||
        toCleanText(record.label) ||
        `关键判断 ${index + 1}`;
      const paragraphs =
        normalizeParagraphs(record.paragraphs) ||
        normalizeParagraphs(record.body) ||
        normalizeParagraphs(record.content) ||
        normalizeParagraphs(record.text) ||
        [];

      return {
        heading: sanitizeHeading(heading),
        paragraphs,
      };
    })
    .filter((section): section is NormalizedSection => {
      return Boolean(section && section.paragraphs.length > 0);
    });
}

function shapeBodySections(
  sections: NormalizedSection[],
  intro: string,
): NormalizedSection[] {
  const base =
    sections.length > 0
      ? sections
      : [
          {
            heading: "为什么这个话题值得讨论",
            paragraphs: intro ? splitLongParagraph(intro) : ["当前正文结构不完整，可先使用基础排版预览。"],
          },
        ];
  const cleaned = base.map((section) => ({
    heading: sanitizeHeading(section.heading),
    paragraphs: section.paragraphs.flatMap((paragraph) => splitLongParagraph(paragraph)).filter(Boolean),
  }));
  return cleaned.length > 6 ? mergeSectionsToLimit(cleaned, 6) : cleaned;
}

function mergeSectionsToLimit(
  sections: NormalizedSection[],
  maxCount: number,
): NormalizedSection[] {
  const merged = sections.slice(0, maxCount).map((section) => ({
    heading: section.heading,
    paragraphs: [...section.paragraphs],
  }));
  sections.slice(maxCount).forEach((section, index) => {
    merged[index % maxCount].paragraphs.push(...section.paragraphs);
  });
  return merged;
}

function buildMotivationIntro(
  title: string,
  originalIntro: string,
  sections: NormalizedSection[],
): string {
  const signal = firstUsefulSentence(originalIntro) || firstUsefulSentence(sections[0]?.paragraphs[0] || "");
  const topic = title.replace(/[：:].*$/, "");
  const intro = `今天想写这篇文章，是因为我最近反复看到一个现象：很多大健康从业者并不缺内容动作，真正卡住的是专业判断、用户信任和后端承接没有放在一起看。围绕「${topic}」，我想和大家讨论的是：我们到底该怎么把一个热点，变成能让读者看清问题、也能沉淀信任的长期内容。${signal ? `这篇会从「${truncate(signal, 42)}」这个观察切进去。` : ""}`;
  return truncate(intro, 220);
}

function firstUsefulSentence(value: string): string {
  return value.match(/[^。！？!?]+[。！？!?]?/)?.[0]?.trim() || "";
}

function buildImageSuggestions(
  sections: NormalizedSection[],
): WechatImageSuggestion[] {
  return [
    {
      position: "开头自我介绍后",
      purpose: "建立人物身份和亲近感",
      imageType: "人物实拍或个人介绍图",
      colorAdvice: "白底、浅绿灰、低饱和自然色",
    },
    {
      position: sections[1] ? "第 2 个正文板块中段" : "正文前半段中段",
      purpose: "解释案例或行业现象",
      imageType: "场景图、案例示意图或流程图",
      colorAdvice: "延续低饱和绿色体系",
    },
    {
      position: sections[3] ? "第 4 个正文板块中段" : "正文中后段",
      purpose: "强化核心判断",
      imageType: "个人观点卡片图",
      colorAdvice: "白底、绿色标题、留白充足",
    },
  ];
}

function normalizeParagraphs(value: unknown): string[] | null {
  if (Array.isArray(value)) {
    const paragraphs = value.flatMap((item) => splitLongParagraph(cleanIdentityText(toCleanText(item)))).filter(Boolean);
    return paragraphs.length > 0 ? paragraphs : null;
  }
  const text = cleanIdentityText(toCleanText(value));
  return text ? splitLongParagraph(text) : null;
}

function normalizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(toCleanText).filter(Boolean).slice(0, 6);
}

function splitParagraphs(value: string): string[] {
  return value
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitLongParagraph(value: string): string[] {
  const text = cleanIdentityText(value).trim();
  if (!text) return [];
  const base = splitParagraphs(text);
  return base.flatMap((paragraph) => {
    if (paragraph.length <= 130) return [paragraph];
    const sentences = paragraph.match(/[^。！？!?]+[。！？!?]?/g)?.map((item) => item.trim()).filter(Boolean) ?? [paragraph];
    const chunks: string[] = [];
    let current = "";
    sentences.forEach((sentence) => {
      if ((current + sentence).length > 120 && current) {
        chunks.push(current);
        current = sentence;
      } else {
        current += sentence;
      }
    });
    if (current) chunks.push(current);
    return chunks;
  });
}

function toCleanText(value: unknown): string {
  if (typeof value !== "string" && typeof value !== "number") return "";
  return String(value).replace(/\s+/g, " ").trim();
}

function cleanIdentityText(value: string): string {
  return value
    .replace(/我的学员/g, "我合作过的项目")
    .replace(/学员/g, "项目伙伴")
    .replace(/带班/g, "做项目")
    .replace(/我教大家/g, "我更想分享")
    .replace(/你必须/g, "更建议你")
    .replace(/[（）]/g, "");
}

function createDigest(value: string): string {
  return truncate(value.replace(/\s+/g, " ").trim(), 118);
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength).replace(/[，。！？、：；,.!?;:]+$/u, "")}`;
}

function estimateWordCount(
  intro: string,
  sections: NormalizedSection[],
  conclusion: string,
): number {
  const text = [intro, ...sections.flatMap((section) => section.paragraphs), conclusion].join("");
  return text.replace(/\s/g, "").length;
}

function pickHighlightSentences(paragraph: string): HighlightSentence[] {
  const sentences = paragraph.match(/[^。！？!?]+[。！？!?]?/g)?.map((item) => item.trim()) ?? [];
  const candidates = sentences
    .filter((sentence) => {
      return (
        sentence.length >= 18 &&
        sentence.length <= 90 &&
        /(信任|私域|转化|专业判断|内容承接|用户关系|商业闭环|价值|判断力|实操|观察|不是|而是|真正|核心)/.test(sentence)
      );
    })
    .map((sentence) => ({
      text: sentence,
      level: isSpecialHighlight(sentence) ? "special" as const : "normal" as const,
    }));

  const deduped: HighlightSentence[] = [];
  candidates.forEach((candidate) => {
    if (deduped.length >= 3) return;
    if (deduped.some((item) => item.text === candidate.text)) return;
    deduped.push(candidate);
  });
  return deduped;
}

function isSpecialHighlight(sentence: string): boolean {
  return (
    /不是.+而是/.test(sentence) ||
    /真正/.test(sentence) ||
    /核心/.test(sentence) ||
    /信任资产|判断力|商业闭环|交付价值/.test(sentence)
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildTitleBlock(title: string): string {
  return `<section style="margin:0 0 52px 0;padding:0;background:${THEME.paper};">
    <p style="margin:0 0 10px 0;color:${THEME.accent};font-size:14px;line-height:1.6;font-weight:500;">陈七七77 · 女性健康 IP 操盘笔记</p>
    <h1 style="margin:0;color:${THEME.title};font-size:${LAYOUT_SPEC.titleFontSize};line-height:1.36;font-weight:${LAYOUT_SPEC.titleWeight};letter-spacing:0;">${escapeHtml(title)}</h1>
  </section>`;
}

function buildFixedIntroBlock(
  articleIntro: string,
  wordCount: number,
  readMinutes: number,
): string {
  return `<section style="margin:0 0 56px 0;padding:0;background:${THEME.paper};">
    <p style="margin:0 0 20px 0;color:${THEME.muted};font-size:15px;line-height:1.9;font-weight:400;">${escapeHtml(FIXED_INTRO_TEXT)}</p>
    ${buildIntroCardImage()}
    <section style="margin:0;padding:18px 0;background:${THEME.introBg};">
      <p style="margin:0 0 10px 0;color:${THEME.accent};font-size:15px;line-height:1.6;font-weight:700;">引言</p>
      <p style="margin:0;color:${THEME.body};font-size:16px;line-height:${LAYOUT_SPEC.lineHeight};">${escapeHtml(articleIntro)}</p>
    </section>
    <p style="margin:14px 0 0 0;color:${THEME.muted};font-size:13px;line-height:1.7;text-align:center;">全文约 ${wordCount} 字 · 阅读约 ${readMinutes} 分钟</p>
  </section>`;
}

function buildSectionBlock(section: NormalizedSection, index: number): string {
  const number = String(index + 1).padStart(2, "0");
  const cleanHeading = sanitizeHeading(section.heading);
  return `<section style="margin:${LAYOUT_SPEC.sectionSpacing} 0 0 0;padding:0;">
    <h2 style="margin:0 0 28px 0;color:${THEME.theme};font-size:23px;line-height:1.42;font-weight:700;letter-spacing:0;">
      <span style="display:inline-block;margin-right:10px;color:${THEME.theme};font-size:16px;font-weight:700;">${number}</span>${escapeHtml(cleanHeading)}
    </h2>
    ${buildSectionBody(section, index)}
  </section>`;
}

function buildSectionBody(section: NormalizedSection, index: number): string {
  const highlights = pickHighlightSentences(section.paragraphs.join(" "));
  const imageAfter = chooseImageInsertIndex(section.paragraphs, index);
  return section.paragraphs
    .map((paragraph, paragraphIndex) => {
      const html = highlights.length ? highlightSentences(paragraph, highlights) : escapeHtml(paragraph);
      const p = `<p style="margin:0 0 ${LAYOUT_SPEC.paragraphSpacing} 0;color:${THEME.body};font-size:${LAYOUT_SPEC.bodyFontSize};line-height:${LAYOUT_SPEC.lineHeight};">${html}</p>`;
      return paragraphIndex === imageAfter ? `${p}${buildImageHint(index, section, false)}` : p;
    })
    .join("");
}

function highlightSentences(paragraph: string, highlights: HighlightSentence[]): string {
  let html = escapeHtml(paragraph);
  highlights.forEach((highlight) => {
    const escapedHighlight = escapeHtml(highlight.text);
    if (!escapedHighlight || !html.includes(escapedHighlight)) return;
    const style =
      highlight.level === "special"
        ? `color:${THEME.accent};font-weight:700;`
        : "font-weight:700;";
    html = html.replace(
      escapedHighlight,
      `<strong style="${style}">${escapedHighlight}</strong>`,
    );
  });
  return html;
}

function chooseImageInsertIndex(paragraphs: string[], sectionIndex: number): number {
  if (![0, 1, 3, 4].includes(sectionIndex)) return -1;
  if (paragraphs.length <= 1) return 0;
  return Math.min(1, paragraphs.length - 2);
}

function buildImageHint(index: number, section: NormalizedSection, method: boolean): string {
  const text = `${section.heading} ${section.paragraphs.join(" ")}`;
  const hint = method || /方法|路径|流程|步骤|怎么做/.test(text)
    ? "这里可做成 1 张方法卡片图"
    : /案例|项目|现场|用户|场景/.test(text)
      ? "项目场景图 / 案例示意图 / 生活感照片"
      : index >= 3
        ? "个人观点图 / 核心判断金句图"
        : "话题引入图 / 生活感照片";
  return `<p style="margin:4px 0 22px 0;color:${THEME.imageHint};font-size:14px;line-height:1.8;font-style:italic;">这里需配图：${escapeHtml(hint)}</p>`;
}

function buildConclusionBlock(conclusion: string): string {
  if (!conclusion) return "";
  return `<section style="margin:86px 0 0 0;padding:0;">
    <h2 style="margin:0 0 20px 0;color:${THEME.theme};font-size:22px;line-height:1.42;font-weight:700;">结尾总结</h2>
    <p style="margin:0;color:${THEME.body};font-size:16px;line-height:${LAYOUT_SPEC.lineHeight};">${escapeHtml(cleanIdentityText(conclusion))}</p>
  </section>`;
}

function buildFixedOutroBlock(conclusion: string): string {
  return `<section style="margin:72px 0 0 0;padding:0;">
    ${conclusion ? "" : `<p style="margin:0 0 18px 0;color:${THEME.body};font-size:16px;line-height:${LAYOUT_SPEC.lineHeight};">真正能留下来的内容，不是追热点本身，而是把热点转化成自己的判断、方法和长期信任。</p>`}
    <p style="margin:0 0 22px 0;color:${THEME.muted};font-size:15px;line-height:1.85;">${escapeHtml(FIXED_OUTRO_TEXT)}</p>
    ${buildIntroCardImage()}
    <p style="margin:24px 0 0 0;color:${THEME.muted};font-size:15px;line-height:1.9;font-weight:400;">${escapeHtml(FIXED_OUTRO_PROFILE_TEXT)}</p>
  </section>`;
}

function buildIntroCardImage(): string {
  return `<p style="margin:28px 0 34px 0;text-align:center;">
    <img src="${INTRO_CARD_IMAGE_SRC}" alt="陈七七77个人介绍图" style="display:block;width:100%;max-width:560px;height:auto;margin:0 auto;border-radius:10px;" />
  </p>`;
}

function sanitizeHeading(value: string): string {
  return truncate(
    stripLeadingSectionNumber(value)
      .replace(/[。！？!?，,、：:；;….\s]+$/u, "")
      .trim() || "正文判断",
    30,
  ).replace(/[。！？!?，,、：:；;….\s]+$/u, "");
}

function stripLeadingSectionNumber(value: string): string {
  return value.replace(/^\s*(?:0?[1-9]|[一二三四五六七八九十]+)[\.、\s-]+/, "").trim();
}
